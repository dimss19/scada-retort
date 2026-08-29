import React from 'react';

interface TelemetryLog {
    pv?: number | null;
    actual?: number | null;
    sv?: number | null;
    setting?: number | null;
    mv?: number | null;
    phase?: string;
    ps?: string;
    tot?: string;
    stp?: string;
    recorded_at?: string;
    ts?: string;
}

interface Props {
    logs: TelemetryLog[];
}

export default function EspProcessLogs({ logs = [] }: Props) {
    const displayLogs = logs.slice(-50).reverse();

    return (
        <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 sm:p-7 shadow-lg backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-extrabold text-slate-900 dark:text-white text-xl">ESP Telemetry Records</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Riwayat pembacaan sensor langsung dari broker MQTT.</p>
                </div>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-extrabold text-blue-700 dark:text-blue-300">
                    {displayLogs.length} data points
                </span>
            </div>

            <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    <thead className="sticky top-0 bg-[#0f172a] text-left text-xs font-black uppercase tracking-wider text-white">
                        <tr>
                            <th className="px-5 py-3.5">Timestamp</th>
                            <th className="px-5 py-3.5">PV (°C)</th>
                            <th className="px-5 py-3.5">SV (°C)</th>
                            <th className="px-5 py-3.5">Katup (MV %)</th>
                            <th className="px-5 py-3.5">Fase</th>
                            <th className="px-5 py-3.5">P/S</th>
                            <th className="px-5 py-3.5">TOT / STP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 font-mono">
                        {displayLogs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-10 text-center font-sans font-bold text-slate-400">
                                    Belum ada log telemetri yang tercatat.
                                </td>
                            </tr>
                        ) : (
                            displayLogs.map((log, index) => {
                                const pv = Number(log.pv ?? log.actual ?? 0);
                                const sv = Number(log.sv ?? log.setting ?? 121.1);
                                const mv = Number(log.mv ?? 0);
                                const phase = (log.phase || 'IDLE').toUpperCase();

                                return (
                                    <tr key={`${log.ts ?? log.recorded_at ?? index}-${index}`} className="hover:bg-blue-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400 font-bold">
                                            {log.ts || log.recorded_at || '--'}
                                        </td>
                                        <td className="px-5 py-3 font-extrabold text-blue-600 dark:text-blue-400">
                                            {pv.toFixed(1)}
                                        </td>
                                        <td className="px-5 py-3 font-extrabold text-amber-600 dark:text-amber-400">
                                            {sv.toFixed(1)}
                                        </td>
                                        <td className="px-5 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {mv.toFixed(0)}%
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] font-sans font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {phase}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-bold">
                                            {log.ps || '--'}
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 font-semibold">
                                            {log.tot || '--:--'} / {log.stp || '--:--'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
