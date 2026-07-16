<?php

namespace App\Http\Controllers;

use App\Models\ControllerDevice;
use App\Models\TnController;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ControllerDeviceController extends Controller
{
    public function index(Request $request)
    {
        $controllerId = $request->integer('controller');

        $devices = ControllerDevice::with('controller.machine')
            ->when($controllerId, fn ($query) => $query->where('controller_id', $controllerId))
            ->get();

        return Inertia::render('Device/Index', [
            'devices' => $devices,
            'controllerId' => $controllerId ?: null,
        ]);
    }

    public function create(Request $request)
    {
        $controllerId = $request->integer('controller');

        return Inertia::render('Device/Form', [
            'controllers' => TnController::with('machine:id,machine_name')->get(['id', 'machine_id', 'name']),
            'selectedControllerId' => $controllerId ?: null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->valid($request);
        $data['device_code'] = $data['device_code'] ?: 'DEV-'.str_pad((string) (ControllerDevice::max('id') + 1), 4, '0', STR_PAD_LEFT);

        $device = ControllerDevice::create($data);

        return redirect()->route('devices.index', ['controller' => $device->controller_id]);
    }

    public function edit(ControllerDevice $device)
    {
        return Inertia::render('Device/Form', [
            'device' => $device,
            'controllers' => TnController::with('machine:id,machine_name')->get(['id', 'machine_id', 'name']),
            'selectedControllerId' => $device->controller_id,
        ]);
    }

    public function update(Request $request, ControllerDevice $device)
    {
        $device->update($this->valid($request));

        return redirect()->route('devices.index', ['controller' => $device->controller_id]);
    }

    public function destroy(ControllerDevice $device)
    {
        $controllerId = $device->controller_id;
        $device->delete();

        return redirect()->route('devices.index', ['controller' => $controllerId]);
    }

    private function valid(Request $r): array
    {
        return $r->validate([
            'controller_id' => ['required', 'exists:tn_controllers,id'],
            'device_code' => ['nullable', 'string', 'max:80'],
            'device_name' => ['required', 'string', 'max:255'],
            'device_type' => ['required', Rule::in(['Thermocouple'])],
            'sensor_type' => ['nullable', Rule::in(['K', 'J', 'PT100'])],
            'unit' => ['required', 'string', 'max:10'],
            'register_pv' => ['nullable', 'integer', 'min:0'],
            'register_sv' => ['nullable', 'integer', 'min:0'],
            'register_output' => ['nullable', 'integer', 'min:0'],
            'register_alarm' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);
    }
}
