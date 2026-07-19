<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScadaCanvas extends Model
{
    protected $fillable = [
        'tn_controller_id',
        'background_image_url',
        'width',
        'height',
        'grid_enabled',
        'grid_size',
        'snap_to_grid',
    ];

    protected $casts = [
        'grid_enabled' => 'boolean',
        'snap_to_grid' => 'boolean',
    ];

    public function tnController()
    {
        return $this->belongsTo(TnController::class);
    }
}
