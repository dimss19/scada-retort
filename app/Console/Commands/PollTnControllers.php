<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TnController;
use App\Models\TnReading;
use App\Services\TnModbusService;
use App\Services\TnRegisterMap;
use App\Events\TnDataReceived;
use Carbon\Carbon;

class PollTnControllers extends Command
{
    protected $signature = 'tn:poll {--interval=1 : Polling interval in seconds}';
    protected $description = 'Poll TN Controllers for monitoring data';

    public function handle(TnModbusService $modbus)
    {
        $interval = (int) $this->option('interval');
        $this->info("Starting TN Controller polling every {$interval} second(s)...");

        while (true) {
            $start = microtime(true);
            $controllers = TnController::all();

            foreach ($controllers as $controller) {
                // Read input registers 301001-301027 (address 1000, 27 count)
                $result = $modbus->readInputRegisters($controller, 1000, 27);

                if ($result['success']) {
                    $data = $result['data'];
                    
                    // Decode status and alarms
                    $statusFlags = TnRegisterMap::decodeStatusFlag($data[5]);
                    
                    $reading = TnReading::create([
                        'tn_controller_id' => $controller->id,
                        'pv' => $data[0],
                        'decimal_point' => $data[1],
                        'sv' => $data[2],
                        'heating_mv' => $data[3],
                        'cooling_mv' => $data[4],
                        'run_status' => $statusFlags['run_status'],
                        'auto_manual' => $statusFlags['auto_manual'],
                        'out1_active' => $statusFlags['out1_active'],
                        'out2_active' => $statusFlags['out2_active'],
                        'at_running' => $statusFlags['at_running'],
                        'alarm_bits' => $data[6],
                        'event_bits' => $data[7],
                        'ct1_current' => $data[12],
                        'ct2_current' => $data[13],
                        'created_at' => Carbon::now(),
                    ]);

                    $controller->update([
                        'is_online' => true,
                        'last_seen_at' => Carbon::now(),
                        'last_error' => null,
                    ]);

                    // Broadcast Event
                    event(new TnDataReceived($controller, $reading));

                    $this->info("Successfully polled {$controller->name}");
                } else {
                    $controller->update([
                        'is_online' => false,
                        'last_error' => \Illuminate\Support\Str::limit($result['error'], 250),
                    ]);
                    $this->error("Failed to poll {$controller->name}: {$result['error']}");
                    
                    // Might want to broadcast an offline event here
                }
            }

            $elapsed = microtime(true) - $start;
            $sleep = max(0, $interval - $elapsed);
            if ($sleep > 0) {
                usleep((int)($sleep * 1000000));
            }
        }
    }
}
