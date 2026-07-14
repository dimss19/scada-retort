<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Device;
use App\Http\Requests\UploadFirmwareRequest;
use App\Http\Requests\DeployOtaRequest;
use Inertia\Inertia;

class OtaController extends Controller
{
    public function index()
    {
        $devices = Device::orderBy('name')->get();
        $deployments = \App\Models\OtaDeployment::with(['device', 'firmwareFile'])
            ->orderByDesc('created_at')
            ->get();
        return Inertia::render('Ota/Index', compact('devices', 'deployments'));
    }

    public function uploadFirmware(UploadFirmwareRequest $request)
    {
        $file = $request->file('file');
        
        $md5 = md5_file($file->getRealPath());
        $path = $file->storeAs('firmware', $file->getClientOriginalName(), 'local');

        \App\Models\FirmwareFile::create([
            'filename' => $file->getClientOriginalName(),
            'version' => $request->version,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'checksum_md5' => $md5,
            'uploaded_by' => auth()->id(),
        ]);

        return back()->with('success', 'Firmware berhasil diunggah.');
    }

    public function deploy(\App\Http\Requests\DeployOtaRequest $request, \App\Services\MqttService $mqttService)
    {
        $device = Device::findOrFail($request->device_id);
        
        // Buat OtaDeployment record
        $deployment = \App\Models\OtaDeployment::create([
            'device_id' => $device->id,
            'firmware_file_id' => $request->firmware_file_id,
            'status' => 'pending',
            'progress' => 0,
        ]);

        // Publish MQTT
        $downloadUrl = url("/api/ota/firmware/{$request->firmware_file_id}/download");
        $success = $mqttService->publishOtaNotify($device, $downloadUrl);

        if ($success) {
            return back()->with('success', 'OTA Update berhasil di-push ke device.');
        } else {
            return back()->with('warning', 'Broker MQTT sedang tidak tersedia. Proses OTA mungkin tertunda.');
        }
    }

    public function download($id)
    {
        $firmware = \App\Models\FirmwareFile::findOrFail($id);
        
        $path = storage_path('app/private/' . $firmware->file_path);
        
        if (!file_exists($path)) {
            // Check old local disk path just in case
            $path = storage_path('app/' . $firmware->file_path);
            if (!file_exists($path)) {
                abort(404, 'Firmware file not found.');
            }
        }

        return response()->download($path, $firmware->filename, [
            'Content-Type' => 'application/octet-stream',
            'x-MD5' => $firmware->checksum_md5,
        ]);
    }
}
