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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Monitoring Retort</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider border shadow-sm ${
                            isOnline
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            {isOnline ? 'Realtime Online' : 'Offline'}
                        </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                        {controller.machine?.machine_name ? `${controller.machine.machine_name} • ` : ''}
                        {controllerName} • <span className="font-mono text-blue-700 font-bold">{controller.model_type}</span> • Update {props.lastUpdate}
                    </p>
                    <Link href={route('dashboard')} className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-900 transition-colors">
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
                    <Link href={route('tn.config.edit', controller.id)} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-extrabold text-blue-800 hover:bg-amber-400 hover:text-slate-950 transition-all shadow-sm">
                        Konfigurasi TN
                    </Link>
                </div>
            </div>
        }>
            <Head title={`Monitor Retort - ${controllerName}`} />
            <div className="py-8">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                        <button
                            type="button"
                            onClick={() => props.onTabChange('monitor')}
                            className={`rounded-2xl px-6 py-3 text-sm font-extrabold transition-all shadow-sm ${
                                props.activeTab === 'monitor'
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-800'
                            }`}
                        >
                            Monitoring Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => props.onTabChange('scada')}
                            className={`rounded-2xl px-6 py-3 text-sm font-extrabold transition-all shadow-sm ${
                                props.activeTab === 'scada'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-800'
                            }`}
                        >
                            SCADA Canvas POV
                        </button>
                    </div>

                    {props.activeTab === 'monitor' ? (
                        <TnNormalMonitor telemetry={telemetry} history={props.history} isOnline={isOnline} />
                    ) : (
                        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
                                <div>
                                    <h2 className="font-extrabold text-white text-lg">SCADA POV Editor Canvas</h2>
                                    <p className="text-xs text-blue-200">Layout dari SCADA Editor dengan data controller realtime.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${isOnline ? 'bg-amber-400 text-slate-950' : 'bg-rose-500 text-white'}`}>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                                    <Link href={route('tn.scada.edit', controller.id)} className="rounded-xl border border-yellow-400 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-1.5 text-xs font-black text-slate-950 hover:scale-105 transition-transform shadow-md">Edit SCADA</Link>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-950">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
