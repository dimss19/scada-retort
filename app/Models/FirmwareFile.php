<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FirmwareFile extends Model
{
    protected $fillable = [
        'filename',
        'version',
        'file_path',
        'file_size',
        'checksum_md5',
        'uploaded_by',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function otaDeployments()
    {
        return $this->hasMany(OtaDeployment::class);
    }
}
