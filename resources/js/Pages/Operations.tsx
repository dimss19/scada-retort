import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Gauge,
    Settings,
    ThermometerSun,
    Wind,
    Wrench,
    Factory,
    Snowflake,
    ArrowDown,
    Database as DatabaseIcon,
    CheckCircle,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import React from 'react';

type Module = 'scada' | 'historian' | 'alarm' | 'notifications' | 'database';
type Props = { module: Module; histories?: any[] };

type FlowItem = {
    icon: ReactNode;
    label: string;
    value: string;
};

type BadgeTone = 'green' | 'amber' | 'red' | 'blue';

const Badge = ({ children, tone = 'green' }: { children: ReactNode; tone?: BadgeTone }) => {
    const colors: Record<BadgeTone, string> = {
        green: 'bg-amber-100 text-amber-900 border border-amber-300',
        amber: 'bg-amber-100 text-amber-900 border border-amber-300',
        red: 'bg-rose-100 text-rose-800 border border-rose-200',
        blue: 'bg-blue-100 text-blue-800 border border-blue-200',
    };

    return <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-extrabold ${colors[tone]}`}>{children}</span>;
};

const Panel = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
    <section className={`rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-lg backdrop-blur-xl ${className}`}>
        {title && <h3 className="mb-4 text-xl font-extrabold text-slate-900">{title}</h3>}
        {children}
    </section>
);

const Scada = () => {
    const flow: FlowItem[] = [
        { icon: <Gauge size={20} className="text-cyan-600" />, label: 'Water Tank', value: '82%' },
        { icon: <Settings size={20} className="text-blue-600" />, label: 'Pump', value: 'Running' },
        { icon: <ThermometerSun size={20} className="text-red-500" />, label: 'Boiler', value: '121.4 °C' },
        { icon: <Wind size={20} className="text-slate-500" />, label: 'Steam Pipe', value: '1.8 bar' },
        { icon: <Wrench size={20} className="text-amber-600" />, label: 'Steam Valve', value: 'Open' },
        { icon: <Factory size={20} className="text-emerald-600" />, label: 'Retort', value: '120.8 °C' },
        { icon: <Snowflake size={20} className="text-blue-400" />, label: 'Cooling', value: 'Standby' },
        { icon: <ArrowDown size={20} className="text-slate-600" />, label: 'Drain', value: 'Closed' },
    ];

    return (
        <>
            <Panel>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800">Realtime Mimic Diagram</h3>
                        <p className="text-sm text-slate-500">Live process overview · updated just now</p>
                    </div>
                    <Badge tone="green">System Online</Badge>
                </div>
                <div className="flex flex-col items-center">
                    {flow.map((item, index) => (
                        <div key={item.label} className="contents">
                            <div className="flex w-full max-w-xl items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
                                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-100">
                                    {item.icon}
                                </span>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{item.label}</p>
                                    <p className="text-xs text-slate-500">Realtime object</p>
                                </div>
                                <span className="font-mono text-sm font-semibold text-cyan-700">{item.value}</span>
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            </div>
                            {index < flow.length - 1 && <div className="relative h-7"><ArrowDown size={16} className="absolute left-[-8px] top-3 text-cyan-500 rotate-90" /></div>}
                        </div>
                    ))}
                </div>
            </Panel>
        </>
    );
};

function Historian({ histories = [] }: { histories?: any[] }) {
    const [period, setPeriod] = useState('Hari');
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const formatValue = (val: number | undefined, dp: number = 0) => {
        if (val === undefined || val === 31000 || val === 30000 || val === -30000) return '-';
        return (val / Math.pow(10, dp)).toFixed(dp).replace('.', ',');
    };

    const getChronologicalLogs = (batch: any) => {
        return [...(batch.log_data || [])].sort((a: any, b: any) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    };

    const handleDownload = (batch: any, format: 'csv' | 'excel' | 'pdf') => {
        const logs = getChronologicalLogs(batch);
        if (!logs.length) {
            alert('No data points in this batch.');
            return;
        }

        const headers = ['Time', 'PV (C)', 'SV (C)'];
        const rows = logs.map((log: any) => [
            new Date(log.created_at).toLocaleTimeString(),
            formatValue(log.pv, log.decimal_point),
            formatValue(log.sv, log.decimal_point)
        ]);

        if (format === 'csv' || format === 'excel') {
            const csvContent = "data:text/csv;charset=utf-8,"
                + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `batch_${batch.id}_${format === 'csv' ? 'log.csv' : 'log.csv'}`); // Excel opens CSV natively
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const title = `Batch Log Report: ${batch.controller?.machine?.machine_name || batch.controller?.model_type || 'Controller'}`;
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: sans-serif; padding: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                            th { background-color: #f0f0f0; }
                        </style>
                    </head>
                    <body>
                        <h2>${title}</h2>
                        <p>Start Time: ${new Date(batch.start_time).toLocaleString()}</p>
                        <p>End Time: ${new Date(batch.end_time).toLocaleString()}</p>
                        <table>
                            <thead>
                                <tr><th>Time</th><th>PV (&deg;C)</th><th>SV (&deg;C)</th></tr>
                            </thead>
                            <tbody>
                                ${rows.map((r: any) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
                            </tbody>
                        </table>
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this process history?')) {
            router.delete(route('tn.history.destroy', id));
        }
    };

    // Close active menu when clicking anywhere on screen
    useEffect(() => {
        const closeMenu = () => setActiveMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);
    return (
        <div className="space-y-6">
            <Panel>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">Filter Periode</label>
                        <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
                            {['Hari', 'Minggu', 'Bulan'].map((x) => (
                                <button key={x} onClick={() => setPeriod(x)} className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${period === x ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                                    {x}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">Tanggal Kustom</label>
                        <input type="date" className="rounded-xl border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 shadow-sm focus:border-blue-600 focus:ring-blue-600 py-2 px-3" />
                    </div>
                </div>
            </Panel>

            <Panel title="Process Batches (Heating Logs)">
                <div className="overflow-x-auto min-h-[280px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] text-white">
                            <tr>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-tl-2xl">Mesin / Controller</th>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider">Waktu Mulai</th>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider">Waktu Selesai</th>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider">Durasi</th>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider">Data Points</th>
                                <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-right rounded-tr-2xl">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {histories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-xs font-bold text-slate-400">Belum ada riwayat proses tercatat.</td>
                                </tr>
                            ) : (
                                histories.map((h) => {
                                    const start = new Date(h.start_time);
                                    const end = new Date(h.end_time);
                                    const durationMins = ((end.getTime() - start.getTime()) / 60000).toFixed(1);

                                    return (
                                        <tr
                                            key={h.id}
                                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedBatch(h)}
                                        >
                                            <td className="px-4 py-4 font-extrabold text-slate-900">
                                                {h.controller?.machine?.machine_name || h.controller?.model_type || `Controller #${h.tn_controller_id}`}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-semibold text-slate-600">{start.toLocaleString()}</td>
                                            <td className="px-4 py-4 text-xs font-semibold text-slate-600">{end.toLocaleString()}</td>
                                            <td className="px-4 py-4 font-mono font-bold text-slate-800 text-xs">{durationMins} min</td>
                                            <td className="px-4 py-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-mono font-black text-xs inline-flex items-center gap-1">
                                                    {h.log_data?.length || 0} baris
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === h.id ? null : h.id); }}
                                                    className="text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 font-bold transition-colors"
                                                >
                                                    &#8942;
                                                </button>
                                                {activeMenu === h.id && (
                                                    <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-white border border-slate-200 z-50 text-left overflow-hidden">
                                                        <div className="p-1.5 space-y-0.5">
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'csv'); }} className="block w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-left transition-colors">Download CSV</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'excel'); }} className="block w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-left transition-colors">Download Excel</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'pdf'); }} className="block w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-left transition-colors">Download PDF</button>
                                                            <hr className="my-1 border-slate-100" />
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }} className="block w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl text-left transition-colors">Hapus</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>

            {/* Modal Detail Popup via createPortal */}
            {selectedBatch && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4" onClick={() => setSelectedBatch(null)}>
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0f172a] text-white">
                            <div>
                                <h3 className="font-black text-lg text-white">Detail Batch Log: {selectedBatch.controller?.machine?.machine_name || selectedBatch.controller?.model_type || `Controller #${selectedBatch.tn_controller_id}`}</h3>
                                <p className="text-xs font-semibold text-blue-300 mt-0.5">
                                    {new Date(selectedBatch.start_time).toLocaleString()} - {new Date(selectedBatch.end_time).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedBatch(null)} className="h-8 w-8 rounded-full bg-blue-900/60 flex items-center justify-center text-lg font-bold text-blue-200 hover:bg-blue-800 transition-colors">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 text-xs uppercase font-black text-slate-700 bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="py-3 px-3">Waktu</th>
                                        <th className="py-3 px-3">PV (&deg;C)</th>
                                        <th className="py-3 px-3">SV (&deg;C)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {getChronologicalLogs(selectedBatch).map((log: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-2.5 px-3 font-semibold text-slate-600">{new Date(log.created_at).toLocaleTimeString()}</td>
                                            <td className="py-2.5 px-3 font-black text-blue-700">{log.decimal_point ? (log.pv / Math.pow(10, log.decimal_point)).toFixed(log.decimal_point) : log.pv}</td>
                                            <td className="py-2.5 px-3 font-black text-amber-700">{log.decimal_point ? (log.sv / Math.pow(10, log.decimal_point)).toFixed(log.decimal_point) : log.sv}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setSelectedBatch(null)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-black text-slate-800 bg-white hover:bg-slate-50 shadow-sm transition-all">Tutup</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function Alarm() {
    const rows = [
        { time: '10:31:04', msg: 'High temperature detected', machine: 'Retort-01', status: 'Critical', icon: <XCircle className="text-red-500" />, tone: 'red' as const },
        { time: '09:48:22', msg: 'Pressure approaching limit', machine: 'Boiler-01', status: 'Warning', icon: <AlertTriangle className="text-amber-500" />, tone: 'amber' as const },
        { time: '08:12:10', msg: 'Cycle completed', machine: 'Retort-02', status: 'Normal', icon: <CheckCircle className="text-emerald-500" />, tone: 'green' as const },
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                <Panel><p className="text-sm text-slate-500">Normal</p><p className="mt-2 text-3xl font-bold text-emerald-600">18</p></Panel>
                <Panel><p className="text-sm text-slate-500">Warning</p><p className="mt-2 text-3xl font-bold text-amber-500">2</p></Panel>
                <Panel><p className="text-sm text-slate-500">Critical</p><p className="mt-2 text-3xl font-bold text-red-600">1</p></Panel>
            </div>
            <Panel title="Alarm History">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-slate-400">
                            <tr>{['Time', 'Message', 'Machine', 'Status'].map((x) => <th key={x} className="px-3 py-3">{x}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.time} className="border-b border-slate-100">
                                    <td className="px-3 py-4 font-mono text-slate-500">{r.time}</td>
                                    <td className="px-3 py-4 font-medium text-slate-700 flex items-center gap-2">{r.icon}{r.msg}</td>
                                    <td className="px-3 py-4 text-slate-500">{r.machine}</td>
                                    <td className="px-3 py-4"><Badge tone={r.tone}>{r.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </>
    );
}

function Notifications() {
    return (
        <Panel title="Notification Channels">
            <div className="divide-y">
                {[
                    { name: 'Browser Notification', status: 'Active', future: false },
                    { name: 'Email', status: '', future: true },
                    { name: 'WhatsApp', status: '', future: true },
                    { name: 'Telegram', status: '', future: true },
                ].map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between py-4">
                        <div>
                            <p className="font-medium text-slate-700">{ch.name}</p>
                            <p className="text-sm text-slate-400">Receive SCADA alarms via this channel</p>
                        </div>
                        {ch.future ? <Badge tone="blue">Future</Badge> : <label className="flex items-center gap-2 text-sm text-emerald-600"><input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />{ch.status}</label>}
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function DatabasePanel() {
    const tables = ['users', 'roles', 'permissions', 'machines', 'devices', 'tnh_registers', 'temperature_logs', 'pressure_logs', 'alarm_logs', 'communication_logs', 'events'];

    return (
        <Panel title="Database Structure">
            <p className="mb-5 text-sm text-slate-500">Operational tables required by the SCADA system.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((x, i) => (
                    <div key={x} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                        <DatabaseIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="font-mono text-sm font-semibold text-slate-700">{x}</p>
                            <p className="text-xs text-slate-400">{i < 2 || x === 'devices' ? 'Available / planned schema' : 'Planned schema'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

const titles: Record<Module, [string, string]> = {
    scada: ['SCADA', 'Realtime process monitoring'],
    historian: ['History', 'Process data logs and export'],
    alarm: ['Alarm', 'Active alarms and event history'],
    notifications: ['Notification', 'Alarm notification channels'],
    database: ['Database', 'SCADA data structure'],
};

export default function Operations({ module, histories }: Props) {
    const [title, subtitle] = titles[module];
    const content = { scada: <Scada />, historian: <Historian histories={histories} />, alarm: <Alarm />, notifications: <Notifications />, database: <DatabasePanel /> }[module];

    return (
        <AuthenticatedLayout header={<div><h2 className="text-xl font-semibold text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>}>
            <Head title={title} />
            <div className="space-y-5 p-4 sm:p-6 lg:p-8">{content}</div>
        </AuthenticatedLayout>
    );
}