import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wrench, CheckCircle2, AlertCircle, Play, Sparkles, RefreshCw, Cpu, Activity } from 'lucide-react';

interface PinChannel {
    name: string;
    pin: string;
    type: 'out' | 'alarm';
    label: string;
}

const PIN_SCHEMAS: Record<string, {
    title: string;
    dimension: string;
    rs485A: string;
    rs485B: string;
    power: string;
    channels: PinChannel[];
}> = {
    TNS: {
        title: 'TNS Controller (48×48 mm)',
        dimension: 'Compact 48×48 mm',
        rs485A: 'Terminal Skrup A (+)',
        rs485B: 'Terminal Skrup B (-)',
        power: 'Terminal 5–6 (220V AC)',
        channels: [
            { name: 'OUT1', pin: '1–2', type: 'out', label: 'Control OUT1 (Heater Output)' },
            { name: 'OUT2', pin: '3–4', type: 'out', label: 'Control OUT2 (Cooler Output)' },
            { name: 'AL1', pin: '13–14', type: 'alarm', label: 'Alarm 1 Relay Output' },
            { name: 'AL2', pin: '15–16', type: 'alarm', label: 'Alarm 2 Relay Output' },
        ]
    },
    TNH: {
        title: 'TNH Controller (48×96 mm)',
        dimension: 'Vertical 48×96 mm',
        rs485A: 'Pin 13 (A+)',
        rs485B: 'Pin 14 (B-)',
        power: 'Pin 11–12 (220V AC)',
        channels: [
            { name: 'OUT1', pin: '3–4', type: 'out', label: 'Control OUT1 (Heater Output)' },
            { name: 'OUT2', pin: '5–6', type: 'out', label: 'Control OUT2 (Cooler Output)' },
            { name: 'AL1', pin: '7–8', type: 'alarm', label: 'Alarm 1 Relay Output' },
            { name: 'AL2', pin: '9–10', type: 'alarm', label: 'Alarm 2 Relay Output' },
            { name: 'AL3', pin: '15–16', type: 'alarm', label: 'Alarm 3 Relay Output' },
            { name: 'AL4', pin: '17–18', type: 'alarm', label: 'Alarm 4 / Trans. Output' },
        ]
    },
    TNL: {
        title: 'TNL Controller (96×96 mm)',
        dimension: 'Large 96×96 mm',
        rs485A: 'Pin 14 (A+)',
        rs485B: 'Pin 13 (B-)',
        power: 'Pin 11–12 (220V AC)',
        channels: [
            { name: 'OUT1', pin: '3–4', type: 'out', label: 'Control OUT1 (Heater Output)' },
            { name: 'OUT2', pin: '5–6', type: 'out', label: 'Control OUT2 (Cooler Output)' },
            { name: 'AL1', pin: '7–8', type: 'alarm', label: 'Alarm 1 Relay Output' },
            { name: 'AL2', pin: '9–10', type: 'alarm', label: 'Alarm 2 Relay Output' },
            { name: 'AL3', pin: 'AL3 (Opt)', type: 'alarm', label: 'Alarm 3 Relay Output' },
            { name: 'AL4', pin: 'AL4 (Opt)', type: 'alarm', label: 'Alarm 4 Relay Output' },
            { name: 'AL5', pin: 'AL5 (Opt)', type: 'alarm', label: 'Alarm 5 Relay Output' },
            { name: 'AL6', pin: 'AL6 (Opt)', type: 'alarm', label: 'Alarm 6 Relay Output' },
        ]
    }
};

interface Props {
    controllerId: number;
    model: string;
    serialPort: string | null;
    isOnline: boolean;
    onClose: () => void;
}

