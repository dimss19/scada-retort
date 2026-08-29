import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    ChevronLeft,
    Download,
    TrendingUp,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    FileText,
    CheckCircle2,
    Calendar,
    Clock,
} from 'lucide-react';

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
    const [viewMode, setViewMode] = useState<'all' | 'table'>('all');
    const [exportMode, setExportMode] = useState<'both' | 'data' | 'chart'>('both');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [panOffset, setPanOffset] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStartX, setDragStartX] = useState<number>(0);
    const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

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

    const machineTitle = batch.controller?.machine?.machine_name || batch.controller?.model_type || `Controller #${batch.tn_controller_id || batch.id}`;

    // Pagination
    const totalRows = logs.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const paginatedLogs = useMemo(() => {
        const start = (tablePage - 1) * pageSize;
        return logs.slice(start, start + pageSize);
    }, [logs, tablePage, pageSize]);

    // Chart Metrics & Min/Max calculation
    const { minTemp, maxTemp, yRange, validReadings } = useMemo(() => {
        if (!logs.length) {
            return { minTemp: 100, maxTemp: 130, yRange: 30, validReadings: [] };
        }

        const valid = logs.map((l, i) => {
            const rawPv = Number(l.pv ?? l.actual ?? 0);
            const dp = Number(l.decimal_point ?? 0);
            const pv = dp > 0 ? rawPv / Math.pow(10, dp) : rawPv;

            const rawSv = Number(l.sv ?? l.setting ?? 121.1);
            const sv = dp > 0 ? rawSv / Math.pow(10, dp) : rawSv;

            const timeStr = l.created_at
                ? new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : `--:${i}`;

            return { index: i, pv, sv, timeStr, raw: l };
        });

        const allPvs = valid.map((v) => v.pv);
        const allSvs = valid.map((v) => v.sv);
        const minVal = Math.min(...allPvs, ...allSvs);
        const maxVal = Math.max(...allPvs, ...allSvs);

        const pad = Math.max(0.5, (maxVal - minVal) * 0.15);
        const min = Math.floor((minVal - pad) * 10) / 10;
        const max = Math.ceil((maxVal + pad) * 10) / 10;

        return {
            minTemp: min,
            maxTemp: max,
            yRange: Math.max(1, max - min),
            validReadings: valid,
        };
    }, [logs]);

    // SVG Layout calculation
    const svgWidth = 900;
    const svgHeight = 360;
    const padLeft = 65;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const getY = useCallback((temp: number) => {
        const ratio = (temp - minTemp) / yRange;
        return padTop + plotHeight - ratio * plotHeight;
    }, [minTemp, yRange, plotHeight]);

    const getX = useCallback((index: number) => {
        if (validReadings.length <= 1) return padLeft + plotWidth / 2;
        const baseRatio = index / (validReadings.length - 1);
        const zoomedWidth = plotWidth * zoomLevel;
        return padLeft + baseRatio * zoomedWidth + panOffset;
    }, [validReadings.length, plotWidth, zoomLevel, panOffset]);

    // SVG Paths
    const pvPoints = useMemo(() => {
        return validReadings.map((r) => `${getX(r.index)},${getY(r.pv)}`).join(' ');
    }, [validReadings, getX, getY]);

    const svPoints = useMemo(() => {
        return validReadings.map((r) => `${getX(r.index)},${getY(r.sv)}`).join(' ');
    }, [validReadings, getX, getY]);

    // Y Axis Ticks (6 grid lines)
    const yTicks = useMemo(() => {
        const ticks = [];
        const step = yRange / 5;
        for (let i = 0; i <= 5; i++) {
            const val = minTemp + i * step;
            ticks.push({ val, y: getY(val) });
        }
        return ticks;
    }, [minTemp, yRange, getY]);

    // X Axis Ticks (approx 6-8 evenly spaced labels)
    const xTicks = useMemo(() => {
        if (!validReadings.length) return [];
        const step = Math.max(1, Math.floor(validReadings.length / 6));
        const ticks = [];
        for (let i = 0; i < validReadings.length; i += step) {
            ticks.push(validReadings[i]);
        }
        // Always include last
        if (ticks[ticks.length - 1]?.index !== validReadings.length - 1) {
            ticks.push(validReadings[validReadings.length - 1]);
        }
        return ticks;
    }, [validReadings]);

    // Mouse Dragging & Zoom Handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.2 : 0.8;
        setZoomLevel((prev) => Math.min(6, Math.max(1, prev * delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX - panOffset);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const maxPan = 0;
            const minPan = -(plotWidth * (zoomLevel - 1));
            const newOffset = Math.max(minPan, Math.min(maxPan, e.clientX - dragStartX));
            setPanOffset(newOffset);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset(0);
    };

    // PDF / CSV Export
    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const headers = ['Waktu', 'SV (°C)', 'PV (°C)'];
        const rows = logs.map((l) => [
            l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID') : '--',
            Number(l.sv ?? 121.1).toFixed(1),
            Number(l.pv ?? 0).toFixed(1),
        ]);

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
                    .pv-col { font-weight: bold; color: #e11d48; }
                    .sv-col { font-weight: bold; color: #16a34a; }
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
                                <td class="sv-col">${r[1]}</td>
                                <td class="pv-col">${r[2]}</td>
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
        const headers = ['Waktu', 'SV (°C)', 'PV (°C)'];
        const rows = logs.map((l) => [
            l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID') : '--',
            Number(l.sv ?? 121.1).toFixed(1),
            Number(l.pv ?? 0).toFixed(1),
        ]);

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
            {/* Top Toolbar / Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft size={16} />
                        <span>Kembali ke Daftar</span>
                    </button>

                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setViewMode('all')}
                            className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
                                viewMode === 'all'
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Daftar Proses & Grafik
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
                                viewMode === 'table'
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tabel Data
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <select
                        value={exportMode}
                        onChange={(e) => setExportMode(e.target.value as any)}
                        className="rounded-xl border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-sm focus:border-amber-500 focus:ring-amber-500 py-2 px-3"
                    >
                        <option value="both">Data + Grafik</option>
                        <option value="data">Data saja</option>
                        <option value="chart">Grafik saja</option>
                    </select>

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

            {/* Thermal Curve Chart Card (Dark Industrial Visualizer matching Indah Mesin) */}
            {(viewMode === 'all' || exportMode === 'chart') && (
                <div className="rounded-3xl border border-slate-800 bg-[#0d131f] p-6 sm:p-7 shadow-2xl text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <TrendingUp className="w-5 h-5 text-amber-400" />
                            <h3 className="text-lg font-black text-white tracking-tight">Grafik Suhu</h3>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setZoomLevel((prev) => Math.min(6, prev * 1.25))}
                                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-all shadow-sm"
                                title="Zoom in"
                            >
                                <ZoomIn size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel((prev) => Math.max(1, prev * 0.8))}
                                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-all shadow-sm"
                                title="Zoom out"
                            >
                                <ZoomOut size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={handleResetZoom}
                                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-all shadow-sm"
                                title="Reset zoom"
                            >
                                <RotateCcw size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 font-medium mb-3">
                        <p>Scroll mouse untuk zoom • Geser area grafik untuk panning waktu.</p>
                        <div className="flex items-center gap-4 font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                                <span className="text-slate-200">PV (Process Value)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-4 border-b-2 border-dashed border-emerald-400 inline-block"></span>
                                <span className="text-slate-200">SV (Target)</span>
                            </div>
                        </div>
                    </div>

                    {/* SVG Interactive Canvas */}
                    <div
                        className="relative w-full overflow-hidden rounded-2xl bg-[#060911] border border-slate-800 cursor-grab active:cursor-grabbing"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-[320px] sm:h-[380px] select-none pointer-events-auto"
                        >
                            {/* Grid Lines (Horizontal / Y-Axis) */}
                            {yTicks.map((tick, i) => (
                                <g key={`ytick-${i}`}>
                                    <line
                                        x1={padLeft}
                                        y1={tick.y}
                                        x2={svgWidth - padRight}
                                        y2={tick.y}
                                        stroke="#1e293b"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={padLeft - 10}
                                        y={tick.y + 4}
                                        textAnchor="end"
                                        fontSize="11"
                                        fontWeight="600"
                                        fill="#94a3b8"
                                        fontFamily="monospace"
                                    >
                                        {tick.val.toFixed(1)}
                                    </text>
                                </g>
                            ))}

                            {/* Y Axis Title */}
                            <text
                                x={-svgHeight / 2}
                                y="18"
                                transform="rotate(-90)"
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="700"
                                fill="#f59e0b"
                            >
                                Suhu (°C)
                            </text>

                            {/* X Axis Time Labels */}
                            {xTicks.map((tick, i) => {
                                const xPos = getX(tick.index);
                                if (xPos < padLeft || xPos > svgWidth - padRight) return null;
                                return (
                                    <g key={`xtick-${i}`}>
                                        <line
                                            x1={xPos}
                                            y1={padTop}
                                            x2={xPos}
                                            y2={padTop + plotHeight}
                                            stroke="#1e293b"
                                            strokeWidth="1"
                                            strokeDasharray="2,4"
                                        />
                                        <text
                                            x={xPos}
                                            y={padTop + plotHeight + 20}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fontWeight="600"
                                            fill="#94a3b8"
                                            fontFamily="monospace"
                                            transform={`rotate(35, ${xPos}, ${padTop + plotHeight + 20})`}
                                        >
                                            {tick.timeStr}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* SV Target Line (Green Dashed) */}
                            {validReadings.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="#00e676"
                                    strokeWidth="2"
                                    strokeDasharray="5,4"
                                    points={svPoints}
                                />
                            )}

                            {/* PV Curve Line (Vibrant Red) */}
                            {validReadings.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="#ff3b30"
                                    strokeWidth="2.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={pvPoints}
                                />
                            )}

                            {/* Data Points Glowing Dots */}
                            {validReadings.map((r, i) => {
                                const cx = getX(r.index);
                                const cy = getY(r.pv);
                                if (cx < padLeft - 5 || cx > svgWidth - padRight + 5) return null;
                                return (
                                    <circle
                                        key={`dot-${i}`}
                                        cx={cx}
                                        cy={cy}
                                        r="3.5"
                                        fill="#ff3b30"
                                        stroke="#ffffff"
                                        strokeWidth="1.2"
                                        className="transition-transform hover:scale-150 cursor-pointer"
                                        onMouseEnter={() => setHoveredPoint(r)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                );
                            })}
                        </svg>

                        {/* Hover Tooltip Overlay */}
                        {hoveredPoint && (
                            <div className="absolute top-3 left-4 rounded-xl bg-slate-900/90 border border-slate-700 px-3.5 py-2 text-xs shadow-2xl backdrop-blur-md pointer-events-none font-mono">
                                <p className="text-slate-400 font-bold">{hoveredPoint.timeStr}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-rose-400 font-black">PV: {hoveredPoint.pv.toFixed(1)} °C</span>
                                    <span className="text-emerald-400 font-black">SV: {hoveredPoint.sv.toFixed(1)} °C</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Data Table Section */}
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-700">
                        {totalRows > 0
                            ? `Menampilkan ${(tablePage - 1) * pageSize + 1}–${Math.min(
                                  tablePage * pageSize,
                                  totalRows
                              )} dari ${totalRows} data`
                            : 'Tidak ada data'}
                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="per-page" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                            Per halaman
                        </label>
                        <select
                            id="per-page"
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
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-[#0f172a] text-left text-xs font-black uppercase tracking-wider text-white">
                            <tr>
                                <th className="px-6 py-3.5">WAKTU</th>
                                <th className="px-6 py-3.5">SV (°C)</th>
                                <th className="px-6 py-3.5">PV (°C)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-mono">
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center font-sans font-bold text-slate-400">
                                        Tidak ada data points tersimpan pada batch ini.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, idx) => {
                                    const rawPv = Number(log.pv ?? log.actual ?? 0);
                                    const dp = Number(log.decimal_point ?? 0);
                                    const pv = dp > 0 ? rawPv / Math.pow(10, dp) : rawPv;

                                    const rawSv = Number(log.sv ?? log.setting ?? 121.1);
                                    const sv = dp > 0 ? rawSv / Math.pow(10, dp) : rawSv;

                                    return (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="whitespace-nowrap px-6 py-3 text-slate-600 font-bold">
                                                {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '--'}
                                            </td>
                                            <td className="px-6 py-3 font-extrabold text-amber-600">
                                                {sv.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-3 font-extrabold text-rose-600">
                                                {pv.toFixed(1)}°C
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalRows > pageSize && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
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
            </div>
        </div>
    );
}
