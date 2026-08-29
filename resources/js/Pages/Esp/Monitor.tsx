import React, { useState, useEffect, useMemo, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { RetortTelemetry } from '@/Pages/Tn/retortTelemetry';
import TnFaceplateDisplay from '@/Components/Tn/TnFaceplateDisplay';
import RetortThermalChart from '@/Components/Tn/RetortThermalChart';
import { calculateLethality, EspTelemetryData } from '@/Components/Esp/EspMonitoringPanel';
import { ShieldCheck, Flame, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';

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
    history: any[];
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
    const [history, setHistory] = useState<any[]>(initialHistory);
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

                // Add to history for chart & logs
                const historyEntry = {
                    pv: data.pv ?? data.actual ?? 0,
                    sv: data.sv ?? data.setting ?? 121.1,
                    heating_mv: data.mv ?? 0,
                    phase: data.phase ?? 'IDLE',
                    created_at: data.ts ?? data.recorded_at ?? new Date().toISOString(),
                };
                setHistory(prev => [...prev.slice(-120), historyEntry]);

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
            if (Date.now() - lastUpdateRef.current > 30000) {
                setIsOnline(false);
            }

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
                        const formatted = json.history.map((h: any) => ({
                            pv: h.pv ?? h.actual ?? 0,
                            sv: h.sv ?? h.setting ?? 121.1,
                            heating_mv: h.mv ?? 0,
                            phase: h.phase ?? 'IDLE',
                            created_at: h.ts ?? h.recorded_at ?? new Date().toISOString(),
                        }));
                        setHistory(formatted);
                    }
                }
            } catch (err) {
                // Ignore silent poll error
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [device.machine_code]);

    // Map ESP telemetry to standard RetortTelemetry object for TnFaceplateDisplay
    const mappedTelemetry: RetortTelemetry = useMemo(() => {
        const pvVal = telemetry.pv ?? telemetry.actual ?? null;
        const svVal = telemetry.sv ?? telemetry.setting ?? 121.1;
        const mvVal = telemetry.mv ?? 0;
        const isRunning = Boolean(
            telemetry.run ||
            (mvVal > 0) ||
            (telemetry.tot && telemetry.tot !== '00:00') ||
            (telemetry.phase && telemetry.phase.toUpperCase() !== 'IDLE')
        );

        // Parse TOT MM:SS or seconds
        const parseTimeDigits = (tStr?: string) => {
            if (!tStr) return 0;
            const clean = tStr.replace(/[^0-9]/g, '');
            return parseInt(clean, 10) || 0;
        };

        const pNum = telemetry.pattern ?? (telemetry.ps ? parseInt(telemetry.ps.split('.')[0], 10) : 0);
        const sNum = telemetry.step ?? (telemetry.ps ? parseInt(telemetry.ps.split('.')[1], 10) : 0);

        return {
            actualTemperature: pvVal !== null ? Number(pvVal) : null,
            targetTemperature: svVal !== null ? Number(svVal) : 121.1,
            heatingPercent: Number(mvVal),
            coolingPercent: 0,
            running: isRunning,
            automatic: true,
            heatingActive: mvVal > 0,
            coolingActive: false,
            sensorFault: null,
            activeAlarms: [],
            alarmActive: false,
            phase: (isRunning ? 'Running' : 'Waiting') as any,
            pattern: pNum,
            step: sNum,
            processTime: parseTimeDigits(telemetry.tot),
            remainingTime: parseTimeDigits(telemetry.stp),
            timestamp: telemetry.ts || telemetry.iso || new Date().toISOString(),
        };
    }, [telemetry]);

    const heatingLogs = useMemo(() => {
        return history
            .filter((item) => Number(item.heating_mv ?? item.mv ?? 0) > 0 || Number(item.pv ?? 0) > 40)
            .slice(-100)
            .reverse();
    }, [history]);

    const formattedUpdateTime = useMemo(() => {
        return new Date().toLocaleTimeString('id-ID');
    }, [telemetry]);

    const handleSelectDevice = (code: string) => {
        router.get(route('esp.monitor'), { machine_code: code }, { preserveState: false });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto py-1">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                {device.name || 'ESP32 Retort Logger'} ({device.machine_code})
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border ${
                                isOnline
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                {isOnline ? 'Realtime Online' : 'Offline'}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <span>Tipe: <strong className="font-mono text-blue-700 dark:text-blue-400">ESP32-S3 (RetortLogger)</strong></span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>Protokol: <strong className="font-mono text-amber-700 dark:text-amber-400">MQTT</strong></span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>Update: <strong className="text-slate-700 dark:text-slate-300">{formattedUpdateTime}</strong></span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
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
            <Head title={`Monitor Retort - ${device.name || device.machine_code}`} />

            <div className="py-8">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Navigation Tab (Single Tab - Monitoring Dashboard) */}
                    <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                        <button
                            type="button"
                            className="rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-md bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-none cursor-default"
                        >
                            Monitoring Dashboard
                        </button>
                    </div>

                    {/* Watchdog / System Alert Banner if present */}
                    {wdtAlert && (
                        <div className="flex items-center justify-between rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4 text-amber-800 dark:text-amber-300 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider">ESP32 Watchdog / System Boot Event</p>
                                    <p className="text-xs mt-0.5">
                                        Perangkat reboot dengan alasan: <strong>{wdtAlert.reason || 'Watchdog Timeout'}</strong> pada {wdtAlert.ts || wdtAlert.iso || '--'}.
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

                    {/* Industrial Faceplate Display (Mirroring Autonics TNH-P Industrial Display) */}
                    <TnFaceplateDisplay
                        telemetry={mappedTelemetry}
                        modelType="ESP32-LOGGER"
                        isOnline={isOnline}
                    />

                    {/* F0 Lethality Summary Bar */}
                    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-5 shadow-lg backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex items-center justify-center rounded-2xl w-12 h-12 bg-amber-500/15 text-amber-600 shrink-0">
                                <ShieldCheck size={26} strokeWidth={2.2} />
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Akumulasi Nilai Sterilitas F₀</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-amber-600 font-mono">{f0.toFixed(2)}</span>
                                    <span className="text-xs font-extrabold text-amber-500">menit ekuivalen (Tref 121.1°C, z = 10°C)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500">Fase Saat Ini:</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <Flame size={14} className="text-amber-500" />
                                {telemetry.phase || (mappedTelemetry.running ? 'STERILIZING' : 'STANDBY (IDLE)')}
                            </span>
                        </div>
                    </div>

                    {/* Industrial Thermal Sterilization Profile Chart */}
                    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 sm:p-7 shadow-lg backdrop-blur-xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
                                        Profil Termal Sterilisasi Retort
                                    </h2>
                                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                        Thermal Profile
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    Kurva pemanasan riil dengan pembagian zona langkah (CUT, Holding Time & F₀, Cooling Time) berbasis waktu proses dari ESP32 RetortLogger.
                                </p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black border ${
                                isOnline
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            }`}>
                                <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                {isOnline ? 'LIVE MONITOR' : 'OFFLINE'}
                            </span>
                        </div>

                        <RetortThermalChart
                            data={history}
                            targetSv={mappedTelemetry.targetTemperature ?? 121.0}
                            height={380}
                            isRunning={Boolean(mappedTelemetry.running && mappedTelemetry.phase !== 'Waiting' && mappedTelemetry.phase !== 'Offline')}
                        />
                    </section>

                    {/* Process Logs Table */}
                    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-7 shadow-lg backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-xl">Process Logs (ESP Telemetry)</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Reading telemetri masuk dari broker MQTT.</p>
                            </div>
                            <span className="rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-extrabold text-blue-700 dark:text-blue-300">
                                {heatingLogs.length} records
                            </span>
                        </div>
                        <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                                <thead className="sticky top-0 bg-[#0f172a] text-left text-xs font-black uppercase tracking-wider text-white">
                                    <tr>
                                        <th className="px-5 py-3.5">Time</th>
                                        <th className="px-5 py-3.5">PV (°C)</th>
                                        <th className="px-5 py-3.5">SV (°C)</th>
                                        <th className="px-5 py-3.5">Heat MV</th>
                                        <th className="px-5 py-3.5">Fase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 font-mono">
                                    {heatingLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center font-sans font-bold text-slate-400">
                                                Belum ada reading yang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        heatingLogs.map((log, index) => (
                                            <tr key={`${log.created_at ?? index}-${index}`} className="hover:bg-blue-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400 font-bold">
                                                    {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}
                                                </td>
                                                <td className="px-5 py-3 font-extrabold text-blue-700 dark:text-blue-400">
                                                    {Number(log.pv).toFixed(1)}
                                                </td>
                                                <td className="px-5 py-3 font-extrabold text-amber-700 dark:text-amber-400">
                                                    {Number(log.sv).toFixed(1)}
                                                </td>
                                                <td className="px-5 py-3 font-extrabold text-amber-600 dark:text-amber-500">
                                                    {Number(log.heating_mv).toFixed(0)}%
                                                </td>
                                                <td className="px-5 py-3 font-sans text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                                    {log.phase || 'IDLE'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
