<?php
namespace App\Http\Controllers;
use App\Models\Machine;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
class MachineController extends Controller {
    public function index() { return Inertia::render('Machine/Index', ['machines'=>Machine::withCount('controllers')->with(['controllers:id,machine_id,name,is_online'])->get()]); }
    public function create() { return Inertia::render('Machine/Form'); }
    public function store(Request $request) { Machine::create($this->valid($request)); return redirect()->route('machines.index'); }
    public function edit(Machine $machine) { return Inertia::render('Machine/Form', ['machine'=>$machine]); }
    public function update(Request $request, Machine $machine) { $machine->update($this->valid($request,$machine)); return redirect()->route('machines.index'); }
    public function destroy(Machine $machine) { $machine->delete(); return redirect()->route('machines.index'); }
    private function valid(Request $request, ?Machine $machine=null): array { return $request->validate(['machine_code'=>['required','string','max:50',Rule::unique('machines')->ignore($machine)],'machine_name'=>['required','string','max:255'],'machine_type'=>['required','string','max:100'],'description'=>['nullable','string'],'location'=>['nullable','string','max:255'],'status'=>['required',Rule::in(['Active','Inactive'])]]); }
}
