<?php
namespace App\Http\Controllers;
use App\Models\TnRecipeTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TnRecipeController extends Controller {
    public function index() { return Inertia::render('Recipe/Index', ['recipes'=>TnRecipeTemplate::with(['steps','creator:id,name','approver:id,name'])->latest()->get(), 'controllers'=>\App\Models\TnController::all()]); }
    public function create() { return Inertia::render('Recipe/Form', ['users'=>User::orderBy('name')->get(['id','name'])]); }
    public function store(Request $request) {
        $data=$this->validateRecipe($request);
        $recipe = DB::transaction(function() use($data,$request){
            $recipe=TnRecipeTemplate::create($this->template($data)+['created_by'=>$request->user()->id]);
            $recipe->steps()->createMany($this->steps($data['steps']));
            return $recipe;
        });

        $syncMsg = '';
        if ($request->boolean('sync_to_tn', true)) {
            $writeRes = $this->writeRecipeToDevice($recipe);
            if ($writeRes['success']) {
                $syncMsg = ' dan berhasil ditulis ke TN Controller (' . $writeRes['controller'] . ')';
            } else {
                $syncMsg = ' (Peringatan: Gagal menulis ke TN Controller: ' . ($writeRes['error'] ?? 'Offline') . ')';
            }
        }

        return redirect()->route('tn.recipes.index')->with('success', 'Pattern berhasil disimpan' . $syncMsg . '.');
    }

    public function edit(TnRecipeTemplate $recipe) { return Inertia::render('Recipe/Form',['recipe'=>$recipe->load('steps'),'users'=>User::orderBy('name')->get(['id','name'])]); }

    public function update(Request $request,TnRecipeTemplate $recipe) {
        $data=$this->validateRecipe($request,$recipe);
        DB::transaction(function() use($data,$recipe){
            $recipe->update($this->template($data));
            $recipe->steps()->delete();
            $recipe->steps()->createMany($this->steps($data['steps']));
        });

        $syncMsg = '';
        if ($request->boolean('sync_to_tn', true)) {
            $writeRes = $this->writeRecipeToDevice($recipe);
            if ($writeRes['success']) {
                $syncMsg = ' dan berhasil ditulis ke TN Controller (' . $writeRes['controller'] . ')';
            } else {
                $syncMsg = ' (Peringatan: Gagal menulis ke TN Controller: ' . ($writeRes['error'] ?? 'Offline') . ')';
            }
        }

        return redirect()->route('tn.recipes.index')->with('success', 'Pattern berhasil diperbarui' . $syncMsg . '.');
    }

    public function duplicate(Request $request,TnRecipeTemplate $recipe) {
        $copy=DB::transaction(function() use($request,$recipe){$recipe->load('steps');$copy=$recipe->replicate(['recipe_code','status','approved_by','archived_at']);$copy->recipe_code=$this->copyCode($recipe->recipe_code);$copy->name=$recipe->name.' (Copy)';$copy->revision=1;$copy->version='1.0';$copy->status='Draft';$copy->created_by=$request->user()->id;$copy->save();foreach($recipe->steps as $step)$copy->steps()->create($step->only(['step_number','step_name','target_sv','target_pressure','duration','end_action','event_link','pid_group','steam_enable','cooling_enable','drain_enable','alarm_enable','settings']));return $copy;});
        return redirect()->route('tn.recipes.edit',$copy)->with('success','Recipe duplicated as draft.');
    }
    public function archive(TnRecipeTemplate $recipe) { $recipe->update(['status'=>'Archived','archived_at'=>now()]);return back()->with('success','Recipe archived.'); }
    public function destroy(TnRecipeTemplate $recipe) { $recipe->delete();return redirect()->route('tn.recipes.index'); }
    
    public function apply(Request $request, TnRecipeTemplate $recipe, $tnId = null)
    {
        $writeRes = $this->writeRecipeToDevice($recipe, $tnId);
        if (!$writeRes['success']) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $writeRes['error']], 500);
            }
            return back()->with('error', 'Gagal menulis pattern ke TN Controller: ' . $writeRes['error']);
        }

        $pNum = (int)($recipe->pattern_number ?? 0);
        $msg = "Pattern '{$recipe->name}' (PTN.{$pNum}) berhasil diterapkan dan ditulis langsung ke memori Controller TN ({$writeRes['controller']}).";
        
        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }
        return back()->with('success', $msg);
    }

    protected function writeRecipeToDevice(TnRecipeTemplate $recipe, $tnId = null): array
    {
        $tn = null;
        if ($tnId) {
            $tn = \App\Models\TnController::find($tnId);
        }
        if (!$tn) {
            $tn = \App\Models\TnController::where('is_online', true)->first() ?? \App\Models\TnController::first();
        }

        if (!$tn) {
            return ['success' => false, 'error' => 'Tidak ada TN Controller yang terdaftar.'];
        }

        $modbus = app(\App\Services\TnModbusService::class);
        $recipe->load('steps');
        $pNum = (int)($recipe->pattern_number ?? 0);

        // 1. Write Pattern Number (400205 -> offset 204)
        $pSelectRes = $modbus->writeSingleRegister($tn, 204, $pNum);
        if (!$pSelectRes['success']) {
            return ['success' => false, 'error' => 'Gagal memilih slot pattern: ' . ($pSelectRes['error'] ?? 'Koneksi Modbus gagal')];
        }

        // 2. Prepare base config values (400201-400209 -> offset 200)
        $endStates = ['STOP' => 0, 'HOLD' => 1, 'NEXT' => 2, 'PRE' => 3];
        $endStateVal = $endStates[$recipe->pattern_end_state] ?? 0;

        $stepCount = count($recipe->steps);
        $configValues = [
            $recipe->time_unit === 'HH.MM' ? 1 : 0,    // 400201: Time Unit (0: MM.SS, 1: HH.MM)
            $recipe->start_condition === 'SPV' ? 1 : 0, // 400202: Start Condition (0: SSV, 1: SPV)
            (int)($recipe->wait_width ?? 20),          // 400203: Wait Width
            (int)($recipe->wait_time ?? 0),            // 400204: Wait Time
            $pNum,                                     // 400205: Pattern Number
            (int)($recipe->repetitions ?? 0),          // 400206: Repetitions
            $endStateVal,                              // 400207: End State
            (int)($recipe->pid_group ?? 0),            // 400208: PID Group
            $stepCount,                                // 400209: Step Count
        ];

        $resConfig = $modbus->writeMultipleRegisters($tn, 200, $configValues);
        if (!$resConfig['success']) {
            return ['success' => false, 'error' => 'Gagal menulis konfigurasi dasar pattern: ' . ($resConfig['error'] ?? 'Modbus error')];
        }

        // 3. Prepare step registers (400210-400249 -> offset 209, 40 registers)
        $stepRegisters = array_fill(0, 40, 0);
        foreach ($recipe->steps as $idx => $step) {
            if ($idx >= 20) break;
            $svVal = (int)($step->target_sv ?? 0);
            $timVal = (int)($step->duration ?? 0);

            // If temperature entered as e.g. 121 (without multiplying by 10 for 1-decimal TN), scale appropriately
            // Normal retort sterilizing temperatures are 20.0 - 140.0 °C
            if ($svVal > 0 && $svVal < 200) {
                $svVal = $svVal * 10;
            }

            $stepRegisters[$idx * 2] = $svVal;
            $stepRegisters[($idx * 2) + 1] = $timVal;
        }

        $resSteps = $modbus->writeMultipleRegisters($tn, 209, $stepRegisters);
        if (!$resSteps['success']) {
            return ['success' => false, 'error' => 'Gagal menulis langkah-langkah step: ' . ($resSteps['error'] ?? 'Modbus error')];
        }

        return ['success' => true, 'controller' => $tn->name];
    }

    public function scanFromDevice(Request $request, $tnId)
    {
        $tn = \App\Models\TnController::findOrFail($tnId);
        $modbus = app(\App\Services\TnModbusService::class);
        
        // Read pattern config (400201-400209) -> offset 200-208
        $configResult = $modbus->readHoldingRegisters($tn, 200, 9);
        if (!$configResult['success']) {
            return response()->json(['error' => 'Failed to read config: ' . $configResult['error']], 500);
        }

        // Read pattern steps (400210-400249) -> offset 209-248 (40 registers)
        $stepsResult = $modbus->readHoldingRegisters($tn, 209, 40);
        if (!$stepsResult['success']) {
            return response()->json(['error' => 'Failed to read steps: ' . $stepsResult['error']], 500);
        }

        $configData = $configResult['data'];
        $stepsData = $stepsResult['data'];

        $pattern = [
            'time_unit' => $configData[0] == 0 ? 'MM.SS' : 'HH.MM',
            'start_condition' => $configData[1] == 0 ? 'SSV' : 'SPV',
            'wait_width' => $configData[2] ?? 0,
            'wait_time' => $configData[3] ?? 0,
            'pattern_number' => $configData[4] ?? 0,
            'repetitions' => $configData[5] ?? 0,
            'pattern_end_state' => ['STOP', 'HOLD', 'NEXT', 'PRE'][$configData[6] ?? 0] ?? 'STOP',
            'pid_group' => $configData[7] ?? 0,
            'step_count' => $configData[8] ?? 0,
            'steps' => []
        ];

        for ($i = 0; $i < 20; $i++) {
            $pattern['steps'][] = [
                'target_sv' => $stepsData[$i * 2] ?? 0,
                'duration' => $stepsData[($i * 2) + 1] ?? 0,
                'step_name' => 'Step ' . ($i + 1),
            ];
        }

        return response()->json($pattern);
    }

    public function scanAllPatterns(Request $request)
    {
        $request->validate(['tn_id' => 'required|exists:tn_controllers,id']);
        $tn = \App\Models\TnController::findOrFail($request->tn_id);
        $modbus = app(\App\Services\TnModbusService::class);

        // 1. Check if RUNNING
        $runResult = $modbus->readHoldingRegisters($tn, 0, 1);
        if (!$runResult['success']) {
            return response()->json(['error' => 'Failed to read RUN/STOP status: ' . $runResult['error']], 500);
        }
        if ($runResult['data'][0] === 0) { // 0 = RUN, 1 = STOP
            return response()->json(['error' => 'Cannot scan patterns while the controller is RUNNING. Please stop the operation first.'], 403);
        }

        // 2. Read Current Pattern Number
        $patternResult = $modbus->readHoldingRegisters($tn, 204, 1);
        if (!$patternResult['success']) {
            return response()->json(['error' => 'Failed to read current pattern number.'], 500);
        }
        $originalPatternNum = $patternResult['data'][0];

        $scannedCount = 0;
        
        // 3. Loop 0 to 9
        for ($p = 0; $p < 10; $p++) {
            // Write pattern number
            $writeResult = $modbus->writeSingleRegister($tn, 204, $p);
            if (!$writeResult['success']) continue;
            
            // Read config
            $configResult = $modbus->readHoldingRegisters($tn, 200, 9);
            if (!$configResult['success']) continue;
            
            // Read steps
            $stepsResult = $modbus->readHoldingRegisters($tn, 209, 40);
            if (!$stepsResult['success']) continue;
            
            $configData = $configResult['data'];
            $stepsData = $stepsResult['data'];
            
            $stepCount = $configData[8] ?? 0;
            
            // Only save if there are actual steps
            if ($stepCount > 0) {
                DB::transaction(function() use ($p, $configData, $stepsData, $stepCount, $tn, $request) {
                    $template = TnRecipeTemplate::create([
                        'recipe_code' => 'P' . $p . '-' . uniqid(),
                        'name' => 'Pattern ' . $p . ($tn->name && strtolower(trim($tn->name)) !== 'asa' ? ' (' . $tn->name . ')' : ''),
                        'status' => 'Draft',
                        'version' => '1.0',
                        'revision' => 1,
                        'created_by' => $request->user()->id,
                        'time_unit' => $configData[0] == 0 ? 'MM.SS' : 'HH.MM',
                        'start_condition' => $configData[1] == 0 ? 'SSV' : 'SPV',
                        'wait_width' => $configData[2] ?? 0,
                        'wait_time' => $configData[3] ?? 0,
                        'pattern_number' => $p,
                        'repetitions' => $configData[5] ?? 0,
                        'pattern_end_state' => ['STOP', 'HOLD', 'NEXT', 'PRE'][$configData[6] ?? 0] ?? 'STOP',
                        'pid_group' => $configData[7] ?? 0,
                        'step_count' => $stepCount,
                        'process_parameters' => ['scanned_from' => $tn->id]
                    ]);
                    
                    for ($i = 0; $i < $stepCount; $i++) {
                        $template->steps()->create([
                            'step_number' => $i + 1,
                            'step_name' => 'Step ' . ($i + 1),
                            'target_sv' => $stepsData[$i * 2] ?? 0,
                            'duration' => $stepsData[($i * 2) + 1] ?? 0,
                        ]);
                    }
                });
                $scannedCount++;
            }
        }

        // 4. Restore original pattern number
        $modbus->writeSingleRegister($tn, 204, $originalPatternNum);

        return response()->json(['message' => "Successfully scanned and saved {$scannedCount} patterns."]);
    }

    private function validateRecipe(Request $r,?TnRecipeTemplate $recipe=null):array{return $r->validate([
        'recipe_code'=>['required','string','max:80',Rule::unique('tn_recipe_templates')->ignore($recipe)],'name'=>['required','string','max:255'],'product_name'=>['required','string','max:255'],'product_category'=>['nullable','string','max:100'],'package_type'=>['nullable','string','max:100'],'package_size'=>['nullable','string','max:100'],'description'=>['nullable','string'],'revision'=>['required','integer','min:1'],'version'=>['required','string','max:30'],'status'=>['required',Rule::in(['Draft','Active','Inactive','Archived'])],'approved_by'=>['nullable','exists:users,id'],'process_parameters'=>['required','array'],'tn_config'=>['nullable','array'],'time_unit'=>['required',Rule::in(['MM.SS','HH.MM'])],'start_condition'=>['required',Rule::in(['SSV','SPV'])],'pattern_end_state'=>['required',Rule::in(['STOP','HOLD','NEXT','PRE'])],'pattern_number'=>['required','integer','min:0','max:9'],'repetitions'=>['required','integer','min:0'],'pid_group'=>['required','integer','min:0','max:7'],'wait_width'=>['required','integer','min:0'],'wait_time'=>['required','integer','min:0'],'steps'=>['required','array','min:1','max:50'],'steps.*.step_name'=>['required','string','max:100'],'steps.*.target_sv'=>['required','integer','min:-1999','max:9999'],'steps.*.duration'=>['required','integer','min:0','max:9999'],'steps.*.end_action'=>['nullable',Rule::in(['CONT','HOLD','STOP'])],'steps.*.event_link'=>['nullable','integer','min:0','max:9'],'steps.*.pid_group'=>['nullable','integer','min:0','max:7'],'steps.*.target_pressure'=>['nullable','numeric','min:0','max:99'],'steps.*.steam_enable'=>['boolean'],'steps.*.cooling_enable'=>['boolean'],'steps.*.drain_enable'=>['boolean'],'steps.*.alarm_enable'=>['boolean']]);}
    private function template(array $d):array{return collect($d)->only(['recipe_code','name','product_name','product_category','package_type','package_size','description','revision','version','status','approved_by','process_parameters','tn_config','time_unit','start_condition','pattern_end_state','pattern_number','repetitions','pid_group','wait_width','wait_time'])->all()+['step_count'=>count($d['steps'])];}
    private function steps(array $steps):array{return array_map(fn($s,$i)=>['step_number'=>$i+1]+$s,$steps,array_keys($steps));}
    private function copyCode(string $code):string{$base=$code.'-COPY';$candidate=$base;$i=1;while(TnRecipeTemplate::where('recipe_code',$candidate)->exists())$candidate=$base.'-'.$i++;return $candidate;}
}
