import React, { useMemo } from 'react';
import { RetortTelemetry, formatControllerTime } from '@/Pages/Tn/retortTelemetry';
import TnGauge from './TnGauge';
import TnTrendChart from './TnTrendChart';
import TnFaceplateDisplay from './TnFaceplateDisplay';

interface Props {
    controllerId?: number;
    controllerModel?: string;
    telemetry: RetortTelemetry;
    history: any[];
    isOnline: boolean;
}

const formatValue = (value: number | null, digits = 1) => value === null
    ? undefined
    : value.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function TnNormalMonitor({ controllerModel = 'TNH', telemetry, history, isOnline }: Props) {
    const heatingLogs = useMemo(() => history
        .filter((item) => Number(item.heating_mv ?? 0) > 0)
        .slice(-100)
        .reverse(), [history]);

    return (
        <div className="space-y-6">
            {/* Status Banner (Royal Blue & Yellow Accent) */}
            <div className="rounded-3xl border border-blue-900/40 bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-7 shadow-xl text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-yellow-400">Operation Status</p>
                        <p className="mt-1 text-3xl font-black text-white">
                            {telemetry.pattern !== null ? `PTN.${telemetry.pattern}` : 'NO PATTERN'}
                            <span className="ml-3 text-slate-950 font-black bg-gradient-to-r from-amber-400 to-yellow-500 px-3.5 py-1 rounded-xl text-lg shadow-md">Step {telemetry.step ?? '--'}</span>
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs font-extrabold uppercase text-blue-200">Process Time</p>
                            <p className="font-mono text-2xl font-black text-white">{formatControllerTime(telemetry.processTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-extrabold uppercase text-yellow-400">Rest Time</p>
                            <p className="font-mono text-2xl font-black text-yellow-300">{formatControllerTime(telemetry.remainingTime)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gauges Grid (Fresh White Glass Cards) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-lg backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">Present Value (PV)</h2>
                    <TnGauge value={telemetry.actualTemperature ?? undefined} formattedValue={formatValue(telemetry.actualTemperature)} label="PV" unit="°C" color="#2563eb" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-lg backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">Set Value (SV)</h2>
                    <TnGauge value={telemetry.targetTemperature ?? undefined} formattedValue={formatValue(telemetry.targetTemperature)} label="SV" unit="°C" color="#eab308" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-lg backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">Heat MV</h2>
                    <TnGauge value={telemetry.heatingPercent ?? undefined} formattedValue={formatValue(telemetry.heatingPercent)} label="MV" unit="%" color="#f59e0b" max={100} />
                </div>
            </div>

            {/* Temperature Trend Section */}
            <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-lg backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-extrabold text-slate-900 text-xl">Temperature Trend</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Data 30 menit terakhir dalam engineering unit.</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black border ${
                        isOnline
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isOnline ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
                <div className="h-72 w-full"><TnTrendChart data={isOnline ? history : []} /></div>
            </section>

            {/* Autonics Industrial Digital Faceplate Display (Mirroring Physical TNH-P Screen) */}
            <TnFaceplateDisplay
                telemetry={telemetry}
                modelType={controllerModel}
                isOnline={isOnline}
            />

            {/* Process Logs Table */}
            <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-lg backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-extrabold text-slate-900 text-xl">Process Logs (Active Heating)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Reading ketika heating output lebih dari 0%.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-extrabold text-blue-700">{heatingLogs.length} records</span>
                </div>
                <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 bg-[#0f172a] text-left text-xs font-black uppercase tracking-wider text-white">
                            <tr><th className="px-5 py-3.5">Time</th><th className="px-5 py-3.5">PV (°C)</th><th className="px-5 py-3.5">SV (°C)</th><th className="px-5 py-3.5">Heat MV</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-mono">
                            {heatingLogs.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center font-sans font-bold text-slate-400">Belum ada reading dengan heating aktif.</td></tr>
                            ) : heatingLogs.map((log, index) => (
                                <tr key={`${log.created_at ?? index}-${index}`} className="hover:bg-blue-50/70 transition-colors">
                                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 font-bold">{log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}</td>
                                    <td className="px-5 py-3 font-extrabold text-blue-700">{Number(log.pv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-3 font-extrabold text-amber-700">{Number(log.sv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-3 font-extrabold text-amber-600">{(Number(log.heating_mv) / 10).toLocaleString('id-ID')}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
