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
            $table->decimal('target_f0', 8, 2)->default(6.0)->after('description');
            $table->decimal('z_value', 8, 2)->default(10.0)->after('target_f0');
            $table->decimal('t_ref', 8, 2)->default(121.1)->after('z_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tn_recipe_templates', function (Blueprint $table) {
            $table->dropColumn(['target_f0', 'z_value', 't_ref']);
        });
    }
};
