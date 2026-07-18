<?php

namespace App\Http\Controllers;

use App\Models\TnController;
use App\Services\TnModbusService;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;

class TnControllerController extends Controller
{
    public function index()
    {
        $controllerId = request()->session()->get('active_tn_id');

        if ($controllerId && $controller = TnController::find($controllerId)) {
            return redirect()->route('tn.monitor', $controller->id);
        }

        return redirect()->route('dashboard')->with('info', 'Pilih tipe controller terlebih dahulu.');
    }

    public function quickStart(string $model)
    {
        $model = strtoupper($model);
        abort_unless(in_array($model, ['TNS', 'TNH', 'TNL'], true), 404);

        $controller = TnController::query()
            ->where('model_type', $model)
            ->orderBy('id')
            ->first();

        if (!$controller) {
            return redirect()->route('tn.index')->with(
                'error',
                "Profil {$model} belum tersedia. Jalankan database seeder terlebih dahulu."
            );
        }

        $controller->update(['serial_port' => $this->detectSerialPort()]);
        request()->session()->put([
            'active_tn_id' => $controller->id,
            'active_tn_model' => $controller->model_type,
        ]);

        return redirect()->route('tn.monitor', $controller->id);
    }

    public function show(TnController $tn)
    {
        return redirect()->route('tn.monitor', $tn->id);
    }

    public function destroy(TnController $tn)
    {
        $tn->delete();
        return redirect()->route('tn.index')->with('success', 'TN Controller deleted successfully.');
    }

    private function detectSerialPort(): string
    {
        $fallback = config('tn.serial_port', 'COM3');

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                // Use .NET SerialPort.GetPortNames() which detects USB-to-Serial adapters
                // (CH340, FTDI, CP210x) that Win32_SerialPort misses
                $result = Process::run([
                    'powershell',
                    '-NoProfile',
                    '-Command',
                    '([System.IO.Ports.SerialPort]::GetPortNames()) -join ","',
                ]);

                if ($result->successful()) {
                    $ports = array_values(array_filter(array_map('trim', explode(',', trim($result->output())))));

                    if (!empty($ports)) {
                        return $ports[0];
                    }
                }
            } else {
                foreach (glob('/dev/ttyUSB*') ?: [] as $port) {
                    return $port;
                }
                foreach (glob('/dev/ttyACM*') ?: [] as $port) {
                    return $port;
                }
                foreach (glob('/dev/ttyS*') ?: [] as $port) {
                    return $port;
                }
            }
        } catch (\Throwable $e) {
            // Fall back to the configured default port.
        }

        return $fallback;
    }

    public function testConnection(TnController $tn, TnModbusService $modbus)
    {
        $result = $modbus->testConnection($tn);
        if ($result['success']) {
            return response()->json(['message' => 'Connection successful', 'data' => $result['data']]);
        }
        return response()->json(['message' => 'Connection failed', 'error' => $result['error']], 500);
    }
}
