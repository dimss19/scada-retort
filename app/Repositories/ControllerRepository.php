<?php
namespace App\Repositories; use App\Models\TnController; class ControllerRepository extends EloquentRepository {public function __construct(TnController $model){parent::__construct($model);}}
