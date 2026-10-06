import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ScadaCanvas, ScadaMapping, SensorData } from '@/types';
import { RetortEvent, RetortTelemetry, formatControllerTime } from '@/Pages/Tn/retortTelemetry';
import TnNormalMonitor from './TnNormalMonitor';
import ScadaCanvasView from '@/Components/ScadaCanvas';
import RetortIndustrialHmi from './RetortIndustrialHmi';
import { RefreshCw, Wrench, CheckCircle2, AlertCircle, Cable, X } from 'lucide-react';

interface Props {
    controller: any;
    telemetry: RetortTelemetry;
    events: RetortEvent[];
    history: any[];
    mappings: ScadaMapping[];
    canvas?: ScadaCanvas | null;
    sensorData?: SensorData;
    isOnline: boolean;
    serialPort?: string;
    commandPending: 'run' | 'stop' | 'reset' | null;
    lastUpdate: string;
    activeTab: 'monitor' | 'scada';
    onTabChange: (tab: 'monitor' | 'scada') => void;
    onRun: () => void;
    onStop: () => void;
    onResetAlarm: () => void;
    isScanningPort?: boolean;
    scanStatus?: {
        loading: boolean;
        success?: boolean;
        message?: string;
        available_ports?: string[];
    } | null;
    onScanPort?: () => void;
    onOpenPortModal?: () => void;
    onCloseScanStatus?: () => void;
    isWebSerialConnected?: boolean;
    webSerialPortLabel?: string | null;
    onDisconnectWebSerial?: () => void;
}

