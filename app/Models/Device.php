<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Device extends Model
{
    use HasFactory;
    protected $fillable = [
        'machine_code',
        'name',
        'mqtt_broker',
        'mqtt_port',
        'firmware_version',
        'is_online',
        'last_seen_at',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function pinConfigs()
    {
        return $this->hasMany(PinConfig::class);
    }

    public function featureConfigs()
    {
        return $this->hasMany(FeatureConfig::class);
    }

    public function otaDeployments()
    {
        return $this->hasMany(OtaDeployment::class);
    }

    public function scadaMappings()
    {
        return $this->hasMany(ScadaMapping::class);
    }
}
