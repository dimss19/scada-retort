<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{
  Schema::table('machines',fn(Blueprint $t)=>$t->string('machine_type')->default('Retort')->after('machine_name'));
  Schema::table('tn_controllers',function(Blueprint $t){$t->string('controller_code')->nullable()->unique()->after('machine_id');$t->unsignedInteger('polling_interval')->default(1000)->after('communication');$t->string('firmware_version')->nullable()->after('polling_interval');$t->enum('status',['Active','Inactive'])->default('Active')->after('firmware_version');});
  Schema::table('controller_devices',function(Blueprint $t){$t->string('device_code')->nullable()->unique()->after('controller_id');$t->unsignedInteger('register_alarm')->nullable()->after('register_output');});
  Schema::table('tn_recipe_templates',function(Blueprint $t){$t->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();});
  Schema::create('batch_productions',function(Blueprint $t){$t->id();$t->string('batch_number')->unique();$t->foreignId('machine_id')->constrained('machines')->restrictOnDelete();$t->foreignId('recipe_id')->constrained('tn_recipe_templates')->restrictOnDelete();$t->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();$t->enum('status',['Planned','Running','Holding','Cooling','Completed','Failed','Aborted'])->default('Planned');$t->timestamp('started_at')->nullable();$t->timestamp('ended_at')->nullable();$t->json('process_snapshot')->nullable();$t->json('result_summary')->nullable();$t->timestamps();});
 }
 public function down():void{Schema::dropIfExists('batch_productions');Schema::table('tn_recipe_templates',function(Blueprint $t){$t->dropForeign(['updated_by']);$t->dropColumn('updated_by');});Schema::table('controller_devices',fn(Blueprint $t)=>$t->dropColumn(['device_code','register_alarm']));Schema::table('tn_controllers',fn(Blueprint $t)=>$t->dropColumn(['controller_code','polling_interval','firmware_version','status']));Schema::table('machines',fn(Blueprint $t)=>$t->dropColumn('machine_type'));}
};
