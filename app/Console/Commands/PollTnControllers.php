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
    protected $signature = 'tn:poll {--interval=1 : Polling interval in seconds} {--once : Poll controllers once and exit} {--controller= : Poll one TN controller id only}';
    protected $description = 'Poll TN Controllers for monitoring data';

    public function handle(TnModbusService $modbus)
    {
        $interval = (int) $this->option('interval');
        $this->info("Starting TN Controller polling every {$interval} second(s)...");

        do {
            $start = microtime(true);
            $controllers = TnController::query()
                ->when($this->option('controller'), fn ($query, $id) => $query->whereKey($id))
                ->get();

            foreach ($controllers as $controller) {
                // Read input registers 301001-301027 (address 1000, 27 count)
                $result = $modbus->readInputRegisters($controller, 1000, 27);

                if ($result['success']) {
                    $data = $result['data'];
                    
                    // Decode status and alarms (status flag is at 301008 -> index 7)
                    $statusFlags = TnRegisterMap::decodeStatusFlag($data[7]);
                    
                    $reading = TnReading::create([
                        'tn_controller_id' => $controller->id,
                        'pv' => $data[0],
                        'decimal_point' => $data[1],
                        'sv' => $data[3],
                        'heating_mv' => $data[4],
                        'cooling_mv' => $data[5],
                        'run_status' => $statusFlags['run_status'],
                        'auto_manual' => $statusFlags['auto_manual'],
                        'out1_active' => $statusFlags['out1_active'],
                        'out2_active' => $statusFlags['out2_active'],
                        'at_running' => $statusFlags['at_running'],
                        'alarm_bits' => $data[11], // alarms at 301012 -> index 11
                        'event_bits' => $data[10], // events at 301011 -> index 10
                        'ct1_current' => $data[12],
                        'ct2_current' => $data[13],
                        'pattern_current' => $data[19],
                        'step_current' => $data[20],
                        'process_time' => $data[21],
                        'rest_time' => $data[23],
                        'created_at' => Carbon::now(),
                    ]);

                    // Backend History Tracking
                    $mv = $data[4] ?? 0;
                    $cacheKey = "tn_active_history_{$controller->id}";
                    $activeHistoryId = \Illuminate\Support\Facades\Cache::get($cacheKey);

                    if ($mv > 0 && !$activeHistoryId) {
                        $history = \App\Models\TnProcessHistory::create([
                            'tn_controller_id' => $controller->id,
                            'start_time' => Carbon::now(),
                        ]);
                        \Illuminate\Support\Facades\Cache::forever($cacheKey, $history->id);
                    } elseif ($mv == 0 && $activeHistoryId) {
                        $history = \App\Models\TnProcessHistory::find($activeHistoryId);
                        if ($history) {
                            $endTime = Carbon::now();
                            $readings = TnReading::where('tn_controller_id', $controller->id)
                                ->where('created_at', '>=', $history->start_time)
                                ->where('created_at', '<=', $endTime)
                                ->orderBy('created_at', 'desc')
                                ->get()
                                ->toArray();

                            $history->update([
                                'end_time' => $endTime,
                                'log_data' => $readings,
                            ]);
                        }
                        \Illuminate\Support\Facades\Cache::forget($cacheKey);
                    }

                    $controller->update([
                        'is_online' => true,
                        'last_seen_at' => Carbon::now(),
                        'last_error' => null,
                    ]);

                    try {
                        event(new TnDataReceived($controller, $reading));
                    } catch (\Throwable $e) {
                        $this->warn("Realtime broadcast failed for {$controller->name}: {$e->getMessage()}");
                    }

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
            if (!$this->option('once') && $sleep > 0) {
                usleep((int)($sleep * 1000000));
            }
        } while (!$this->option('once'));
    }
}
