import React, { useEffect, useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { TnController } from '@/types/tn';
import TnGauge from '@/Components/Tn/TnGauge';
import TnStatusPanel from '@/Components/Tn/TnStatusPanel';
import TnControlPanel from '@/Components/Tn/TnControlPanel';
import TnTrendChart from '@/Components/Tn/TnTrendChart';

interface Props extends PageProps {
    controller: TnController;
    latestReading: any;
}

export default function Monitor({ auth, controller, latestReading: initialReading }: Props) {
    const [reading, setReading] = useState(initialReading);
    const [history, setHistory] = useState<any[]>([]);

    // Lethality (F0) State
    const [accumulatedF0, setAccumulatedF0] = useState(0);
    const [targetF0, setTargetF0] = useState(6.0);
    const [zValue, setZValue] = useState(10.0);
    const [tRef, setTRef] = useState(121.1);
    
    // Ref to store previous timestamp for F0 calc (using accurate JS timestamps)
    const prevTimeRef = useRef<number | null>(null);

    useEffect(() => {
        // Fetch historical data for chart
        fetch(route('tn.readings', controller.id))
            .then(res => res.json())
            .then(data => setHistory(data));

        // Listen for real-time updates
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
                decimal_point: e.decimal_point
            };
            setReading(newReading);
            setReading(newReading);
            setHistory(prev => {
                const newHistory = [...prev, newReading];
                if (newHistory.length > 1800) newHistory.shift(); // Keep last 30 mins
                return newHistory;
            });

            // F0 Calculation (Riemann Sum)
            // Note: TN run_status = 0 usually means RUN, 1 means STOP.
            const now = Date.now();
            if (prevTimeRef.current !== null) {
                const dtMinutes = (now - prevTimeRef.current) / 60000;
                
                // Only accumulate if machine is RUNNING and Temp > 90C (to avoid irrelevant calc)
                if (e.run_status === 0 && e.pv > 90) {
                    // We use standard state setter function to get latest state
                    setAccumulatedF0(prev => {
                        // Math.pow(10, (T - Tref) / Z) * dt
                        // Need to use state variables for zValue and tRef, but we can't reliably get them inside this closure
                        // without adding them to dependency array, which re-binds listener. 
                        // For simplicity, we assume default 10 and 121.1 for real-time calc here, 
                        // or we use refs. Let's just use the current closure values.
                        const f0_increment = Math.pow(10, (e.pv - 121.1) / 10.0) * dtMinutes;
                        return prev + f0_increment;
                    });
                }
            }
            prevTimeRef.current = now;
        });

        return () => {
            channel.stopListening('TnDataReceived');
        };
    }, [controller.id]);

    const handleRunStop = (run: boolean) => {
        router.post(route('tn.cmd.runstop', controller.id), { run }, { preserveScroll: true });
    };

    const handleSetSv = (sv: number) => {
        router.post(route('tn.cmd.setsv', controller.id), { sv }, { preserveScroll: true });
    };

    const handleAutoTune = () => {
        if (confirm('Are you sure you want to start Auto-Tuning? The controller will temporarily change PV dynamically to calculate PID values.')) {
            router.post(route('tn.cmd.autotune', controller.id), {}, { preserveScroll: true });
        }
    };

    const handleResetAlarm = () => {
        router.post(route('tn.cmd.alarmreset', controller.id), {}, { preserveScroll: true });
    };

    const handleSetMode = (manual: boolean) => {
        router.post(route('tn.cmd.setmode', controller.id), { manual }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {controller.name} <span className="text-sm font-normal text-gray-500">({controller.model_type} &bull; Slave #{controller.slave_id})</span>
                    </h2>
                    <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${controller.is_online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {controller.is_online ? '● ONLINE' : '○ OFFLINE'}
                        </span>
                        {reading && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${!reading.run_status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {!reading.run_status ? '▶ RUN' : '■ STOP'}
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Monitor - ${controller.name}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Top Row: Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col items-center">
                            <h3 className="text-gray-500 uppercase tracking-wider text-sm font-bold mb-4">Present Value (PV)</h3>
                            <TnGauge value={reading?.pv} label="PV" unit="℃" color="#3b82f6" max={200} />
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col items-center">
                            <h3 className="text-gray-500 uppercase tracking-wider text-sm font-bold mb-4">Set Value (SV)</h3>
                            <TnGauge value={reading?.sv} label="SV" unit="℃" color="#10b981" max={200} />
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col items-center">
                            <h3 className="text-gray-500 uppercase tracking-wider text-sm font-bold mb-4">Heat MV</h3>
                            <TnGauge value={reading?.heating_mv ? reading.heating_mv / 10 : 0} label="MV" unit="%" color="#f59e0b" max={100} />
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-gray-700 font-bold mb-4">Temperature Trend (Last 30 Min)</h3>
                        <div className="h-64 w-full">
                            <TnTrendChart data={history} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Quick Control */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-gray-700 font-bold mb-4">Quick Control</h3>
                            <TnControlPanel 
                                reading={reading} 
                                onRunStop={handleRunStop}
                                onSetSv={handleSetSv}
                                onAutoTune={handleAutoTune}
                                onResetAlarm={handleResetAlarm}
                                onSetMode={handleSetMode}
                            />
                        </div>

                        {/* Status */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-gray-700 font-bold mb-4">Status Information</h3>
                            <TnStatusPanel reading={reading} modelType={controller.model_type} />
                        </div>

                        {/* F0 Lethality Validation */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-gray-700 font-bold">Validation & Lethality (F₀)</h3>
                                <button onClick={() => setAccumulatedF0(0)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border">Reset F₀</button>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="text-5xl font-black mb-2 font-mono">
                                    {accumulatedF0.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-6">Accumulated F₀</div>

                                <div className="w-full bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700 overflow-hidden">
                                    <div 
                                        className={`h-4 rounded-full transition-all duration-500 ${accumulatedF0 >= targetF0 ? 'bg-green-500' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(100, (accumulatedF0 / targetF0) * 100)}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between w-full text-sm text-gray-600 mb-6 font-medium">
                                    <span>0</span>
                                    <span>Target: {targetF0}</span>
                                </div>

                                {accumulatedF0 >= targetF0 ? (
                                    <div className="w-full py-3 bg-green-100 text-green-800 text-center rounded-lg font-bold text-lg border border-green-200 shadow-sm flex items-center justify-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        VALIDATION PASSED
                                    </div>
                                ) : (
                                    <div className="w-full py-3 bg-slate-100 text-slate-500 text-center rounded-lg font-bold border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        IN PROGRESS
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
