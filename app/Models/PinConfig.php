<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PinConfig extends Model
{
    protected $fillable = [
        'device_id',
        'function',
        'gpio_pin',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
