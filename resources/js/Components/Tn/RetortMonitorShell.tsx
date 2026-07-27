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
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900">Monitoring Retort</h1>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isOnline ? 'Realtime' : 'Offline'}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {controller.machine?.machine_name ? `${controller.machine.machine_name} • ` : ''}
                        {controllerName} • {controller.model_type} • Update {props.lastUpdate}
                    </p>
                    <Link href={route('dashboard')} className="mt-2 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-800">← Kembali ke Dashboard</Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <PortSettings
                        controllerId={controller.id}
                        currentPort={controller.serial_port}
                        isOnline={isOnline}
                        lastError={controller.last_error}
                    />
                    <Link href={route('tn.config.edit', controller.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Konfigurasi TN</Link>
                </div>
            </div>
        }>
            <Head title={`Monitor Retort - ${controllerName}`} />
            <div className="py-6">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex border-b border-slate-300">
                        <button
                            type="button"
                            onClick={() => props.onTabChange('monitor')}
                            className={`border-b-2 px-6 py-3 text-sm font-bold transition ${props.activeTab === 'monitor' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Monitoring
                        </button>
                        <button
                            type="button"
                            onClick={() => props.onTabChange('scada')}
                            className={`border-b-2 px-6 py-3 text-sm font-bold transition ${props.activeTab === 'scada' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            SCADA POV
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
