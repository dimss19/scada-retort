<?php

namespace App\Http\Controllers;

use App\Models\TnController;
use App\Services\TnModbusService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TnControllerController extends Controller
{
    public function index()
    {
        $controllers = TnController::with(['readings' => function ($query) {
            $query->latest()->limit(1);
        }])->get();

        return Inertia::render('Tn/Index', [
            'controllers' => $controllers
        ]);
    }

    public function create()
    {
        return Inertia::render('Tn/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slave_id' => 'required|integer|min:1|max:99|unique:tn_controllers',
            'model_type' => 'required|in:TNS,TNH,TNL',
            'control_model' => 'required|in:fixed,program',
            'serial_port' => 'nullable|string',
            'baudrate' => 'required|integer',
            'parity' => 'required|in:N,E,O',
            'stopbits' => 'required|integer',
        ]);

        $controller = TnController::create($validated);

        return redirect()->route('tn.monitor', $controller->id)->with('success', 'TN Controller added successfully.');
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

    public function testConnection(TnController $tn, TnModbusService $modbus)
    {
        $result = $modbus->testConnection($tn);
        if ($result['success']) {
            return response()->json(['message' => 'Connection successful', 'data' => $result['data']]);
        }
        return response()->json(['message' => 'Connection failed', 'error' => $result['error']], 500);
    }
}
