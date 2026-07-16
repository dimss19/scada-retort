<?php
namespace App\Http\Resources; use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class MachineResource extends JsonResource {public function toArray(Request $r):array{return ['id'=>$this->id,'machine_code'=>$this->machine_code,'machine_name'=>$this->machine_name,'machine_type'=>$this->machine_type,'location'=>$this->location,'description'=>$this->description,'status'=>$this->status,'controllers'=>ControllerResource::collection($this->whenLoaded('controllers')),'created_at'=>$this->created_at,'updated_at'=>$this->updated_at];}}
