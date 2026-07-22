import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, ScadaCanvas as ScadaCanvasType, ScadaElementType, ScadaMapping } from '@/types';
import ScadaCanvas from '@/Components/ScadaCanvas';

interface Props extends PageProps {
    controller: any;
    canvas: ScadaCanvasType | null;
    mappings: ScadaMapping[];
}

const ELEMENT_TYPES: Array<{ type: ScadaElementType; label: string; icon: string; defaultW: number; defaultH: number }> = [
    { type: 'gauge', label: 'Gauge', icon: '◴', defaultW: 140, defaultH: 160 },
    { type: 'display', label: 'Display', icon: '▣', defaultW: 140, defaultH: 80 },
    { type: 'valve', label: 'Valve', icon: '⋈', defaultW: 90, defaultH: 110 },
    { type: 'pump', label: 'Pump', icon: '⚙', defaultW: 90, defaultH: 110 },
    { type: 'tank', label: 'Vessel / Tank', icon: '▥', defaultW: 180, defaultH: 260 },
    { type: 'pipe', label: 'Pipe', icon: '═', defaultW: 180, defaultH: 30 },
    { type: 'label', label: 'Label', icon: 'Aa', defaultW: 180, defaultH: 44 },
    { type: 'indicator', label: 'Indicator', icon: '●', defaultW: 100, defaultH: 64 },
];

const DATA_SOURCES = [
    { value: 'pv', label: 'PV / Temperatur aktual' },
    { value: 'sv', label: 'SV / Target temperatur' },
    { value: 'heating_mv', label: 'Heating output (%)' },
    { value: 'cooling_mv', label: 'Cooling output (%)' },
    { value: 'run_status', label: 'RUN / STOP raw TN' },
    { value: 'controller_running', label: 'Controller running' },
    { value: 'auto_manual', label: 'Auto / Manual' },
    { value: 'at_running', label: 'Auto tune' },
    { value: 'out1_active', label: 'Output 1' },
    { value: 'out2_active', label: 'Output 2' },
    { value: 'alarm_active', label: 'Alarm aktif' },
    { value: 'process_phase', label: 'Status proses TN' },
    { value: 'pattern_current', label: 'Pattern' },
    { value: 'step_current', label: 'Current step' },
    { value: 'process_time', label: 'Process time' },
    { value: 'rest_time', label: 'Remaining time' },
    { value: 'water_level', label: 'Water level — I/O belum dipetakan' },
    { value: 'boiler_pressure', label: 'Boiler pressure — I/O belum dipetakan' },
    { value: 'gas_ready', label: 'Gas — I/O belum dipetakan' },
    { value: 'pilot_flame', label: 'Pilot flame — I/O belum dipetakan' },
    { value: 'steam_valve', label: 'Steam valve — I/O belum dipetakan' },
    { value: 'door_lock', label: 'Door lock — I/O belum dipetakan' },
    { value: 'compressor', label: 'Compressor — I/O belum dipetakan' },
    { value: 'drain_open', label: 'Drain — I/O belum dipetakan' },
];

const PREVIEW_SENSOR_DATA = {
    pv: 1085,
    sv: 1210,
    decimal_point: 1,
    heating_mv: 680,
    cooling_mv: 0,
    run_status: false,
    controller_running: true,
    auto_manual: false,
    at_running: false,
    out1_active: true,
    out2_active: false,
    alarm_active: false,
    process_phase: 'Heating',
    pattern_current: 2,
    step_current: 3,
    process_time: 1245,
    rest_time: 830,
};

function makeMapping(controllerId: number, id: number, values: Partial<ScadaMapping>): ScadaMapping {
    const now = new Date().toISOString();
    return {
        id,
        tn_controller_id: controllerId,
        element_id: values.element_id ?? `element_${Math.abs(id)}`,
        element_type: values.element_type ?? 'display',
        label: values.label ?? null,
        data_source: values.data_source ?? 'pv',
        position_x: values.position_x ?? 0,
        position_y: values.position_y ?? 0,
        width: values.width ?? 140,
        height: values.height ?? 80,
        rotation: values.rotation ?? 0,
        z_index: values.z_index ?? 1,
        normal_color: values.normal_color ?? '#22d3ee',
        warning_color: values.warning_color ?? '#f59e0b',
        critical_color: values.critical_color ?? '#ef4444',
        warning_threshold: values.warning_threshold ?? null,
        critical_threshold: values.critical_threshold ?? null,
        module_dependency: values.module_dependency ?? null,
        created_at: values.created_at ?? now,
        updated_at: now,
    };
}