export default function ControllerPinTestModal({ controllerId, model, serialPort, isOnline, onClose }: Props) {
    const schema = PIN_SCHEMAS[model.toUpperCase()] || PIN_SCHEMAS.TNL;
    const [activeTab, setActiveTab] = useState<'test' | 'wiring'>('test');
    const [testingChannel, setTestingChannel] = useState<string | null>(null);
    const [testingPort, setTestingPort] = useState(false);
    const [logs, setLogs] = useState<Array<{ id: number; time: string; text: string; success: boolean }>>([
        {
            id: 1,
            time: new Date().toLocaleTimeString(),
            text: `Pin test bench siap untuk ${schema.title}. Mode komunikasi: ${serialPort || 'Auto-Detect'}`,
            success: true
        }
    ]);

    const addLog = (text: string, success: boolean) => {
        setLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), text, success },
            ...prev.slice(0, 25)
        ]);
    };

    const handleTestPort = async () => {
        setTestingPort(true);
        addLog(`Memulai test koneksi Modbus RTU ke ${schema.title}...`, true);
        try {
            const res = await fetch(route('tn.port.test', controllerId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port: serialPort || 'COM6' })
            });
            const data = await res.json();
            if (data.success) {
                addLog(data.message || `Koneksi Berhasil! Controller merespons.`, true);
            } else {
                addLog(data.message || `Koneksi Gagal. Cek kabel serial RS485.`, false);
            }
        } catch (err: any) {
            addLog(`Error saat test koneksi: ${err.message}`, false);
        } finally {
            setTestingPort(false);
        }
    };

    const handleTogglePin = async (channel: string, pin: string) => {
        setTestingChannel(channel);
        addLog(`Mengirim sinyal ON ke ${channel} (Terminal ${pin}) selama 2 detik...`, true);
        try {
            const res = await fetch(route('tn.port.toggle-pin', controllerId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel, port: serialPort || '' })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`PASS: ${channel} (Terminal ${pin}) berhasil di-trigger aktif 2 detik.`, true);
            } else {
                addLog(`FAIL: ${data.message || 'Gagal memicu pin output'}`, false);
            }
        } catch (err: any) {
            addLog(`FAIL: Error koneksi saat toggle ${channel}: ${err.message}`, false);
        } finally {
            setTestingChannel(null);
        }
    };

    const handleSweepAll = async () => {
        addLog(`Memulai Sweep Test semua pin output (${schema.channels.length} kanal)...`, true);
        for (const ch of schema.channels) {
            await handleTogglePin(ch.name, ch.pin);
            await new Promise(r => setTimeout(r, 600));
        }
        addLog(`Sweep test selesai untuk seluruh pin output ${model}.`, true);
    };

    return typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6" onClick={onClose}>
            <div className="flex flex-col max-h-[90vh] w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between px-7 py-5 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                            <Cpu size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-white">{schema.title}</h2>
                                <span className="rounded-full bg-blue-500/20 border border-blue-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-400">
                                    Pin Test Bench
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                Port: <span className="text-amber-400 font-mono font-bold">{serialPort || 'Auto-Detect'}</span> · Status: {isOnline ? <span className="text-emerald-400 font-bold">Online</span> : <span className="text-rose-400 font-bold">Standby/Disconnected</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xl font-black text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        &times;
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/30 px-7 pt-2 gap-3 text-xs font-bold">
                    <button onClick={() => setActiveTab('test')} className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'test' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                        <Play size={14} /> Pengujian Pin & Output
                    </button>
                    <button onClick={() => setActiveTab('wiring')} className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'wiring' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                        <Wrench size={14} /> Panduan Wiring Terminal {model}
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-7 space-y-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                    {activeTab === 'test' ? (
                        <>
                            {/* Actions Top Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <button onClick={handleTestPort} disabled={testingPort}
                                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all disabled:opacity-50">
                                        <RefreshCw size={14} className={testingPort ? "animate-spin" : ""} />
                                        {testingPort ? "Testing Port..." : "Test Koneksi RS485"}
                                    </button>
                                    <button onClick={handleSweepAll} disabled={testingChannel !== null}
                                        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg transition-all disabled:opacity-50">
                                        <Sparkles size={14} />
                                        Sweep Semua Pin
                                    </button>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400">
                                    Klik tombol pin di bawah untuk toggle 2 detik
                                </span>
                            </div>

                            {/* Pin Interactive Grid */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Daftar Pin Terminal {model}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {schema.channels.map(ch => (
                                        <div key={ch.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-base text-white">{ch.name}</span>
                                                    <span className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-400">
                                                        Terminal {ch.pin}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{ch.label}</p>
                                            </div>
                                            <button
                                                onClick={() => handleTogglePin(ch.name, ch.pin)}
                                                disabled={testingChannel !== null}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-black shadow-md transition-all shrink-0 ${
                                                    testingChannel === ch.name
                                                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                                                        : ch.type === 'out'
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                                                }`}
                                            >
                                                {testingChannel === ch.name ? 'Aktif...' : 'Test ON'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Console Output */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <Activity size={14} className="text-amber-400" /> Log Pengujian Hardware
                                    </h3>
                                    <button onClick={() => setLogs([])} className="text-[11px] font-bold text-slate-500 hover:text-slate-300">
                                        Bersihkan
                                    </button>
                                </div>
                                <div className="h-44 overflow-y-auto rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs space-y-1.5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
                                    {logs.length === 0 ? (
                                        <p className="text-slate-600 italic">Belum ada aktivitas pengujian.</p>
                                    ) : (
                                        logs.map(l => (
                                            <div key={l.id} className="flex items-start gap-2 leading-relaxed">
                                                <span className="text-slate-500 shrink-0">[{l.time}]</span>
                                                <span className={l.success ? "text-emerald-400" : "text-rose-400 font-bold"}>
                                                    {l.text}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Wiring Diagram Tab */
                        <div className="space-y-6 text-sm">
                            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5 space-y-4">
                                <h3 className="font-bold text-amber-400 text-base">Skema Wiring Fisik Autonics {schema.title}</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-blue-400">1. Komunikasi Serial RS485</span>
                                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                                            • USB Converter A(+) ──▶ <b>{schema.rs485A}</b><br/>
                                            • USB Converter B(-) ──▶ <b>{schema.rs485B}</b>
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">2. Power Listrik Utama</span>
                                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                                            • PLN 100–240V AC ──▶ <b>{schema.power}</b>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
                                <h3 className="font-bold text-slate-200 text-sm mb-3">Tabel Terminal Pin Output</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400">
                                                <th className="py-2.5 px-3">Kanal</th>
                                                <th className="py-2.5 px-3">Terminal Pin {model}</th>
                                                <th className="py-2.5 px-3">Fungsi & Beban</th>
                                                <th className="py-2.5 px-3">Tipe Output</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                            {schema.channels.map(ch => (
                                                <tr key={ch.name} className="hover:bg-slate-900/50">
                                                    <td className="py-2.5 px-3 font-bold text-amber-400">{ch.name}</td>
                                                    <td className="py-2.5 px-3 font-bold text-white">{ch.pin}</td>
                                                    <td className="py-2.5 px-3 text-slate-400">{ch.label}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ch.type === 'out' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}`}>
                                                            {ch.type === 'out' ? 'SSR / Relay Control' : 'Relay Alarm (Dry Contact)'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-slate-800 bg-slate-950/60">
                    <span className="text-xs text-slate-500 font-medium">
                        Autonics TN Series Testing Utility · Retort SCADA System
                    </span>
                    <button onClick={onClose} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-bold text-slate-200 transition-colors">
                        Tutup
                    </button>
                </div>

            </div>
        </div>,
        document.body
    ) : null;
}
