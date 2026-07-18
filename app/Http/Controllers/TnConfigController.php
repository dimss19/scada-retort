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

    public function scanPattern(TnController $tn, TnModbusService $modbus)
    {
        // Read pattern config (400201-400209) -> offset 200-208
        $configResult = $modbus->readHoldingRegisters($tn, 200, 9);
        
        if (!$configResult['success']) {
            return response()->json(['error' => 'Failed to read pattern config: ' . $configResult['error']], 500);
        }

        // Read pattern steps (400210-400249) -> offset 209-248 (40 registers)
        $stepsResult = $modbus->readHoldingRegisters($tn, 209, 40);

        if (!$stepsResult['success']) {
            return response()->json(['error' => 'Failed to read pattern steps: ' . $stepsResult['error']], 500);
        }

        $configData = $configResult['data'];
        $stepsData = $stepsResult['data'];

        $pattern = [
            'time_unit' => $configData[0] ?? 0,
            'start_condition' => $configData[1] ?? 0,
            'wait_width' => $configData[2] ?? 0,
            'wait_time' => $configData[3] ?? 0,
            'pattern_number' => $configData[4] ?? 0,
            'repetitions' => $configData[5] ?? 0,
            'end_state' => $configData[6] ?? 0,
            'pid_select' => $configData[7] ?? 0,
            'step_quantity' => $configData[8] ?? 0,
            'steps' => []
        ];

        for ($i = 0; $i < 20; $i++) {
            $pattern['steps'][] = [
                'target_sv' => $stepsData[$i * 2] ?? 0,
                'duration' => $stepsData[($i * 2) + 1] ?? 0,
            ];
        }

        return response()->json($pattern);
    }

    public function writePattern(Request $request, TnController $tn, TnModbusService $modbus)
    {
        $data = $request->validate([
            'time_unit' => 'required|integer',
            'start_condition' => 'required|integer',
            'wait_width' => 'required|integer',
            'wait_time' => 'required|integer',
            'pattern_number' => 'required|integer',
            'repetitions' => 'required|integer',
            'end_state' => 'required|integer',
            'pid_select' => 'required|integer',
            'step_quantity' => 'required|integer',
            'steps' => 'required|array',
            'steps.*.target_sv' => 'required|integer',
            'steps.*.duration' => 'required|integer',
        ]);

        $configValues = [
            $data['time_unit'],
            $data['start_condition'],
            $data['wait_width'],
            $data['wait_time'],
            $data['pattern_number'],
            $data['repetitions'],
            $data['end_state'],
            $data['pid_select'],
            $data['step_quantity'],
        ];

        // Write config
        $configResult = $modbus->writeMultipleRegisters($tn, 200, $configValues);
        if (!$configResult['success']) {
            return back()->with('error', 'Failed to write pattern config: ' . $configResult['error']);
        }

        // Write steps
        $stepValues = [];
        for ($i = 0; $i < 20; $i++) {
            $step = $data['steps'][$i] ?? ['target_sv' => 0, 'duration' => 0];
            $stepValues[] = $step['target_sv'];
            $stepValues[] = $step['duration'];
        }

        $stepsResult = $modbus->writeMultipleRegisters($tn, 209, $stepValues);
        if (!$stepsResult['success']) {
            return back()->with('error', 'Failed to write pattern steps: ' . $stepsResult['error']);
        }

        return back()->with('success', 'Pattern written to device successfully.');
    }
}
