<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$svc = app(\App\Services\TnModbusService::class);
$tn = \App\Models\TnController::find(2);

echo "Testing Modbus offset 0...\n";
$r = $svc->readHoldingRegisters($tn, 0, 1);
echo json_encode($r, JSON_PRETTY_PRINT);
