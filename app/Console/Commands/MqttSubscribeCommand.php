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
            if (isset($payload['machine_code'])) {
                $machineCode = $payload['machine_code'];
                broadcast(new SensorDataReceived($machineCode, $payload));

                // Cache RUN status (Rule 2) and timestamp (Rule 4)
                if (isset($payload['run'])) {
                    \Illuminate\Support\Facades\Cache::put("device.{$machineCode}.run", $payload['run'], now()->addMinutes(5));
                }
                \Illuminate\Support\Facades\Cache::put("device.{$machineCode}.last_seen", now()->timestamp, now()->addMinutes(5));
            }
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
