<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnConfig extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'tn_controller_id',
        'register_address',
        'value',
        'synced_at',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
    ];

    public function controller()
    {
        return $this->belongsTo(TnController::class, 'tn_controller_id');
    }
}
