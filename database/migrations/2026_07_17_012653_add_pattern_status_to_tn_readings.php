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
        Schema::table('tn_readings', function (Blueprint $table) {
            $table->integer('pattern_current')->nullable();
            $table->integer('step_current')->nullable();
            $table->integer('process_time')->nullable();
            $table->integer('rest_time')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tn_readings', function (Blueprint $table) {
            $table->dropColumn(['pattern_current', 'step_current', 'process_time', 'rest_time']);
        });
    }
};
