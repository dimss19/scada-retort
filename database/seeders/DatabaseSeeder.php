<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Machine;
use App\Models\TnController;
use App\Models\ControllerDevice;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Default Admin User
        User::firstOrCreate(
            ['email' => 'admin@scada.local'],
            [
                'name' => 'Admin Operator',
                'password' => bcrypt('password123'), // Default password
            ]
        );

        foreach ([
            ['RT-01', 'Retort TNS', 'TNS', 1],
            ['RT-02', 'Retort TNH', 'TNH', 2],
            ['RT-03', 'Retort TNL', 'TNL', 3],
        ] as [$code, $name, $model, $defaultSlaveId]) {
            $machine = Machine::updateOrCreate(
                ['machine_code' => $code],
                ['machine_name' => $name, 'description' => 'Production retort machine', 'location' => 'Production Area', 'status' => 'Active']
            );

            $controller = TnController::where('model_type', $model)->orderBy('id')->first();
            $controller ??= new TnController([
                'model_type' => $model,
                'slave_id' => $this->availableSlaveId($defaultSlaveId),
            ]);
            $controller->fill([
                'machine_id' => $machine->id,
                'name' => $model.' Controller',
                'control_model' => 'program',
                'serial_port' => config('tn.serial_port', 'COM3'),
                'baudrate' => config('tn.baudrate', 9600),
                'parity' => config('tn.parity', 'N'),
                'stopbits' => config('tn.stopbits', 2),
                'communication' => 'RS485',
            ])->save();

            ControllerDevice::firstOrCreate(
                ['controller_id' => $controller->id, 'device_name' => 'Thermocouple-'.$code],
                ['device_type' => 'Thermocouple', 'sensor_type' => 'K', 'unit' => '°C', 'register_pv' => 1000, 'register_sv' => 0, 'register_output' => 1, 'status' => 'Active']
            );
        }

        $this->seedScadaTemplates();
    }

    private function seedScadaTemplates(): void
    {
        $controllers = TnController::all();

        foreach ($controllers as $tn) {
            \App\Models\ScadaCanvas::updateOrCreate(
                ['tn_controller_id' => $tn->id],
                [
                    'width' => 1200,
                    'height' => 800,
                    'grid_enabled' => true,
                    'grid_size' => 20,
                    'snap_to_grid' => true,
                ]
            );

            \App\Models\ScadaMapping::where('tn_controller_id', $tn->id)->delete();

            $items = [
                ['element_id' => 'title', 'element_type' => 'label', 'label' => 'MESIN RETORT (STERILISASI)', 'data_source' => 'process_phase', 'position_x' => 100, 'position_y' => 20, 'width' => 1000, 'height' => 44, 'z_index' => 10],

                ['element_id' => 'controller_run', 'element_type' => 'indicator', 'label' => 'RUN', 'data_source' => 'controller_running', 'position_x' => 100, 'position_y' => 76, 'width' => 110, 'height' => 56, 'normal_color' => '#22c55e'],
                ['element_id' => 'mode', 'element_type' => 'display', 'label' => 'MODE', 'data_source' => 'auto_manual', 'position_x' => 230, 'position_y' => 76, 'width' => 160, 'height' => 56, 'normal_color' => '#34d399'],
                ['element_id' => 'alarm', 'element_type' => 'indicator', 'label' => 'ALARM', 'data_source' => 'alarm_active', 'position_x' => 810, 'position_y' => 76, 'width' => 130, 'height' => 56, 'normal_color' => '#ef4444'],
                ['element_id' => 'door_lock', 'element_type' => 'indicator', 'label' => 'DOOR LOCK', 'data_source' => 'door_lock', 'position_x' => 960, 'position_y' => 76, 'width' => 140, 'height' => 56, 'normal_color' => '#22c55e'],

                ['element_id' => 'pv_title', 'element_type' => 'label', 'label' => 'TABUNG PV (SUHU AKTUAL)', 'data_source' => 'pv', 'position_x' => 100, 'position_y' => 150, 'width' => 260, 'height' => 40],
                ['element_id' => 'tank_pv', 'element_type' => 'tank', 'label' => 'PV', 'data_source' => 'pv', 'position_x' => 130, 'position_y' => 205, 'width' => 200, 'height' => 260, 'normal_color' => '#06b6d4', 'warning_threshold' => 121, 'critical_threshold' => 130],
                ['element_id' => 'actual_temp', 'element_type' => 'display', 'label' => 'PV (SUHU AKTUAL)', 'data_source' => 'pv', 'position_x' => 130, 'position_y' => 480, 'width' => 200, 'height' => 75, 'normal_color' => '#22d3ee', 'warning_threshold' => 121, 'critical_threshold' => 130],

                ['element_id' => 'steam_valve', 'element_type' => 'valve', 'label' => 'STEAM VALVE', 'data_source' => 'heating_mv', 'position_x' => 555, 'position_y' => 215, 'width' => 90, 'height' => 95, 'normal_color' => '#22c55e'],
                ['element_id' => 'steam_pipe', 'element_type' => 'pipe', 'label' => 'STEAM FLOW', 'data_source' => 'heating_mv', 'position_x' => 340, 'position_y' => 290, 'width' => 520, 'height' => 28, 'normal_color' => '#38bdf8'],
                ['element_id' => 'steam_info', 'element_type' => 'label', 'label' => 'STEAM & WATER LINE', 'data_source' => 'process_phase', 'position_x' => 460, 'position_y' => 335, 'width' => 280, 'height' => 38],
                ['element_id' => 'cooling_pipe', 'element_type' => 'pipe', 'label' => 'COOLING FLOW', 'data_source' => 'cooling_mv', 'position_x' => 340, 'position_y' => 420, 'width' => 520, 'height' => 28, 'normal_color' => '#0284c7'],
                ['element_id' => 'cooling_pump', 'element_type' => 'pump', 'label' => 'COOLING PUMP', 'data_source' => 'cooling_mv', 'position_x' => 555, 'position_y' => 460, 'width' => 90, 'height' => 95, 'normal_color' => '#38bdf8'],

                ['element_id' => 'sv_title', 'element_type' => 'label', 'label' => 'TABUNG SV (TARGET SUHU)', 'data_source' => 'sv', 'position_x' => 840, 'position_y' => 150, 'width' => 260, 'height' => 40],
                ['element_id' => 'tank_sv', 'element_type' => 'tank', 'label' => 'SV', 'data_source' => 'sv', 'position_x' => 870, 'position_y' => 205, 'width' => 200, 'height' => 260, 'normal_color' => '#10b981', 'warning_threshold' => 125, 'critical_threshold' => 135],
                ['element_id' => 'target_temp', 'element_type' => 'display', 'label' => 'SV (TARGET SUHU)', 'data_source' => 'sv', 'position_x' => 870, 'position_y' => 480, 'width' => 200, 'height' => 75, 'normal_color' => '#34d399'],

                ['element_id' => 'drain_valve', 'element_type' => 'valve', 'label' => 'DRAIN VALVE', 'data_source' => 'drain_open', 'position_x' => 1080, 'position_y' => 260, 'width' => 85, 'height' => 95, 'normal_color' => '#38bdf8'],
                ['element_id' => 'drain_pipe', 'element_type' => 'pipe', 'label' => 'DRAIN OUT', 'data_source' => 'drain_open', 'position_x' => 1070, 'position_y' => 395, 'width' => 105, 'height' => 26, 'rotation' => 90, 'normal_color' => '#38bdf8'],

                ['element_id' => 'gas_status', 'element_type' => 'indicator', 'label' => 'GAS', 'data_source' => 'gas_ready', 'position_x' => 100, 'position_y' => 600, 'width' => 110, 'height' => 58, 'normal_color' => '#fb923c'],
                ['element_id' => 'pilot_status', 'element_type' => 'indicator', 'label' => 'PEMATIK', 'data_source' => 'pilot_flame', 'position_x' => 225, 'position_y' => 600, 'width' => 110, 'height' => 58, 'normal_color' => '#fb923c'],
                ['element_id' => 'current_step', 'element_type' => 'display', 'label' => 'CURRENT STEP', 'data_source' => 'step_current', 'position_x' => 420, 'position_y' => 595, 'width' => 170, 'height' => 68, 'normal_color' => '#60a5fa'],
                ['element_id' => 'remaining_time', 'element_type' => 'display', 'label' => 'REMAINING TIME', 'data_source' => 'rest_time', 'position_x' => 610, 'position_y' => 595, 'width' => 170, 'height' => 68, 'normal_color' => '#a78bfa'],
                ['element_id' => 'heat_mv', 'element_type' => 'display', 'label' => 'HEATING MV', 'data_source' => 'heating_mv', 'position_x' => 870, 'position_y' => 595, 'width' => 200, 'height' => 68, 'normal_color' => '#f59e0b'],
            ];

            foreach ($items as $item) {
                \App\Models\ScadaMapping::create(array_merge($item, ['tn_controller_id' => $tn->id]));
            }
        }
    }

    private function availableSlaveId(int $preferred): int
    {
        for ($slaveId = $preferred; $slaveId <= 247; $slaveId++) {
            if (!TnController::where('slave_id', $slaveId)->exists()) {
                return $slaveId;
            }
        }

        for ($slaveId = 1; $slaveId < $preferred; $slaveId++) {
            if (!TnController::where('slave_id', $slaveId)->exists()) {
                return $slaveId;
            }
        }

        throw new \RuntimeException('Tidak ada Modbus slave ID yang tersedia.');
    }
}
