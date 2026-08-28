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
        Schema::table('tn_recipe_templates', function (Blueprint $table) {
            $table->json('tn_config')->nullable()->after('process_parameters');
        });

        Schema::table('tn_recipe_steps', function (Blueprint $table) {
            $table->enum('end_action', ['CONT', 'HOLD', 'STOP'])->default('CONT')->after('duration');
            $table->integer('event_link')->nullable()->after('end_action');
            $table->integer('pid_group')->nullable()->after('event_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tn_recipe_steps', function (Blueprint $table) {
            $table->dropColumn(['end_action', 'event_link', 'pid_group']);
        });

        Schema::table('tn_recipe_templates', function (Blueprint $table) {
            $table->dropColumn('tn_config');
        });
    }
};
