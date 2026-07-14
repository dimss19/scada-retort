<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_view_devices_index()
    {
        Device::factory()->count(3)->create();

        $response = $this->actingAs($this->user)->get('/devices');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Devices/Index'));
    }

    public function test_can_store_device()
    {
        $response = $this->actingAs($this->user)->post('/devices', [
            'machine_code' => 'TEST_001',
            'name' => 'Test Machine',
            'mqtt_broker' => '127.0.0.1',
            'mqtt_port' => 1883,
        ]);

        $response->assertRedirect('/devices');
        $this->assertDatabaseHas('devices', [
            'machine_code' => 'TEST_001',
            'name' => 'Test Machine',
        ]);
    }

    public function test_cannot_store_duplicate_machine_code()
    {
        Device::factory()->create(['machine_code' => 'DUP_001']);

        $response = $this->actingAs($this->user)->post('/devices', [
            'machine_code' => 'DUP_001',
            'name' => 'Test Machine 2',
            'mqtt_broker' => '127.0.0.1',
            'mqtt_port' => 1883,
        ]);

        $response->assertSessionHasErrors(['machine_code']);
    }

    public function test_can_delete_device()
    {
        $device = Device::factory()->create();

        $response = $this->actingAs($this->user)->delete("/devices/{$device->id}");

        $response->assertRedirect('/devices');
        $this->assertDatabaseMissing('devices', [
            'id' => $device->id,
        ]);
    }
}
