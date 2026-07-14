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
        Schema::create('scada_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('element_id');
            $table->string('data_source');
            $table->string('normal_color')->default('#22c55e');
            $table->string('warning_color')->default('#eab308');
            $table->string('critical_color')->default('#ef4444');
            $table->float('warning_threshold')->nullable();
            $table->float('critical_threshold')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scada_mappings');
    }
};
