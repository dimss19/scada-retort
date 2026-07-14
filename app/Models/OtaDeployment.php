<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtaDeployment extends Model
{
    protected $fillable = [
        'device_id',
        'firmware_file_id',
        'status',
        'progress',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function firmwareFile()
    {
        return $this->belongsTo(FirmwareFile::class);
    }
}
