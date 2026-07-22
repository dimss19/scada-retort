import React, { useState, useEffect, useCallback } from 'react';
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
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${isOnline
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                title={`Port: ${portLabel}`}>
                Port: {portLabel}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setOpen(false)}>
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}>
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">Port Settings</h2>
                            <button onClick={() => setOpen(false)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        {statusMsg && (
                            <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                                statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                                {statusMsg.text}
                            </div>
                        )}

                        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="mb-3 text-sm font-bold text-slate-700">Current Status</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-slate-500">Status:</span>{' '}
                                    <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {isOnline ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Port:</span>{' '}
                                    <span className="font-mono font-semibold text-slate-700">{portLabel}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Mode:</span>{' '}
                                    <span className="font-semibold text-slate-700">{mode === 'auto' ? 'Auto Detect' : 'Manual'}</span>
                                </div>
                                {lastError && (
                                    <div className="col-span-2">
                                        <span className="text-slate-500">Last Error:</span>{' '}
                                        <span className="text-red-600 text-xs">{lastError}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-5 flex gap-2">
                            <button onClick={handleScan} disabled={scanning}
                                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                                {scanning ? 'Scanning...' : 'Scan Ports'}
                            </button>
                            <button onClick={handleAutoMode}
                                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${mode === 'auto' ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                                Auto Mode
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700">Available Ports</h3>
                            {scanning && ports.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-400">Scanning ports...</div>
                            ) : ports.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-400">
                                    No ports detected. Click "Scan Ports" to search for Modbus devices.
                                </div>
                            ) : (
                                ports.map(p => (
                                    <div key={p.device}
                                        className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                                            selectedPort === p.device ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 hover:border-slate-300'
                                        }`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-800">{p.device}</span>
                                                {selectedPort === p.device && (
                                                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">ACTIVE</span>
                                                )}
                                            </div>
                                            <p className="truncate text-xs text-slate-500">{p.description || p.hwid || 'No description'}</p>
                                            {p.manufacturer && (
                                                <p className="text-[10px] text-slate-400">{p.manufacturer}{p.serial_number ? ` - SN: ${p.serial_number}` : ''}</p>
                                            )}
                                        </div>
                                        <div className="ml-3 flex gap-2 shrink-0">
                                            <button onClick={() => handleTest(p.device)} disabled={testing === p.device}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                                                {testing === p.device ? 'Testing...' : 'Test'}
                                            </button>
                                            <button onClick={() => handleSelect(p.device)}
                                                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
