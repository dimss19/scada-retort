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
        Schema::create('tn_controllers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('slave_id')->unique();
            $table->enum('model_type', ['TNS', 'TNH', 'TNL']);
            $table->enum('control_model', ['fixed', 'program']);
            $table->string('serial_port')->nullable();
            $table->integer('baudrate')->default(9600);
            $table->string('parity')->default('N');
            $table->integer('stopbits')->default(2);
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen_at')->nullable();
            $table->string('last_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tn_controllers');
    }
};
