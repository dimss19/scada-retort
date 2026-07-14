<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScadaMapping extends Model
{
    protected $fillable = [
        'device_id',
        'element_id',
        'data_source',
        'normal_color',
        'warning_color',
        'critical_color',
        'warning_threshold',
        'critical_threshold',
    ];

    protected $casts = [
        'warning_threshold' => 'float',
        'critical_threshold' => 'float',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
