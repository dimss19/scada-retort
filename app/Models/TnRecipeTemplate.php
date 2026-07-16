<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnRecipeTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'time_unit',
        'start_condition',
        'pattern_end_state',
        'repetitions',
        'pid_group',
        'wait_width',
        'wait_time',
        'step_count',
        'target_f0',
        'z_value',
        't_ref',
        'created_by',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function steps()
    {
        return $this->hasMany(TnRecipeStep::class)->orderBy('step_number');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
