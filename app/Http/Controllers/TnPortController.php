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
        $request->validate(['port' => 'nullable|string']);

        $port = $request->port ?: ($tn->serial_port ?: null);
        $result = $modbus->testPort($tn, $port);

        if ($result['success']) {
            $rawPv = $result['data'][0] ?? null;
            $pvText = $rawPv !== null ? ' (PV: ' . number_format($rawPv / 10, 1) . ' °C)' : '';
            $portDisplay = ($port && strtolower($port) !== 'auto') ? $port : ($tn->serial_port ?: 'Auto Port');
            return response()->json([
                'success' => true,
                'message' => "Koneksi ke {$portDisplay} berhasil! Respons controller diterima{$pvText}.",
                'data' => $result['data'] ?? null,
                'pv' => $rawPv !== null ? $rawPv / 10 : null,
            ]);
        }

        $portDisplay = ($port && strtolower($port) !== 'auto') ? $port : ($tn->serial_port ?: 'Auto Port');
        return response()->json([
            'success' => false,
            'message' => "Koneksi ke {$portDisplay} gagal: " . ($result['error'] ?? 'Unknown error'),
        ]);
    }

    public function togglePin(TnController $tn, Request $request, TnModbusService $modbus)
    {
        $request->validate([
            'channel' => 'required|string',
            'port' => 'nullable|string',
        ]);

        $result = $modbus->togglePin($tn, $request->channel, $request->port);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? "Pin {$request->channel} berhasil diaktifkan selama 2 detik.",
                'channel' => $request->channel,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => "Test Pin {$request->channel} gagal: " . ($result['error'] ?? 'Unknown error'),
        ], 422);
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
