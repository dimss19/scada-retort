<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScadaMapping extends Model
{
    protected $fillable = [
        'tn_controller_id',
        'device_id',
        'element_id',
        'element_type',
        'label',
        'data_source',
        'position_x',
        'position_y',
        'width',
        'height',
        'rotation',
        'z_index',
        'normal_color',
        'warning_color',
        'critical_color',
        'warning_threshold',
        'critical_threshold',
        'module_dependency',
    ];

    protected $casts = [
        'warning_threshold' => 'float',
        'critical_threshold' => 'float',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function tnController()
    {
        return $this->belongsTo(TnController::class);
    }
}
