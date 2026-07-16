<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use App\Models\TnController;

class TnModbusService
{
    protected string $scriptPath;
    protected string $pythonPath;

    public function __construct()
    {
        $this->scriptPath = base_path('scripts/modbus_bridge.py');
        $this->pythonPath = 'python'; // or 'python3' based on environment
    }

    protected function executeCommand(string $command, TnController $controller, array $args = [])
    {
        $port = $controller->serial_port ?? config('tn.serial_port');
        $baud = $controller->baudrate ?? config('tn.baudrate');
        $parity = $controller->parity ?? config('tn.parity');
        $stopbits = $controller->stopbits ?? config('tn.stopbits');
        $timeout = config('tn.timeout');

        $baseArgs = [
            $this->pythonPath,
            $this->scriptPath,
            $command,
            '--port', $port,
            '--baud', (string)$baud,
            '--parity', $parity,
            '--stopbits', (string)$stopbits,
            '--timeout', (string)$timeout,
            '--slave', (string)$controller->slave_id
        ];

        $processArgs = array_merge($baseArgs, $args);
        
        $process = new Process($processArgs);
        // Timeout set high enough for modbus response
        $process->setTimeout($timeout + 2);
        
        try {
            $process->mustRun();
            $output = $process->getOutput();
            $result = json_decode($output, true);
            
            if (!$result) {
                return ['success' => false, 'error' => 'Invalid JSON from Python script: ' . $output];
            }
            
            return $result;
        } catch (ProcessFailedException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function testConnection(TnController $controller)
    {
        return $this->executeCommand('test_connection', $controller);
    }

    public function readInputRegisters(TnController $controller, int $address, int $count)
    {
        return $this->executeCommand('read_input', $controller, [
            '--addr', (string)$address,
            '--count', (string)$count
        ]);
    }

    public function readHoldingRegisters(TnController $controller, int $address, int $count)
    {
        return $this->executeCommand('read_holding', $controller, [
            '--addr', (string)$address,
            '--count', (string)$count
        ]);
    }

    public function writeSingleRegister(TnController $controller, int $address, int $value)
    {
        return $this->executeCommand('write_register', $controller, [
            '--addr', (string)$address,
            '--value', (string)$value
        ]);
    }

    public function writeSingleCoil(TnController $controller, int $address, bool $value)
    {
        return $this->executeCommand('write_coil', $controller, [
            '--addr', (string)$address,
            '--value', $value ? '1' : '0'
        ]);
    }

    public function writeMultipleRegisters(TnController $controller, int $address, array $values)
    {
        return $this->executeCommand('write_registers', $controller, [
            '--addr', (string)$address,
            '--values', implode(',', $values)
        ]);
    }
}
