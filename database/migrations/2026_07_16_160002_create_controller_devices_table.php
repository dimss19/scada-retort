<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('controller_devices', function (Blueprint $table) { $table->id(); $table->foreignId('controller_id')->constrained('tn_controllers')->cascadeOnDelete(); $table->string('device_name'); $table->enum('device_type', ['Thermocouple'])->default('Thermocouple'); $table->enum('sensor_type', ['K','J','PT100'])->nullable(); $table->string('unit')->default('°C'); $table->unsignedInteger('register_pv')->nullable(); $table->unsignedInteger('register_sv')->nullable(); $table->unsignedInteger('register_output')->nullable(); $table->enum('status', ['Active','Inactive'])->default('Active'); $table->timestamps(); }); }
    public function down(): void { Schema::dropIfExists('controller_devices'); }
};
