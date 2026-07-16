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
