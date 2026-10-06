import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { PageProps, ScadaCanvas as ScadaCanvasType, ScadaMapping } from '@/types';
import { TnController } from '@/types/tn';
import RetortMonitorShell from '@/Components/Tn/RetortMonitorShell';
import UsbPortModal from '@/Components/Tn/UsbPortModal';
import { webSerialDriver, WebSerialModbusDriver } from '@/Services/WebSerialModbus';
import {
    buildRetortEvents,
    buildRetortTelemetry,
    formatControllerTime,
} from './retortTelemetry';

interface Props extends PageProps {
    controller: TnController & {
        communication?: string;
        polling_interval?: number;
        machine?: { machine_name: string };
        scada_canvas?: ScadaCanvasType | null;
        scada_mappings?: ScadaMapping[];
    };
    latestReading: any;
}

type MonitorTab = 'monitor' | 'scada';

export default function Monitor({ controller, latestReading: initialReading }: Props) {
    const pollIntervalMs = Math.max(1000, controller.polling_interval ?? 1000);
    const staleAfterMs = Math.max(60000, pollIntervalMs * 10);
    const getReadingTimestamp = (value: any) => value?.created_at ?? value?.timestamp ?? null;
    const timestampToMs = (timestamp: any): number | false => {
        if (!timestamp) return false;
        const time = new Date(timestamp).getTime();
        return Number.isFinite(time) ? time : false;
    };
    const isFreshTimestamp = (timestamp: any) => {
        const time = timestampToMs(timestamp);
        return time !== false && Date.now() - time <= staleAfterMs;
    };

    const [reading, setReading] = useState(initialReading);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<MonitorTab>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'scada') return 'scada';
        }
        return 'monitor';
    });

    const handleTabChange = (tab: MonitorTab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (tab === 'scada') {
                url.searchParams.set('tab', 'scada');
            } else {
                url.searchParams.delete('tab');
            }
            window.history.replaceState({}, '', url.toString());
        }
    };
    const [isLiveOnline, setIsLiveOnline] = useState(Boolean(
        controller.is_online || isFreshTimestamp(getReadingTimestamp(initialReading)),
    ));
    const [commandPending, setCommandPending] = useState<'run' | 'stop' | 'reset' | null>(null);
    const [currentSerialPort, setCurrentSerialPort] = useState<string>(controller.serial_port || 'AUTO');
    const [isScanningPort, setIsScanningPort] = useState<boolean>(false);
    const [scanStatus, setScanStatus] = useState<{
        loading: boolean;
        success?: boolean;
        message?: string;
        available_ports?: string[];
    } | null>(null);
    const [showPortModal, setShowPortModal] = useState<boolean>(false);

    // Web Serial (Laptop Browser Native Connection)
    const [isWebSerialConnected, setIsWebSerialConnected] = useState<boolean>(() => webSerialDriver.isConnected());
    const [webSerialPortLabel, setWebSerialPortLabel] = useState<string | null>(() => webSerialDriver.isConnected() ? 'USB Serial Laptop' : null);

    const isMountedRef = useRef<boolean>(true);
    const lastReadingTimestampRef = useRef<any>(getReadingTimestamp(initialReading));
    const lastSeenAtRef = useRef<number | false>(timestampToMs(getReadingTimestamp(initialReading)));
    const loadReadingsRef = useRef<((replaceLatest?: boolean) => Promise<void>) | null>(null);

    const applyReading = React.useCallback((newReading: any, appendHistory = true) => {
        if (!isMountedRef.current || !newReading) return;

        const timestamp = getReadingTimestamp(newReading);
        const timestampMs = timestampToMs(timestamp);
        lastSeenAtRef.current = timestampMs !== false ? timestampMs : Date.now();
        setIsLiveOnline(timestampMs === false || Date.now() - (timestampMs || Date.now()) <= staleAfterMs);
        lastReadingTimestampRef.current = timestamp;
        setReading(newReading);

        if (appendHistory) {
            setHistory((previous) => {
                const next = [...previous, newReading];
                return next.length > 1800 ? next.slice(next.length - 1800) : next;
            });
        }
    }, [staleAfterMs]);

    useEffect(() => {
        isMountedRef.current = true;
        lastReadingTimestampRef.current = getReadingTimestamp(initialReading);
        lastSeenAtRef.current = timestampToMs(getReadingTimestamp(initialReading));

        const loadReadings = async (replaceLatest = false) => {
            try {
                const response = await fetch(route('tn.readings', controller.id), {
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                if (!isMountedRef.current) return;

                let readingsList: any[] = [];
                if (Array.isArray(data)) {
                    readingsList = data;
                } else if (data && typeof data === 'object') {
                    readingsList = Array.isArray(data.readings) ? data.readings : [];
                    if (data.serial_port) {
                        setCurrentSerialPort(data.serial_port);
                    }
                    if (typeof data.is_online === 'boolean') {
                        setIsLiveOnline(data.is_online);
                    }
                    if (typeof data.unverified_count === 'number') {
                        window.dispatchEvent(new CustomEvent('unverified-count-update', { detail: data.unverified_count }));
                    }
                }

                if (readingsList.length === 0 && !Array.isArray(data)) return;

                setHistory(readingsList);
                const latest = readingsList[readingsList.length - 1];

                if (latest) {
                    const timestamp = getReadingTimestamp(latest);
                    const timestampMs = timestampToMs(timestamp);
                    lastReadingTimestampRef.current = timestamp;
                    lastSeenAtRef.current = timestampMs;
                    setIsLiveOnline(timestampMs !== false ? (Date.now() - timestampMs <= staleAfterMs) : Boolean(controller.is_online));
                    setReading(latest);
                }
            } catch {
                if (isMountedRef.current) setIsLiveOnline(false);
            }
        };

        loadReadingsRef.current = loadReadings;
        loadReadings(true);

        const echo = (window as any).Echo;
        const channel = echo?.channel(`tn.${controller.id}`);
        channel?.listen('.tn.data', (event: any) => {
            applyReading({
                pv: event.pv,
                sv: event.sv,
                heating_mv: event.heating_mv,
                cooling_mv: event.cooling_mv,
                run_status: event.run_status,
                auto_manual: event.auto_manual,
                at_running: event.at_running,
                out1_active: event.out1_active,
                out2_active: event.out2_active,
                alarms: event.alarms,
                alarm_bits: event.alarm_bits,
                pattern_current: event.pattern_current,
                step_current: event.step_current,
                process_time: event.process_time,
                rest_time: event.rest_time,
                created_at: event.timestamp,
                decimal_point: event.decimal_point,
            });
        });

        const refreshIntervalId = window.setInterval(() => {
            loadReadings();
        }, pollIntervalMs);

        const staleIntervalId = window.setInterval(() => {
            if (!isMountedRef.current) return;
            const lastSeenAt = lastSeenAtRef.current;
            setIsLiveOnline(lastSeenAt !== false && Date.now() - lastSeenAt <= staleAfterMs);
        }, 1000);

        return () => {
            isMountedRef.current = false;
            loadReadingsRef.current = null;
            window.clearInterval(refreshIntervalId);
            window.clearInterval(staleIntervalId);
            channel?.stopListening('.tn.data');
        };
    }, [controller.id, controller.polling_interval, initialReading, applyReading]);

    // Listen to real-time data directly from Laptop's USB RS-485 via Web Serial
    useEffect(() => {
        let lastIngestTime = 0;

        webSerialDriver.onReading = (decoded) => {
            applyReading({
                pv: decoded.pv,
                sv: decoded.sv,
                heating_mv: decoded.heating_mv,
                cooling_mv: decoded.cooling_mv,
                run_status: decoded.run_status,
                auto_manual: decoded.auto_manual,
                at_running: false,
                out1_active: decoded.heating_mv > 0,
                out2_active: decoded.cooling_mv > 0,
                alarms: [],
                alarm_bits: decoded.alarm_status,
                pattern_current: decoded.pattern_current,
                step_current: decoded.step_current,
                process_time: decoded.process_time,
                rest_time: decoded.rest_time,
                created_at: decoded.timestamp,
                decimal_point: decoded.decimal_point,
            });
            setIsLiveOnline(true);
            lastSeenAtRef.current = Date.now();

            // Synchronize telemetry with VPS database every 3s
            const now = Date.now();
            if (now - lastIngestTime >= 3000) {
                lastIngestTime = now;
                axios.post(route('tn.ingest-reading', controller.id), {
                    pv: decoded.pv,
                    decimal_point: decoded.decimal_point,
                    sv: decoded.sv,
                    heating_mv: decoded.heating_mv,
                    cooling_mv: decoded.cooling_mv,
                    run_status: decoded.run_status,
                    auto_manual: decoded.auto_manual,
                    pattern_current: decoded.pattern_current,
                    step_current: decoded.step_current,
                    process_time: decoded.process_time,
                    rest_time: decoded.rest_time,
                    raw_registers: decoded.raw_registers,
                }).catch(() => {});
            }
        };

        webSerialDriver.onStatusChange = (status) => {
            if (status === 'disconnected') {
                setIsWebSerialConnected(false);
                setWebSerialPortLabel(null);
            } else if (status === 'connected') {
                setIsWebSerialConnected(true);
                setWebSerialPortLabel('USB Serial Laptop');
            }
        };

        webSerialDriver.onError = (errMsg) => {
            console.warn('Web Serial modbus warning:', errMsg);
            setScanStatus((prev) => {
                if (prev?.loading) return prev;
                return {
                    loading: false,
                    success: false,
                    message: errMsg,
                };
            });
        };
    }, [controller.id, applyReading]);

    const isOnline = isLiveOnline;
    const telemetry = useMemo(() => buildRetortTelemetry(reading, isOnline), [isOnline, reading]);
    const recentEvents = useMemo(() => buildRetortEvents(history), [history]);
    const normalizedHistory = useMemo(() => history.map((item) => {
        const normalized = buildRetortTelemetry(item, true);
        return {
            ...item,
            pv: normalized.actualTemperature,
            sv: normalized.targetTemperature,
            decimal_point: 0,
        };
    }).filter((item) => item.pv !== null && item.sv !== null), [history]);

    const sensorData = isOnline && reading ? {
        pv: reading.pv,
        sv: reading.sv,
        heating_mv: reading.heating_mv,
        cooling_mv: reading.cooling_mv,
        run_status: reading.run_status,
        auto_manual: reading.auto_manual,
        at_running: reading.at_running,
        out1_active: reading.out1_active,
        out2_active: reading.out2_active,
        alarms: reading.alarms,
        pattern_current: reading.pattern_current,
        step_current: reading.step_current,
        process_time: reading.process_time,
        rest_time: reading.rest_time,
        decimal_point: reading.decimal_point,
        alarm_bits: reading.alarm_bits,
        controller_running: telemetry.running,
        alarm_active: telemetry.alarmActive,
        process_phase: telemetry.phase,
        actual_temperature: telemetry.actualTemperature,
        target_temperature: telemetry.targetTemperature,
    } : undefined;

    const sendCommand = async (kind: 'run' | 'stop' | 'reset') => {
        if (commandPending || !isOnline) return;
        setCommandPending(kind);

        // If connected directly via laptop's Web Serial, send Modbus command directly
        if (isWebSerialConnected) {
            try {
                const slaveId = controller.slave_id || 1;
                if (kind === 'run') {
                    // Autonics TN coil 0: 0 for RUN, 1 for STOP
                    await webSerialDriver.writeSingleCoil(slaveId, 0, false);
                } else if (kind === 'stop') {
                    await webSerialDriver.writeSingleCoil(slaveId, 0, true);
                }
            } catch (err: any) {
                console.error('Gagal mengirim perintah via Web Serial:', err);
            }
        }

        const routeName = kind === 'reset' ? 'tn.cmd.alarmreset' : 'tn.cmd.runstop';
        const payload = kind === 'reset' ? {} : { run: kind === 'run' };
        router.post(route(routeName, controller.id), payload, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setCommandPending(null),
        });
    };

    /**
     * Triggers Google Chrome native serial device picker dialog on the laptop
     * This opens the exact dialog shown in the user's reference image
     */
    const handleScanLaptopPort = async () => {
        if (!WebSerialModbusDriver.isSupported()) {
            setScanStatus({
                loading: false,
                success: false,
                message: 'Browser Anda tidak mendukung Web Serial API. Gunakan Google Chrome atau Microsoft Edge di laptop Anda.',
            });
            return;
        }

        setIsScanningPort(true);
        setScanStatus({
            loading: true,
            message: 'Silakan pilih port USB serial laptop Anda di jendela browser pop-up...',
        });

        try {
            const parity = (controller.parity === 'E' ? 'even' : (controller.parity === 'O' ? 'odd' : 'none')) as any;
            const stopBits = (controller.stopbits === 1 ? 1 : 2) as any;
            const baudRate = controller.baudrate || 9600;

            // Connect using the controller's exact hardware communication specs
            await webSerialDriver.connect(undefined, {
                baudRate,
                parity,
                stopBits,
            });

            setIsWebSerialConnected(true);
            setWebSerialPortLabel('USB Serial Laptop');
            setCurrentSerialPort('USB Serial (Laptop)');
            setIsLiveOnline(true);
            lastSeenAtRef.current = Date.now();

            setScanStatus({
                loading: false,
                success: true,
                message: `Port USB Serial Laptop terhubung (${baudRate} bps, 8-${parity[0].toUpperCase()}-${stopBits})! Membaca data Modbus controller...`,
            });

            const slaveId = controller.slave_id || 1;
            webSerialDriver.startPolling(slaveId, 1000);

            setTimeout(() => {
                setScanStatus((prev) => (prev?.success ? null : prev));
            }, 6000);
        } catch (err: any) {
            console.error('Web Serial connect error:', err);
            if (err?.name === 'NotFoundError' || err?.message?.includes('No port selected') || err?.message?.includes('cancel')) {
                setScanStatus({
                    loading: false,
                    success: false,
                    message: 'Pemilihan port USB serial laptop dibatalkan.',
                });
            } else {
                setScanStatus({
                    loading: false,
                    success: false,
                    message: 'Gagal menghubungkan ke port USB serial laptop: ' + (err?.message || 'Error tidak diketahui'),
                });
            }
        } finally {
            setIsScanningPort(false);
        }
    };

    const handleDisconnectLaptopPort = async () => {
        await webSerialDriver.disconnect();
        setIsWebSerialConnected(false);
        setWebSerialPortLabel(null);
        setCurrentSerialPort(controller.serial_port || 'AUTO');
        setScanStatus({
            loading: false,
            success: true,
            message: 'Koneksi USB Serial Laptop telah diputuskan.',
        });
        setTimeout(() => setScanStatus(null), 3000);
    };

    const lastUpdate = telemetry.timestamp
        ? new Date(telemetry.timestamp).toLocaleString('id-ID')
        : 'Belum ada data';

    return (
        <>
            <RetortMonitorShell
                controller={controller}
                telemetry={telemetry}
                events={recentEvents}
                history={normalizedHistory}
                mappings={controller.scada_mappings ?? []}
                canvas={controller.scada_canvas}
                sensorData={sensorData}
                isOnline={isOnline}
                serialPort={currentSerialPort}
                commandPending={commandPending}
                lastUpdate={lastUpdate}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onRun={() => sendCommand('run')}
                onStop={() => sendCommand('stop')}
                onResetAlarm={() => sendCommand('reset')}
                isScanningPort={isScanningPort}
                scanStatus={scanStatus}
                onScanPort={handleScanLaptopPort}
                onOpenPortModal={() => setShowPortModal(true)}
                onCloseScanStatus={() => setScanStatus(null)}
                isWebSerialConnected={isWebSerialConnected}
                webSerialPortLabel={webSerialPortLabel}
                onDisconnectWebSerial={handleDisconnectLaptopPort}
            />

            {showPortModal && (
                <UsbPortModal
                    controllerId={controller.id}
                    activePort={currentSerialPort}
                    isOnline={isOnline}
                    isWebSerialConnected={isWebSerialConnected}
                    webSerialPortLabel={webSerialPortLabel}
                    onConnectWebSerial={handleScanLaptopPort}
                    onDisconnectWebSerial={handleDisconnectLaptopPort}
                    onPortChanged={(newPort) => {
                        setCurrentSerialPort(newPort);
                        loadReadingsRef.current?.(true);
                    }}
                    onClose={() => {
                        setShowPortModal(false);
                        loadReadingsRef.current?.(true);
                    }}
                />
            )}
        </>
    );
}
