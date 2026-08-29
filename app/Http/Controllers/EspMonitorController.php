<?php

namespace App\Http\Controllers;

use App\Models\Device;
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

        return Inertia::render('Esp/Monitor', [
            'device' => $device,
            'devices' => $devices,
            'initialTelemetry' => $latest,
            'history' => $history,
            'isOnline' => (bool)$isOnline,
            'systemEvent' => $systemEvent,
        ]);
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
