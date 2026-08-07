import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, ScadaCanvas as ScadaCanvasType, ScadaElementType, ScadaMapping } from '@/types';
import ScadaCanvas from '@/Components/ScadaCanvas';
import { ReactNode } from 'react';
import {
    Gauge,
    Monitor,
    GitMerge,
    Cog,
    Square,
    Minus,
    Type,
    CircleDot,
} from 'lucide-react';

interface Props extends PageProps {
    controller: any;
    canvas: ScadaCanvasType | null;
    mappings: ScadaMapping[];
}

const ELEMENT_TYPES: Array<{ type: ScadaElementType; label: string; icon: ReactNode; defaultW: number; defaultH: number }> = [
    { type: 'gauge', label: 'Gauge', icon: <Gauge size={18} />, defaultW: 140, defaultH: 160 },
    { type: 'display', label: 'Display', icon: <Monitor size={18} />, defaultW: 140, defaultH: 80 },
    { type: 'valve', label: 'Valve', icon: <GitMerge size={18} />, defaultW: 90, defaultH: 110 },
    { type: 'pump', label: 'Pump', icon: <Cog size={18} />, defaultW: 90, defaultH: 110 },
    { type: 'tank', label: 'Vessel / Tank', icon: <Square size={18} />, defaultW: 180, defaultH: 260 },
    { type: 'pipe', label: 'Pipe', icon: <Minus size={18} />, defaultW: 180, defaultH: 30 },
    { type: 'label', label: 'Label', icon: <Type size={18} />, defaultW: 180, defaultH: 44 },
    { type: 'indicator', label: 'Indicator', icon: <CircleDot size={18} />, defaultW: 100, defaultH: 64 },
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
        [mappings, selectedId]
    );

    const selectedDataSources = useMemo(() => {
        if (!selectedMapping) return DATA_SOURCES;
        const currentSource = selectedMapping.data_source;
        if (DATA_SOURCES.some((item) => item.value === currentSource)) return DATA_SOURCES;
        return [{ value: currentSource, label: `${currentSource} (kustom)` }, ...DATA_SOURCES];
    }, [selectedMapping]);

    useEffect(() => {
        if (initialCanvas) return;

        setCanvas({
            id: -1,
            tn_controller_id: controller.id,
            width: 1200,
            height: 800,
            grid_size: 20,
            snap_to_grid: true,
            grid_enabled: true,
            background_image_url: null,
        });
    }, [controller.id, initialCanvas]);

    useEffect(() => {
        if (initialMappings.length > 0) return;
        setMappings(makeRetortTemplate(controller.id));
    }, [controller.id, initialMappings.length]);

    const handleApplyTemplate = useCallback(() => {
        if (mappings.length > 0 && !confirm('Semua elemen canvas saat ini akan diganti dengan Template Retort Standar. Lanjutkan?')) {
            return;
        }
        setMappings(makeRetortTemplate(controller.id));
        setSelectedId(null);
    }, [controller.id, mappings.length]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const elementType = event.dataTransfer.getData('elementType') as ScadaElementType;
        if (!elementType) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const targetX = event.clientX - bounds.left;
        const targetY = event.clientY - bounds.top;

        const grid = canvas?.grid_size ?? 20;
        const snap = canvas?.snap_to_grid ?? true;
        const position_x = snap ? Math.round(targetX / grid) * grid : Math.round(targetX);
        const position_y = snap ? Math.round(targetY / grid) * grid : Math.round(targetY);

        const config = ELEMENT_TYPES.find((item) => item.type === elementType);
        const newId = nextId.current--;
        const newMapping = makeMapping(controller.id, newId, {
            element_id: `${elementType}_${Math.abs(newId)}`,
            element_type: elementType,
            label: config?.label ?? elementType,
            data_source: 'pv',
            position_x,
            position_y,
            width: config?.defaultW ?? 140,
            height: config?.defaultH ?? 80,
        });

        setMappings((previous) => [...previous, newMapping]);
        setSelectedId(newId);
    }, [canvas?.grid_size, canvas?.snap_to_grid, controller.id]);

    const updateMapping = useCallback((id: number, values: Partial<ScadaMapping>) => {
        setMappings((previous) => previous.map((item) => (item.id === id ? { ...item, ...values } : item)));
    }, []);

    const deleteMapping = useCallback((id: number) => {
        setMappings((previous) => previous.filter((item) => item.id !== id));
        if (selectedId === id) setSelectedId(null);
    }, [selectedId]);

    const handleSave = useCallback(() => {
        if (!canvas) return;
        setIsSaving(true);
        router.post(route('tn.scada.save', controller.id), {
            canvas: canvas as any,
            mappings: mappings.map((m) => ({ ...m, id: m.id < 0 ? null : m.id })) as any,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsSaving(false),
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto py-1">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">SCADA Engineering Editor</h1>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">
                        {controller.name} &bull; <span className="font-mono text-blue-700 font-bold">{controller.model_type}</span> &bull; Preview data bersifat contoh
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button type="button" onClick={handleApplyTemplate} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-800 hover:bg-blue-100 shadow-sm transition-all">
                        Template Retort
                    </button>
                    <button type="button" onClick={handleSave} disabled={!canvas || isSaving} className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-5 py-2 text-xs font-black shadow-md border-none transition-all disabled:opacity-50">
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <Link href={route('tn.monitor', controller.id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-800 hover:bg-slate-50 shadow-sm transition-all">
                        Selesai
                    </Link>
                </div>
            </div>
        }>
            <Head title={`SCADA Editor - ${controller.name}`} />
            <div className="h-[calc(100vh-104px)] min-h-[600px] bg-[#f0f4f9] p-4">
                <div
                    className="grid h-full gap-4 max-w-[1700px] mx-auto"
                    style={{ gridTemplateColumns: selectedMapping ? '230px minmax(0, 1fr) 300px' : '230px minmax(0, 1fr)' }}
                >
                    {/* Left Sidebar */}
                    <aside className="h-full overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-4 text-slate-800 shadow-lg backdrop-blur-xl flex flex-col">
                        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50/80 px-3 py-2 rounded-xl">Elemen</h2>
                            {ELEMENT_TYPES.map((element) => (
                                <div key={element.type} draggable onDragStart={(event) => event.dataTransfer.setData('elementType', element.type)} className="flex cursor-grab items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-xs font-extrabold text-slate-800 hover:border-blue-300 hover:bg-blue-50/50 transition-all active:cursor-grabbing shadow-sm">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0 font-bold">{element.icon}</span>
                                    <span>{element.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-200 pt-4 mt-3 space-y-3 text-xs font-semibold text-slate-700">
                            <h2 className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50/80 px-3 py-2 rounded-xl">Canvas</h2>
                            <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={canvas?.grid_enabled ?? true} onChange={(event) => setCanvas((previous) => previous ? { ...previous, grid_enabled: event.target.checked } : previous)} className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600" /> Tampilkan grid</label>
                            <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={canvas?.snap_to_grid ?? true} onChange={(event) => setCanvas((previous) => previous ? { ...previous, snap_to_grid: event.target.checked } : previous)} className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600" /> Snap ke grid</label>
                            <NumberField label="Grid size" value={canvas?.grid_size ?? 20} min={5} max={100} onChange={(value) => setCanvas((previous) => previous ? { ...previous, grid_size: value } : previous)} />
                            <NumberField label="Lebar" value={canvas?.width ?? 1200} min={400} max={4000} onChange={(value) => setCanvas((previous) => previous ? { ...previous, width: value } : previous)} />
                            <NumberField label="Tinggi" value={canvas?.height ?? 800} min={300} max={4000} onChange={(value) => setCanvas((previous) => previous ? { ...previous, height: value } : previous)} />
                            <div>
                                <label className="mb-1 block text-xs font-extrabold uppercase text-slate-600">Background</label>
                                <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="w-full text-[10px] text-slate-500 file:mr-2 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-800" />
                                {canvas?.background_image_url ? <button type="button" onClick={() => setCanvas((previous) => previous ? { ...previous, background_image_url: null } : previous)} className="mt-2 text-rose-600 font-extrabold text-xs hover:text-rose-800">Hapus background</button> : null}
                            </div>
                        </div>
                    </aside>

                    {/* Canvas Main Area */}
                    <main className="h-full flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-5 py-3 text-xs flex-shrink-0 text-white">
                            <span className="font-black uppercase tracking-wider text-blue-300">Preview Engineering Canvas</span>
                            <span className="text-amber-400 font-bold bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">Nilai preview bukan data mesin live</span>
                        </div>
                        <div className="relative flex-1 overflow-auto min-h-0" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
                            <ScadaCanvas
                                mappings={mappings}
                                canvas={canvas}
                                sensorData={PREVIEW_SENSOR_DATA}
                                controllerModel={controller.model_type}
                                selectedId={selectedId}
                                onSelectElement={setSelectedId}
                                onDeleteElement={deleteMapping}
                                onUpdateMapping={updateMapping}
                                readonly={false}
                                className="min-h-0"
                            />
                        </div>
                    </main>

                    {/* Right Property Sidebar */}
                    {selectedMapping && (
                        <aside className="h-full overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg backdrop-blur-xl">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                    <div>
                                        <h2 className="font-black text-slate-900 text-base">Properti Elemen</h2>
                                        <p className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mt-0.5">{selectedMapping.element_type}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setSelectedId(null)} className="text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors">Tutup</button>
                                        <button type="button" onClick={() => deleteMapping(selectedMapping.id)} className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors">Hapus</button>
                                    </div>
                                </div>
                                <TextField label="Element ID" value={selectedMapping.element_id} onChange={(value) => updateMapping(selectedMapping.id, { element_id: value })} />
                                <TextField label="Label" value={selectedMapping.label ?? ''} onChange={(value) => updateMapping(selectedMapping.id, { label: value || null })} />
                                <div>
                                    <label className="mb-1 block text-xs font-extrabold text-slate-700 uppercase">Data Source</label>
                                    <select value={selectedMapping.data_source} disabled={selectedMapping.element_type === 'display'} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="w-full rounded-xl border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 shadow-sm">
                                        {selectedDataSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
                                    </select>
                                    <input type="text" value={selectedMapping.data_source} disabled={selectedMapping.element_type === 'display'} onChange={(event) => updateMapping(selectedMapping.id, { data_source: event.target.value })} className="mt-2 w-full rounded-xl border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-blue-600 py-1.5 px-3 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 shadow-sm" aria-label="Custom data source" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <NumberField label="X" value={selectedMapping.position_x} onChange={(value) => updateMapping(selectedMapping.id, { position_x: value })} />
                                    <NumberField label="Y" value={selectedMapping.position_y} onChange={(value) => updateMapping(selectedMapping.id, { position_y: value })} />
                                    <NumberField label="Lebar" value={selectedMapping.width} min={20} onChange={(value) => updateMapping(selectedMapping.id, { width: value })} />
                                    <NumberField label="Tinggi" value={selectedMapping.height} min={20} onChange={(value) => updateMapping(selectedMapping.id, { height: value })} />
                                    <NumberField label="Rotasi" value={selectedMapping.rotation} min={0} max={360} onChange={(value) => updateMapping(selectedMapping.id, { rotation: value })} />
                                    <NumberField label="Z-index" value={selectedMapping.z_index} min={-100} max={100} onChange={(value) => updateMapping(selectedMapping.id, { z_index: value })} />
                                </div>
                                {!['display', 'indicator', 'valve', 'label', 'pump'].includes(selectedMapping.element_type) ? (
                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-700">Threshold</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <NullableNumberField label="Warning ≥" value={selectedMapping.warning_threshold} onChange={(value) => updateMapping(selectedMapping.id, { warning_threshold: value })} />
                                            <NullableNumberField label="Critical ≥" value={selectedMapping.critical_threshold} onChange={(value) => updateMapping(selectedMapping.id, { critical_threshold: value })} />
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
    return <label className="block text-xs font-extrabold text-slate-700 uppercase">{label}<input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 shadow-sm" /></label>;
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
    return <label className="block text-xs font-extrabold text-slate-700 uppercase">{label}<input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value) || 0)} className="mt-1.5 w-full rounded-xl border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 shadow-sm" /></label>;
}

function NullableNumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
    return <label className="block text-xs font-extrabold text-slate-700 uppercase">{label}<input type="number" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} className="mt-1.5 w-full rounded-xl border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 shadow-sm" /></label>;
}
