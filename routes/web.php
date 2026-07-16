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
    return Inertia::render('Dashboard', [
        'tnCount' => \App\Models\TnController::count(),
        'tnOnline' => \App\Models\TnController::where('is_online', true)->count(),
        'recipeCount' => \App\Models\TnRecipeTemplate::count(),
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    foreach (['scada', 'historian', 'trend', 'alarm', 'notifications', 'communication', 'database'] as $module) {
        Route::get('/'.$module, fn () => Inertia::render('Operations', ['module' => $module]))
            ->name($module.'.index');
    }

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('machines', \App\Http\Controllers\MachineController::class)->except('show');
    Route::resource('devices', \App\Http\Controllers\ControllerDeviceController::class)->except('show');

    // === Temperature Recipe CRUD ===
    Route::prefix('recipes')->name('tn.recipes.')->group(function () {
        Route::get('/', [\App\Http\Controllers\TnRecipeController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\TnRecipeController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\TnRecipeController::class, 'store'])->name('store');
        Route::get('/{recipe}/edit', [\App\Http\Controllers\TnRecipeController::class, 'edit'])->name('edit');
        Route::put('/{recipe}', [\App\Http\Controllers\TnRecipeController::class, 'update'])->name('update');
        Route::post('/{recipe}/duplicate', [\App\Http\Controllers\TnRecipeController::class, 'duplicate'])->name('duplicate');
        Route::patch('/{recipe}/archive', [\App\Http\Controllers\TnRecipeController::class, 'archive'])->name('archive');
        Route::delete('/{recipe}', [\App\Http\Controllers\TnRecipeController::class, 'destroy'])->name('destroy');
        Route::post('/{recipe}/apply/{tn}', [\App\Http\Controllers\TnRecipeController::class, 'apply'])->name('apply');
    });

    // === TN Controllers ===
    Route::prefix('tn')->group(function () {
        // CRUD
        Route::get('/', [\App\Http\Controllers\TnControllerController::class, 'index'])->name('tn.index');
        Route::get('/create', [\App\Http\Controllers\TnControllerController::class, 'create'])->name('tn.create');
        Route::post('/', [\App\Http\Controllers\TnControllerController::class, 'store'])->name('tn.store');
        Route::get('/{tn}', [\App\Http\Controllers\TnControllerController::class, 'show'])->name('tn.show');
        Route::delete('/{tn}', [\App\Http\Controllers\TnControllerController::class, 'destroy'])->name('tn.destroy');
        Route::post('/{tn}/test', [\App\Http\Controllers\TnControllerController::class, 'testConnection'])->name('tn.test');

        // Monitor & Control
        Route::get('/{tn}/monitor', [\App\Http\Controllers\TnMonitorController::class, 'show'])->name('tn.monitor');
        Route::post('/{tn}/cmd/run-stop', [\App\Http\Controllers\TnMonitorController::class, 'toggleRunStop'])->name('tn.cmd.runstop');
        Route::post('/{tn}/cmd/set-sv', [\App\Http\Controllers\TnMonitorController::class, 'setSv'])->name('tn.cmd.setsv');
        Route::post('/{tn}/cmd/auto-tune', [\App\Http\Controllers\TnMonitorController::class, 'startAutoTune'])->name('tn.cmd.autotune');
        Route::post('/{tn}/cmd/alarm-reset', [\App\Http\Controllers\TnMonitorController::class, 'resetAlarm'])->name('tn.cmd.alarmreset');
        Route::post('/{tn}/cmd/set-mode', [\App\Http\Controllers\TnMonitorController::class, 'setMode'])->name('tn.cmd.setmode');
        Route::get('/{tn}/readings', [\App\Http\Controllers\TnMonitorController::class, 'readings'])->name('tn.readings');

        // Config
        Route::get('/{tn}/config', [\App\Http\Controllers\TnConfigController::class, 'edit'])->name('tn.config.edit');
        Route::post('/{tn}/config/sync', [\App\Http\Controllers\TnConfigController::class, 'syncFromDevice'])->name('tn.config.sync');
        Route::put('/{tn}/config/{group}', [\App\Http\Controllers\TnConfigController::class, 'updateGroup'])->name('tn.config.update');
    });

});

require __DIR__.'/auth.php';
