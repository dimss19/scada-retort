import React, { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { TnController } from '@/types/tn';
import TnGauge from '@/Components/Tn/TnGauge';
import TnTrendChart from '@/Components/Tn/TnTrendChart';

interface Props extends PageProps {
    controller: TnController & {
        communication?: string;
        polling_interval?: number;
        baudrate?: number;
        parity?: string;
        stopbits?: number;
        machine?: { machine_name: string };
        last_seen_at?: string | null;
    };
    latestReading: any;
}

export default function Monitor({ controller, latestReading: initialReading }: Props) {
    const [reading, setReading] = useState(initialReading);
    const [history, setHistory] = useState<any[]>([]);
    const [eventLogs, setEventLogs] = useState<any[]>([]);
    const [isLiveOnline, setIsLiveOnline] = useState(Boolean(controller.is_online || initialReading));

    const formatValue = (val: number | undefined, dp: number = 0) => {
        if (val === undefined || val === 31000 || val === 30000 || val === -30000) return undefined;
        return (val / Math.pow(10, dp)).toFixed(dp).replace('.', ','); // Use comma for decimal separator
    };

    const isHeatingRef = useRef(false);
    const logsRef = useRef<any[]>([]);

    useEffect(() => {
        logsRef.current = eventLogs;
    }, [eventLogs]);

    useEffect(() => {
        let isMounted = true;
        let lastReadingTimestamp = initialReading?.created_at ?? initialReading?.timestamp ?? null;

        const applyReading = (newReading: any, appendHistory = true) => {
            if (!isMounted || !newReading) return;

            const timestamp = newReading.created_at ?? newReading.timestamp ?? null;
            if (timestamp && timestamp === lastReadingTimestamp) return;

            lastReadingTimestamp = timestamp;
            setIsLiveOnline(true);
            setReading(newReading);
            if (appendHistory) {
                setHistory((prev) => {
                    const next = [...prev, newReading];
                    if (next.length > 1800) next.shift();
                    return next;
                });
            }

            const mv = newReading.heating_mv ?? 0;
            if (mv > 0) {
                setEventLogs((prev) => {
                    const next = [newReading, ...prev];
                    if (next.length > 500) next.pop();
                    return next;
                });
            } else if (mv === 0 && logsRef.current.length > 0) {
                setEventLogs([]);
            }
        };

        const loadReadings = async (replaceHistory = false) => {
            try {
                const res = await fetch(route('tn.readings', controller.id), {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                if (!isMounted || !Array.isArray(data)) return;

                setHistory(data);
                setIsLiveOnline(data.length > 0);

                const latest = data[data.length - 1];
                if (replaceHistory && latest) {
                    lastReadingTimestamp = latest.created_at ?? latest.timestamp ?? null;
                    setReading(latest);
                    return;
                }

                applyReading(latest, false);
            } catch {
                if (isMounted) setIsLiveOnline(false);
            }
        };

        loadReadings(true);

        const echo = (window as any).Echo;
        const channel = echo?.channel(`tn.${controller.id}`);
        channel?.listen('.tn.data', (e: any) => {
            applyReading({
                pv: e.pv,
                sv: e.sv,
                heating_mv: e.heating_mv,
                cooling_mv: e.cooling_mv,
                run_status: e.run_status,
                auto_manual: e.auto_manual,
                at_running: e.at_running,
                out1_active: e.out1_active,
                out2_active: e.out2_active,
                alarms: e.alarms,
                pattern_current: e.pattern_current,
                step_current: e.step_current,
                process_time: e.process_time,
                rest_time: e.rest_time,
                created_at: e.timestamp,
                decimal_point: e.decimal_point,
            });
        });

        const pollIntervalMs = Math.max(5000, controller.polling_interval ?? 5000);
        const intervalId = window.setInterval(() => loadReadings(), pollIntervalMs);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            channel?.stopListening('.tn.data');
        };
    }, [controller.id, controller.polling_interval, initialReading]);

    const isOnline = isLiveOnline;
    const pvValue = isOnline ? reading?.pv : 0;
    const svValue = isOnline ? reading?.sv : 0;
    const mvValue = isOnline ? reading?.heating_mv : 0;

    const pvFormatted = formatValue(pvValue, reading?.decimal_point);
    const svFormatted = formatValue(svValue, reading?.decimal_point);
    const mvFormatted = formatValue(mvValue, 1);

    const formatTime = (t: number | undefined) => {
        if (t === undefined) return '--:--';
        const s = String(t).padStart(4, '0');
        return s.slice(0, s.length - 2) + ':' + s.slice(-2);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Monitoring
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Trend dan komunikasi controller digabung langsung di halaman monitor.</p>
                        <div className="mt-2">
                            <Link href={route('dashboard')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">&larr; Back to Dashboard</Link>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('tn.config.edit', controller.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Config</Link>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isOnline ? (controller.serial_port || 'SERIAL') : 'OFFLINE'}
                        </span>
                        {reading && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${!reading.run_status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {!reading.run_status ? 'RUN' : 'STOP'}
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Monitor - ${controller.model_type}`} />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {isOnline && reading?.pattern_current !== undefined && (
                        <div className="rounded-lg bg-white p-6 shadow-sm flex items-center justify-between border-l-4 border-indigo-500">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Operation Status</h3>
                                <div className="text-2xl font-bold text-slate-800">
                                    PTN.{reading.pattern_current} - Step {reading.step_current}
                                </div>
                            </div>
                            <div className="flex gap-8 text-right">
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase">Process Time</div>
                                    <div className="font-mono text-lg text-slate-700">{formatTime(reading.process_time)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase">Rest Time</div>
                                    <div className="font-mono text-lg text-indigo-600">{formatTime(reading.rest_time)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Present Value (PV)</h3>
                            <TnGauge value={pvValue} formattedValue={pvFormatted} label="PV" unit="C" color="#3b82f6" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Set Value (SV)</h3>
                            <TnGauge value={svValue} formattedValue={svFormatted} label="SV" unit="C" color="#10b981" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Heat MV</h3>
                            <TnGauge value={mvValue} formattedValue={mvFormatted} label="MV" unit="%" color="#f59e0b" max={100} />
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-gray-700">Temperature Trend (Last 30 Min)</h3>
                        <div className="h-64 w-full">
                            <TnTrendChart data={isOnline ? history : []} />
                        </div>
                    </div>

                    {/* Process Log Table (MV > 0) */}
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">Process Logs (Active Heating)</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {eventLogs.length} Records
                            </span>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">PV (°C)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">SV (°C)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white font-mono text-sm">
                                    {eventLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                                Waiting for heating valve (MV) to open...
                                            </td>
                                        </tr>
                                    ) : (
                                        eventLogs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap px-6 py-2 text-slate-500">
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-2 font-semibold text-blue-600">
                                                    {formatValue(log.pv, log.decimal_point)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-2 text-emerald-600">
                                                    {formatValue(log.sv, log.decimal_point)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
