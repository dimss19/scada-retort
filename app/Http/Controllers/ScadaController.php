<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Device;
use App\Http\Requests\UpdateScadaMappingRequest;
use Inertia\Inertia;

class ScadaController extends Controller
{
    public function show(Device $device)
    {
        $device->load(['scadaMappings', 'featureConfigs']);
        return Inertia::render('Scada/Show', [
            'device' => $device,
            'mappings' => $device->scadaMappings,
            'featureConfigs' => $device->featureConfigs,
        ]);
    }

    public function editMapping(Device $device)
    {
        return Inertia::render('Scada/Config', compact('device'));
    }

    public function updateMapping(UpdateScadaMappingRequest $request, Device $device)
    {
        //
    }
}
