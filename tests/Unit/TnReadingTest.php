<?php

namespace Tests\Unit;

use App\Models\TnReading;
use PHPUnit\Framework\TestCase;

class TnReadingTest extends TestCase
{
    public function test_alarm_bits_are_decoded_and_appended_to_json(): void
    {
        $reading = new TnReading([
            'alarm_bits' => (1 << 0) | (1 << 2),
        ]);

        $this->assertSame([
            'al1' => true,
            'al2' => false,
            'al3' => true,
            'al4' => false,
            'al5' => false,
            'al6' => false,
            'al7' => false,
        ], $reading->alarms);

        $this->assertArrayHasKey('alarms', $reading->toArray());
    }
}
