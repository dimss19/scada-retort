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
            ['RT-01', 'Retort 01', 'TNH', 1],
            ['RT-02', 'Retort 02', 'TNL', 2],
            ['RT-03', 'Retort 03', 'TNS', 3],
        ] as [$code, $name, $model, $slaveId]) {
            $machine = Machine::firstOrCreate(
                ['machine_code' => $code],
                ['machine_name' => $name, 'description' => 'Production retort machine', 'location' => 'Production Area', 'status' => 'Active']
            );

            $controller = TnController::firstOrCreate(
                ['slave_id' => $slaveId],
                ['machine_id' => $machine->id, 'name' => $model.'-'.$code, 'model_type' => $model, 'control_model' => 'program', 'serial_port' => 'COM3', 'baudrate' => 9600, 'parity' => 'N', 'stopbits' => 2, 'communication' => 'RS485']
            );

            ControllerDevice::firstOrCreate(
                ['controller_id' => $controller->id, 'device_name' => 'Thermocouple-'.$code],
                ['device_type' => 'Thermocouple', 'sensor_type' => 'K', 'unit' => '°C', 'register_pv' => 1000, 'register_sv' => 0, 'register_output' => 1, 'status' => 'Active']
            );
        }
    }
}
