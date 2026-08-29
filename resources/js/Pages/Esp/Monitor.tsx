import React, { useState, useEffect, useCallback, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Wifi, WifiOff, AlertTriangle, X, RefreshCw, Cpu } from 'lucide-react';
import EspMonitoringPanel, { EspTelemetryData, calculateLethality } from '@/Components/Esp/EspMonitoringPanel';
import EspThermalChart from '@/Components/Esp/EspThermalChart';
import EspProcessLogs from '@/Components/Esp/EspProcessLogs';

interface DeviceItem {
    id: number;
    machine_code: string;
    name: string;
    firmware_version?: string;
    mqtt_broker?: string;
    mqtt_port?: number;
    is_online?: boolean;
}

interface Props {
    device: DeviceItem;
    devices: DeviceItem[];
    initialTelemetry: EspTelemetryData;
    history: EspTelemetryData[];
    isOnline: boolean;
    systemEvent?: {
        event?: string;
        reason?: string;
        iso?: string;
        ts?: string;
    } | null;
}

export default function EspMonitor({
    device,
    devices = [],
    initialTelemetry,
    history: initialHistory = [],
    isOnline: initialIsOnline,
    systemEvent,
}: Props) {
    const [telemetry, setTelemetry] = useState<EspTelemetryData>(initialTelemetry);
    const [history, setHistory] = useState<EspTelemetryData[]>(initialHistory);
    const [isOnline, setIsOnline] = useState<boolean>(initialIsOnline);
    const [wdtAlert, setWdtAlert] = useState(systemEvent);
    const [f0, setF0] = useState<number>(0);
    const lastUpdateRef = useRef<number>(Date.now());

    // Realtime WebSocket Listener via Laravel Echo
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private(`retort.${device.machine_code}`);
        channel.listen('SensorDataReceived', (e: any) => {
            const data = e?.data || e;
            if (data) {
                lastUpdateRef.current = Date.now();
                setIsOnline(true);
                setTelemetry(data);
                setHistory(prev => [...prev.slice(-100), data]);

                // Accumulate F0 lethality if temperature >= 100 C
                const temp = Number(data.pv ?? data.actual ?? 0);
                if (temp >= 100.0) {
                    const lethality = calculateLethality(temp);
                    // Approx dt = 1 second -> 1/60 min
                    setF0(prev => prev + (lethality / 60));
                }
            }
        });

        return () => {
            window.Echo.leave(`retort.${device.machine_code}`);
        };
    }, [device.machine_code]);

    // Fallback heartbeat checker and polling sync
    useEffect(() => {
        const interval = setInterval(async () => {
            // If no data received for 30 seconds, mark offline
            if (Date.now() - lastUpdateRef.current > 30000) {
                setIsOnline(false);
            }

            // Sync latest data from server
            try {
                const res = await fetch(route('esp.live', { machine_code: device.machine_code }), {
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.telemetry) {
                        setTelemetry(json.telemetry);
                    }
                    if (typeof json.is_online === 'boolean') {
                        setIsOnline(json.is_online);
                        if (json.is_online) lastUpdateRef.current = Date.now();
                    }
                    if (Array.isArray(json.history) && json.history.length > 0) {
                        setHistory(json.history);
                    }
                }
            } catch (err) {
                // Ignore silent poll error
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [device.machine_code]);

    const handleSelectDevice = (code: string) => {
        router.get(route('esp.monitor'), { machine_code: code }, { preserveState: false });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto py-1">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-6 h-6 text-amber-500" />
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {device.name || 'ESP32 Retort Logger'}
                                </h1>
                            </div>
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-bold border border-slate-200 dark:border-slate-700">
                                {device.machine_code}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border ${
                                isOnline
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                {isOnline ? 'REALTIME ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <span>Protokol: <strong className="font-mono text-amber-600">MQTT (Broker {device.mqtt_broker || '127.0.0.1'})</strong></span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>Firmware: <strong className="text-slate-700 dark:text-slate-300 font-mono">v{device.firmware_version || '1.0.0'}</strong></span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {devices.length > 1 && (
                            <select
                                value={device.machine_code}
                                onChange={(e) => handleSelectDevice(e.target.value)}
                                className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold py-2 px-3 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            >
                                {devices.map((d) => (
                                    <option key={d.id} value={d.machine_code}>
                                        {d.name} ({d.machine_code})
                                    </option>
                                ))}
                            </select>
                        )}
                        <Link
                            href={route('dashboard')}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`ESP Monitoring - ${device.name || device.machine_code}`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Watchdog / System Alert Banner */}
                    {wdtAlert && (
                        <div className="flex items-center justify-between rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4 text-amber-800 dark:text-amber-300 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider">ESP32 Watchdog / System Boot Event</p>
                                    <p className="text-xs mt-0.5">
                                        Perangkat baru saja reboot dengan alasan: <strong>{wdtAlert.reason || 'Watchdog Timeout'}</strong> pada {wdtAlert.ts || wdtAlert.iso || '--'}.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWdtAlert(null)}
                                className="rounded-lg p-1 text-amber-700 hover:bg-amber-400/20"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Primary ESP Monitoring Panel (Mirroring project-indah-mesin) */}
                    <EspMonitoringPanel
                        telemetry={telemetry}
                        isOnline={isOnline}
                        f0Value={f0}
                    />

                    {/* Thermal Chart Profile */}
                    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 sm:p-7 shadow-lg backdrop-blur-xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
                                        Profil Termal Suhu Retort (ESP32)
                                    </h2>
                                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                        MQTT WAVE
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    Grafik gelombang suhu real-time yang dilaporkan langsung dari sensor thermocouple ESP32 RetortLogger.
                                </p>
                            </div>
                        </div>

                        <EspThermalChart
                            data={history}
                            targetSv={Number(telemetry.sv ?? telemetry.setting ?? 121.1)}
                            height={340}
                        />
                    </section>

                    {/* Process Logs */}
                    <EspProcessLogs logs={history} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
