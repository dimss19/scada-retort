<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scada_mappings', function (Blueprint $table) {
            $table->foreignId('tn_controller_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->change();
            $table->string('element_type')->default('display')->after('element_id');
            $table->string('label')->nullable()->after('element_type');
            $table->integer('position_x')->default(0)->after('label');
            $table->integer('position_y')->default(0)->after('position_x');
            $table->integer('width')->default(120)->after('position_y');
            $table->integer('height')->default(80)->after('width');
            $table->integer('rotation')->default(0)->after('height');
            $table->integer('z_index')->default(0)->after('rotation');
        });
    }

    public function down(): void
    {
        Schema::table('scada_mappings', function (Blueprint $table) {
            $table->dropColumn(['tn_controller_id', 'element_type', 'label', 'position_x', 'position_y', 'width', 'height', 'rotation', 'z_index']);
            $table->foreignId('device_id')->constrained()->change();
        });
    }
};
