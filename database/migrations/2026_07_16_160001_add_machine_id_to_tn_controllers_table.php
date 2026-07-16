<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('tn_controllers', function (Blueprint $table) { $table->foreignId('machine_id')->nullable()->after('id')->constrained('machines')->nullOnDelete(); $table->string('communication')->default('RS485')->after('stopbits'); }); }
    public function down(): void { Schema::table('tn_controllers', function (Blueprint $table) { $table->dropForeign(['machine_id']); $table->dropColumn(['machine_id','communication']); }); }
};