function makeRetortTemplate(controllerId: number): ScadaMapping[] {
    let id = -1000;
    const add = (values: Partial<ScadaMapping>) => makeMapping(controllerId, id--, values);

    return [
        add({ element_id: 'title', element_type: 'label', label: 'MESIN RETORT (STERILISASI)', data_source: 'process_phase', position_x: 60, position_y: 20, width: 900, height: 48, z_index: 10 }),
        add({ element_id: 'mode', element_type: 'display', label: 'MODE', data_source: 'auto_manual', position_x: 420, position_y: 78, width: 180, height: 60, normal_color: '#34d399' }),
        add({ element_id: 'controller_run', element_type: 'indicator', label: 'RUN', data_source: 'controller_running', position_x: 45, position_y: 82, width: 100, height: 58, normal_color: '#22c55e' }),
        add({ element_id: 'alarm', element_type: 'indicator', label: 'ALARM', data_source: 'alarm_active', position_x: 610, position_y: 90, width: 150, height: 76, normal_color: '#ef4444' }),

        add({ element_id: 'boiler_title', element_type: 'label', label: 'BOILER', data_source: 'process_phase', position_x: 25, position_y: 160, width: 250, height: 40 }),
        add({ element_id: 'boiler_vessel', element_type: 'tank', label: 'WATER LEVEL', data_source: 'water_level', position_x: 40, position_y: 210, width: 190, height: 255, normal_color: '#38bdf8' }),
        add({ element_id: 'gas_status', element_type: 'indicator', label: 'GAS', data_source: 'gas_ready', position_x: 45, position_y: 610, width: 110, height: 58, normal_color: '#fb923c' }),
        add({ element_id: 'pilot_status', element_type: 'indicator', label: 'PEMATIK', data_source: 'pilot_flame', position_x: 170, position_y: 610, width: 120, height: 58, normal_color: '#fb923c' }),

        add({ element_id: 'steam_pipe', element_type: 'pipe', label: 'STEAM', data_source: 'steam_valve', position_x: 260, position_y: 330, width: 430, height: 30, normal_color: '#38bdf8' }),
        add({ element_id: 'steam_valve', element_type: 'valve', label: 'STEAM VALVE', data_source: 'steam_valve', position_x: 455, position_y: 215, width: 82, height: 98, normal_color: '#22c55e' }),
        add({ element_id: 'steam_unmapped', element_type: 'label', label: 'STEAM I/O BELUM DIPETAKAN', data_source: 'steam_valve', position_x: 355, position_y: 405, width: 330, height: 42 }),

        add({ element_id: 'retort_title', element_type: 'label', label: 'RETORT', data_source: 'process_phase', position_x: 705, position_y: 185, width: 285, height: 42 }),
        add({ element_id: 'retort_vessel', element_type: 'tank', label: 'TEMP AKTUAL', data_source: 'pv', position_x: 725, position_y: 245, width: 190, height: 255, normal_color: '#22d3ee', warning_threshold: 121, critical_threshold: 130 }),
        add({ element_id: 'actual_temp', element_type: 'display', label: 'TEMP AKTUAL', data_source: 'pv', position_x: 690, position_y: 590, width: 220, height: 155, normal_color: '#38bdf8', warning_threshold: 121, critical_threshold: 130 }),
        add({ element_id: 'current_step', element_type: 'display', label: 'CURRENT STEP', data_source: 'step_current', position_x: 300, position_y: 720, width: 170, height: 66 }),
        add({ element_id: 'remaining_time', element_type: 'display', label: 'REMAINING', data_source: 'rest_time', position_x: 500, position_y: 720, width: 170, height: 66, normal_color: '#a78bfa' }),
        add({ element_id: 'door_lock', element_type: 'indicator', label: 'DOOR LOCK', data_source: 'door_lock', position_x: 790, position_y: 90, width: 150, height: 76, normal_color: '#22c55e' }),

        add({ element_id: 'cooling_pipe', element_type: 'pipe', label: 'COOLING OUT', data_source: 'cooling_mv', position_x: 310, position_y: 495, width: 360, height: 30, normal_color: '#38bdf8' }),
        add({ element_id: 'cooling_pump', element_type: 'pump', label: 'COOLING', data_source: 'cooling_mv', position_x: 450, position_y: 610, width: 92, height: 105, normal_color: '#38bdf8' }),
        add({ element_id: 'drain_valve', element_type: 'valve', label: 'DRAIN', data_source: 'drain_open', position_x: 925, position_y: 265, width: 82, height: 98, normal_color: '#38bdf8' }),
        add({ element_id: 'drain_pipe', element_type: 'pipe', label: 'DRAIN FLOW', data_source: 'drain_open', position_x: 940, position_y: 380, width: 150, height: 30, rotation: 90, normal_color: '#38bdf8' }),
    ];
}

