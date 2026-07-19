<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scada_canvases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tn_controller_id')->constrained()->cascadeOnDelete();
            $table->string('background_image_url')->nullable();
            $table->integer('width')->default(1200);
            $table->integer('height')->default(800);
            $table->boolean('grid_enabled')->default(true);
            $table->integer('grid_size')->default(20);
            $table->boolean('snap_to_grid')->default(true);
            $table->timestamps();

            $table->unique('tn_controller_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scada_canvases');
    }
};
