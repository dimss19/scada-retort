<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\Facades\MQTT;
use App\Events\SensorDataReceived;
use App\Events\OtaProgressUpdated;

class MqttSubscribeCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mqtt:subscribe';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Subscribe to MQTT topics and listen for messages';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting MQTT Listener...');

        $mqtt = MQTT::connection();

        // Topic: retort/data (sensor data)
        $mqtt->subscribe('retort/data', function (string $topic, string $message) {
            $payload = json_decode($message, true);
            if (!is_array($payload)) return;

            $machineCode = $payload['machine_code'] ?? $payload['id'] ?? 'RT-001';

            // Normalize payload fields for unified consumption
            $normalized = [
                'machine_code' => $machineCode,
                'id' => $machineCode,
                'pv' => isset($payload['actual']) ? (float)$payload['actual'] : (isset($payload['pv']) ? (float)$payload['pv'] : null),
                'sv' => isset($payload['setting']) ? (float)$payload['setting'] : (isset($payload['sv']) ? (float)$payload['sv'] : null),
                'actual' => isset($payload['actual']) ? (float)$payload['actual'] : (isset($payload['pv']) ? (float)$payload['pv'] : null),
                'setting' => isset($payload['setting']) ? (float)$payload['setting'] : (isset($payload['sv']) ? (float)$payload['sv'] : null),
                'mv' => isset($payload['mv']) ? (float)$payload['mv'] : 0.0,
                'phase' => $payload['phase'] ?? 'IDLE',
                'ps' => $payload['ps'] ?? '00.00',
                'tot' => $payload['tot'] ?? '00:00',
                'stp' => $payload['stp'] ?? '00:00',
                'pattern' => $payload['pattern'] ?? 0,
                'step' => $payload['step'] ?? 0,
                'run' => filter_var($payload['run'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'logging' => filter_var($payload['logging'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'ts' => $payload['ts'] ?? now()->toDateTimeString(),
                'iso' => $payload['iso'] ?? now()->toIso8601String(),
                'recorded_at' => now()->toDateTimeString(),
            ];

            // Broadcast to private websocket channel
            broadcast(new SensorDataReceived($machineCode, $normalized));

            // Cache device state and recent ESP telemetry
            \Illuminate\Support\Facades\Cache::put("device.{$machineCode}.run", $normalized['run'], now()->addMinutes(5));
            \Illuminate\Support\Facades\Cache::put("device.{$machineCode}.last_seen", now()->timestamp, now()->addMinutes(5));
            \Illuminate\Support\Facades\Cache::put("esp_latest_telemetry_{$machineCode}", $normalized, now()->addMinutes(15));

            // Keep rolling buffer of last 60 telemetry points for live chart initialization
            $historyKey = "esp_telemetry_history_{$machineCode}";
            $history = \Illuminate\Support\Facades\Cache::get($historyKey, []);
            if (!is_array($history)) $history = [];
            $history[] = $normalized;
            if (count($history) > 120) {
                $history = array_slice($history, -120);
            }
            \Illuminate\Support\Facades\Cache::put($historyKey, $history, now()->addHours(2));
        });

        // Topic: retort/system (Watchdog / Boot Events from ESP32)
        $mqtt->subscribe('retort/system', function (string $topic, string $message) {
            $payload = json_decode($message, true);
            if (!is_array($payload)) return;

            $machineCode = $payload['id'] ?? $payload['machine_code'] ?? 'RT-001';
            $this->info("Received system event for {$machineCode}: " . $message);
            \Illuminate\Support\Facades\Cache::put("esp_latest_system_event_{$machineCode}", $payload, now()->addHours(6));
        });

        // Topic: retort/{machine_code}/ota/status
        $mqtt->subscribe('retort/+/ota/status', function (string $topic, string $message) {
            $parts = explode('/', $topic);
            if (count($parts) >= 4) {
                $machineCode = $parts[1];
                $payload = json_decode($message, true);
                if ($payload) {
                    $status = $payload['status'] ?? 'unknown';
                    $progress = $payload['progress'] ?? 0;
                    $errorMsg = $payload['error_message'] ?? null;

                    broadcast(new OtaProgressUpdated(
                        $machineCode,
                        $status,
                        $progress,
                        $errorMsg
                    ));

                    // Update database for Rule 3
                    $device = \App\Models\Device::where('machine_code', $machineCode)->first();
                    if ($device) {
                        $latestDeployment = $device->otaDeployments()->latest()->first();
                        if ($latestDeployment) {
                            $latestDeployment->update([
                                'status' => $status,
                                'progress' => $progress,
                                'error_message' => $errorMsg,
                                'completed_at' => in_array($status, ['success', 'failed', 'rollback']) ? now() : null,
                            ]);
                        }
                    }
                }
            }
        });

        // Topic: retort/{machine_code}/config/ack
        $mqtt->subscribe('retort/+/config/ack', function (string $topic, string $message) {
            $parts = explode('/', $topic);
            if (count($parts) >= 4) {
                $machineCode = $parts[1];
                $this->info("Received config ACK for $machineCode: $message");
                // In phase 3/4 this could update DB status if needed
            }
        });

        $mqtt->loop(true);
    }
}
