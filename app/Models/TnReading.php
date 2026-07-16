<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnReading extends Model
{
    use HasFactory;

    public $timestamps = false; // We only use created_at

    protected $fillable = [
        'tn_controller_id',
        'pv',
        'sv',
        'heating_mv',
        'cooling_mv',
        'decimal_point',
        'run_status',
        'auto_manual',
        'alarm_bits',
        'event_bits',
        'out1_active',
        'out2_active',
        'at_running',
        'ct1_current',
        'ct2_current',
        'created_at',
    ];

    protected $casts = [
        'run_status' => 'boolean',
        'auto_manual' => 'boolean',
        'out1_active' => 'boolean',
        'out2_active' => 'boolean',
        'at_running' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function controller()
    {
        return $this->belongsTo(TnController::class, 'tn_controller_id');
    }

    public function getAlarmsAttribute()
    {
        $bits = $this->alarm_bits;
        return [
            'al1' => (bool)($bits & (1 << 0)),
            'al2' => (bool)($bits & (1 << 1)),
            'al3' => (bool)($bits & (1 << 2)),
            'al4' => (bool)($bits & (1 << 3)),
            'al5' => (bool)($bits & (1 << 4)),
            'al6' => (bool)($bits & (1 << 5)),
            'al7' => (bool)($bits & (1 << 6)),
        ];
    }
}
