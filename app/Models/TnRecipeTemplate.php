<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TnRecipeTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipe_code',
        'name',
        'product_name',
        'product_category',
        'package_type',
        'package_size',
        'description',
        'revision',
        'version',
        'status',
        'time_unit',
        'start_condition',
        'pattern_number',
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
        'updated_by',
        'approved_by',
        'process_parameters',
        'tn_config',
        'is_default',
        'archived_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'process_parameters' => 'array',
        'tn_config' => 'array',
        'archived_at' => 'datetime',
    ];

    public function steps()
    {
        return $this->hasMany(TnRecipeStep::class)->orderBy('step_number');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
    public function batches() { return $this->hasMany(BatchProduction::class, 'recipe_id'); }
}
