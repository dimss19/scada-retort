<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnProcessHistory extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'log_data' => 'array',
    ];

    public function controller()
    {
        return $this->belongsTo(TnController::class, 'tn_controller_id');
    }
}
