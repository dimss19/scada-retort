<?php
namespace App\Http\Controllers;
use App\Models\TnRecipeTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TnRecipeController extends Controller {
    public function index() { return Inertia::render('Recipe/Index', ['recipes'=>TnRecipeTemplate::with(['steps','creator:id,name','approver:id,name'])->latest()->get()]); }
    public function create() { return Inertia::render('Recipe/Form', ['users'=>User::orderBy('name')->get(['id','name'])]); }
    public function store(Request $request) {
        $data=$this->validateRecipe($request);
        DB::transaction(function() use($data,$request){$recipe=TnRecipeTemplate::create($this->template($data)+['created_by'=>$request->user()->id]);$recipe->steps()->createMany($this->steps($data['steps']));});
        return redirect()->route('tn.recipes.index')->with('success','Recipe created.');
    }
    public function edit(TnRecipeTemplate $recipe) { return Inertia::render('Recipe/Form',['recipe'=>$recipe->load('steps'),'users'=>User::orderBy('name')->get(['id','name'])]); }
    public function update(Request $request,TnRecipeTemplate $recipe) {
        $data=$this->validateRecipe($request,$recipe);
        DB::transaction(function() use($data,$recipe){$recipe->update($this->template($data));$recipe->steps()->delete();$recipe->steps()->createMany($this->steps($data['steps']));});
        return redirect()->route('tn.recipes.index')->with('success','Recipe updated.');
    }
    public function duplicate(Request $request,TnRecipeTemplate $recipe) {
        $copy=DB::transaction(function() use($request,$recipe){$recipe->load('steps');$copy=$recipe->replicate(['recipe_code','status','approved_by','archived_at']);$copy->recipe_code=$this->copyCode($recipe->recipe_code);$copy->name=$recipe->name.' (Copy)';$copy->revision=1;$copy->version='1.0';$copy->status='Draft';$copy->created_by=$request->user()->id;$copy->save();foreach($recipe->steps as $step)$copy->steps()->create($step->only(['step_number','step_name','target_sv','target_pressure','duration','steam_enable','cooling_enable','drain_enable','alarm_enable','settings']));return $copy;});
        return redirect()->route('tn.recipes.edit',$copy)->with('success','Recipe duplicated as draft.');
    }
    public function archive(TnRecipeTemplate $recipe) { $recipe->update(['status'=>'Archived','archived_at'=>now()]);return back()->with('success','Recipe archived.'); }
    public function destroy(TnRecipeTemplate $recipe) { $recipe->delete();return redirect()->route('tn.recipes.index'); }
    
    public function apply(Request $request, $tnId, TnRecipeTemplate $recipe)
    {
        // TODO: In Phase 3, this will send the modbus writes to the bridge
        return back()->with('success', "Recipe '{$recipe->name}' applied to Controller ID: {$tnId} (Simulated).");
    }

    private function validateRecipe(Request $r,?TnRecipeTemplate $recipe=null):array{return $r->validate([
        'recipe_code'=>['required','string','max:80',Rule::unique('tn_recipe_templates')->ignore($recipe)],'name'=>['required','string','max:255'],'product_name'=>['required','string','max:255'],'product_category'=>['nullable','string','max:100'],'package_type'=>['nullable','string','max:100'],'package_size'=>['nullable','string','max:100'],'description'=>['nullable','string'],'revision'=>['required','integer','min:1'],'version'=>['required','string','max:30'],'status'=>['required',Rule::in(['Draft','Active','Inactive','Archived'])],'approved_by'=>['nullable','exists:users,id'],'process_parameters'=>['required','array'],'steps'=>['required','array','min:1','max:50'],'steps.*.step_name'=>['required','string','max:100'],'steps.*.target_sv'=>['required','integer','min:-199','max:999'],'steps.*.target_pressure'=>['nullable','numeric','min:0','max:99'],'steps.*.duration'=>['required','integer','min:0','max:9999'],'steps.*.steam_enable'=>['boolean'],'steps.*.cooling_enable'=>['boolean'],'steps.*.drain_enable'=>['boolean'],'steps.*.alarm_enable'=>['boolean']]);}
    private function template(array $d):array{return collect($d)->only(['recipe_code','name','product_name','product_category','package_type','package_size','description','revision','version','status','approved_by','process_parameters'])->all()+['time_unit'=>'MM.SS','step_count'=>count($d['steps'])];}
    private function steps(array $steps):array{return array_map(fn($s,$i)=>['step_number'=>$i+1]+$s,$steps,array_keys($steps));}
    private function copyCode(string $code):string{$base=$code.'-COPY';$candidate=$base;$i=1;while(TnRecipeTemplate::where('recipe_code',$candidate)->exists())$candidate=$base.'-'.$i++;return $candidate;}
}
