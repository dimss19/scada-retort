<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnRecipeStep extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'tn_recipe_template_id',
        'step_number',
        'step_name',
        'target_sv',
        'target_pressure',
        'duration',
        'steam_enable',
        'cooling_enable',
        'drain_enable',
        'alarm_enable',
        'settings',
    ];

    protected $casts = ['steam_enable'=>'boolean','cooling_enable'=>'boolean','drain_enable'=>'boolean','alarm_enable'=>'boolean','settings'=>'array'];

    public function template()
    {
        return $this->belongsTo(TnRecipeTemplate::class, 'tn_recipe_template_id');
    }
}
