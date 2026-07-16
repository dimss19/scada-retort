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
        Schema::create('tn_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tn_controller_id')->constrained()->cascadeOnDelete();
            $table->integer('register_address');
            $table->integer('value');
            $table->timestamp('synced_at')->nullable();
            $table->unique(['tn_controller_id', 'register_address']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tn_configs');
    }
};
