<?php

namespace App\Events;

use App\Models\TnController;
use App\Models\TnReading;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TnDataReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $controller;
    public $reading;

    public function __construct(TnController $controller, TnReading $reading)
    {
        $this->controller = $controller;
        $this->reading = $reading;
    }

    public function broadcastOn()
    {
        return new Channel('tn.' . $this->controller->id);
    }

    public function broadcastWith()
    {
        return [
            'slave_id' => $this->controller->slave_id,
            'pv' => $this->reading->pv,
            'sv' => $this->reading->sv,
            'decimal_point' => $this->reading->decimal_point,
            'heating_mv' => $this->reading->heating_mv,
            'cooling_mv' => $this->reading->cooling_mv,
            'run_status' => $this->reading->run_status,
            'auto_manual' => $this->reading->auto_manual,
            'at_running' => $this->reading->at_running,
            'out1_active' => $this->reading->out1_active,
            'out2_active' => $this->reading->out2_active,
            'alarms' => $this->reading->alarms, // decoded via accessor
            'pattern_current' => $this->reading->pattern_current,
            'step_current' => $this->reading->step_current,
            'process_time' => $this->reading->process_time,
            'rest_time' => $this->reading->rest_time,
            'timestamp' => $this->reading->created_at->toIso8601String(),
        ];
    }
}
