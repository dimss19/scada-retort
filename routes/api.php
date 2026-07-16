<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MachineController;
use App\Http\Controllers\Api\ControllerController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\BatchProductionController;
Route::middleware('auth:sanctum')->name('api.')->group(function(){Route::apiResource('machines',MachineController::class);Route::apiResource('controllers',ControllerController::class);Route::apiResource('devices',DeviceController::class);Route::apiResource('recipes',RecipeController::class);Route::apiResource('batches',BatchProductionController::class)->parameters(['batches'=>'batch']);});
