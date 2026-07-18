<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$svc = app(\App\Services\TnModbusService::class);
$tn = \App\Models\TnController::find(2);

echo "Testing tight loop with TnModbusService executing...\n";
for($i=0; $i<10; $i++) {
    try {
        $result = $svc->readHoldingRegisters($tn, 200, 9);
        echo "Attempt $i: success=" . ($result['success'] ? 'true' : 'false') . " error=" . ($result['error'] ?? '') . "\n";
    } catch (\Throwable $e) {
        echo "Attempt $i Exception: " . $e->getMessage() . "\n";
    }
}
