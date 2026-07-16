<?php
namespace App\Repositories; use App\Models\ControllerDevice; class DeviceRepository extends EloquentRepository {public function __construct(ControllerDevice $model){parent::__construct($model);}}
