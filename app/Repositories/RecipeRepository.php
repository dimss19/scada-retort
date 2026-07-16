<?php
namespace App\Repositories; use App\Models\TnRecipeTemplate; class RecipeRepository extends EloquentRepository {public function __construct(TnRecipeTemplate $model){parent::__construct($model);}}
