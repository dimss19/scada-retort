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

interface Interaction {
    id: number;
    mode: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
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
        add({ element_id: 'title', element_type: 'label', label: 'MESIN RETORT (STERILISASI)', data_source: 'process_phase', position_x: 100, position_y: 24, width: 1000, height: 52, z_index: 10 }),
        add({ element_id: 'mode', element_type: 'display', label: 'MODE', data_source: 'auto_manual', position_x: 500, position_y: 88, width: 200, height: 66, normal_color: '#34d399' }),
        add({ element_id: 'controller_run', element_type: 'indicator', label: 'RUN', data_source: 'controller_running', position_x: 100, position_y: 90, width: 110, height: 64, normal_color: '#22c55e' }),
        add({ element_id: 'alarm', element_type: 'indicator', label: 'ALARM', data_source: 'alarm_active', position_x: 990, position_y: 90, width: 110, height: 64, normal_color: '#ef4444' }),

        add({ element_id: 'boiler_title', element_type: 'label', label: 'BOILER', data_source: 'process_phase', position_x: 80, position_y: 175, width: 270, height: 42 }),
        add({ element_id: 'boiler_vessel', element_type: 'tank', label: 'WATER LEVEL', data_source: 'water_level', position_x: 105, position_y: 225, width: 220, height: 300, normal_color: '#38bdf8' }),
        add({ element_id: 'boiler_pressure', element_type: 'display', label: 'PRESSURE (BAR)', data_source: 'boiler_pressure', position_x: 75, position_y: 545, width: 150, height: 72 }),
        add({ element_id: 'heating_output', element_type: 'display', label: 'TN HEATING OUT', data_source: 'heating_mv', position_x: 235, position_y: 545, width: 150, height: 72, normal_color: '#fb923c' }),
        add({ element_id: 'gas_status', element_type: 'indicator', label: 'GAS', data_source: 'gas_ready', position_x: 80, position_y: 630, width: 120, height: 64, normal_color: '#fb923c' }),
        add({ element_id: 'pilot_status', element_type: 'indicator', label: 'PEMATIK', data_source: 'pilot_flame', position_x: 215, position_y: 630, width: 135, height: 64, normal_color: '#fb923c' }),

        add({ element_id: 'steam_pipe', element_type: 'pipe', label: 'STEAM', data_source: 'steam_valve', position_x: 350, position_y: 330, width: 410, height: 34, normal_color: '#38bdf8' }),
        add({ element_id: 'steam_valve', element_type: 'valve', label: 'STEAM VALVE', data_source: 'steam_valve', position_x: 510, position_y: 230, width: 90, height: 105, normal_color: '#22c55e' }),
        add({ element_id: 'steam_unmapped', element_type: 'label', label: 'STEAM I/O BELUM DIPETAKAN', data_source: 'steam_valve', position_x: 410, position_y: 385, width: 290, height: 42 }),

        add({ element_id: 'retort_title', element_type: 'label', label: 'RETORT', data_source: 'process_phase', position_x: 785, position_y: 175, width: 315, height: 42 }),
        add({ element_id: 'retort_vessel', element_type: 'tank', label: 'TEMP AKTUAL', data_source: 'pv', position_x: 830, position_y: 225, width: 220, height: 300, normal_color: '#22d3ee', warning_threshold: 121, critical_threshold: 130 }),
        add({ element_id: 'actual_temp', element_type: 'display', label: 'TEMP AKTUAL', data_source: 'pv', position_x: 750, position_y: 545, width: 160, height: 72, normal_color: '#38bdf8', warning_threshold: 121, critical_threshold: 130 }),
        add({ element_id: 'target_temp', element_type: 'display', label: 'TARGET TEMP', data_source: 'sv', position_x: 920, position_y: 545, width: 160, height: 72, normal_color: '#34d399' }),
        add({ element_id: 'current_step', element_type: 'display', label: 'CURRENT STEP', data_source: 'step_current', position_x: 750, position_y: 630, width: 160, height: 72 }),
        add({ element_id: 'remaining_time', element_type: 'display', label: 'REMAINING', data_source: 'rest_time', position_x: 920, position_y: 630, width: 160, height: 72, normal_color: '#a78bfa' }),
        add({ element_id: 'door_lock', element_type: 'indicator', label: 'DOOR LOCK', data_source: 'door_lock', position_x: 1085, position_y: 250, width: 110, height: 66, normal_color: '#22c55e' }),

