<?php
namespace App\Repositories; use App\Models\Machine; class MachineRepository extends EloquentRepository {public function __construct(Machine $model){parent::__construct($model);}}
