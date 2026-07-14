<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Devices
    Route::get('/devices', [\App\Http\Controllers\DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/create', [\App\Http\Controllers\DeviceController::class, 'create'])->name('devices.create');
    Route::post('/devices', [\App\Http\Controllers\DeviceController::class, 'store'])->name('devices.store');
    Route::get('/devices/{device}', [\App\Http\Controllers\DeviceController::class, 'show'])->name('devices.show');
    Route::delete('/devices/{device}', [\App\Http\Controllers\DeviceController::class, 'destroy'])->name('devices.destroy');

    // Config
    Route::get('/devices/{device}/config', [\App\Http\Controllers\ConfigController::class, 'edit'])->name('config.edit');
    Route::put('/devices/{device}/config/pins', [\App\Http\Controllers\ConfigController::class, 'updatePins'])->name('config.updatePins');
    Route::put('/devices/{device}/config/features', [\App\Http\Controllers\ConfigController::class, 'updateFeatures'])->name('config.updateFeatures');

    // OTA
    Route::get('/ota', [\App\Http\Controllers\OtaController::class, 'index'])->name('ota.index');
    Route::post('/ota/firmware', [\App\Http\Controllers\OtaController::class, 'uploadFirmware'])->name('ota.upload');
    Route::post('/ota/deploy', [\App\Http\Controllers\OtaController::class, 'deploy'])->name('ota.deploy');

    // SCADA
    Route::get('/scada/{device}', [\App\Http\Controllers\ScadaController::class, 'show'])->name('scada.show');
    Route::get('/devices/{device}/scada/config', [\App\Http\Controllers\ScadaController::class, 'editMapping'])->name('scada.config.edit');
    Route::put('/devices/{device}/scada/config', [\App\Http\Controllers\ScadaController::class, 'updateMapping'])->name('scada.config.update');
});

Route::get('/api/ota/firmware/{id}/download', [\App\Http\Controllers\OtaController::class, 'download'])->name('ota.download');

require __DIR__.'/auth.php';
