<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$svc = app(\App\Services\TnModbusService::class);
$tn = \App\Models\TnController::find(2);

echo "Testing Modbus pattern 1 offset 250...\n";
$r = $svc->readHoldingRegisters($tn, 250, 9);
echo json_encode($r, JSON_PRETTY_PRINT);
