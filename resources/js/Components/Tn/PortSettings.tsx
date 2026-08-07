import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';

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
}

export default function PortSettings({ controllerId, currentPort, isOnline, lastError }: Props) {
    const [open, setOpen] = useState(false);
    const [ports, setPorts] = useState<PortInfo[]>([]);
    const [scanning, setScanning] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [mode, setMode] = useState<'auto' | 'manual'>(currentPort ? 'manual' : 'auto');
    const [selectedPort, setSelectedPort] = useState<string | null>(currentPort);

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
                showStatus('success', data.message);
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

    useEffect(() => {
        if (open) fetchPorts();
    }, [open, fetchPorts]);

    const portLabel = currentPort || (mode === 'auto' ? 'Auto' : 'None');

    return (
        <>
            <button onClick={() => setOpen(true)}
                className={`rounded-xl border px-4 py-2 text-xs font-black shadow-sm transition-all ${isOnline
                    ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
                title={`Port: ${portLabel}`}>
                Port: {portLabel}
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4"
                    onClick={() => setOpen(false)}>
                    <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl border border-slate-200"
                        onClick={e => e.stopPropagation()}>
                        <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Serial Port Settings</h2>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">Konfigurasi koneksi Modbus RS485 controller Retort</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500 hover:bg-slate-200 transition-colors">&times;</button>
                        </div>

                        {statusMsg && (
                            <div className={`mb-5 rounded-2xl px-4 py-3 text-xs font-extrabold border ${
                                statusMsg.type === 'success' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                statusMsg.type === 'error' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                                {statusMsg.text}
                            </div>
                        )}

                        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <h3 className="mb-3 text-xs font-black text-slate-700 uppercase tracking-wider">Status Koneksi</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                                <div>
                                    <span className="text-slate-500">Status:</span>{' '}
                                    <span className={`font-black ${isOnline ? 'text-amber-700' : 'text-rose-700'}`}>
                                        {isOnline ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Port Aktif:</span>{' '}
                                    <span className="font-mono font-black text-blue-700">{portLabel}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Mode:</span>{' '}
                                    <span className="font-black text-slate-800">{mode === 'auto' ? 'Auto Detect' : 'Manual'}</span>
                                </div>
                                {lastError && (
                                    <div className="col-span-2 mt-1 pt-2 border-t border-slate-200/80">
                                        <span className="text-rose-700 font-bold block mb-1">Pesan Error Terakhir:</span>
                                        <span className="text-rose-800 font-mono text-[11px] bg-rose-50 border border-rose-200 p-2.5 rounded-xl block leading-relaxed">{lastError}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 flex gap-3">
                            <button onClick={handleScan} disabled={scanning}
                                className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50 shadow-sm transition-all">
                                {scanning ? 'Scanning...' : 'Scan Ports'}
                            </button>
                            <button onClick={handleAutoMode}
                                className={`rounded-xl border px-5 py-2.5 text-xs font-black transition-all ${mode === 'auto' ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-sm' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                                Auto Mode
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Daftar Port Tersedia</h3>
                            {scanning && ports.length === 0 ? (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">Scanning serial ports...</div>
                            ) : ports.length === 0 ? (
                                <div className="py-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
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
                </div>,
                document.body
            )}
        </>
    );
}
