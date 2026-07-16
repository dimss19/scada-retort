<?php
namespace App\Repositories;use App\Models\BatchProduction;class BatchProductionRepository extends EloquentRepository{public function __construct(BatchProduction $model){parent::__construct($model);}}
