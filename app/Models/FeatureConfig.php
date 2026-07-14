<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureConfig extends Model
{
    protected $fillable = [
        'device_id',
        'module_name',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
