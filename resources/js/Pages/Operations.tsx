import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';

type Module = 'scada' | 'historian' | 'alarm' | 'notifications' | 'database';
type Props = { module: Module; histories?: any[] };

const Badge = ({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' }) => {
    const colors = {
        green: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700',
    };

    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
};

const Panel = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
        {title && <h3 className="mb-4 font-semibold text-slate-800">{title}</h3>}
        {children}
    </section>
);

function Scada() {
    const flow = [['Water Tank', '82%', '💧'], ['Pump', 'Running', '⚙️'], ['Boiler', '121.4 °C', '🔥'], ['Steam Pipe', '1.8 bar', '〰️'], ['Steam Valve', 'Open', '🔧'], ['Retort', '120.8 °C', '🏭'], ['Cooling', 'Standby', '❄️'], ['Drain', 'Closed', '⬇️']];

    return (
        <>
            <Panel>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800">Realtime Mimic Diagram</h3>
                        <p className="text-sm text-slate-500">Live process overview · updated just now</p>
                    </div>
                    <Badge>System Online</Badge>
                </div>
                <div className="flex flex-col items-center">
                    {flow.map(([name, value, icon], index) => (
                        <div key={name} className="contents">
                            <div className="flex w-full max-w-xl items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
                                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-100 text-xl">{icon}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{name}</p>
                                    <p className="text-xs text-slate-500">Realtime object</p>
                                </div>
                                <span className="font-mono text-sm font-semibold text-cyan-700">{value}</span>
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            </div>
                            {index < flow.length - 1 && <div className="h-7 border-l-2 border-dashed border-cyan-400"><span className="relative left-[-7px] top-3 text-xs text-cyan-500">▼</span></div>}
                        </div>
                    ))}
                </div>
            </Panel>
        </>
    );
}

