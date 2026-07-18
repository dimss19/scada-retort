<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tn_process_histories', function (Blueprint $table) {
            $table->timestamp('end_time')->nullable()->change();
            $table->json('log_data')->nullable()->change();
        });
    }

    public function down(): void {
        Schema::table('tn_process_histories', function (Blueprint $table) {
            $table->timestamp('end_time')->nullable(false)->change();
            $table->json('log_data')->nullable(false)->change();
        });
    }
};
