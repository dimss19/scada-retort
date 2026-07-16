<?php
namespace App\Repositories\Contracts; use Illuminate\Database\Eloquent\Collection; use Illuminate\Database\Eloquent\Model;
interface CrudRepositoryInterface {public function all(array $with=[]):Collection;public function find(int $id,array $with=[]):Model;public function create(array $data):Model;public function update(Model $model,array $data):Model;public function delete(Model $model):void;}
