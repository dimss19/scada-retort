import React, { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { TnController } from '@/types/tn';
import TnGauge from '@/Components/Tn/TnGauge';
import TnStatusPanel from '@/Components/Tn/TnStatusPanel';
import TnControlPanel from '@/Components/Tn/TnControlPanel';
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
    const [accumulatedF0, setAccumulatedF0] = useState(0);
    const [targetF0] = useState(6.0);
    const prevTimeRef = useRef<number | null>(null);

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

            const now = Date.now();
            if (prevTimeRef.current !== null && e.run_status === 0 && e.pv > 90) {
                const dtMinutes = (now - prevTimeRef.current) / 60000;
                setAccumulatedF0((prev) => prev + Math.pow(10, (e.pv - 121.1) / 10.0) * dtMinutes);
            }
            prevTimeRef.current = now;
        });

        return () => {
            channel.stopListening('TnDataReceived');
        };
    }, [controller.id]);

    const handleRunStop = (run: boolean) => router.post(route('tn.cmd.runstop', controller.id), { run }, { preserveScroll: true });
    const handleSetSv = (sv: number) => router.post(route('tn.cmd.setsv', controller.id), { sv }, { preserveScroll: true });
    const handleAutoTune = () => {
        if (confirm('Are you sure you want to start Auto-Tuning? The controller will temporarily change PV dynamically to calculate PID values.')) {
            router.post(route('tn.cmd.autotune', controller.id), {}, { preserveScroll: true });
        }
    };
    const handleResetAlarm = () => router.post(route('tn.cmd.alarmreset', controller.id), {}, { preserveScroll: true });
    const handleSetMode = (manual: boolean) => router.post(route('tn.cmd.setmode', controller.id), { manual }, { preserveScroll: true });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {controller.model_type}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Trend dan komunikasi controller digabung langsung di halaman monitor.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('tn.config.edit', controller.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">Config</Link>
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
                            <TnGauge value={reading?.pv} label="PV" unit="C" color="#3b82f6" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Set Value (SV)</h3>
                            <TnGauge value={reading?.sv} label="SV" unit="C" color="#10b981" max={200} />
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Heat MV</h3>
                            <TnGauge value={reading?.heating_mv ? reading.heating_mv / 10 : 0} label="MV" unit="%" color="#f59e0b" max={100} />
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-gray-700">Temperature Trend (Last 30 Min)</h3>
                        <div className="h-64 w-full">
                            <TnTrendChart data={history} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-bold text-gray-700">Quick Control</h3>
                            <TnControlPanel reading={reading} onRunStop={handleRunStop} onSetSv={handleSetSv} onAutoTune={handleAutoTune} onResetAlarm={handleResetAlarm} onSetMode={handleSetMode} />
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-bold text-gray-700">Status Information</h3>
                            <TnStatusPanel reading={reading} modelType={controller.model_type} />
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-bold text-gray-700">Communication</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Baudrate</p><p className="mt-1 font-semibold text-slate-800">{controller.baudrate || '-'}</p></div>
                                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Parity / Stopbits</p><p className="mt-1 font-semibold text-slate-800">{controller.parity || '-'} / {controller.stopbits || '-'}</p></div>
                                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Polling</p><p className="mt-1 font-semibold text-slate-800">{controller.polling_interval || '-'} ms</p></div>
                                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Last Seen</p><p className="mt-1 font-semibold text-slate-800">{controller.last_seen_at ? new Date(controller.last_seen_at).toLocaleString() : 'No data'}</p></div>
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-bold text-gray-700">Validation & Lethality (F0)</h3>
                                <button onClick={() => setAccumulatedF0(0)} className="rounded border bg-gray-100 px-2 py-1 text-xs text-gray-700">Reset F0</button>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="mb-2 text-5xl font-black font-mono">{accumulatedF0.toFixed(2)}</div>
                                <div className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">Accumulated F0</div>
                                <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div className={`h-4 rounded-full transition-all duration-500 ${accumulatedF0 >= targetF0 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (accumulatedF0 / targetF0) * 100)}%` }} />
                                </div>
                                <div className="mb-6 flex w-full justify-between text-sm text-gray-600 font-medium">
                                    <span>0</span>
                                    <span>Target: {targetF0}</span>
                                </div>
                                {accumulatedF0 >= targetF0 ? (
                                    <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-100 py-3 text-center text-lg font-bold text-green-800">VALIDATION PASSED</div>
                                ) : (
                                    <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 py-3 text-center font-bold text-slate-500">IN PROGRESS</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
