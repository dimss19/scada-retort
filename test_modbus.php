<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tn = \App\Models\TnController::find(2);
$svc = app(\App\Services\TnModbusService::class);
echo "Testing readHoldingRegisters (addr 200, count 9)...\n";
$r = $svc->readHoldingRegisters($tn, 200, 9);
echo json_encode($r, JSON_PRETTY_PRINT);