export default function ScadaEditor({ controller, canvas: initialCanvas, mappings: initialMappings }: Props) {
    const [mappings, setMappings] = useState<ScadaMapping[]>(initialMappings);
    const [canvas, setCanvas] = useState<ScadaCanvasType | null>(initialCanvas);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const nextId = useRef(-Date.now());

    const selectedMapping = useMemo(
        () => mappings.find((mapping) => mapping.id === selectedId) ?? null,
        [mappings, selectedId],
    );
    const selectedDataSources = useMemo(() => {
        if (!selectedMapping || DATA_SOURCES.some((source) => source.value === selectedMapping.data_source)) return DATA_SOURCES;
        return [...DATA_SOURCES, { value: selectedMapping.data_source, label: `${selectedMapping.data_source} — custom` }];
    }, [selectedMapping]);

    const updateMapping = useCallback((id: number, updates: Partial<ScadaMapping>) => {
        setMappings((previous) => previous.map((mapping) => mapping.id === id ? { ...mapping, ...updates } : mapping));
    }, []);

    const deleteMapping = useCallback((id: number) => {
        setMappings((previous) => previous.filter((mapping) => mapping.id !== id));
        setSelectedId((current) => current === id ? null : current);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('elementType') as ScadaElementType;
        const preset = ELEMENT_TYPES.find((item) => item.type === type);
        const viewport = event.currentTarget;
        if (!preset || !viewport) return;

        const rect = viewport.getBoundingClientRect();
        const snap = canvas?.snap_to_grid ? canvas.grid_size || 20 : 1;
        const x = Math.max(0, Math.round((event.clientX - rect.left + viewport.scrollLeft) / snap) * snap);
        const y = Math.max(0, Math.round((event.clientY - rect.top + viewport.scrollTop) / snap) * snap);
        const source = type === 'label' ? 'process_phase' : ['valve', 'pump', 'pipe', 'indicator'].includes(type) ? 'controller_running' : 'pv';
        const defaultWidth = type === 'display' ? 260 : preset.defaultW;
        const defaultHeight = type === 'display' ? 220 : preset.defaultH;
        const mapping = makeMapping(controller.id, nextId.current--, {
            element_id: `${type}_${mappings.length + 1}`,
            element_type: type,
            label: preset.label,
            data_source: source,
            position_x: x,
            position_y: y,
            width: defaultWidth,
            height: defaultHeight,
            z_index: mappings.length + 1,
        });
        setMappings((previous) => [...previous, mapping]);
        setSelectedId(mapping.id);
    }, [canvas?.grid_size, canvas?.snap_to_grid, controller.id, mappings.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (!selectedId || target?.matches('input, select, textarea')) return;
            if (event.key === 'Delete' || event.key === 'Backspace') deleteMapping(selectedId);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteMapping, selectedId]);

    const handleApplyTemplate = () => {
        if (mappings.length > 0 && !window.confirm('Ganti semua elemen pada canvas dengan Template Retort?')) return;
        setCanvas((previous) => ({
            id: previous?.id ?? 0,
            tn_controller_id: controller.id,
            background_image_url: previous?.background_image_url ?? null,
            width: 1120,
            height: 860,
            grid_enabled: previous?.grid_enabled ?? true,
            grid_size: previous?.grid_size ?? 20,
            snap_to_grid: previous?.snap_to_grid ?? true,
        }));
        const template = makeRetortTemplate(controller.id);
        setMappings(template);
        setSelectedId(template[0]?.id ?? null);
    };

    const handleSave = useCallback(() => {
        if (!canvas || isSaving) return;
        setIsSaving(true);
        const serverMappings = mappings.map((mapping) => ({
            ...mapping,
            id: mapping.id > 0 ? mapping.id : undefined,
        }));

        const saveMappings = () => router.post(route('tn.scada.mappings', controller.id), {
            mappings: serverMappings,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['mappings', 'canvas'] }),
            onFinish: () => setIsSaving(false),
        });

        router.post(route('tn.scada.canvas', controller.id), {
            background_image_url: canvas.background_image_url,
            width: canvas.width,
            height: canvas.height,
            grid_enabled: canvas.grid_enabled,
            grid_size: canvas.grid_size,
            snap_to_grid: canvas.snap_to_grid,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: saveMappings,
            onError: () => setIsSaving(false),
        });
    }, [canvas, controller.id, isSaving, mappings]);

    const handleBackgroundUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('background', file);
        router.post(route('tn.scada.upload-bg', controller.id), formData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['canvas'] }),
        });
    }, [controller.id]);