        add({ element_id: 'cooling_pipe', element_type: 'pipe', label: 'COOLING OUT', data_source: 'cooling_mv', position_x: 540, position_y: 505, width: 285, height: 34, normal_color: '#38bdf8' }),
        add({ element_id: 'cooling_pump', element_type: 'pump', label: 'COOLING', data_source: 'cooling_mv', position_x: 535, position_y: 545, width: 100, height: 115, normal_color: '#38bdf8' }),
        add({ element_id: 'cooling_output', element_type: 'display', label: 'COOLING OUT', data_source: 'cooling_mv', position_x: 645, position_y: 565, width: 130, height: 74, normal_color: '#38bdf8' }),
        add({ element_id: 'drain_valve', element_type: 'valve', label: 'DRAIN', data_source: 'drain_open', position_x: 1090, position_y: 470, width: 90, height: 105, normal_color: '#38bdf8' }),
        add({ element_id: 'drain_pipe', element_type: 'pipe', label: 'DRAIN FLOW', data_source: 'drain_open', position_x: 1050, position_y: 585, width: 145, height: 34, rotation: 90, normal_color: '#38bdf8' }),
    ];
}

export default function ScadaEditor({ controller, canvas: initialCanvas, mappings: initialMappings }: Props) {
    const [mappings, setMappings] = useState<ScadaMapping[]>(initialMappings);
    const [canvas, setCanvas] = useState<ScadaCanvasType | null>(initialCanvas);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<Interaction | null>(null);
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
        const viewport = viewportRef.current;
        if (!preset || !viewport) return;

        const rect = viewport.getBoundingClientRect();
        const snap = canvas?.snap_to_grid ? canvas.grid_size || 20 : 1;
        const x = Math.max(0, Math.round((event.clientX - rect.left + viewport.scrollLeft) / snap) * snap);
        const y = Math.max(0, Math.round((event.clientY - rect.top + viewport.scrollTop) / snap) * snap);
        const source = type === 'label' ? 'process_phase' : ['valve', 'pump', 'pipe', 'indicator'].includes(type) ? 'controller_running' : 'pv';
        const mapping = makeMapping(controller.id, nextId.current--, {
            element_id: `${type}_${mappings.length + 1}`,
            element_type: type,
            label: preset.label,
            data_source: source,
            position_x: x,
            position_y: y,
            width: preset.defaultW,
            height: preset.defaultH,
            z_index: mappings.length + 1,
        });
        setMappings((previous) => [...previous, mapping]);
        setSelectedId(mapping.id);
    }, [canvas?.grid_size, canvas?.snap_to_grid, controller.id, mappings.length]);

    const startInteraction = useCallback((event: React.MouseEvent, mapping: ScadaMapping, mode: Interaction['mode']) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedId(mapping.id);
        interactionRef.current = {
            id: mapping.id,
            mode,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: mapping.position_x,
            startY: mapping.position_y,
            startWidth: mapping.width,
            startHeight: mapping.height,
        };
    }, []);

    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            const interaction = interactionRef.current;
            if (!interaction) return;
            const snap = canvas?.snap_to_grid ? canvas.grid_size || 20 : 1;
            const dx = Math.round((event.clientX - interaction.startClientX) / snap) * snap;
            const dy = Math.round((event.clientY - interaction.startClientY) / snap) * snap;

            if (interaction.mode === 'move') {
                updateMapping(interaction.id, {
                    position_x: Math.max(0, interaction.startX + dx),
                    position_y: Math.max(0, interaction.startY + dy),
                });
            } else {
                updateMapping(interaction.id, {
                    width: Math.max(20, interaction.startWidth + dx),
                    height: Math.max(20, interaction.startHeight + dy),
                });
            }
        };
        const handleUp = () => { interactionRef.current = null; };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [canvas?.grid_size, canvas?.snap_to_grid, updateMapping]);

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
            width: 1200,
            height: 740,
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
                    <p className="mt-1 text-sm text-slate-500">{controller.name} • {controller.model_type} • Preview data bersifat contoh</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleApplyTemplate} className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 hover:bg-cyan-100">Template Retort</button>
                    <button type="button" onClick={handleSave} disabled={!canvas || isSaving} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
                    <Link href={route('tn.monitor', controller.id)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Selesai</Link>
                </div>
            </div>
        }>
            <Head title={`SCADA Editor - ${controller.name}`} />
            <div className="grid h-[calc(100vh-10rem)] min-h-[640px] grid-cols-[210px_minmax(0,1fr)_300px] gap-3 bg-slate-100 p-3">
                <aside className="overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-lg">
                    <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Elemen</h2>
                    <div className="space-y-1.5">
                        {ELEMENT_TYPES.map((element) => (
                            <div key={element.type} draggable onDragStart={(event) => event.dataTransfer.setData('elementType', element.type)} className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-sm hover:border-cyan-500 hover:bg-slate-800 active:cursor-grabbing">
                                <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-950 font-bold text-cyan-300">{element.icon}</span>
                                <span className="font-semibold text-slate-200">{element.label}</span>
                            </div>
                        ))}
                    </div>

                    <h2 className="mb-3 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Canvas</h2>
                    <div className="space-y-3 text-xs text-slate-300">
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

                <main className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2 text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-300">Preview Engineering</span>
                        <span className="text-amber-300">Nilai preview bukan data mesin live</span>
                    </div>
                    <div ref={viewportRef} className="relative flex-1 overflow-auto" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()} onMouseDown={(event) => { if (!(event.target as HTMLElement).closest('[data-element-id]')) setSelectedId(null); }}>
                        <div className="relative" style={{ width: canvas?.width ?? 1200, height: canvas?.height ?? 800 }}>
                            <ScadaCanvas mappings={mappings} canvas={canvas} sensorData={PREVIEW_SENSOR_DATA} selectedId={selectedId} readonly={false} className="!min-h-0 !overflow-visible !rounded-none !border-0" />
                            {mappings.map((mapping) => (
                                <div key={mapping.id} data-element-id={mapping.id} onMouseDown={(event) => startInteraction(event, mapping, 'move')} className="absolute cursor-move" style={{ left: mapping.position_x, top: mapping.position_y, width: mapping.width, height: mapping.height, zIndex: mapping.z_index + 1000, transform: mapping.rotation ? `rotate(${mapping.rotation}deg)` : undefined }}>
                                    {selectedId === mapping.id ? (
                                        <>
                                            <button type="button" onMouseDown={(event) => event.stopPropagation()} onClick={() => deleteMapping(mapping.id)} className="absolute -top-7 right-0 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow hover:bg-red-500">Hapus</button>
                                            <span onMouseDown={(event) => startInteraction(event, mapping, 'resize')} className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-full border-2 border-slate-950 bg-cyan-400 shadow" />
                                        </>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                <aside className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                    {selectedMapping ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <div><h2 className="font-bold text-slate-900">Properti Elemen</h2><p className="text-xs uppercase text-slate-400">{selectedMapping.element_type}</p></div>
                                <button type="button" onClick={() => deleteMapping(selectedMapping.id)} className="text-xs font-bold text-red-600 hover:text-red-700">Hapus</button>
                            </div>
                            <TextField label="Element ID" value={selectedMapping.element_id} onChange={(value) => updateMapping(selectedMapping.id, { element_id: value })} />
                            <TextField label="Label" value={selectedMapping.label ?? ''} onChange={(value) => updateMapping(selectedMapping.id, { label: value || null })} />
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500">Data Source</label>
                                <select value={selectedMapping.data_source} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="w-full rounded-lg border-slate-300 text-sm">
                                    {selectedDataSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
                                </select>
                                <input type="text" value={selectedMapping.data_source} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="mt-2 w-full rounded-lg border-slate-300 text-xs" aria-label="Custom data source" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <NumberField label="X" value={selectedMapping.position_x} onChange={(value) => updateMapping(selectedMapping.id, { position_x: value })} />
                                <NumberField label="Y" value={selectedMapping.position_y} onChange={(value) => updateMapping(selectedMapping.id, { position_y: value })} />
                                <NumberField label="Lebar" value={selectedMapping.width} min={20} onChange={(value) => updateMapping(selectedMapping.id, { width: value })} />
                                <NumberField label="Tinggi" value={selectedMapping.height} min={20} onChange={(value) => updateMapping(selectedMapping.id, { height: value })} />
                                <NumberField label="Rotasi" value={selectedMapping.rotation} min={0} max={360} onChange={(value) => updateMapping(selectedMapping.id, { rotation: value })} />
                                <NumberField label="Z-index" value={selectedMapping.z_index} min={-100} max={100} onChange={(value) => updateMapping(selectedMapping.id, { z_index: value })} />
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Warna & Threshold</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['normal_color', 'warning_color', 'critical_color'] as const).map((key) => <label key={key} className="text-[10px] font-semibold capitalize text-slate-500">{key.replace('_color', '')}<input type="color" value={selectedMapping[key]} onChange={(event) => updateMapping(selectedMapping.id, { [key]: event.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded border-0 p-0" /></label>)}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <NullableNumberField label="Warning ≥" value={selectedMapping.warning_threshold} onChange={(value) => updateMapping(selectedMapping.id, { warning_threshold: value })} />
                                    <NullableNumberField label="Critical ≥" value={selectedMapping.critical_threshold} onChange={(value) => updateMapping(selectedMapping.id, { critical_threshold: value })} />
                                </div>
                            </div>
                        </div>
                    ) : <div className="flex h-full min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Pilih elemen pada canvas untuk mengubah propertinya.</div>}
                </aside>
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
