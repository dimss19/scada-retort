<?php

namespace App\Http\Controllers;

use App\Models\TnController;
use App\Services\TnModbusService;
use Illuminate\Http\Request;

class TnPortController extends Controller
{
    public function list(TnController $tn, TnModbusService $modbus)
    {
        $ports = $modbus->listAvailablePorts();
        return response()->json(['success' => true, 'ports' => $ports]);
    }

    public function scan(TnController $tn, TnModbusService $modbus)
    {
        $modbus->clearPortCache($tn);
        $port = $modbus->scanPorts($tn);

        if ($port) {
            $tn->update(['serial_port' => $port, 'last_error' => null]);
            return response()->json([
                'success' => true,
                'port' => $port,
                'message' => "Port {$port} ditemukan dan merespons. Port telah dipilih."
            ]);
        }

        $ports = $modbus->listAvailablePorts();
        $portNames = array_column($ports, 'device');

        return response()->json([
            'success' => false,
            'port' => null,
            'message' => 'Tidak ada port Modbus yang merespons. Cek kabel dan power device.',
            'available_ports' => $portNames,
        ]);
    }

    public function test(TnController $tn, Request $request, TnModbusService $modbus)
    {
        $request->validate(['port' => 'required|string']);

        $result = $modbus->testPort($tn, $request->port);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => "Koneksi ke {$request->port} berhasil.",
                'data' => $result['data'] ?? null,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => "Koneksi ke {$request->port} gagal: " . ($result['error'] ?? 'Unknown error'),
        ]);
    }

    public function select(TnController $tn, Request $request, TnModbusService $modbus)
    {
        $request->validate([
            'port' => 'required|string',
            'mode' => 'sometimes|in:manual,auto',
        ]);

        $mode = $request->mode ?? 'manual';

        if ($mode === 'auto') {
            $modbus->clearPortCache($tn);
            $tn->update(['serial_port' => null, 'last_error' => null]);
            return response()->json([
                'success' => true,
                'message' => 'Mode auto-detect diaktifkan. Port akan dideteksi otomatis.',
                'serial_port' => null,
            ]);
        }

        $modbus->clearPortCache($tn);
        $tn->update(['serial_port' => $request->port, 'last_error' => null]);
        return response()->json([
            'success' => true,
            'message' => "Port di-set ke {$request->port}. Error sebelumnya telah di-reset.",
            'serial_port' => $request->port,
        ]);
    }

    public function status(TnController $tn)
    {
        $lastError = $tn->last_error;

        return response()->json([
            'success' => true,
            'is_online' => $tn->is_online,
            'serial_port' => $tn->serial_port,
            'last_seen_at' => $tn->last_seen_at,
            'last_error' => $lastError,
            'last_error_preview' => $lastError ? \Illuminate\Support\Str::limit($lastError, 120) : null,
        ]);
    }
}