function Historian({ histories = [] }: { histories?: any[] }) {
    const [period, setPeriod] = useState('Hari');
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const formatValue = (val: number | undefined, dp: number = 0) => {
        if (val === undefined || val === 31000 || val === 30000 || val === -30000) return '-';
        return (val / Math.pow(10, dp)).toFixed(dp).replace('.', ',');
    };

    const handleDownload = (batch: any, format: 'csv' | 'excel' | 'pdf') => {
        const logs = batch.log_data || [];
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
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Filter periode</label>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            {['Hari', 'Minggu', 'Bulan'].map((x) => (
                                <button key={x} onClick={() => setPeriod(x)} className={`rounded-md px-4 py-2 text-sm ${period === x ? 'bg-white font-semibold text-cyan-700 shadow-sm' : 'text-slate-500'}`}>
                                    {x}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Custom Date</label>
                        <input type="date" className="rounded-lg border-slate-300 text-sm" />
                    </div>
                </div>            </Panel>
            
            <Panel title="Process Batches (Heating Logs)">
                <div className="overflow-x-auto min-h-[280px]">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-slate-400">
                            <tr>
                                <th className="px-3 py-3">Machine</th>
                                <th className="px-3 py-3">Start Time</th>
                                <th className="px-3 py-3">End Time</th>
                                <th className="px-3 py-3">Duration (Mins)</th>
                                <th className="px-3 py-3">Data Points</th>
                                <th className="px-3 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {histories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">No process history recorded yet.</td>
                                </tr>
                            ) : (
                                histories.map((h) => {
                                    const start = new Date(h.start_time);
                                    const end = new Date(h.end_time);
                                    const durationMins = ((end.getTime() - start.getTime()) / 60000).toFixed(1);
                                    
                                    return (
                                        <tr 
                                            key={h.id} 
                                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                            onClick={() => setSelectedBatch(h)}
                                        >
                                            <td className="px-3 py-4 font-medium text-slate-700">
                                                {h.controller?.machine?.machine_name || h.controller?.model_type || `Controller #${h.tn_controller_id}`}
                                            </td>
                                            <td className="px-3 py-4 text-slate-500">{start.toLocaleString()}</td>
                                            <td className="px-3 py-4 text-slate-500">{end.toLocaleString()}</td>
                                            <td className="px-3 py-4 font-mono text-slate-600">{durationMins} min</td>
                                            <td className="px-3 py-4 text-emerald-600 font-semibold">{h.log_data?.length || 0} rows <span className="text-slate-400 font-normal ml-2 text-xs">(Click to view)</span></td>
                                            <td className="px-3 py-4 text-right relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === h.id ? null : h.id); }}
                                                    className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 text-lg font-bold"
                                                >
                                                    &#8942;
                                                </button>
                                                {activeMenu === h.id && (
                                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 text-left">
                                                        <div className="py-1">
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'csv'); }} className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left">Download CSV</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'excel'); }} className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left">Download Excel</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(h, 'pdf'); }} className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left">Download PDF</button>
                                                            <hr className="my-1 border-slate-100" />
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }} className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">Delete</button>
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

            {/* Modal Detail Popup */}
            {selectedBatch && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedBatch(null)}>
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Batch Details: {selectedBatch.controller?.machine?.machine_name || selectedBatch.controller?.model_type || `Controller #${selectedBatch.tn_controller_id}`}</h3>
                                <p className="text-xs text-slate-500">
                                    {new Date(selectedBatch.start_time).toLocaleString()} - {new Date(selectedBatch.end_time).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600 text-xl font-semibold px-2">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-xs uppercase text-slate-400 bg-white sticky top-0">
                                    <tr>
                                        <th className="pb-3">Time</th>
                                        <th className="pb-3">PV (&deg;C)</th>
                                        <th className="pb-3">SV (&deg;C)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBatch.log_data?.map((log: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-2 font-mono text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</td>
                                            <td className="py-2 font-semibold text-blue-600">{log.decimal_point ? (log.pv / Math.pow(10, log.decimal_point)).toFixed(log.decimal_point) : log.pv}</td>
                                            <td className="py-2 text-emerald-600">{log.decimal_point ? (log.sv / Math.pow(10, log.decimal_point)).toFixed(log.decimal_point) : log.sv}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setSelectedBatch(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Alarm() {
    const rows = [['10:31:04', 'High temperature detected', 'Retort-01', 'Critical'], ['09:48:22', 'Pressure approaching limit', 'Boiler-01', 'Warning'], ['08:12:10', 'Cycle completed', 'Retort-02', 'Normal']];

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
                                <tr key={r[0]} className="border-b border-slate-100">
                                    <td className="px-3 py-4 font-mono text-slate-500">{r[0]}</td>
                                    <td className="px-3 py-4 font-medium text-slate-700">{r[1]}</td>
                                    <td className="px-3 py-4 text-slate-500">{r[2]}</td>
                                    <td className="px-3 py-4"><Badge tone={r[3] === 'Critical' ? 'red' : r[3] === 'Warning' ? 'amber' : 'green'}>{r[3]}</Badge></td>
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
                    ['Browser Notification', 'Active', false],
                    ['Email', 'Future', true],
                    ['WhatsApp', 'Future', true],
                    ['Telegram', 'Future', true],
                ].map(([name, status, future]) => (
                    <div key={String(name)} className="flex items-center justify-between py-4">
                        <div>
                            <p className="font-medium text-slate-700">{name}</p>
                            <p className="text-sm text-slate-400">Receive SCADA alarms via this channel</p>
                        </div>
                        {future ? <Badge tone="blue">Future</Badge> : <label className="flex items-center gap-2 text-sm text-emerald-600"><input type="checkbox" defaultChecked className="rounded border-slate-300 text-cyan-600" />{status}</label>}
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function Database() {
    const tables = ['users', 'roles', 'permissions', 'machines', 'devices', 'tnh_registers', 'temperature_logs', 'pressure_logs', 'alarm_logs', 'communication_logs', 'events'];

    return (
        <Panel title="Database Structure">
            <p className="mb-5 text-sm text-slate-500">Operational tables required by the SCADA system.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((x, i) => (
                    <div key={x} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                        <span className="text-xl">🗄️</span>
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
    const content = { scada: <Scada />, historian: <Historian histories={histories} />, alarm: <Alarm />, notifications: <Notifications />, database: <Database /> }[module];

    return (
        <AuthenticatedLayout header={<div><h2 className="text-xl font-semibold text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>}>
            <Head title={title} />
            <div className="space-y-5 p-4 sm:p-6 lg:p-8">{content}</div>
        </AuthenticatedLayout>
    );
}
