<?php

namespace App\Http\Controllers;

use App\Models\TnRecipeTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TnRecipeController extends Controller
{
    public function index()
    {
        $recipes = TnRecipeTemplate::with('creator')->get();
        return Inertia::render('Tn/Recipes/Index', [
            'recipes' => $recipes
        ]);
    }

    public function create()
    {
        return Inertia::render('Tn/Recipes/CreateEdit');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'time_unit' => 'required|in:MM.SS,HH.MM',
            'start_condition' => 'required|in:SSV,SPV',
            'pattern_end_state' => 'required|in:STOP,HOLD,NEXT,PRE',
            'repetitions' => 'required|integer|min:0',
            'target_f0' => 'required|numeric|min:0',
            'z_value' => 'required|numeric|min:0.1',
            't_ref' => 'required|numeric|min:0',
            'steps' => 'required|array|min:1|max:20',
            'steps.*.target_sv' => 'required|numeric',
            'steps.*.time_minutes' => 'required|integer|min:0',
            'steps.*.time_seconds' => 'required|integer|min:0|max:59',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $recipe = TnRecipeTemplate::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'time_unit' => $validated['time_unit'],
                'start_condition' => $validated['start_condition'],
                'pattern_end_state' => $validated['pattern_end_state'],
                'repetitions' => $validated['repetitions'],
                'target_f0' => $validated['target_f0'],
                'z_value' => $validated['z_value'],
                't_ref' => $validated['t_ref'],
                'step_count' => count($validated['steps']),
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['steps'] as $index => $step) {
                $recipe->steps()->create([
                    'step_number' => $index + 1,
                    'target_sv' => $step['target_sv'],
                    'time_minutes' => $step['time_minutes'],
                    'time_seconds' => $step['time_seconds'],
                ]);
            }
        });

        return redirect()->route('tn.recipes.index')->with('success', 'Recipe created successfully.');
    }

    public function edit(TnRecipeTemplate $recipe)
    {
        $recipe->load('steps');
        return Inertia::render('Tn/Recipes/CreateEdit', [
            'recipe' => $recipe
        ]);
    }

    public function update(Request $request, TnRecipeTemplate $recipe)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'time_unit' => 'required|in:MM.SS,HH.MM',
            'start_condition' => 'required|in:SSV,SPV',
            'pattern_end_state' => 'required|in:STOP,HOLD,NEXT,PRE',
            'repetitions' => 'required|integer|min:0',
            'target_f0' => 'required|numeric|min:0',
            'z_value' => 'required|numeric|min:0.1',
            't_ref' => 'required|numeric|min:0',
            'steps' => 'required|array|min:1|max:20',
            'steps.*.target_sv' => 'required|numeric',
            'steps.*.time_minutes' => 'required|integer|min:0',
            'steps.*.time_seconds' => 'required|integer|min:0|max:59',
        ]);

        DB::transaction(function () use ($validated, $recipe) {
            $recipe->update([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'time_unit' => $validated['time_unit'],
                'start_condition' => $validated['start_condition'],
                'pattern_end_state' => $validated['pattern_end_state'],
                'repetitions' => $validated['repetitions'],
                'target_f0' => $validated['target_f0'],
                'z_value' => $validated['z_value'],
                't_ref' => $validated['t_ref'],
                'step_count' => count($validated['steps']),
            ]);

            $recipe->steps()->delete();
            foreach ($validated['steps'] as $index => $step) {
                $recipe->steps()->create([
                    'step_number' => $index + 1,
                    'target_sv' => $step['target_sv'],
                    'time_minutes' => $step['time_minutes'],
                    'time_seconds' => $step['time_seconds'],
                ]);
            }
        });

        return redirect()->route('tn.recipes.index')->with('success', 'Recipe updated successfully.');
    }

    public function destroy(TnRecipeTemplate $recipe)
    {
        $recipe->delete();
        return redirect()->route('tn.recipes.index')->with('success', 'Recipe deleted successfully.');
    }

    public function apply(Request $request, $tnId, TnRecipeTemplate $recipe)
    {
        // TODO: In Phase 3, this will send the modbus writes to the bridge
        return back()->with('success', "Recipe '{$recipe->name}' applied to Controller ID: {$tnId} (Simulated).");
    }
}
