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
        Schema::create('tn_recipe_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tn_recipe_template_id')->constrained()->cascadeOnDelete();
            $table->integer('step_number'); // 0-19
            $table->integer('target_sv');
            $table->integer('duration');
            $table->unique(['tn_recipe_template_id', 'step_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tn_recipe_steps');
    }
};
