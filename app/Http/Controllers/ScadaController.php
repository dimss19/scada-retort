<?php

namespace App\Http\Controllers;

use App\Models\ScadaCanvas;
use App\Models\ScadaMapping;
use App\Models\TnController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ScadaController extends Controller
{
    public function edit(TnController $tn)
    {
        $canvas = ScadaCanvas::firstOrCreate(
            ['tn_controller_id' => $tn->id],
            [
                'width' => 1200,
                'height' => 800,
                'grid_enabled' => true,
                'grid_size' => 20,
                'snap_to_grid' => true,
            ]
        );

        $mappings = ScadaMapping::where('tn_controller_id', $tn->id)
            ->orderBy('z_index')
            ->orderBy('id')
            ->get();

        return inertia('Tn/ScadaEditor', [
            'controller' => $tn->load('machine'),
            'canvas' => $canvas,
            'mappings' => $mappings,
        ]);
    }

    public function save(Request $request, TnController $tn)
    {
        if ($request->has('canvas')) {
            $canvasData = $request->input('canvas');
            ScadaCanvas::updateOrCreate(
                ['tn_controller_id' => $tn->id],
                [
                    'background_image_url' => $canvasData['background_image_url'] ?? null,
                    'width' => (int) ($canvasData['width'] ?? 1200),
                    'height' => (int) ($canvasData['height'] ?? 800),
                    'grid_enabled' => (bool) ($canvasData['grid_enabled'] ?? true),
                    'grid_size' => (int) ($canvasData['grid_size'] ?? 20),
                    'snap_to_grid' => (bool) ($canvasData['snap_to_grid'] ?? true),
                ]
            );
        }

        if ($request->has('mappings')) {
            $mappings = $request->input('mappings', []);
            $existingIds = ScadaMapping::where('tn_controller_id', $tn->id)->pluck('id')->toArray();
            $keptIds = [];

            foreach ($mappings as $item) {
                $id = (!empty($item['id']) && (int)$item['id'] > 0) ? (int)$item['id'] : null;
                $mapping = ScadaMapping::updateOrCreate(
                    ['id' => $id, 'tn_controller_id' => $tn->id],
                    [
                        'element_id' => $item['element_id'] ?? ('elem_' . uniqid()),
                        'element_type' => $item['element_type'] ?? 'display',
                        'label' => $item['label'] ?? null,
                        'data_source' => $item['data_source'] ?? 'pv',
                        'position_x' => (int) ($item['position_x'] ?? 0),
                        'position_y' => (int) ($item['position_y'] ?? 0),
                        'width' => (int) ($item['width'] ?? 120),
                        'height' => (int) ($item['height'] ?? 80),
                        'rotation' => (int) ($item['rotation'] ?? 0),
                        'z_index' => (int) ($item['z_index'] ?? 0),
                        'normal_color' => $item['normal_color'] ?? '#22c55e',
                        'warning_color' => $item['warning_color'] ?? '#eab308',
                        'critical_color' => $item['critical_color'] ?? '#ef4444',
                        'warning_threshold' => isset($item['warning_threshold']) && is_numeric($item['warning_threshold']) ? (float)$item['warning_threshold'] : null,
                        'critical_threshold' => isset($item['critical_threshold']) && is_numeric($item['critical_threshold']) ? (float)$item['critical_threshold'] : null,
                        'module_dependency' => $item['module_dependency'] ?? null,
                    ]
                );
                $keptIds[] = $mapping->id;
            }

            $toDelete = array_diff($existingIds, $keptIds);
            if (!empty($toDelete)) {
                ScadaMapping::whereIn('id', $toDelete)->delete();
            }
        }

        return back()->with('success', 'SCADA Editor configuration saved successfully.');
    }

    public function updateCanvas(Request $request, TnController $tn)
    {
        $validated = $request->validate([
            'background_image_url' => 'nullable|string',
            'width' => 'integer|min:400|max:4000',
            'height' => 'integer|min:300|max:4000',
            'grid_enabled' => 'boolean',
            'grid_size' => 'integer|min:5|max:100',
            'snap_to_grid' => 'boolean',
        ]);

        $canvas = ScadaCanvas::updateOrCreate(
            ['tn_controller_id' => $tn->id],
            $validated
        );

        return back()->with('success', 'Canvas updated.');
    }

    public function saveMappings(Request $request, TnController $tn)
    {
        $validated = $request->validate([
            'mappings' => 'required|array',
            'mappings.*.id' => 'nullable|integer|exists:scada_mappings,id',
            'mappings.*.element_id' => 'required|string|max:100',
            'mappings.*.element_type' => 'required|string|in:gauge,valve,pump,tank,pipe,label,display,indicator',
            'mappings.*.label' => 'nullable|string|max:200',
            'mappings.*.data_source' => 'required|string|max:100',
            'mappings.*.position_x' => 'integer|min:-5000|max:5000',
            'mappings.*.position_y' => 'integer|min:-5000|max:5000',
            'mappings.*.width' => 'integer|min:20|max:1000',
            'mappings.*.height' => 'integer|min:20|max:1000',
            'mappings.*.rotation' => 'integer|min:0|max:360',
            'mappings.*.z_index' => 'integer|min:-100|max:100',
            'mappings.*.normal_color' => 'string|max:20',
            'mappings.*.warning_color' => 'string|max:20',
            'mappings.*.critical_color' => 'string|max:20',
            'mappings.*.warning_threshold' => 'nullable|numeric',
            'mappings.*.critical_threshold' => 'nullable|numeric',
            'mappings.*.module_dependency' => 'nullable|string|max:100',
        ]);

        $existingIds = ScadaMapping::where('tn_controller_id', $tn->id)->pluck('id')->toArray();
        $keptIds = [];

        foreach ($validated['mappings'] as $item) {
            $mapping = ScadaMapping::updateOrCreate(
                ['id' => $item['id'] ?? null, 'tn_controller_id' => $tn->id],
                [
                    'element_id' => $item['element_id'],
                    'element_type' => $item['element_type'],
                    'label' => $item['label'] ?? null,
                    'data_source' => $item['data_source'],
                    'position_x' => $item['position_x'] ?? 0,
                    'position_y' => $item['position_y'] ?? 0,
                    'width' => $item['width'] ?? 120,
                    'height' => $item['height'] ?? 80,
                    'rotation' => $item['rotation'] ?? 0,
                    'z_index' => $item['z_index'] ?? 0,
                    'normal_color' => $item['normal_color'] ?? '#22c55e',
                    'warning_color' => $item['warning_color'] ?? '#eab308',
                    'critical_color' => $item['critical_color'] ?? '#ef4444',
                    'warning_threshold' => $item['warning_threshold'] ?? null,
                    'critical_threshold' => $item['critical_threshold'] ?? null,
                    'module_dependency' => $item['module_dependency'] ?? null,
                ]
            );
            $keptIds[] = $mapping->id;
        }

        $toDelete = array_diff($existingIds, $keptIds);
        if (!empty($toDelete)) {
            ScadaMapping::whereIn('id', $toDelete)->delete();
        }

        return back()->with('success', 'Mappings saved.');
    }

    public function uploadBackground(Request $request, TnController $tn)
    {
        $request->validate([
            'background' => 'required|image|mimes:png,jpg,jpeg,gif,svg|max:5120',
        ]);

        $path = $request->file('background')->store('scada/backgrounds', 'public');

        ScadaCanvas::updateOrCreate(
            ['tn_controller_id' => $tn->id],
            ['background_image_url' => Storage::url($path)]
        );

        return back()->with('success', 'Background uploaded.');
    }
}
