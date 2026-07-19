import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ScadaCanvas, ScadaMapping, SensorData } from '@/types';
import { RetortEvent, RetortTelemetry, formatControllerTime } from '@/Pages/Tn/retortTelemetry';
import RetortProcessOverview from './RetortProcessOverview';
import RetortMonitorPanels from './RetortMonitorPanels';

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
    onRun: () => void;
    onStop: () => void;
    onResetAlarm: () => void;
}

const eventToneClasses = {
    neutral: 'bg-slate-400',
    info: 'bg-sky-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
};

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
                    <Link href={route('historian.index')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">History</Link>
                    <Link href={route('tn.config.edit', controller.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Konfigurasi TN</Link>
                    <Link href={route('tn.scada.edit', controller.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">SCADA Editor</Link>
                </div>
            </div>
        }>
            <Head title={`Monitor Retort - ${controllerName}`} />
            <div className="py-6">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    <RetortProcessOverview
                        telemetry={telemetry}
                        controllerName={controllerName}
                        isOnline={isOnline}
                        commandPending={props.commandPending}
                        onRun={props.onRun}
                        onStop={props.onStop}
                        onResetAlarm={props.onResetAlarm}
                    />
                    <RetortMonitorPanels
                        telemetry={telemetry}
                        events={props.events}
                        history={props.history}
                        mappings={props.mappings}
                        canvas={props.canvas}
                        sensorData={props.sensorData}
                        isOnline={isOnline}
                        eventToneClasses={eventToneClasses}
                    />
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
