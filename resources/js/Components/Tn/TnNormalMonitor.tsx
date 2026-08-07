import React, { useMemo } from 'react';
import { RetortTelemetry, formatControllerTime } from '@/Pages/Tn/retortTelemetry';
import TnGauge from './TnGauge';
import TnTrendChart from './TnTrendChart';

interface Props {
    telemetry: RetortTelemetry;
    history: any[];
    isOnline: boolean;
}

const formatValue = (value: number | null, digits = 1) => value === null
    ? undefined
    : value.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function TnNormalMonitor({ telemetry, history, isOnline }: Props) {
    const heatingLogs = useMemo(() => history
        .filter((item) => Number(item.heating_mv ?? 0) > 0)
        .slice(-100)
        .reverse(), [history]);

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-r from-[#0d1b3e]/80 via-blue-950/70 to-[#070e24]/90 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">Operation Status</p>
                        <p className="mt-1 text-2xl font-black text-white">
                            {telemetry.pattern !== null ? `PTN.${telemetry.pattern}` : 'NO PATTERN'}
                            <span className="ml-3 text-yellow-300 font-bold bg-amber-500/20 border border-amber-400/40 px-3 py-0.5 rounded-lg text-lg">Step {telemetry.step ?? '--'}</span>
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-300">Process Time</p>
                            <p className="font-mono text-xl font-black text-blue-300">{formatControllerTime(telemetry.processTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-amber-400">Rest Time</p>
                            <p className="font-mono text-xl font-black text-yellow-300">{formatControllerTime(telemetry.remainingTime)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gauges Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/70 p-6 shadow-xl backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-blue-300">Present Value (PV)</h2>
                    <TnGauge value={telemetry.actualTemperature ?? undefined} formattedValue={formatValue(telemetry.actualTemperature)} label="PV" unit="°C" color="#60a5fa" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/70 p-6 shadow-xl backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-yellow-400">Set Value (SV)</h2>
                    <TnGauge value={telemetry.targetTemperature ?? undefined} formattedValue={formatValue(telemetry.targetTemperature)} label="SV" unit="°C" color="#facc15" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/70 p-6 shadow-xl backdrop-blur-xl">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-amber-400">Heat MV</h2>
                    <TnGauge value={telemetry.heatingPercent ?? undefined} formattedValue={formatValue(telemetry.heatingPercent)} label="MV" unit="%" color="#f59e0b" max={100} />
                </div>
            </div>

            {/* Temperature Trend Section */}
            <section className="rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/70 p-6 shadow-xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-white text-lg">Temperature Trend</h2>
                        <p className="text-xs text-slate-300">Data 30 menit terakhir dalam engineering unit.</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                        isOnline
                            ? 'bg-amber-500/20 text-yellow-300 border-amber-400/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-yellow-400 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isOnline ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
                <div className="h-72 w-full"><TnTrendChart data={isOnline ? history : []} /></div>
            </section>

            {/* Process Logs Table */}
            <section className="rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/70 p-6 shadow-xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-white text-lg">Process Logs (Active Heating)</h2>
                        <p className="text-xs text-slate-300">Reading ketika heating output lebih dari 0%.</p>
                    </div>
                    <span className="rounded-full bg-blue-950 border border-blue-800 px-3 py-1 text-xs font-bold text-yellow-300">{heatingLogs.length} records</span>
                </div>
                <div className="max-h-80 overflow-auto rounded-2xl border border-blue-800/60">
                    <table className="min-w-full divide-y divide-blue-900/60 text-sm">
                        <thead className="sticky top-0 bg-[#09132e] text-left text-xs font-bold uppercase tracking-wider text-yellow-300">
                            <tr><th className="px-5 py-3.5">Time</th><th className="px-5 py-3.5">PV (°C)</th><th className="px-5 py-3.5">SV (°C)</th><th className="px-5 py-3.5">Heat MV</th></tr>
                        </thead>
                        <tbody className="divide-y divide-blue-950/60 bg-blue-950/40 font-mono">
                            {heatingLogs.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center font-sans text-slate-400">Belum ada reading dengan heating aktif.</td></tr>
                            ) : heatingLogs.map((log, index) => (
                                <tr key={`${log.created_at ?? index}-${index}`} className="hover:bg-blue-900/30 transition-colors">
                                    <td className="whitespace-nowrap px-5 py-2.5 text-slate-300">{log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}</td>
                                    <td className="px-5 py-2.5 font-bold text-blue-400">{Number(log.pv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-2.5 font-bold text-yellow-300">{Number(log.sv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-2.5 font-bold text-amber-400">{(Number(log.heating_mv) / 10).toLocaleString('id-ID')}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
