import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    Cable,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    X,
    Activity,
    Check,
    Cpu,
    HelpCircle
} from 'lucide-react';

interface SystemPort {
    device: string;
    description: string;
    manufacturer?: string;
    hwid?: string;
}

interface Props {
    controllerId: number;
    activePort?: string | null;
    isOnline: boolean;
    onClose: () => void;
    onPortChanged: (newPort: string) => void;
}

export default function UsbPortModal({
    controllerId,
    activePort,
    isOnline,
    onClose,
    onPortChanged,
}: Props) {
    const [ports, setPorts] = useState<SystemPort[]>([]);
    const [loadingPorts, setLoadingPorts] = useState<boolean>(true);
    const [scanning, setScanning] = useState<boolean>(false);
    const [selectingPort, setSelectingPort] = useState<string | null>(null);
    const [testingPort, setTestingPort] = useState<string | null>(null);
    const [currentPort, setCurrentPort] = useState<string | null>(activePort || null);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; pv?: number | null }>>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const fetchPortList = async () => {
        setLoadingPorts(true);
        try {
            const res = await axios.get(route('tn.port.list', controllerId));
            if (res.data?.success && Array.isArray(res.data.ports)) {
                setPorts(res.data.ports);
            }
        } catch (err: any) {
            console.error('Gagal mengambil daftar port:', err);
            setNotification({
                type: 'error',
                message: 'Gagal membaca daftar port dari sistem VPS: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setLoadingPorts(false);
        }
    };

    useEffect(() => {
        fetchPortList();
    }, [controllerId]);

    const handleScanPorts = async () => {
        setScanning(true);
        setNotification({
            type: 'info',
            message: 'Sedang memindai seluruh port USB/Serial di VPS...',
        });

        try {
            const res = await axios.post(route('tn.port.scan', controllerId));
            const data = res.data;

            if (data.success && data.port) {
                setCurrentPort(data.port);
                onPortChanged(data.port);
                setNotification({
                    type: 'success',
                    message: data.message || `Port ${data.port} ditemukan dan merespons! Port telah dihubungkan.`,
                });
                await fetchPortList();
            } else {
                setNotification({
                    type: 'error',
                    message: data.message || 'Tidak ada port yang merespons perintah Modbus. Silakan pilih port secara manual di bawah.',
                });
                await fetchPortList();
            }
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: 'Gagal melakukan scan port: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setScanning(false);
        }
    };

    const handleSelectPort = async (portName: string) => {
        setSelectingPort(portName);
        try {
            const res = await axios.post(route('tn.port.select', controllerId), {
                port: portName,
                mode: 'manual',
            });

            if (res.data?.success) {
                setCurrentPort(portName);
                onPortChanged(portName);
                setNotification({
                    type: 'success',
                    message: `Port aktif berhasil disetel ke ${portName}. Telemetri akan menggunakan port ini.`,
                });
            } else {
                setNotification({
                    type: 'error',
                    message: res.data?.message || 'Gagal mengubah port.',
                });
            }
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: 'Gagal memilih port: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setSelectingPort(null);
        }
    };

    const handleAutoMode = async () => {
        setSelectingPort('AUTO');
        try {
            const res = await axios.post(route('tn.port.select', controllerId), {
                port: '',
                mode: 'auto',
            });

            if (res.data?.success) {
                setCurrentPort(null);
                onPortChanged('AUTO');
                setNotification({
                    type: 'success',
                    message: 'Mode Auto-Detect diaktifkan. Sistem akan memindai port otomatis saat polling.',
                });
            }
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: 'Gagal menyetel mode auto: ' + (err.response?.data?.message || err.message),
            });
        } finally {
            setSelectingPort(null);
        }
    };

    const handleTestPort = async (portName: string) => {
        setTestingPort(portName);
        try {
            const res = await axios.post(route('tn.port.test', controllerId), {
                port: portName,
            });
            const data = res.data;

            setTestResults(prev => ({
                ...prev,
                [portName]: {
                    success: Boolean(data.success),
                    message: data.message || (data.success ? 'Koneksi berhasil merespons!' : 'Koneksi gagal merespons.'),
                    pv: data.pv,
                }
            }));

            if (data.success) {
                onPortChanged(portName);
            }
        } catch (err: any) {
            setTestResults(prev => ({
                ...prev,
                [portName]: {
                    success: false,
                    message: 'Error pengujian: ' + (err.response?.data?.message || err.message),
                }
            }));
        } finally {
            setTestingPort(null);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col max-h-[90vh] w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                            <Cable size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900">Deteksi Port USB & Serial</h2>
                                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                                    VPS Linux / System
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                Port serial yang terhubung ke server VPS untuk komunikasi Modbus RTU retort.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                        title="Tutup Modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Status Port Aktif Bar */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Port Aktif Digunakan:</span>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="text-base font-black font-mono text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                    {currentPort || 'AUTO (Auto-Detect)'}
                                </code>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${
                                    isOnline
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border-rose-200'
                                }`}>
                                    <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                    {isOnline ? 'Terhubung' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={scanning}
                                onClick={handleScanPorts}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
                                <span>{scanning ? 'Memindai Port...' : 'Scan Ulang Port'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {notification && (
                        <div className={`rounded-2xl border p-3.5 text-xs flex items-start gap-2.5 shadow-sm transition-all ${
                            notification.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : notification.type === 'error'
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : 'bg-blue-50 border-blue-200 text-blue-900 animate-pulse'
                        }`}>
                            {notification.type === 'success' ? (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            ) : notification.type === 'error' ? (
                                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                                <RefreshCw size={16} className="animate-spin text-blue-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 font-semibold leading-relaxed">
                                {notification.message}
                            </div>
                            <button
                                type="button"
                                onClick={() => setNotification(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Section Daftar Port */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Daftar Port Terdeteksi di Sistem ({ports.length})
                            </h3>
                            <button
                                type="button"
                                onClick={fetchPortList}
                                disabled={loadingPorts}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                            >
                                <RefreshCw size={11} className={loadingPorts ? 'animate-spin' : ''} />
                                <span>Refresh List</span>
                            </button>
                        </div>

                        {loadingPorts ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-500">Membaca daftar port dari sistem VPS...</p>
                            </div>
                        ) : ports.length === 0 ? (
                            <div className="p-6 text-center bg-amber-50/60 rounded-2xl border border-amber-200">
                                <AlertCircle size={32} className="text-amber-600 mx-auto mb-2" />
                                <p className="text-sm font-black text-amber-900">Belum Ada Port USB Terdeteksi di VPS</p>
                                <p className="text-xs font-medium text-amber-800 mt-1 max-w-md mx-auto">
                                    Pastikan adapter USB-to-RS485 sudah dicolokkan ke server VPS. Di Ubuntu VPS biasanya terbaca sebagai <code className="bg-amber-100 font-mono px-1 rounded">/dev/ttyUSB0</code> atau <code className="bg-amber-100 font-mono px-1 rounded">/dev/ttyACM0</code>.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleScanPorts}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-black shadow-sm"
                                >
                                    <RefreshCw size={13} />
                                    <span>Coba Scan Ulang</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {/* Opsi Auto-Detect */}
                                <div
                                    className={`rounded-2xl border p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                        !currentPort || currentPort === 'AUTO'
                                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                                            <Cpu size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-sm text-slate-900">Auto-Detect Mode</span>
                                                {(!currentPort || currentPort === 'AUTO') && (
                                                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                                Sistem otomatis memindai seluruh port USB yang ada dan memilih yang merespons data Modbus.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={selectingPort === 'AUTO' || (!currentPort || currentPort === 'AUTO')}
                                        onClick={handleAutoMode}
                                        className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all shrink-0 ${
                                            (!currentPort || currentPort === 'AUTO')
                                                ? 'bg-slate-200 text-slate-500 cursor-default'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                                        }`}
                                    >
                                        {selectingPort === 'AUTO' ? 'Menyetel...' : (!currentPort || currentPort === 'AUTO') ? 'Sedang Digunakan' : 'Gunakan Auto-Detect'}
                                    </button>
                                </div>

                                {/* List Port Individual */}
                                {ports.map((p) => {
                                    const isSelected = currentPort === p.device;
                                    const testRes = testResults[p.device];
                                    const isTesting = testingPort === p.device;
                                    const isSelecting = selectingPort === p.device;

                                    return (
                                        <div
                                            key={p.device}
                                            className={`rounded-2xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                                                        isSelected
                                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                                            : 'bg-slate-100 border-slate-200 text-slate-600'
                                                    }`}>
                                                        <Cable size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <code className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                {p.device}
                                                            </code>
                                                            {isSelected && (
                                                                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Check size={10} /> Aktif
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-600 mt-1">
                                                            {p.description || 'USB Serial Device'}
                                                        </p>
                                                        {p.manufacturer && p.manufacturer !== 'Generic' && (
                                                            <p className="text-[11px] font-medium text-slate-400">
                                                                Chipset / Produsen: {p.manufacturer}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                    <button
                                                        type="button"
                                                        disabled={isTesting}
                                                        onClick={() => handleTestPort(p.device)}
                                                        className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                                        title="Uji apakah controller merespons pada port ini"
                                                    >
                                                        <Activity size={13} className={isTesting ? 'animate-pulse text-amber-500' : 'text-blue-600'} />
                                                        <span>{isTesting ? 'Menguji...' : 'Test Port'}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isSelecting || isSelected}
                                                        onClick={() => handleSelectPort(p.device)}
                                                        className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
                                                            isSelected
                                                                ? 'bg-emerald-600 text-white cursor-default'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                    >
                                                        {isSelecting ? 'Memilih...' : isSelected ? 'Port Terpilih' : 'Gunakan Port Ini'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Test result display */}
                                            {testRes && (
                                                <div className={`mt-2 rounded-xl border p-2.5 text-xs flex items-center gap-2 ${
                                                    testRes.success
                                                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-bold'
                                                        : 'bg-rose-100/70 border-rose-300 text-rose-900 font-semibold'
                                                }`}>
                                                    {testRes.success ? (
                                                        <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                                                    ) : (
                                                        <AlertCircle size={14} className="text-rose-700 shrink-0" />
                                                    )}
                                                    <span>{testRes.message}</span>
                                                    {testRes.pv !== null && testRes.pv !== undefined && (
                                                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 font-black ml-auto">
                                                            PV: {testRes.pv} °C
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
                    <p className="text-xs text-slate-500 font-medium">
                        Perubahan port langsung disimpan dan diaplikasikan ke monitoring retort.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-black shadow-sm transition-all"
                    >
                        Tutup Pop-up
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
