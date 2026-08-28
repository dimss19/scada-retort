import React, { useMemo } from 'react';
import { RetortTelemetry } from '@/Pages/Tn/retortTelemetry';
import TnTrendChart from './TnTrendChart';
import TnFaceplateDisplay from './TnFaceplateDisplay';

interface Props {
    controllerId?: number;
    controllerModel?: string;
    telemetry: RetortTelemetry;
    history: any[];
    isOnline: boolean;
}

export default function TnNormalMonitor({ controllerModel = 'TNH', telemetry, history, isOnline }: Props) {
    const heatingLogs = useMemo(() => history
        .filter((item) => Number(item.heating_mv ?? 0) > 0)
        .slice(-100)
        .reverse(), [history]);

    return (
        <div className="space-y-6">
            {/* Autonics Industrial Digital Faceplate Display (Mirroring Physical TNH-P Screen) */}
            <TnFaceplateDisplay
                telemetry={telemetry}
                modelType={controllerModel}
                isOnline={isOnline}
            />

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
