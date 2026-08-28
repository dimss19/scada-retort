import React, { useEffect, useRef, useState, useMemo } from 'react';
import { toEngineeringValue, segmentThermalSteps, calculateF0, RetortStepSegment } from '@/Pages/Tn/retortTelemetry';

interface Props {
    data: any[];
    targetSv?: number;
    height?: number;
}

export default function RetortThermalChart({ data = [], targetSv = 121.0, height = 360 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);

    // Compute step segments
    const segments: RetortStepSegment[] = useMemo(() => {
        return segmentThermalSteps(data);
    }, [data]);

    // Compute total accumulated F0 and overall stats
    const stats = useMemo(() => {
        const temps = data
            .map(d => toEngineeringValue(d.pv, d.decimal_point ?? 0))
            .filter((t): t is number => t !== null && t < 3000);

        const currentTemp = temps.length > 0 ? temps[temps.length - 1] : 0;
        const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
        const totalMinutes = Math.max(1, Math.round((data.length / 60) * 10) / 10);
        const totalF0 = calculateF0(temps, 1);

        return {
            currentTemp,
            maxTemp,
            totalMinutes,
            totalF0,
            pointCount: data.length,
        };
    }, [data]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = containerWidth;
        const h = height;

        canvas.width = width * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, h);

        const padding = { top: 40, right: 30, bottom: 45, left: 55 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = h - padding.top - padding.bottom;

        // Scale bounds
        const minY = 0;
        const maxY = 140; // 0 to 140 °C matching reference image
        const totalPoints = Math.max(120, data.length); // minimum 2 minutes x-span
        const totalDurationMinutes = Math.max(10, Math.ceil(totalPoints / 60 / 10) * 10); // Round up to 10-min increments

        const getX = (index: number) => {
            return padding.left + (index / Math.max(1, totalPoints - 1)) * plotWidth;
        };

        const getY = (temp: number) => {
            const clamped = Math.max(minY, Math.min(maxY, temp));
            return padding.top + (1 - (clamped - minY) / (maxY - minY)) * plotHeight;
        };

        // 1. Draw Fine Industrial Grid Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padding.left, padding.top, plotWidth, plotHeight);

        // Minor grid lines (every 5 °C)
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let t = minY; t <= maxY; t += 5) {
            const y = getY(t);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotWidth, y);
            ctx.stroke();
        }

        // Major grid lines & Y-Axis Labels (every 20 °C)
        for (let t = minY; t <= maxY; t += 20) {
            const y = getY(t);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotWidth, y);
            ctx.stroke();

            // Y Label
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${t}`, padding.left - 10, y);
        }

        // X-Axis Major Grid & Labels (minutes)
        const minuteStep = totalDurationMinutes <= 30 ? 5 : totalDurationMinutes <= 90 ? 10 : 20;
        for (let m = 0; m <= totalDurationMinutes; m += minuteStep) {
            const idx = (m * 60);
            const x = padding.left + (idx / totalPoints) * plotWidth;
            if (x <= padding.left + plotWidth + 2) {
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, padding.top);
                ctx.lineTo(x, padding.top + plotHeight);
                ctx.stroke();

                // X Label
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`${m}`, x, padding.top + plotHeight + 8);
            }
        }

        // 2. Draw Target Sterilization Line (121 °C Red Dashed Line)
        const targetY = getY(targetSv);
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, targetY);
        ctx.lineTo(padding.left + plotWidth, targetY);
        ctx.stroke();
        ctx.restore();

        // Target Line Label Badge
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Target: ${targetSv}°C`, padding.left + 8, targetY - 6);

        // 3. Draw Step Segments & Vertical Dashed Separators
        segments.forEach((seg, idx) => {
            const startX = getX(seg.startIndex);
            const endX = getX(seg.endIndex);
            const segWidth = endX - startX;

            // Soft Phase Background Tint
            let tint = 'rgba(241, 245, 249, 0.3)';
            if (seg.category === 'HOLD') tint = 'rgba(254, 243, 199, 0.25)'; // Amber/Gold for Holding
            else if (seg.category === 'COOL') tint = 'rgba(224, 242, 254, 0.25)'; // Sky for Cooling
            else if (seg.category === 'CUT') tint = 'rgba(254, 226, 226, 0.2)'; // Rose for CUT

            ctx.fillStyle = tint;
            ctx.fillRect(startX, padding.top, segWidth, plotHeight);

            // Vertical separator line
            if (idx > 0) {
                ctx.save();
                ctx.strokeStyle = '#8b5cf6'; // Purple dashed separator
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(startX, padding.top);
                ctx.lineTo(startX, padding.top + plotHeight);
                ctx.stroke();
                ctx.restore();
            }
        });

        // 4. Draw Single Main Temperature Curve (PV)
        if (data.length > 0) {
            // Draw Gradient Area Under Curve
            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)'); // Blue
            gradient.addColorStop(0.7, 'rgba(56, 189, 248, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

            ctx.beginPath();
            let firstPoint = true;
            for (let i = 0; i < data.length; i++) {
                const temp = toEngineeringValue(data[i].pv, data[i].decimal_point ?? 0);
                if (temp === null || temp >= 3000) continue;

                const x = getX(i);
                const y = getY(temp);

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }

            if (!firstPoint) {
                const lastX = getX(data.length - 1);
                ctx.lineTo(lastX, padding.top + plotHeight);
                ctx.lineTo(getX(0), padding.top + plotHeight);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Draw Sharp Smooth PV Line
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = '#1e3a8a'; // Deep Navy Blue as in physical reference
            ctx.lineWidth = 2.8;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            firstPoint = true;
            for (let i = 0; i < data.length; i++) {
                const temp = toEngineeringValue(data[i].pv, data[i].decimal_point ?? 0);
                if (temp === null || temp >= 3000) continue;

                const x = getX(i);
                const y = getY(temp);

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();

            // Draw current point glow dot
            const lastTemp = toEngineeringValue(data[data.length - 1].pv, data[data.length - 1].decimal_point ?? 0);
            if (lastTemp !== null && lastTemp < 3000) {
                const lastX = getX(data.length - 1);
                const lastY = getY(lastTemp);

                ctx.beginPath();
                ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#2563eb';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // 5. Draw Axis Titles
        // Y Axis Title
        ctx.save();
        ctx.translate(16, padding.top + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'black 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Temperature (°C)', 0, 0);
        ctx.restore();

        // X Axis Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'black 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Heating Time (minutes)', padding.left + plotWidth / 2, h - 8);

        // Border around chart area
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);

        // 6. Draw Hover Crosshair
        if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
            const hTemp = toEngineeringValue(data[hoverIndex].pv, data[hoverIndex].decimal_point ?? 0);
            if (hTemp !== null && hTemp < 3000) {
                const hX = getX(hoverIndex);
                const hY = getY(hTemp);

                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);

                // Vertical crosshair
                ctx.beginPath();
                ctx.moveTo(hX, padding.top);
                ctx.lineTo(hX, padding.top + plotHeight);
                ctx.stroke();

                // Horizontal crosshair
                ctx.beginPath();
                ctx.moveTo(padding.left, hY);
                ctx.lineTo(padding.left + plotWidth, hY);
                ctx.stroke();

                // Dot
                ctx.beginPath();
                ctx.arc(hX, hY, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.restore();
            }
        }

    }, [containerWidth, data, height, hoverIndex, segments, targetSv]);

    // Handle mouse move for interactive tooltip
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const padding = { left: 55, right: 30 };
        const plotWidth = containerWidth - padding.left - padding.right;

        const totalPoints = Math.max(120, data.length);
        const relX = x - padding.left;

        if (relX >= 0 && relX <= plotWidth) {
            const idx = Math.round((relX / plotWidth) * (totalPoints - 1));
            if (idx >= 0 && idx < data.length) {
                setHoverIndex(idx);
            } else {
                setHoverIndex(null);
            }
        } else {
            setHoverIndex(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverIndex(null);
    };

    const hoveredItem = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;
    const hoveredTemp = hoveredItem ? toEngineeringValue(hoveredItem.pv, hoveredItem.decimal_point ?? 0) : null;
    const hoveredMinute = hoverIndex !== null ? (Math.round((hoverIndex / 60) * 10) / 10) : 0;

    return (
        <div className="space-y-4">
            {/* Top Annotation Cards per Step Category (Matching Reference Diagram) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {segments.length === 0 ? (
                    <div className="col-span-full py-2 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                        Menunggu proses berjalan untuk kalkulasi zona step (CUT, Holding, Cooling)...
                    </div>
                ) : (
                    segments.map((seg, sIdx) => {
                        let badgeBg = 'bg-slate-100 border-slate-300 text-slate-800';
                        let accentBorder = 'border-l-4 border-l-slate-400';

                        if (seg.category === 'CUT') {
                            badgeBg = 'bg-gradient-to-r from-rose-50 to-white border-rose-200 text-rose-950';
                            accentBorder = 'border-l-4 border-l-rose-500';
                        } else if (seg.category === 'HOLD') {
                            badgeBg = 'bg-gradient-to-r from-amber-50 to-white border-amber-300 text-amber-950';
                            accentBorder = 'border-l-4 border-l-amber-500';
                        } else if (seg.category === 'COOL') {
                            badgeBg = 'bg-gradient-to-r from-blue-50 to-white border-blue-200 text-blue-950';
                            accentBorder = 'border-l-4 border-l-blue-500';
                        }

                        return (
                            <div
                                key={sIdx}
                                className={`p-3.5 rounded-2xl shadow-sm border ${badgeBg} ${accentBorder} transition-all hover:shadow-md`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider">
                                        {seg.stepName}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-white/90 px-2 py-0.5 rounded-md shadow-xs border border-slate-200">
                                        Step {seg.stepIndex}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-lg font-black font-mono tracking-tight">
                                        {seg.durationMinutes} <span className="text-xs font-bold text-slate-500">menit</span>
                                    </span>
                                    {seg.category === 'HOLD' && (
                                        <span className="text-xs font-mono font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                                            F₀ = {seg.f0Value}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>Rentang: {seg.startMinute}m – {seg.endMinute}m</span>
                                    <span>Avg: {seg.avgTemperature}°C</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Main Interactive Canvas Chart */}
            <div ref={containerRef} className="relative w-full rounded-2xl border border-slate-300 bg-white p-3 shadow-inner">
                {/* Hover Tooltip Overlay */}
                {hoverIndex !== null && hoveredTemp !== null && (
                    <div className="absolute top-4 right-4 bg-slate-950/90 text-white p-3 rounded-xl shadow-xl backdrop-blur-md border border-slate-800 text-xs font-mono z-10 pointer-events-none animate-fadeIn">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Waktu: {hoveredMinute} menit ({hoverIndex}s)
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-cyan-300">
                                PV: {hoveredTemp}°C
                            </span>
                            <span className="text-xs font-bold text-yellow-400">
                                Step {hoveredItem?.step_current ?? 0}
                            </span>
                        </div>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ width: '100%', height: `${height}px`, display: 'block', cursor: 'crosshair' }}
                />
            </div>

            {/* Bottom Chart Footer Status */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-bold">
                        <span className="h-3 w-3 rounded-full bg-[#1e3a8a]"></span>
                        Suhu Aktual PV (°C)
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-rose-600">
                        <span className="h-0.5 w-4 border-b-2 border-dashed border-rose-500"></span>
                        Target Sterilisasi ({targetSv}°C)
                    </span>
                </div>
                <div className="flex items-center gap-4 font-mono font-bold">
                    <span>Durasi: <strong className="text-slate-900">{stats.totalMinutes} Menit</strong></span>
                    <span>Suhu Max: <strong className="text-blue-700">{stats.maxTemp}°C</strong></span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        Total F₀: <strong>{stats.totalF0}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
