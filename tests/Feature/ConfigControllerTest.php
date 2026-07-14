<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;
use App\Services\MqttService;
use Mockery\MockInterface;

class ConfigControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $device;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->device = Device::factory()->create(['machine_code' => 'TEST_CONF']);
    }

    public function test_can_view_config_page()
    {
        $response = $this->actingAs($this->user)->get("/devices/{$this->device->id}/config");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Devices/Config'));
    }

    public function test_cannot_update_config_when_device_is_running()
    {
        // 5.1.7 Test blokir config saat RUN
        Cache::put("device.{$this->device->machine_code}.run", true);

        $response = $this->actingAs($this->user)->put("/devices/{$this->device->id}/config/pins", [
            'configs' => [
                ['gpio_pin' => 1, 'function' => 'RS485_RX']
            ]
        ]);

        $response->assertSessionHasErrors(['error' => 'Tidak bisa ubah konfigurasi saat proses berjalan']);
    }

    public function test_validation_fails_on_duplicate_pins()
    {
        // 5.1.1 Unit test: validasi konflik pin
        $response = $this->actingAs($this->user)->put("/devices/{$this->device->id}/config/pins", [
            'configs' => [
                ['gpio_pin' => 1, 'function' => 'RS485_RX'],
                ['gpio_pin' => 1, 'function' => 'RS485_TX'], // duplicate pin
            ]
        ]);

        $response->assertSessionHasErrors(['configs.1.gpio_pin']);
    }

    public function test_push_config_via_mqtt()
    {
        // 5.1.4 Feature test: push config via MQTT
        // 5.1.6 Test MQTT publish payload format
        
        $this->mock(MqttService::class, function (MockInterface $mock) {
            $mock->shouldReceive('publishConfig')
                 ->once()
                 ->withArgs(function ($deviceArg, $payloadArg) {
                     return $deviceArg->id === $this->device->id 
                            && isset($payloadArg['pins'])
                            && isset($payloadArg['features']);
                 })
                 ->andReturn(true);
        });

        $response = $this->actingAs($this->user)->put("/devices/{$this->device->id}/config/pins", [
            'configs' => [
                ['gpio_pin' => 1, 'function' => 'RS485_RX'],
            ]
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pin_configs', [
            'device_id' => $this->device->id,
            'gpio_pin' => 1,
            'function' => 'RS485_RX',
        ]);
    }
}
