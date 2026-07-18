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
            $table->integer('pattern_number')->default(0)->after('start_condition');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tn_recipe_templates', function (Blueprint $table) {
            $table->dropColumn('pattern_number');
        });
    }
};
