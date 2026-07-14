<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use App\Models\FirmwareFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Services\MqttService;
use Mockery\MockInterface;

class OtaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $device;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->device = Device::factory()->create();
    }

    public function test_can_upload_valid_bin_file()
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('firmware.bin', 1000, 'application/octet-stream');

        $response = $this->actingAs($this->user)->post('/ota/firmware', [
            'file' => $file,
            'version' => '1.0.0',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('firmware_files', [
            'version' => '1.0.0',
            'filename' => 'firmware.bin',
        ]);

        Storage::disk('local')->assertExists('firmware/firmware.bin');
    }

    public function test_cannot_upload_invalid_file_type()
    {
        // 5.1.2 Unit test: validasi file .bin
        Storage::fake('local');

        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($this->user)->post('/ota/firmware', [
            'file' => $file,
            'version' => '1.0.0',
        ]);

        $response->assertSessionHasErrors(['file']);
    }

    public function test_cannot_upload_file_exceeding_max_size()
    {
        // 5.1.2 Unit test: validasi file .bin (> 1.5MB = 1536KB)
        Storage::fake('local');

        // Create a 2MB file
        $file = UploadedFile::fake()->create('large_firmware.bin', 2000, 'application/octet-stream');

        $response = $this->actingAs($this->user)->post('/ota/firmware', [
            'file' => $file,
            'version' => '1.0.0',
        ]);

        $response->assertSessionHasErrors(['file']);
    }

    public function test_can_deploy_ota_and_notify_mqtt()
    {
        // 5.1.5 Feature test: OTA upload + deploy flow
        $firmware = FirmwareFile::create([
            'filename' => 'test.bin',
            'version' => '1.0.0',
            'file_path' => 'firmware/test.bin',
            'file_size' => 1024,
            'checksum_md5' => 'dummy',
            'uploaded_by' => $this->user->id,
        ]);

        $this->mock(MqttService::class, function (MockInterface $mock) {
            $mock->shouldReceive('publishOtaNotify')
                 ->once()
                 ->withArgs(function ($deviceArg, $urlArg) {
                     return $deviceArg->id === $this->device->id 
                            && str_contains($urlArg, '/api/ota/firmware/');
                 })
                 ->andReturn(true);
        });

        $response = $this->actingAs($this->user)->post('/ota/deploy', [
            'device_id' => $this->device->id,
            'firmware_file_id' => $firmware->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('ota_deployments', [
            'device_id' => $this->device->id,
            'firmware_file_id' => $firmware->id,
            'status' => 'pending',
        ]);
    }
}
