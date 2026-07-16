<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Machine extends Model {
    use HasFactory;
    protected $fillable = ['machine_code','machine_name','machine_type','description','location','status'];
    public function controllers() { return $this->hasMany(TnController::class); }
    public function batches() { return $this->hasMany(BatchProduction::class); }
}
