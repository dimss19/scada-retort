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
        fetch(route('tn.readings', controller.id))
            .then((res) => res.json())
            .then((data) => setHistory(data));

        const channel = (window as any).Echo.channel(`tn.${controller.id}`);
        channel.listen('TnDataReceived', (e: any) => {
            const newReading = {
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
                created_at: e.timestamp,
                decimal_point: e.decimal_point,
            };

            setReading(newReading);
            setHistory((prev) => {
                const next = [...prev, newReading];
                if (next.length > 1800) next.shift();
                return next;
            });

            const mv = newReading.heating_mv ?? 0;
            if (mv > 0) {
                isHeatingRef.current = true;
                setEventLogs((prev) => {
                    const next = [newReading, ...prev];
                    if (next.length > 500) next.pop(); // Keep latest 500 logs in memory
                    return next;
                });
            } else if (mv === 0 && isHeatingRef.current) {
                // Heating stopped, process finished
                isHeatingRef.current = false;
                if (logsRef.current.length > 0) {
                    (window as any).axios.post(route('tn.history.save', controller.id), {
                        log_data: logsRef.current
                    }).then(() => {
                        setEventLogs([]); // Clear logs on screen after saving
                    }).catch((err: any) => console.error("Failed to save history", err));
                }
            }

        });

        return () => {
            channel.stopListening('TnDataReceived');
        };
    }, [controller.id]);

    const pvFormatted = formatValue(reading?.pv, reading?.decimal_point);
    const svFormatted = formatValue(reading?.sv, reading?.decimal_point);
    const mvFormatted = formatValue(reading?.heating_mv, 1);

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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${controller.is_online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {controller.is_online ? (controller.serial_port || 'SERIAL') : 'OFFLINE'}
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Present Value (PV)</h3>
                            <TnGauge value={reading?.pv} formattedValue={pvFormatted} label="PV" unit="C" color="#3b82f6" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Set Value (SV)</h3>
                            <TnGauge value={reading?.sv} formattedValue={svFormatted} label="SV" unit="C" color="#10b981" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Heat MV</h3>
                            <TnGauge value={reading?.heating_mv} formattedValue={mvFormatted} label="MV" unit="%" color="#f59e0b" max={100} />
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-gray-700">Temperature Trend (Last 30 Min)</h3>
                        <div className="h-64 w-full">
                            <TnTrendChart data={history} />
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
