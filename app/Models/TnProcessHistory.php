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
        'verification_status' => 'string',
        'min_f0_achieved' => 'decimal:2',
        'target_f0' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    public function group()
    {
        return $this->belongsTo(HistoryGroup::class, 'group_id');
    }

    public function controller()
    {
        return $this->belongsTo(TnController::class, 'tn_controller_id');
    }

    public function scopeTn($query)
    {
        return $query->where(function ($q) {
            $q->where('source_type', 'tn')
              ->orWhereNull('source_type');
        });
    }

    public function scopeEsp($query)
    {
        return $query->where('source_type', 'esp');
    }

    public function getSourceNameAttribute(): string
    {
        return $this->source_type === 'esp' ? 'ESP Logger' : 'Autonics TN';
    }
}
