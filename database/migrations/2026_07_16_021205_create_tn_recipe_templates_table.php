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
        Schema::create('tn_recipe_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('time_unit', ['MM.SS', 'HH.MM'])->default('MM.SS');
            $table->enum('start_condition', ['SSV', 'SPV'])->default('SSV');
            $table->enum('pattern_end_state', ['STOP', 'HOLD', 'NEXT', 'PRE'])->default('STOP');
            $table->integer('repetitions')->default(0);
            $table->integer('pid_group')->default(0);
            $table->integer('wait_width')->default(2);
            $table->integer('wait_time')->default(0);
            $table->integer('step_count');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tn_recipe_templates');
    }
};
