<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class ControllerDevice extends Model {
    use HasFactory;
    protected $fillable = ['controller_id','device_code','device_name','device_type','sensor_type','unit','register_pv','register_sv','register_output','register_alarm','status'];
    public function controller() { return $this->belongsTo(TnController::class, 'controller_id'); }
}
