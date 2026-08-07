import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ScadaCanvas, ScadaMapping, SensorData } from '@/types';
import { RetortEvent, RetortTelemetry, formatControllerTime } from '@/Pages/Tn/retortTelemetry';
import PortSettings from './PortSettings';
import TnNormalMonitor from './TnNormalMonitor';
import ScadaCanvasView from '@/Components/ScadaCanvas';

interface Props {
    controller: any;
    telemetry: RetortTelemetry;
    events: RetortEvent[];
    history: any[];
    mappings: ScadaMapping[];
    canvas?: ScadaCanvas | null;
    sensorData?: SensorData;
    isOnline: boolean;
    commandPending: 'run' | 'stop' | 'reset' | null;
    lastUpdate: string;
    activeTab: 'monitor' | 'scada';
    onTabChange: (tab: 'monitor' | 'scada') => void;
    onRun: () => void;
    onStop: () => void;
    onResetAlarm: () => void;
}

export default function RetortMonitorShell(props: Props) {
    const { controller, telemetry, isOnline } = props;
    const controllerName = controller.name || `Controller #${controller.id}`;

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">Monitoring Retort</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                            isOnline
                                ? 'bg-amber-500/20 text-yellow-300 border-amber-400/40 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-yellow-400 animate-pulse' : 'bg-rose-500'}`}></span>
                            {isOnline ? 'Realtime Online' : 'Offline'}
                        </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-400">
                        {controller.machine?.machine_name ? `${controller.machine.machine_name} • ` : ''}
                        {controllerName} • <span className="font-mono text-yellow-300 font-bold">{controller.model_type}</span> • Update {props.lastUpdate}
                    </p>
                    <Link href={route('dashboard')} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
                        ← Kembali ke Dashboard
                    </Link>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <PortSettings
                        controllerId={controller.id}
                        currentPort={controller.serial_port}
                        isOnline={isOnline}
                        lastError={controller.last_error}
                    />
                    <Link href={route('tn.config.edit', controller.id)} className="rounded-xl border border-blue-800/60 bg-blue-950/70 px-4 py-2 text-sm font-bold text-slate-200 hover:border-amber-400/40 hover:bg-blue-900/80 hover:text-yellow-300 transition-all backdrop-blur-md shadow-md">
                        Konfigurasi TN
                    </Link>
                </div>
            </div>
        }>
            <Head title={`Monitor Retort - ${controllerName}`} />
            <div className="py-6">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 border-b border-blue-900/60 pb-1">
                        <button
                            type="button"
                            onClick={() => props.onTabChange('monitor')}
                            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                                props.activeTab === 'monitor'
                                    ? 'bg-amber-500/20 text-yellow-300 border border-amber-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                                    : 'text-slate-400 hover:bg-blue-950/60 hover:text-white'
                            }`}
                        >
                            📊 Monitoring Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => props.onTabChange('scada')}
                            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                                props.activeTab === 'scada'
                                    ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                    : 'text-slate-400 hover:bg-blue-950/60 hover:text-white'
                            }`}
                        >
                            🎨 SCADA Canvas POV
                        </button>
                    </div>

                    {props.activeTab === 'monitor' ? (
                        <TnNormalMonitor telemetry={telemetry} history={props.history} isOnline={isOnline} />
                    ) : (
                        <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
                                <div>
                                    <h2 className="font-bold text-white">SCADA POV</h2>
                                    <p className="text-xs text-slate-400">Layout dari SCADA Editor dengan data controller realtime.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                                    <Link href={route('tn.scada.edit', controller.id)} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20">Edit SCADA</Link>
                                </div>
                            </div>
                            <div className="p-3">
                                <ScadaCanvasView
                                    mappings={props.mappings}
                                    canvas={props.canvas}
                                    sensorData={props.sensorData}
                                    controllerModel={controller.model_type}
                                    readonly
                                    className="min-h-[600px]"
                                />
                            </div>
                        </section>
                    )}
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        Status TN: <strong className="text-slate-700">{telemetry.phase}</strong>
                        <span className="mx-2">•</span>
                        Process time: <strong className="text-slate-700">{formatControllerTime(telemetry.processTime)}</strong>
                        <span className="mx-2">•</span>
                        Remaining: <strong className="text-slate-700">{formatControllerTime(telemetry.remainingTime)}</strong>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
