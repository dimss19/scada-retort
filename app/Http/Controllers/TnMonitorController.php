<?php

namespace App\Http\Controllers;

use App\Models\TnController;
use App\Models\TnReading;
use App\Services\TnModbusService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TnMonitorController extends Controller
{
    public function show(TnController $tn)
    {
        request()->session()->put([
            'active_tn_id' => $tn->id,
            'active_tn_model' => $tn->model_type,
        ]);

        $latestReading = $tn->readings()->latest()->first();

        $tn->load(['machine', 'scadaCanvas', 'scadaMappings' => fn ($q) => $q->orderBy('z_index')->orderBy('id')]);

        return Inertia::render('Tn/Monitor', [
            'controller' => $tn,
            'latestReading' => $latestReading,
        ]);
    }

    public function toggleRunStop(TnController $tn, TnModbusService $modbus)
    {
        $validated = request()->validate(['run' => 'required|boolean']);

        // TN coil 000001 uses 0 for RUN and 1 for STOP.
        $result = $modbus->writeSingleCoil($tn, 0, ! $validated['run']);
        
        if ($result['success']) {
            $msg = $validated['run'] ? 'START (RUN) berhasil dikirim via Modbus (Tanpa Jumper 18-21).' : 'STOP berhasil dikirim.';
            if (request()->wantsJson() || request()->header('Accept') === 'application/json') {
                return response()->json(['success' => true, 'message' => $msg]);
            }
            return back()->with('success', $msg);
        }

        if (request()->wantsJson() || request()->header('Accept') === 'application/json') {
            return response()->json(['success' => false, 'message' => 'Gagal mengirim perintah: ' . ($result['error'] ?? 'Unknown error')], 422);
        }
        return back()->with('error', 'Command failed: ' . $result['error']);
    }

    public function setSv(TnController $tn, TnModbusService $modbus)
    {
        request()->validate(['sv' => 'required|integer']);
        // SV is Holding Register 400006 -> offset 5
        $result = $modbus->writeSingleRegister($tn, 5, request('sv'));

        if ($result['success']) {
            return back()->with('success', 'SV updated successfully.');
        }
        return back()->with('error', 'Command failed: ' . $result['error']);
    }

    public function startAutoTune(TnController $tn, TnModbusService $modbus)
    {
        // AT is Coil 000002 -> offset 1
        $result = $modbus->writeSingleCoil($tn, 1, true); // true sets AT

        if ($result['success']) {
            return back()->with('success', 'Auto-Tune started.');
        }
        return back()->with('error', 'Command failed: ' . $result['error']);
    }

    public function resetAlarm(TnController $tn, TnModbusService $modbus)
    {
        // Alarm reset is Coil 000003 -> offset 2
        $result = $modbus->writeSingleCoil($tn, 2, true);

        if ($result['success']) {
            return back()->with('success', 'Alarms reset.');
        }
        return back()->with('error', 'Command failed: ' . $result['error']);
    }

    public function setMode(TnController $tn, TnModbusService $modbus)
    {
        // Auto/Manual is Holding Register 400003 -> offset 2
        $result = $modbus->writeSingleRegister($tn, 2, request('manual') ? 1 : 0);

        if ($result['success']) {
            return back()->with('success', 'Mode updated.');
        }
        return back()->with('error', 'Command failed: ' . $result['error']);
    }

    public function readings(TnController $tn)
    {
        $limit = request('limit', 1800); // 30 minutes of data at 1Hz
        $readings = $tn->readings()->latest()->limit($limit)->get()->reverse()->values();
        return response()->json($readings);
    }

    public function saveHistory(TnController $tn, Request $request)
    {
        $request->validate([
            'log_data' => 'required|array',
        ]);

        $logs = $request->log_data;
        if (empty($logs)) {
            return response()->json(['success' => false, 'message' => 'No logs to save']);
        }

        // Logs are stored newest first in frontend, reverse to get start and end time correctly
        $startTime = $logs[count($logs) - 1]['created_at'];
        $endTime = $logs[0]['created_at'];

        \App\Models\TnProcessHistory::create([
            'tn_controller_id' => $tn->id,
            'start_time' => \Carbon\Carbon::parse($startTime),
            'end_time' => \Carbon\Carbon::parse($endTime),
            'log_data' => $logs,
        ]);

        return response()->json(['success' => true]);
    }

    public function destroyHistory(\App\Models\TnProcessHistory $history)
    {
        $history->delete();
        return back()->with('success', 'Process history deleted.');
    }
}
