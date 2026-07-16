<?php

namespace App\Http\Controllers;

use App\Models\TnController;
use App\Models\TnConfig;
use App\Services\TnModbusService;
use App\Services\TnRegisterMap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TnConfigController extends Controller
{
    public function edit(TnController $tn)
    {
        $configs = $tn->configs()->get()->keyBy('register_address');
        return Inertia::render('Tn/Config', [
            'controller' => $tn,
            'configs' => $configs,
            'groups' => TnRegisterMap::$holdingGroups
        ]);
    }

    public function syncFromDevice(TnController $tn, TnModbusService $modbus)
    {
        // For Phase 2: sync all configs from device
        return back()->with('info', 'Sync feature will be fully implemented in Phase 2.');
    }

    public function updateGroup(Request $request, TnController $tn, $group, TnModbusService $modbus)
    {
        // For Phase 2: write multiple configs to device
        return back()->with('info', 'Config write feature will be fully implemented in Phase 2.');
    }
}
