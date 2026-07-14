<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pin_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->enum('function', ['RS485_RX', 'RS485_TX', 'DI1_TRIGGER', 'SD_CS', 'SD_MOSI', 'SD_CLK', 'SD_MISO', 'RTC_SDA', 'RTC_SCL']);
            $table->integer('gpio_pin');
            $table->boolean('is_active')->default(true);
            $table->unique(['device_id', 'gpio_pin']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pin_configs');
    }
};
