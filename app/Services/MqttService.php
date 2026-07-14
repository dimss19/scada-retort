<?php

namespace App\Services;

use App\Models\Device;
use PhpMqtt\Client\Facades\MQTT;

class MqttService
{
    /**
     * Publish configuration to a specific device.
     */
    public function publishConfig(Device $device, array $config)
    {
        try {
            $topic = "retort/{$device->machine_code}/config/push";
            MQTT::publish($topic, json_encode($config), 1, true); // QoS 1, Retained
            return true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("MQTT Publish Config failed for device {$device->machine_code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notify device about a new OTA firmware.
     */
    public function publishOtaNotify(Device $device, string $downloadUrl)
    {
        try {
            $topic = "retort/{$device->machine_code}/ota/notify";
            $payload = ['download_url' => $downloadUrl];
            MQTT::publish($topic, json_encode($payload), 1);
            return true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("MQTT Publish OTA Notify failed for device {$device->machine_code}: " . $e->getMessage());
            return false;
        }
    }
}
