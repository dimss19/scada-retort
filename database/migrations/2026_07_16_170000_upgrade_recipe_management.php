<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('tn_recipe_templates', function (Blueprint $table) {
            $table->string('recipe_code')->nullable()->unique()->after('id');
            $table->string('product_name')->nullable()->after('name');
            $table->string('product_category')->nullable()->after('product_name');
            $table->string('package_type')->nullable()->after('product_category');
            $table->string('package_size')->nullable()->after('package_type');
            $table->unsignedInteger('revision')->default(1)->after('description');
            $table->string('version', 30)->default('1.0')->after('revision');
            $table->enum('status', ['Draft','Active','Inactive','Archived'])->default('Draft')->after('version');
            $table->foreignId('approved_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->json('process_parameters')->nullable()->after('approved_by');
            $table->timestamp('archived_at')->nullable()->after('is_default');
        });
        Schema::table('tn_recipe_steps', function (Blueprint $table) {
            $table->string('step_name')->nullable()->after('step_number');
            $table->decimal('target_pressure', 8, 3)->nullable()->after('target_sv');
            $table->boolean('steam_enable')->default(false)->after('duration');
            $table->boolean('cooling_enable')->default(false)->after('steam_enable');
            $table->boolean('drain_enable')->default(false)->after('cooling_enable');
            $table->boolean('alarm_enable')->default(true)->after('drain_enable');
            $table->json('settings')->nullable()->after('alarm_enable');
        });
    }
    public function down(): void {
        Schema::table('tn_recipe_steps', fn(Blueprint $t) => $t->dropColumn(['step_name','target_pressure','steam_enable','cooling_enable','drain_enable','alarm_enable','settings']));
        Schema::table('tn_recipe_templates', function(Blueprint $t) { $t->dropForeign(['approved_by']); $t->dropColumn(['recipe_code','product_name','product_category','package_type','package_size','revision','version','status','approved_by','process_parameters','archived_at']); });
    }
};
