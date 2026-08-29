import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { webSerialDriver, WebSerialModbusDriver } from '@/Services/WebSerialModbus';
import { Usb, RefreshCw, Power, CheckCircle, AlertCircle, Laptop } from 'lucide-react';

interface PortInfo {
    device: string;
    description: string;
    hwid: string;
    vid: number | null;
    pid: number | null;
    manufacturer: string | null;
    serial_number: string | null;
}

interface Props {
    controllerId: number;
    currentPort: string | null;
    isOnline: boolean;
    lastError: string | null;
    slaveId?: number;
    onReadingReceived?: (reading: any) => void;
}

export default function PortSettings({ controllerId, currentPort, isOnline, lastError, slaveId = 1, onReadingReceived }: Props) {
    const [open, setOpen] = useState(false);
    const [ports, setPorts] = useState<PortInfo[]>([]);
    const [scanning, setScanning] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [mode, setMode] = useState<'auto' | 'manual'>(currentPort ? 'manual' : 'auto');
    const [selectedPort, setSelectedPort] = useState<string | null>(currentPort);
    const [localOnline, setLocalOnline] = useState<boolean>(isOnline);

    // Web Serial Browser API State
    const isWebSerialSupported = typeof window !== 'undefined' && WebSerialModbusDriver.isSupported();
    const [isWebSerialActive, setIsWebSerialActive] = useState(webSerialDriver.isConnected());
    const [webSerialConnecting, setWebSerialConnecting] = useState(false);
    const [lastWebSerialTime, setLastWebSerialTime] = useState<string | null>(null);

    useEffect(() => {
        setLocalOnline(isOnline);
    }, [isOnline]);

    const showStatus = useCallback((type: 'success' | 'error' | 'info', text: string) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 5000);
    }, []);

    const fetchPorts = useCallback(async () => {
        setScanning(true);
        setStatusMsg(null);
        try {
            const res = await fetch(route('tn.port.list', controllerId));
            const data = await res.json();
            if (data.success) {
                setPorts(data.ports);
                if (data.ports.length === 0) {
                    showStatus('info', 'Tidak ada port serial terdeteksi.');
                }
            } else {
                showStatus('error', 'Gagal mengambil daftar port.');
            }
        } catch {
            showStatus('error', 'Gagal terhubung ke server.');
        } finally {
            setScanning(false);
        }
    }, [controllerId, showStatus]);

    const handleScan = useCallback(async () => {
        setScanning(true);
        setStatusMsg(null);
        try {
            const res = await fetch(route('tn.port.scan', controllerId), { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setSelectedPort(data.port);
                setLocalOnline(true);
                showStatus('success', data.message || `Port ${data.port} ditemukan.`);
                router.reload({ only: ['controller'] });
            } else {
                showStatus('error', data.message || 'Tidak ada port yang merespons.');
                if (data.available_ports?.length) setPorts(prev => prev.filter(p => data.available_ports.includes(p.device)));
            }
        } catch {
            showStatus('error', 'Gagal melakukan scan.');
        } finally {
            setScanning(false);
        }
    }, [controllerId, showStatus]);

    const handleTest = useCallback(async (port: string) => {
        setTesting(port);
        setStatusMsg(null);
        try {
            const res = await fetch(route('tn.port.test', controllerId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port }),
            });
            const data = await res.json();
            if (data.success) {
                setLocalOnline(true);
                showStatus('success', data.message);
                router.reload({ only: ['controller'] });
            } else {
                showStatus('error', data.message);
            }
        } catch {
            showStatus('error', 'Gagal menguji port.');
        } finally {
            setTesting(null);
        }
    }, [controllerId, showStatus]);

    const handleSelect = useCallback(async (port: string) => {
        try {
            const res = await fetch(route('tn.port.select', controllerId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port, mode: 'manual' }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedPort(port);
                setMode('manual');
                showStatus('success', data.message);
                router.reload({ only: ['controller'] });
            }
        } catch {
            showStatus('error', 'Gagal menyimpan port.');
        }
    }, [controllerId, showStatus]);

    const handleAutoMode = useCallback(async () => {
        try {
            const res = await fetch(route('tn.port.select', controllerId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port: '', mode: 'auto' }),
            });
            const data = await res.json();
            if (data.success) {
                setMode('auto');
                setSelectedPort(null);
                showStatus('success', data.message);
                router.reload({ only: ['controller'] });
            }
        } catch {
            showStatus('error', 'Gagal mengaktifkan mode auto.');
        }
    }, [controllerId, showStatus]);

    const handleWebSerialConnect = async () => {
        setWebSerialConnecting(true);
        setStatusMsg(null);

        try {
            await webSerialDriver.connect(undefined, { baudRate: 9600 });
            setIsWebSerialActive(true);
            setLocalOnline(true);
            showStatus('success', 'Berhasil terhubung ke USB RS485 melalui Web Serial API (Chrome/Edge)!');

            // Wire reading callback
            webSerialDriver.onReading = (decoded) => {
                setLastWebSerialTime(new Date().toLocaleTimeString());
                setLocalOnline(true);

                if (onReadingReceived) {
                    onReadingReceived(decoded);
                }
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('tn-webserial-reading', { detail: decoded }));
                }

                // Ingest to backend periodically
                fetch(route('tn.ingest-reading', controllerId), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                    },
                    body: JSON.stringify(decoded),
                }).catch(() => {});
            };

            webSerialDriver.onError = (err) => {
                showStatus('error', err);
            };

            webSerialDriver.startPolling(slaveId, 1000);
        } catch (err: any) {
            setIsWebSerialActive(false);
            showStatus('error', err?.message || 'Gagal membuka port serial.');
        } finally {
            setWebSerialConnecting(false);
        }
    };

    const handleWebSerialDisconnect = async () => {
        await webSerialDriver.disconnect();
        setIsWebSerialActive(false);
        showStatus('info', 'Koneksi Web Serial USB RS485 diputuskan.');
    };

    useEffect(() => {
        if (open) fetchPorts();
    }, [open, fetchPorts]);

    const portLabel = isWebSerialActive
        ? 'Web Serial (Browser)'
        : (currentPort || (mode === 'auto' ? 'Auto' : 'None'));

    return (
        <>
            <button onClick={() => setOpen(true)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-black shadow-sm transition-all ${localOnline || isWebSerialActive
                    ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
                title={`Port: ${portLabel}`}>
                Port: {portLabel}
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 sm:p-6"
                    onClick={() => setOpen(false)}>
                    
                    {/* Modal Main Box - Fixed Header Flex Layout */}
                    <div className="flex flex-col max-h-[85vh] w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        
                        {/* Pinned Fixed Header */}
                        <div className="flex shrink-0 items-center justify-between px-7 py-5 border-b border-slate-100 bg-white">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Serial Port Settings</h2>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">Konfigurasi koneksi Modbus RS485 controller Retort</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xl font-black text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0">&times;</button>
                        </div>

                        {/* Scrollable Body Content */}
                        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
                            
                            {/* Alert Notification */}
                            {statusMsg && (
                                <div className={`rounded-2xl px-4 py-3 text-xs font-extrabold border transition-all ${
                                    statusMsg.type === 'success' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                                    statusMsg.type === 'error' ? 'bg-rose-100 text-rose-900 border-rose-200' :
                                    'bg-blue-100 text-blue-900 border-blue-200'
                                }`}>
                                    {statusMsg.text}
                                </div>
                            )}

                            {/* Web Serial Direct Browser Connection Card (Recommended for SaaS/VPS) */}
                            <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/50 p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                                            <Laptop size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Koneksi USB Langsung (Web Serial Browser)</h3>
                                            <p className="text-[11px] font-semibold text-slate-600">Hubungkan USB RS485 di PC Anda langsung via browser (Chrome/Edge)</p>
                                        </div>
                                    </div>
                                    {isWebSerialActive && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            AKTIF
                                        </span>
                                    )}
                                </div>

                                {!isWebSerialSupported ? (
                                    <div className="rounded-2xl bg-amber-100/70 border border-amber-300 p-3 text-xs text-amber-900 font-semibold">
                                        Browser Anda tidak mendukung Web Serial API. Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di PC Anda untuk koneksi langsung.
                                    </div>
                                ) : isWebSerialActive ? (
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between text-xs font-semibold bg-white/80 border border-emerald-200 rounded-2xl p-3">
                                            <div className="flex items-center gap-2 text-emerald-800 font-bold">
                                                <CheckCircle size={15} />
                                                <span>Terhubung & Streaming Data Modbus RTU (9600 bps)</span>
                                            </div>
                                            {lastWebSerialTime && (
                                                <span className="text-[11px] text-slate-500 font-mono">Sync: {lastWebSerialTime}</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleWebSerialDisconnect}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 text-xs shadow-md transition-all cursor-pointer"
                                        >
                                            <Power size={14} />
                                            <span>Putuskan Koneksi USB Browser</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-1">
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            Klik tombol di bawah untuk memilih port converter USB RS485 yang tertancap di PC Anda:
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleWebSerialConnect}
                                            disabled={webSerialConnecting}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3 text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            <Usb size={15} className={webSerialConnecting ? 'animate-spin' : ''} />
                                            <span>{webSerialConnecting ? 'Membuka Port Serial...' : 'Pilih & Hubungkan USB RS485 (Web Serial)'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Current Connection Status Box */}
                            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5">
                                <h3 className="mb-3 text-[11px] font-black text-slate-700 uppercase tracking-wider">Status Port Server</h3>
                                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                                    <div>
                                        <span className="text-slate-500">Status Server:</span>{' '}
                                        <span className={`font-black ${localOnline ? 'text-emerald-700 font-black' : 'text-rose-700'}`}>
                                            {localOnline ? 'Connected' : 'Disconnected'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Port Terdaftar:</span>{' '}
                                        <span className="font-mono font-black text-blue-700">{portLabel}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Mode:</span>{' '}
                                        <span className="font-black text-slate-800">{mode === 'auto' ? 'Auto Detect' : 'Manual'}</span>
                                    </div>
                                    {lastError && !isWebSerialActive && (
                                        <div className="col-span-2 mt-1 pt-2.5 border-t border-slate-200/80">
                                            <span className="text-rose-700 font-extrabold block mb-1">Pesan Error Terakhir:</span>
                                            <span className="text-rose-800 font-mono text-[11px] bg-rose-50/80 border border-rose-200 p-2.5 rounded-xl block leading-relaxed">{lastError}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scan Action Controls */}
                            <div className="flex gap-3">
                                <button onClick={handleScan} disabled={scanning}
                                    className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50 shadow-sm transition-all">
                                    {scanning ? 'Scanning...' : 'Scan Ports'}
                                </button>
                                <button onClick={handleAutoMode}
                                    className={`rounded-xl border px-5 py-2.5 text-xs font-black transition-all ${mode === 'auto' ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-sm' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                                    Auto Mode
                                </button>
                            </div>

                            {/* Available Ports List */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Daftar Port Tersedia</h3>
                                {scanning && ports.length === 0 ? (
                                    <div className="py-8 text-center text-xs font-bold text-slate-400">Scanning serial ports...</div>
                                ) : ports.length === 0 ? (
                                    <div className="py-8 text-center text-xs font-bold text-slate-400 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 p-6">
                                        Tidak ada port terdeteksi. Klik "Scan Ports" untuk mencari perangkat Modbus RS485.
                                    </div>
                                ) : (
                                    ports.map(p => (
                                        <div key={p.device}
                                            className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                                                selectedPort === p.device ? 'border-amber-400 bg-amber-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'
                                            }`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-slate-900 text-sm">{p.device}</span>
                                                    {selectedPort === p.device && (
                                                        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-950">AKTIF</span>
                                                    )}
                                                </div>
                                                <p className="truncate text-xs font-medium text-slate-600 mt-0.5">{p.description || p.hwid || 'No description'}</p>
                                                {p.manufacturer && (
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.manufacturer}{p.serial_number ? ` - SN: ${p.serial_number}` : ''}</p>
                                                )}
                                            </div>
                                            <div className="ml-4 flex gap-2 shrink-0">
                                                <button onClick={() => handleTest(p.device)} disabled={testing === p.device}
                                                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm">
                                                    {testing === p.device ? 'Testing...' : 'Test'}
                                                </button>
                                                <button onClick={() => handleSelect(p.device)}
                                                    className="rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-blue-800 shadow-sm">
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
