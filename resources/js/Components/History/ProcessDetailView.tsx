import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    Download,
    FileText,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import RetortThermalChart from '@/Components/Tn/RetortThermalChart';

export interface ProcessBatchItem {
    id: number;
    tn_controller_id?: number;
    start_time: string;
    end_time?: string | null;
    log_data?: any[];
    controller?: {
        id?: number;
        model_type?: string;
        machine?: {
            machine_name?: string;
        };
    };
}

interface Props {
    batch: ProcessBatchItem;
    onBack: () => void;
}

export default function ProcessDetailView({ batch, onBack }: Props) {
    const [tablePage, setTablePage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(50);

    const logs = useMemo(() => {
        return [...(batch.log_data || [])].sort(
            (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
    }, [batch.log_data]);

    const startTime = new Date(batch.start_time);
    const endTime = batch.end_time ? new Date(batch.end_time) : null;
    const durationMinutes = endTime
        ? Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000))
        : null;

    const timeRangeStr = `${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${
        endTime ? endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sedang Berjalan'
    }`;

    const machineTitle =
        batch.controller?.machine?.machine_name ||
        batch.controller?.model_type ||
        `Controller #${batch.tn_controller_id || batch.id}`;

    // Target SV detection from logs
    const targetSv = useMemo(() => {
        if (!logs.length) return 121.0;
        const last = logs[logs.length - 1];
        const val = Number(last.sv ?? last.setting ?? 121.0);
        return val > 40 ? val : 121.0;
    }, [logs]);

    // Pagination for logs table
    const totalRows = logs.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const paginatedLogs = useMemo(() => {
        const start = (tablePage - 1) * pageSize;
        return logs.slice(start, start + pageSize);
    }, [logs, tablePage, pageSize]);

    // Export Handlers
    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const headers = ['TIME', 'PV (°C)', 'SV (°C)', 'HEAT MV'];
        const rows = logs.map((l) => {
            const rawPv = Number(l.pv ?? l.actual ?? 0);
            const dp = Number(l.decimal_point ?? 0);
            const pv = dp > 0 ? rawPv / Math.pow(10, dp) : rawPv;

            const rawSv = Number(l.sv ?? l.setting ?? 121.0);
            const sv = dp > 0 ? rawSv / Math.pow(10, dp) : rawSv;

            const mv = Number(l.heating_mv ?? l.mv ?? 0);

            return [
                l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID') : '--',
                pv.toFixed(1),
                sv.toFixed(1),
                `${mv.toFixed(0)}%`,
            ];
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Laporan Batch #${batch.id} - ${machineTitle}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
                    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
                    h2 { margin: 0 0 6px 0; color: #0f172a; }
                    p { margin: 2px 0; font-size: 13px; color: #475569; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                    th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .pv-col { font-weight: bold; color: #1d4ed8; }
                    .sv-col { font-weight: bold; color: #b45309; }
                    .mv-col { font-weight: bold; color: #d97706; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Laporan Proses Sterilisasi Batch #${batch.id}</h2>
                    <p><strong>Mesin / Controller:</strong> ${machineTitle}</p>
                    <p><strong>Waktu Mulai:</strong> ${startTime.toLocaleString('id-ID')}</p>
                    <p><strong>Waktu Selesai:</strong> ${endTime ? endTime.toLocaleString('id-ID') : 'Sedang Berjalan'}</p>
                    <p><strong>Durasi:</strong> ${durationMinutes !== null ? `${durationMinutes} Menit` : '--'}</p>
                </div>
                <table>
                    <thead>
                        <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows
                            .map(
                                (r) => `
                            <tr>
                                <td>${r[0]}</td>
                                <td class="pv-col">${r[1]}</td>
                                <td class="sv-col">${r[2]}</td>
                                <td class="mv-col">${r[3]}</td>
                            </tr>
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadCSV = () => {
        if (!logs.length) return;
        const headers = ['TIME', 'PV (°C)', 'SV (°C)', 'HEAT MV'];
        const rows = logs.map((l) => {
            const rawPv = Number(l.pv ?? l.actual ?? 0);
            const dp = Number(l.decimal_point ?? 0);
            const pv = dp > 0 ? rawPv / Math.pow(10, dp) : rawPv;

            const rawSv = Number(l.sv ?? l.setting ?? 121.0);
            const sv = dp > 0 ? rawSv / Math.pow(10, dp) : rawSv;

            const mv = Number(l.heating_mv ?? l.mv ?? 0);

            return [
                l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID') : '--',
                pv.toFixed(1),
                sv.toFixed(1),
                `${mv.toFixed(0)}%`,
            ];
        });

        const csvContent =
            'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `batch_${batch.id}_${machineTitle.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ChevronLeft size={16} />
                    <span>Kembali ke Daftar</span>
                </button>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 shadow-md transition-all"
                    >
                        <Download size={14} />
                        <span>Download PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadCSV}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black px-3.5 py-2.5 shadow-sm transition-all"
                        title="Download CSV"
                    >
                        <FileText size={14} className="text-emerald-600" />
                        <span>CSV</span>
                    </button>
                </div>
            </div>

            {/* Batch Info Header Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-lg backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-black tracking-tight text-slate-900">
                                Proses #{batch.id} ({machineTitle})
                            </h2>
                            {batch.end_time ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 size={12} /> Selesai
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 animate-pulse">
                                    Sedang Berjalan
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                            {timeRangeStr} • {durationMinutes !== null ? `${durationMinutes} Menit` : '--'} • {logs.length} Data Points
                        </p>
                    </div>
                </div>
            </div>

            {/* Thermal Sterilization Profile Chart (Clean Retort Thermal Chart) */}
            <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-lg backdrop-blur-xl">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">
                                Profil Termal Sterilisasi Retort
                            </h2>
                            <span className="bg-blue-100 text-blue-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                                Thermal Profile
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Kurva pemanasan riil dengan pembagian zona langkah (CUT, Holding Time & F₀, Cooling Time) berbasis waktu proses.
                        </p>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black border ${
                            batch.end_time
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                    >
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                batch.end_time ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            }`}
                        ></span>
                        {batch.end_time ? 'SELESAI' : 'LIVE MONITOR'}
                    </span>
                </div>

                <RetortThermalChart
                    data={logs}
                    targetSv={targetSv}
                    height={380}
                    isRunning={Boolean(batch.end_time === null)}
                />
            </section>

            {/* Process Logs (Active Heating) Table */}
            <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-lg backdrop-blur-xl">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="font-extrabold text-slate-900 text-xl">Process Logs (Active Heating)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {totalRows > 0
                                ? `Menampilkan ${(tablePage - 1) * pageSize + 1}–${Math.min(
                                      tablePage * pageSize,
                                      totalRows
                                  )} dari ${totalRows} data points tersimpan.`
                                : 'Belum ada reading yang tersimpan.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="detail-per-page" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                Per halaman
                            </label>
                            <select
                                id="detail-per-page"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setTablePage(1);
                                }}
                                className="rounded-xl border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-1.5 px-3"
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-extrabold text-blue-700">
                            {totalRows} records
                        </span>
                    </div>
                </div>

                <div className="max-h-[460px] overflow-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 bg-[#0f172a] text-left text-xs font-black uppercase tracking-wider text-white">
                            <tr>
                                <th className="px-5 py-3.5">TIME</th>
                                <th className="px-5 py-3.5">PV (°C)</th>
                                <th className="px-5 py-3.5">SV (°C)</th>
                                <th className="px-5 py-3.5">HEAT MV</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-mono">
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center font-sans font-bold text-slate-400">
                                        Belum ada reading dengan heating aktif pada batch ini.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, index) => {
                                    const rawPv = Number(log.pv ?? log.actual ?? 0);
                                    const dp = Number(log.decimal_point ?? 0);
                                    const pv = dp > 0 ? rawPv / Math.pow(10, dp) : rawPv;

                                    const rawSv = Number(log.sv ?? log.setting ?? 121.0);
                                    const sv = dp > 0 ? rawSv / Math.pow(10, dp) : rawSv;

                                    const rawMv = Number(log.heating_mv ?? log.mv ?? 0);
                                    const mv = dp > 0 && rawMv > 100 ? rawMv / 10 : rawMv;

                                    return (
                                        <tr key={`${log.created_at ?? index}-${index}`} className="hover:bg-blue-50/70 transition-colors">
                                            <td className="whitespace-nowrap px-5 py-3 text-slate-600 font-bold">
                                                {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}
                                            </td>
                                            <td className="px-5 py-3 font-extrabold text-blue-700">
                                                {pv.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                            </td>
                                            <td className="px-5 py-3 font-extrabold text-amber-700">
                                                {sv.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                            </td>
                                            <td className="px-5 py-3 font-extrabold text-amber-600">
                                                {mv.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalRows > pageSize && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                            disabled={tablePage <= 1}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Sebelumnya
                        </button>
                        <span className="text-xs font-bold text-slate-600">
                            Halaman {tablePage} dari {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                            disabled={tablePage >= totalPages}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Berikutnya
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
