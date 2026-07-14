<?php

namespace Database\Factories;

use App\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Device>
 */
class DeviceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'machine_code' => 'TEST_' . $this->faker->unique()->numberBetween(1000, 9999),
            'name' => $this->faker->company . ' Machine',
            'mqtt_broker' => '127.0.0.1',
            'mqtt_port' => 1883,
        ];
    }
}
