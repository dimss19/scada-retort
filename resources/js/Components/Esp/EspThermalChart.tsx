import React, { useMemo } from 'react';

interface TelemetryPoint {
    pv?: number | null;
    actual?: number | null;
    sv?: number | null;
    setting?: number | null;
    phase?: string;
    recorded_at?: string;
    ts?: string;
}

interface Props {
    data: TelemetryPoint[];
    targetSv?: number;
    height?: number;
}

export default function EspThermalChart({ data = [], targetSv = 121.1, height = 340 }: Props) {
    const points = useMemo(() => {
        return data.slice(-50).map((item) => {
            const pv = Number(item.pv ?? item.actual ?? 0);
            const sv = Number(item.sv ?? item.setting ?? targetSv);
            const timeLabel = item.ts ? item.ts.split(' ')[1] || item.ts : (item.recorded_at ? new Date(item.recorded_at).toLocaleTimeString('id-ID') : '');
            const phase = (item.phase || 'IDLE').toUpperCase();
            return { pv, sv, timeLabel, phase };
        });
    }, [data, targetSv]);

    if (points.length === 0) {
        return (
            <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 mb-3">
                    <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Menunggu Sinyal Telemetri ESP32...</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Grafik akan otomatis terisi secara real-time begitu modul ESP32 RetortLogger mulai mem-publish data ke broker MQTT.
                </p>
            </div>
        );
    }

    const minPv = Math.max(0, Math.min(...points.map((p) => p.pv), targetSv - 20));
    const maxPv = Math.max(140, Math.max(...points.map((p) => p.pv), targetSv + 10));

    // SVG coordinates computation
    const svgWidth = 800;
    const svgHeight = height;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const getY = (val: number) => {
        const clamped = Math.max(minPv, Math.min(maxPv, val));
        const ratio = (clamped - minPv) / (maxPv - minPv || 1);
        return paddingTop + plotHeight * (1 - ratio);
    };

    const getX = (index: number) => {
        if (points.length <= 1) return paddingLeft + plotWidth / 2;
        return paddingLeft + (index / (points.length - 1)) * plotWidth;
    };

    // Construct path for PV line
    const pvPointsStr = points.map((p, i) => `${getX(i)},${getY(p.pv)}`).join(' ');
    const svPointsStr = points.map((p, i) => `${getX(i)},${getY(p.sv)}`).join(' ');

    // Construct area under PV line
    const pvAreaStr = `${getX(0)},${paddingTop + plotHeight} ` +
        pvPointsStr +
        ` ${getX(points.length - 1)},${paddingTop + plotHeight}`;

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 p-4 shadow-inner text-white">
            {/* Legend & Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Live Thermal Wave</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {points.length} samples
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-amber-400 inline-block"></span>
                        <span className="text-amber-300 font-mono">PV (Aktual)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-400 inline-block"></span>
                        <span className="text-emerald-400 font-mono">SV ({targetSv.toFixed(1)}°C)</span>
                    </div>
                </div>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full overflow-x-auto [scrollbar-width:none]">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[500px]">
                    <defs>
                        <linearGradient id="espPvGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[minPv, minPv + (maxPv - minPv) * 0.25, minPv + (maxPv - minPv) * 0.5, minPv + (maxPv - minPv) * 0.75, maxPv].map((val, idx) => {
                        const y = getY(val);
                        return (
                            <g key={idx}>
                                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    {val.toFixed(0)}°C
                                </text>
                            </g>
                        );
                    })}

                    {/* Target SV Line (Green Dashed) */}
                    <polyline fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" points={svPointsStr} />

                    {/* PV Area Fill */}
                    <polygon fill="url(#espPvGradient)" points={pvAreaStr} />

                    {/* PV Main Line */}
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pvPointsStr} />

                    {/* Data Points */}
                    {points.map((p, i) => {
                        const cx = getX(i);
                        const cy = getY(p.pv);
                        const isLatest = i === points.length - 1;
                        return (
                            <g key={i}>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isLatest ? 5 : 2.5}
                                    fill={isLatest ? '#fbbf24' : '#f59e0b'}
                                    stroke="#0f172a"
                                    strokeWidth={isLatest ? 2 : 1}
                                />
                                {isLatest && (
                                    <g>
                                        <circle cx={cx} cy={cy} r={9} fill="none" stroke="#fbbf24" strokeWidth="1.5" className="animate-ping" />
                                        <text x={cx} y={cy - 10} textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                            {p.pv.toFixed(1)}°C
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* X-axis time labels */}
                    {points.map((p, i) => {
                        // show only 6 evenly distributed time labels
                        const step = Math.max(1, Math.floor(points.length / 6));
                        if (i % step !== 0 && i !== points.length - 1) return null;
                        const x = getX(i);
                        return (
                            <text key={i} x={x} y={svgHeight - 12} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                                {p.timeLabel}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
