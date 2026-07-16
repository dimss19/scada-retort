import React, { useEffect, useState } from 'react';
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
            setHistory(prev => {
                const newHistory = [...prev, newReading];
                if (newHistory.length > 1800) newHistory.shift(); // Keep last 30 mins
                return newHistory;
            });
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
            user={auth.user}
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
