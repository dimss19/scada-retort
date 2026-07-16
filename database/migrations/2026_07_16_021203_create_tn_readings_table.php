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
        Schema::create('tn_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tn_controller_id')->constrained()->cascadeOnDelete();
            $table->integer('pv');
            $table->integer('sv');
            $table->integer('heating_mv')->default(0);
            $table->integer('cooling_mv')->default(0);
            $table->tinyInteger('decimal_point')->default(0);
            $table->boolean('run_status')->default(false);
            $table->boolean('auto_manual')->default(false); // 0=AUTO, 1=MANUAL
            $table->integer('alarm_bits')->default(0);
            $table->integer('event_bits')->default(0);
            $table->boolean('out1_active')->default(false);
            $table->boolean('out2_active')->default(false);
            $table->boolean('at_running')->default(false);
            $table->integer('ct1_current')->nullable();
            $table->integer('ct2_current')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tn_readings');
    }
};
