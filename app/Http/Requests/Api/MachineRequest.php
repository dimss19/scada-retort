<?php
namespace App\Http\Requests\Api; use Illuminate\Foundation\Http\FormRequest; use Illuminate\Validation\Rule;
class MachineRequest extends FormRequest {public function authorize():bool{return true;}public function rules():array{$id=$this->route('machine')?->id;return ['machine_code'=>['required','string','max:50',Rule::unique('machines')->ignore($id)],'machine_name'=>'required|string|max:255','machine_type'=>'required|string|max:100','location'=>'nullable|string|max:255','description'=>'nullable|string','status'=>['required',Rule::in(['Active','Inactive'])]];}}