return (
        <AuthenticatedLayout header={
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">SCADA Engineering Editor</h1>
                    <p className="mt-1 text-sm text-slate-500">{controller.name} &bull; {controller.model_type} &bull; Preview data bersifat contoh</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleApplyTemplate} className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 hover:bg-cyan-100">Template Retort</button>
                    <button type="button" onClick={handleSave} disabled={!canvas || isSaving} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
                    <Link href={route('tn.monitor', controller.id)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Selesai</Link>
                </div>
            </div>
        }>
            <Head title={`SCADA Editor - ${controller.name}`} />
            <div className="h-[calc(100vh-104px)] min-h-[600px] bg-slate-100">
                <div
                    className="grid h-full gap-3 p-3"
                    style={{ gridTemplateColumns: selectedMapping ? '210px minmax(0, 1fr) 300px' : '210px minmax(0, 1fr)' }}
                >
                    <aside className="h-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-lg flex flex-col">
                        <div className="space-y-1.5 flex-1 overflow-y-auto">
                            <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Elemen</h2>
                            {ELEMENT_TYPES.map((element) => (
                                <div key={element.type} draggable onDragStart={(event) => event.dataTransfer.setData('elementType', element.type)} className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-sm hover:border-cyan-500 hover:bg-slate-800 active:cursor-grabbing">
                                    <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-950 font-bold text-cyan-300">{element.icon}</span>
                                    <span className="font-semibold text-slate-200">{element.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3 mt-3 space-y-3 text-xs text-slate-300">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Canvas</h2>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={canvas?.grid_enabled ?? true} onChange={(event) => setCanvas((previous) => previous ? { ...previous, grid_enabled: event.target.checked } : previous)} className="rounded border-slate-500 bg-slate-800" /> Tampilkan grid</label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={canvas?.snap_to_grid ?? true} onChange={(event) => setCanvas((previous) => previous ? { ...previous, snap_to_grid: event.target.checked } : previous)} className="rounded border-slate-500 bg-slate-800" /> Snap ke grid</label>
                            <NumberField label="Grid size" value={canvas?.grid_size ?? 20} min={5} max={100} onChange={(value) => setCanvas((previous) => previous ? { ...previous, grid_size: value } : previous)} dark />
                            <NumberField label="Lebar" value={canvas?.width ?? 1200} min={400} max={4000} onChange={(value) => setCanvas((previous) => previous ? { ...previous, width: value } : previous)} dark />
                            <NumberField label="Tinggi" value={canvas?.height ?? 800} min={300} max={4000} onChange={(value) => setCanvas((previous) => previous ? { ...previous, height: value } : previous)} dark />
                            <div>
                                <label className="mb-1 block text-slate-400">Background</label>
                                <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="w-full text-[10px] text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-slate-200" />
                                {canvas?.background_image_url ? <button type="button" onClick={() => setCanvas((previous) => previous ? { ...previous, background_image_url: null } : previous)} className="mt-2 text-red-300 hover:text-red-200">Hapus background</button> : null}
                            </div>
                        </div>
                    </aside>

                    <main className="h-full flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2 text-xs flex-shrink-0">
                            <span className="font-bold uppercase tracking-wider text-slate-300">Preview Engineering</span>
                            <span className="text-amber-300">Nilai preview bukan data mesin live</span>
                        </div>
                        <div className="relative flex-1 overflow-auto min-h-0" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
                            <ScadaCanvas
                                mappings={mappings}
                                canvas={canvas}
                                sensorData={PREVIEW_SENSOR_DATA}
                                selectedId={selectedId}
                                onSelectElement={setSelectedId}
                                onDeleteElement={deleteMapping}
                                onUpdateMapping={updateMapping}
                                readonly={false}
                                className="min-h-0"
                            />
                        </div>
                    </main>

                {selectedMapping && (
                    <aside className="h-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                    <div><h2 className="font-bold text-slate-900">Properti Elemen</h2><p className="text-xs uppercase text-slate-400">{selectedMapping.element_type}</p></div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setSelectedId(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700">Tutup</button>
                                        <button type="button" onClick={() => deleteMapping(selectedMapping.id)} className="text-xs font-bold text-red-600 hover:text-red-700">Hapus</button>
                                    </div>
                                </div>
                                <TextField label="Element ID" value={selectedMapping.element_id} onChange={(value) => updateMapping(selectedMapping.id, { element_id: value })} />
                                <TextField label="Label" value={selectedMapping.label ?? ''} onChange={(value) => updateMapping(selectedMapping.id, { label: value || null })} />
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500">Data Source</label>
                                    <select value={selectedMapping.data_source} disabled={selectedMapping.element_type === 'display'} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="w-full rounded-lg border-slate-300 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
                                        {selectedDataSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
                                    </select>
                                    <input type="text" value={selectedMapping.data_source} disabled={selectedMapping.element_type === 'display'} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="mt-2 w-full rounded-lg border-slate-300 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" aria-label="Custom data source" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberField label="X" value={selectedMapping.position_x} onChange={(value) => updateMapping(selectedMapping.id, { position_x: value })} />
                                    <NumberField label="Y" value={selectedMapping.position_y} onChange={(value) => updateMapping(selectedMapping.id, { position_y: value })} />
                                    <NumberField label="Lebar" value={selectedMapping.width} min={20} onChange={(value) => updateMapping(selectedMapping.id, { width: value })} />
                                    <NumberField label="Tinggi" value={selectedMapping.height} min={20} onChange={(value) => updateMapping(selectedMapping.id, { height: value })} />
                                    <NumberField label="Rotasi" value={selectedMapping.rotation} min={0} max={360} onChange={(value) => updateMapping(selectedMapping.id, { rotation: value })} />
                                    <NumberField label="Z-index" value={selectedMapping.z_index} min={-100} max={100} onChange={(value) => updateMapping(selectedMapping.id, { z_index: value })} />
                                </div>
                                {!['display', 'indicator', 'valve', 'label', 'pump'].includes(selectedMapping.element_type) ? (
                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Threshold</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <NullableNumberField label="Warning &ge;" value={selectedMapping.warning_threshold} onChange={(value) => updateMapping(selectedMapping.id, { warning_threshold: value })} />
                                            <NullableNumberField label="Critical &ge;" value={selectedMapping.critical_threshold} onChange={(value) => updateMapping(selectedMapping.id, { critical_threshold: value })} />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                    </aside>
                )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label className="block text-xs font-semibold text-slate-500">{label}<input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>;
}

function NumberField({ label, value, onChange, min, max, dark = false }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; dark?: boolean }) {
    return <label className={`block text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}<input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value) || 0)} className={`mt-1 w-full rounded-lg text-sm ${dark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'}`} /></label>;
}

function NullableNumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
    return <label className="block text-xs font-semibold text-slate-500">{label}<input type="number" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} className="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>;
}
