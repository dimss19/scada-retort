<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnController extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slave_id',
        'model_type',
        'control_model',
        'serial_port',
        'baudrate',
        'parity',
        'stopbits',
        'is_online',
        'last_seen_at',
        'last_error',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function readings()
    {
        return $this->hasMany(TnReading::class);
    }

    public function configs()
    {
        return $this->hasMany(TnConfig::class);
    }

    public function scopeOnline($query)
    {
        return $query->where('is_online', true);
    }

    public function scopeByModel($query, $type)
    {
        return $query->where('model_type', $type);
    }

    // This will format PV according to the decimal point setting, if we have it cached.
    // For now, it's just raw. Decimal formatting usually happens on the frontend or with reading data.
}
