<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\MqttService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class EspMonitorController extends Controller
{
    /**
     * Display the ESP32 Retort Logger live monitoring dashboard.
     */
    public function index(Request $request)
    {
        $devices = Device::all();
        $selectedCode = $request->query('machine_code', $devices->first()?->machine_code ?? 'RT-001');

        $device = $devices->firstWhere('machine_code', $selectedCode) ?? (object)[
            'id' => 1,
            'machine_code' => $selectedCode,
            'name' => 'ESP Retort Logger',
            'firmware_version' => '1.0.0',
            'mqtt_broker' => config('mqtt.host', '127.0.0.1'),
            'mqtt_port' => 1883,
            'is_online' => false,
        ];

        // Retrieve latest telemetry cached by MqttSubscribeCommand
        $latest = Cache::get("esp_latest_telemetry_{$selectedCode}", [
            'machine_code' => $selectedCode,
            'pv' => 25.0,
            'sv' => 121.1,
            'actual' => 25.0,
            'setting' => 121.1,
            'mv' => 0.0,
            'phase' => 'IDLE',
            'ps' => '00.00',
            'tot' => '00:00',
            'stp' => '00:00',
            'pattern' => 0,
            'step' => 0,
            'run' => false,
            'logging' => false,
            'ts' => now()->toDateTimeString(),
            'iso' => now()->toIso8601String(),
        ]);

        $lastSeen = Cache::get("device.{$selectedCode}.last_seen");
        $isOnline = $lastSeen && (now()->timestamp - $lastSeen < 30);

        $history = Cache::get("esp_telemetry_history_{$selectedCode}", []);
        $systemEvent = Cache::get("esp_latest_system_event_{$selectedCode}");

        $processHistories = \App\Models\TnProcessHistory::with('controller.machine')
            ->latest('start_time')
            ->take(30)
            ->get();

        // Default or cached pattern steps for this ESP logger
        $cachedPattern = Cache::get("esp_pattern_{$selectedCode}");
        if ($cachedPattern && isset($cachedPattern['steps'])) {
            foreach ($cachedPattern['steps'] as &$step) {
                if (isset($step['target_sv']) && $step['target_sv'] > 300) {
                    $step['target_sv'] = (float)($step['target_sv'] / 10);
                }
            }
            $pattern = $cachedPattern;
        } else {
            $pattern = [
                'time_unit' => 'MM.SS',
                'pattern_number' => 0,
                'steps' => [
                    ['step_number' => 0, 'step_name' => 'Step 1', 'target_sv' => 117.0, 'duration' => 2, 'end_action' => 'CONT'],
                    ['step_number' => 1, 'step_name' => 'Step 2', 'target_sv' => 117.0, 'duration' => 35, 'end_action' => 'CONT'],
                    ['step_number' => 2, 'step_name' => 'Step 2', 'target_sv' => 125.0, 'duration' => 3, 'end_action' => 'CONT'],
                    ['step_number' => 3, 'step_name' => 'Step 3', 'target_sv' => 125.0, 'duration' => 100, 'end_action' => 'CONT'],
                ]
            ];
        }

        return Inertia::render('Esp/Monitor', [
            'device' => $device,
            'devices' => $devices,
            'initialTelemetry' => $latest,
            'history' => $history,
            'isOnline' => (bool)$isOnline,
            'systemEvent' => $systemEvent,
            'histories' => $processHistories,
            'initialPattern' => $pattern,
        ]);
    }

    /**
     * Save Pattern steps and sync to ESP32 via MQTT.
     */
    public function savePattern(Request $request, MqttService $mqttService)
    {
        $validated = $request->validate([
            'machine_code' => ['required', 'string'],
            'time_unit' => ['nullable', 'string', 'in:MM.SS,HH.MM'],
            'pattern_number' => ['nullable', 'integer', 'min:0', 'max:9'],
            'steps' => ['required', 'array', 'min:1', 'max:20'],
            'steps.*.step_name' => ['nullable', 'string', 'max:50'],
            'steps.*.target_sv' => ['required', 'numeric'],
            'steps.*.duration' => ['required', 'numeric', 'min:0'],
            'steps.*.end_action' => ['nullable', 'string', 'in:CONT,HOLD,STOP'],
        ]);

        $machineCode = $validated['machine_code'];
        $steps = [];

        foreach ($validated['steps'] as $idx => $s) {
            $steps[] = [
                'step_number' => $idx,
                'step_name' => $s['step_name'] ?? "Step " . ($idx + 1),
                'target_sv' => (float)$s['target_sv'],
                'duration' => (int)$s['duration'],
                'end_action' => $s['end_action'] ?? 'CONT',
            ];
        }

        $patternData = [
            'machine_code' => $machineCode,
            'time_unit' => $validated['time_unit'] ?? 'MM.SS',
            'pattern_number' => $validated['pattern_number'] ?? 0,
            'steps' => $steps,
            'updated_at' => now()->toIso8601String(),
        ];

        // Store in cache
        Cache::put("esp_pattern_{$machineCode}", $patternData, now()->addDays(30));

        // Publish via MQTT
        $device = Device::where('machine_code', $machineCode)->first() ?? (object)['machine_code' => $machineCode];
        $mqttPublished = $mqttService->publishPattern($device, $patternData);

        return back()->with('success', $mqttPublished
            ? 'Pattern berhasil disimpan dan disinkronkan ke ESP via MQTT!'
            : 'Pattern berhasil disimpan (MQTT gagal dikirim, periksa koneksi broker).');
    }

    /**
     * Fallback API endpoint for polling or quick status check.
     */
    public function liveData(Request $request)
    {
        $machineCode = $request->query('machine_code', 'RT-001');
        $latest = Cache::get("esp_latest_telemetry_{$machineCode}");
        $lastSeen = Cache::get("device.{$machineCode}.last_seen");
        $isOnline = $lastSeen && (now()->timestamp - $lastSeen < 30);
        $history = Cache::get("esp_telemetry_history_{$machineCode}", []);

        return response()->json([
            'telemetry' => $latest,
            'is_online' => (bool)$isOnline,
            'history' => $history,
        ]);
    }
}