export default function RetortMonitorShell(props: Props) {
    const { controller, telemetry, isOnline, serialPort, isWebSerialConnected, webSerialPortLabel } = props;
    const rawControllerName = controller.name || `Controller #${controller.id}`;
    const controllerName = rawControllerName.replace(/Retort TNS/gi, 'Retort TN').replace(/TNS Controller/gi, 'TN Controller');
    const rawMachineName = controller.machine?.machine_name;
    const machineName = rawMachineName ? rawMachineName.replace(/Retort TNS/gi, 'Retort TN') : null;
    const displayName = (machineName?.toLowerCase().includes('retort') || controllerName?.toLowerCase().includes('tn'))
        ? 'Retort TN Controller'
        : (machineName ? `${machineName} (${controllerName})` : controllerName);
    const activePortDisplay = isWebSerialConnected
        ? (webSerialPortLabel || 'USB Laptop (Web Serial)')
        : (serialPort || controller.serial_port || 'AUTO');

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto py-1">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">{displayName}</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border ${
                            isOnline
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>Tipe: <strong className="font-mono text-blue-700">{controller.model_type}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                            <Cable size={13} className="text-slate-400" />
                            <span>Port USB:</span>
                            <strong className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{activePortDisplay}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Update: <strong className="text-slate-700">{props.lastUpdate}</strong></span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Tombol Scan Port USB / Disconnect */}
                    {isWebSerialConnected ? (
                        <button
                            type="button"
                            onClick={props.onDisconnectWebSerial}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer"
                            title="Putuskan koneksi serial USB di laptop"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
                            <span>Putuskan USB Laptop</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={props.isScanningPort}
                            onClick={props.onScanPort}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            title="Scan port serial USB di laptop ini (membuka popup pemilihan port browser Chrome/Edge)"
                        >
                            <RefreshCw size={14} className={props.isScanningPort ? 'animate-spin' : ''} />
                            <span>{props.isScanningPort ? 'Memilih Port USB...' : 'Scan Port USB (Laptop)'}</span>
                        </button>
                    )}

                    {/* Tombol Pengaturan Port Modal */}
                    {props.onOpenPortModal && (
                        <button
                            type="button"
                            onClick={props.onOpenPortModal}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all cursor-pointer"
                            title="Buka Pengaturan Port"
                        >
                            <Cable size={15} className="text-blue-600" />
                            <span>Pengaturan Port</span>
                        </button>
                    )}
                </div>
            </div>
        }>
            <Head title={`Monitor Retort - ${displayName}`} />
            <div className="py-8">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Banner Notifikasi Scan Port */}
                    {props.scanStatus && (
                        <div className={`rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                            props.scanStatus.loading
                                ? 'bg-blue-50/90 border-blue-200 text-blue-900 animate-pulse'
                                : props.scanStatus.success
                                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                    : 'bg-amber-50/90 border-amber-200 text-amber-900'
                        }`}>
                            <div className="flex items-center gap-3">
                                {props.scanStatus.loading ? (
                                    <RefreshCw size={20} className="animate-spin text-blue-600 shrink-0" />
                                ) : props.scanStatus.success ? (
                                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                                )}
                                <div className="text-xs">
                                    <span className="font-extrabold block text-sm">
                                        {props.scanStatus.loading
                                            ? 'Memindai Port Serial USB VPS...'
                                            : props.scanStatus.success
                                                ? 'Port Berhasil Ditemukan & Terhubung!'
                                                : 'Pemberitahuan Deteksi Port'}
                                    </span>
                                    <span className="mt-0.5 block font-medium">{props.scanStatus.message}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {!props.scanStatus.success && !props.scanStatus.loading && props.onOpenPortModal && (
                                    <button
                                        type="button"
                                        onClick={props.onOpenPortModal}
                                        className="rounded-xl bg-amber-600 text-white px-3 py-1.5 text-xs font-black hover:bg-amber-700 shadow-sm transition-all"
                                    >
                                        Pilih Port Manual
                                    </button>
                                )}
                                {props.onCloseScanStatus && !props.scanStatus.loading && (
                                    <button
                                        type="button"
                                        onClick={props.onCloseScanStatus}
                                        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                        title="Tutup Notifikasi"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs Bar with Integrated Scan Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => props.onTabChange('monitor')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-sm ${
                                    props.activeTab === 'monitor'
                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md border-none'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-800'
                                }`}
                            >
                                Monitoring Dashboard
                            </button>
                            <button
                                type="button"
                                onClick={() => props.onTabChange('scada')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-sm flex items-center gap-2 ${
                                    props.activeTab === 'scada'
                                        ? 'bg-blue-700 text-white shadow-md border-none'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-800'
                                }`}
                            >
                                <span>SCADA View</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={props.onOpenPortModal}
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all"
                                title="Klik untuk membuka daftar port USB yang digunakan di VPS"
                            >
                                <Cable size={14} className="text-blue-600" />
                                <span>Port:</span>
                                <code className="font-mono text-blue-900 font-extrabold">{activePortDisplay}</code>
                            </button>
                            <button
                                type="button"
                                disabled={props.isScanningPort}
                                onClick={props.onScanPort}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Scan port serial USB di VPS"
                            >
                                <RefreshCw size={13} className={props.isScanningPort ? 'animate-spin' : ''} />
                                <span>{props.isScanningPort ? 'Memindai...' : 'Scan Port USB'}</span>
                            </button>
                        </div>
                    </div>

                    {props.activeTab === 'monitor' ? (
                        <TnNormalMonitor
                            controllerId={controller.id}
                            controllerModel={controller.model_type}
                            telemetry={telemetry}
                            history={props.history}
                            isOnline={isOnline}
                            serialPort={activePortDisplay}
                        />
                    ) : (
                        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-[#060b18] shadow-2xl backdrop-blur-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#0b1329] px-6 py-4 text-white">
                                <div>
                                    <h2 className="font-black text-white text-lg tracking-wide">Panel SCADA Mesin Retort & Boiler</h2>
                                    <p className="text-xs font-semibold text-blue-300 mt-0.5">Monitoring kontroler real-time {displayName} ({controller.model_type}).</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black tracking-wider ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                        {isOnline ? 'REALTIME LIVE' : 'OFFLINE'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 bg-[#040816]">
                                <RetortIndustrialHmi
                                    controllerName={displayName}
                                    controllerModel={controller.model_type}
                                    sensorData={props.sensorData}
                                    telemetry={telemetry}
                                    isOnline={isOnline}
                                />
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
