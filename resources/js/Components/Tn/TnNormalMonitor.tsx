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
            <div className="rounded-xl border-l-4 border-indigo-500 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Operation Status</p>
                        <p className="mt-1 text-2xl font-black text-slate-800">
                            {telemetry.pattern !== null ? `PTN.${telemetry.pattern}` : 'NO PATTERN'}
                            <span className="ml-2 text-indigo-600">Step {telemetry.step ?? '--'}</span>
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Process Time</p>
                            <p className="font-mono text-lg font-bold text-slate-700">{formatControllerTime(telemetry.processTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Rest Time</p>
                            <p className="font-mono text-lg font-bold text-indigo-600">{formatControllerTime(telemetry.remainingTime)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Present Value (PV)</h2>
                    <TnGauge value={telemetry.actualTemperature ?? undefined} formattedValue={formatValue(telemetry.actualTemperature)} label="PV" unit="°C" color="#3b82f6" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Set Value (SV)</h2>
                    <TnGauge value={telemetry.targetTemperature ?? undefined} formattedValue={formatValue(telemetry.targetTemperature)} label="SV" unit="°C" color="#10b981" max={200} />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Heat MV</h2>
                    <TnGauge value={telemetry.heatingPercent ?? undefined} formattedValue={formatValue(telemetry.heatingPercent)} label="MV" unit="%" color="#f59e0b" max={100} />
                </div>
            </div>

            <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-slate-800">Temperature Trend</h2>
                        <p className="text-xs text-slate-500">Data 30 menit terakhir dalam engineering unit.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                </div>
                <div className="h-72 w-full"><TnTrendChart data={isOnline ? history : []} /></div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800">Process Logs (Active Heating)</h2>
                        <p className="text-xs text-slate-500">Reading ketika heating output lebih dari 0%.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{heatingLogs.length} records</span>
                </div>
                <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                            <tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">PV (°C)</th><th className="px-5 py-3">SV (°C)</th><th className="px-5 py-3">Heat MV</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-mono">
                            {heatingLogs.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center font-sans text-slate-400">Belum ada reading dengan heating aktif.</td></tr>
                            ) : heatingLogs.map((log, index) => (
                                <tr key={`${log.created_at ?? index}-${index}`} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-5 py-2 text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}</td>
                                    <td className="px-5 py-2 font-bold text-blue-600">{Number(log.pv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-2 text-emerald-600">{Number(log.sv).toLocaleString('id-ID')}</td>
                                    <td className="px-5 py-2 text-amber-600">{(Number(log.heating_mv) / 10).toLocaleString('id-ID')}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
