<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Device;
use App\Http\Requests\UpdatePinConfigRequest;
use App\Http\Requests\UpdateFeatureConfigRequest;
use Inertia\Inertia;

class ConfigController extends Controller
{
    public function edit(Device $device)
    {
        $device->load(['pinConfigs', 'featureConfigs']);
        $isRunning = \Illuminate\Support\Facades\Cache::get("device.{$device->machine_code}.run", false);

        return Inertia::render('Devices/Config', [
            'device' => $device,
            'pinConfigs' => $device->pinConfigs,
            'featureConfigs' => $device->featureConfigs,
            'isRunning' => $isRunning,
        ]);
    }

    public function updatePins(UpdatePinConfigRequest $request, Device $device, \App\Services\MqttService $mqttService)
    {
        if (\Illuminate\Support\Facades\Cache::get("device.{$device->machine_code}.run")) {
            return back()->withErrors(['error' => 'Tidak bisa ubah konfigurasi saat proses berjalan']);
        }

        $configs = $request->input('configs', []);
        
        // Simpan ke DB
        foreach ($configs as $config) {
            $device->pinConfigs()->updateOrCreate(
                ['gpio_pin' => $config['gpio_pin']],
                ['function' => $config['function']]
            );
        }

        // Prepare full payload
        $device->load(['pinConfigs', 'featureConfigs']);
        $payload = [
            'pins' => $device->pinConfigs->toArray(),
            'features' => $device->featureConfigs->toArray(),
        ];

        $success = $mqttService->publishConfig($device, $payload);
        
        if ($success) {
            return back()->with('success', 'Konfigurasi pin berhasil dikirim ke device.');
        } else {
            return back()->with('warning', 'Konfigurasi tersimpan, tetapi broker MQTT sedang tidak tersedia. Konfigurasi akan dikirim setelah broker online.');
        }
    }

    public function updateFeatures(UpdateFeatureConfigRequest $request, Device $device, \App\Services\MqttService $mqttService)
    {
        if (\Illuminate\Support\Facades\Cache::get("device.{$device->machine_code}.run")) {
            return back()->withErrors(['error' => 'Tidak bisa ubah konfigurasi saat proses berjalan']);
        }
        
        $features = $request->input('features', []);
        
        foreach ($features as $feature) {
            $device->featureConfigs()->updateOrCreate(
                ['module_name' => $feature['module_name']],
                ['enabled' => $feature['enabled']]
            );
        }

        // Prepare full payload
        $device->load(['pinConfigs', 'featureConfigs']);
        $payload = [
            'pins' => $device->pinConfigs->toArray(),
            'features' => $device->featureConfigs->toArray(),
        ];

        $success = $mqttService->publishConfig($device, $payload);

        if ($success) {
            return back()->with('success', 'Konfigurasi modul berhasil dikirim ke device.');
        } else {
            return back()->with('warning', 'Konfigurasi tersimpan, tetapi broker MQTT sedang tidak tersedia. Konfigurasi akan dikirim setelah broker online.');
        }
    }
}
