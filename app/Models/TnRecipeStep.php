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
        'target_sv',
        'duration',
    ];

    public function template()
    {
        return $this->belongsTo(TnRecipeTemplate::class, 'tn_recipe_template_id');
    }
}
