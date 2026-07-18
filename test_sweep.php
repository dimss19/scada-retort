<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$svc = app(\App\Services\TnModbusService::class);
$tn = \App\Models\TnController::find(2);

echo "Sweeping holding registers...\n";
$offsets = [300, 400, 500, 1000, 2000, 3000];
foreach($offsets as $offset) {
    try {
        $r = $svc->readHoldingRegisters($tn, $offset, 1);
        echo "Offset $offset: " . json_encode($r) . "\n";
    } catch (\Throwable $e) {}
}
