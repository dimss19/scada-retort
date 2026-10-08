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
        Schema::table('tn_process_histories', function (Blueprint $table) {
            $table->string('source_type', 20)->default('tn')->index();
            $table->string('device_code', 50)->nullable()->index();
            $table->foreignId('tn_controller_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tn_process_histories', function (Blueprint $table) {
            $table->dropIndex(['source_type']);
            $table->dropIndex(['device_code']);
            $table->dropColumn(['source_type', 'device_code']);
        });
    }
};
