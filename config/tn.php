<?php

return [
    'serial_port' => env('TN_SERIAL_PORT', 'COM3'),
    'baudrate' => env('TN_BAUDRATE', 9600),
    'parity' => env('TN_PARITY', 'N'),
    'stopbits' => env('TN_STOPBITS', 2),
    'timeout' => env('TN_TIMEOUT', 1),
    'poll_interval' => env('TN_POLL_INTERVAL', 1),
];
