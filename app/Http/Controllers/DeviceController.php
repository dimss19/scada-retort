<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Device;
use App\Http\Requests\StoreDeviceRequest;
use Inertia\Inertia;

class DeviceController extends Controller
{
    public function index()
    {
        $devices = Device::orderBy('name')->get();
        return Inertia::render('Devices/Index', compact('devices'));
    }

    public function create()
    {
        return Inertia::render('Devices/Create');
    }

    public function store(StoreDeviceRequest $request)
    {
        Device::create($request->validated());
        return redirect()->route('devices.index')->with('success', 'Device berhasil ditambahkan.');
    }

    public function show(Device $device)
    {
        return Inertia::render('Devices/Show', compact('device'));
    }

    public function destroy(Device $device)
    {
        $device->delete();
        return redirect()->route('devices.index')->with('success', 'Device berhasil dihapus.');
    }
}
