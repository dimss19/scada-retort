import React from 'react';
import { SensorData } from '@/types/scada';
import { RetortTelemetry } from '@/Pages/Tn/retortTelemetry';
import { RETORT_HMI_BASE64 } from './hmiAsset';

interface Props {
    controllerName?: string;
    controllerModel?: string;
    sensorData?: SensorData;
    telemetry?: RetortTelemetry;
    isOnline?: boolean;
}

export default function RetortIndustrialHmi({
    controllerName = 'Retort TNH',
    controllerModel = 'TNH',
    sensorData,
    telemetry,
    isOnline = true,
}: Props) {
    // Live Process Values
    const isRunning = Boolean(telemetry?.running || (sensorData && sensorData.run_status === false));

    const pv = typeof sensorData?.pv === 'number'
        ? sensorData.pv.toFixed(1)
        : (telemetry?.actualTemperature ? telemetry.actualTemperature.toFixed(1) : '27.1');

    const sv = typeof sensorData?.sv === 'number'
        ? sensorData.sv.toFixed(1)
        : (telemetry?.targetTemperature ? telemetry.targetTemperature.toFixed(1) : '121.0');

    // Valve & MV Logic: Initially 0, becomes 100 when valve opens / heating output active
    const isValveOpen = Boolean(
        (sensorData && typeof sensorData.heating_mv === 'number' && sensorData.heating_mv > 0) ||
        Boolean(sensorData?.out1_active) ||
        Boolean(telemetry?.heatingActive) ||
        (typeof telemetry?.heatingPercent === 'number' && telemetry.heatingPercent > 0)
    );

    const displayMv = isValveOpen
        ? (sensorData?.heating_mv ? Math.round(sensorData.heating_mv) : (telemetry?.heatingPercent ? Math.round(telemetry.heatingPercent) : 100))
        : 0;

    const currentStep = Number(sensorData?.step_current ?? 0);
    const currentPattern = Number(sensorData?.pattern_current ?? 2);
    const restTime = typeof sensorData?.rest_time === 'number'
        ? sensorData.rest_time
        : 52;

    const timeFormatted = String(Math.max(0, Math.trunc(restTime))).padStart(2, '0');
    const timeSec = timeFormatted.slice(-2) || '52';

    // Alarms check
    const isAlarmActive = Boolean(telemetry?.alarmActive);

    return (
        <div className="relative mx-auto w-full max-w-[1300px] select-none rounded-3xl border-4 border-slate-800 bg-[#030712] p-3 sm:p-5 shadow-2xl overflow-hidden font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial from-blue-900/20 via-slate-950/60 to-black pointer-events-none" />

            {/* TOP HEADER: CONTROLLER INFO & RUN STATUS */}
            <div className="relative z-20 mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3 px-2">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-sm font-black tracking-wide text-slate-200 uppercase">
                        {controllerName} &bull; <span className="text-blue-400 font-mono">{controllerModel}</span>
                    </span>
                </div>

                {/* SYSTEM RUN STATUS */}
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black tracking-wider border ${
                        isRunning
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                        <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {isRunning ? 'RETORT RUNNING' : 'RETORT STOPPED'}
                    </span>
                </div>
            </div>

            {/* MAIN 3D HMI SCADA STAGE */}
            <div className="relative z-10 w-full rounded-2xl bg-gradient-to-b from-slate-950 via-[#060e22] to-black border border-slate-800 p-2 sm:p-4 overflow-hidden shadow-inner flex items-center justify-center min-h-[500px] md:min-h-[640px]">
                
                {/* 3D HMI Background Image Container (Aspect Ratio Preserved) */}
                <div className="relative w-full max-w-[1100px] aspect-[16/9] flex items-center justify-center">
                    
                    {/* Inlined Ultra-Fast WebP (0ms Load / Zero Latency) */}
                    <img
                        src={RETORT_HMI_BASE64}
                        alt="Desain HMI Retort & Boiler"
                        loading="eager"
                        decoding="sync"
                        className="w-full h-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)] pointer-events-none"
                    />

                    {/* Valve Open Glow Indicator on the center pipe valve */}
                    {isValveOpen && (
                        <div className="absolute left-[50.8%] top-[58.8%] -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-red-500/30 filter blur-md animate-ping" />
                        </div>
                    )}

                    {/* ================= LEFT TANK (BOILER): STACKED PROCESS DISPLAY ================= */}
                    <div className="absolute left-[10%] sm:left-[11.2%] top-[20%] sm:top-[22%] z-20 w-[26%] sm:w-[24%] font-mono">
                        <div
                            className="w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-400/80 shadow-2xl"
                            style={{
                                background: 'linear-gradient(180deg, #edf2f7 0%, #e2e8f0 40%, #cbd5e1 80%, #bac7d5 100%)',
                                boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.9), 0 8px 22px rgba(0,0,0,0.4)',
                            }}
                        >
                            {/* Blue Header Bar (TEMP) */}
                            <div className="bg-[#1d4ed8] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#1e40af] shadow-sm">
                                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-white drop-shadow">
                                    TEMP
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-blue-100">
                                    (°C)
                                </span>
                            </div>

                            {/* Section 1: Pv, Sv, Mv */}
                            <div className="p-2 sm:p-2.5 flex flex-col gap-1.5">
                                {/* Pv Row */}
                                <div className="flex items-center justify-between bg-[#f8fafc]/95 border border-slate-300 rounded-lg px-2.5 py-1 shadow-inner">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500">Pv</span>
                                    <span className="text-sm sm:text-xl font-black text-slate-950 tracking-tight">
                                        {pv}
                                    </span>
                                </div>

                                {/* Sv Row */}
                                <div className="flex items-center justify-between bg-[#f8fafc]/95 border border-slate-300 rounded-lg px-2.5 py-1 shadow-inner">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500">Sv</span>
                                    <span className="text-sm sm:text-xl font-black text-slate-950 tracking-tight">
                                        {sv}
                                    </span>
                                </div>

                                {/* Mv Row (0 initially, becomes 100 when valve opens) */}
                                <div className="flex items-center justify-between bg-[#f8fafc]/95 border border-slate-300 rounded-lg px-2.5 py-1 shadow-inner">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500">Mv</span>
                                    <div className="flex items-center gap-1 font-black text-sm sm:text-xl">
                                        <span className={isValveOpen ? 'text-amber-800 font-black' : 'text-slate-950 font-black'}>
                                            {displayMv}
                                        </span>
                                        <span className="text-slate-500 text-xs sm:text-sm font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Blue Header Bar (STEP - Di Bawah MV) */}
                            <div className="bg-[#1d4ed8] text-white px-3 py-1 text-center border-y border-[#1e40af] shadow-sm">
                                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-white drop-shadow">
                                    STEP
                                </span>
                            </div>

                            {/* Section 2: Step Tiles (Di Bawah MV) */}
                            <div className="p-2 sm:p-2.5">
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    {/* Pattern Tile */}
                                    <div className="bg-[#f8fafc]/95 border border-slate-300 rounded-lg py-1 px-0.5 flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">PTN</span>
                                        <span className="text-xs sm:text-base font-black text-slate-950">{currentPattern}</span>
                                    </div>

                                    {/* Step Tile */}
                                    <div className="bg-[#f8fafc]/95 border border-slate-300 rounded-lg py-1 px-0.5 flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">STEP</span>
                                        <span className="text-xs sm:text-base font-black text-slate-950">{currentStep}</span>
                                    </div>

                                    {/* Time Tile */}
                                    <div className="bg-[#f8fafc]/95 border border-slate-300 rounded-lg py-1 px-0.5 flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">REST</span>
                                        <span className="text-xs sm:text-base font-black text-blue-900">{timeSec}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT TANK (RETORT): 4 EMBOSSED ALARM BUTTONS ================= */}
                    <div className="absolute right-[9.5%] sm:right-[10.5%] top-[24%] sm:top-[26%] z-20 w-[27%] sm:w-[25%] font-mono">
                        <div
                            className="w-full p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-400/80 shadow-2xl grid grid-cols-2 gap-2 sm:gap-3"
                            style={{
                                background: 'linear-gradient(180deg, #edf2f7 0%, #e2e8f0 40%, #cbd5e1 80%, #bac7d5 100%)',
                                boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.9), 0 8px 22px rgba(0,0,0,0.4)',
                            }}
                        >
                            {/* BUTTON 1: CEK ALARM 1 */}
                            <div
                                className="relative rounded-lg sm:rounded-xl border-2 border-slate-700 bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-md transition-transform active:scale-95"
                                style={{
                                    boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                <span className="text-[9px] sm:text-[11px] font-black text-slate-200 tracking-wider uppercase leading-tight drop-shadow">
                                    CEK ALARM 1
                                </span>
                            </div>

                            {/* BUTTON 2: CEK ALARM 2 */}
                            <div
                                className="relative rounded-lg sm:rounded-xl border-2 border-slate-700 bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-md transition-transform active:scale-95"
                                style={{
                                    boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                <span className="text-[9px] sm:text-[11px] font-black text-slate-200 tracking-wider uppercase leading-tight drop-shadow">
                                    CEK ALARM 2
                                </span>
                            </div>

                            {/* BUTTON 3: CEK ALARM 3 */}
                            <div
                                className="relative rounded-lg sm:rounded-xl border-2 border-slate-700 bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-md transition-transform active:scale-95"
                                style={{
                                    boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                <span className="text-[9px] sm:text-[11px] font-black text-slate-200 tracking-wider uppercase leading-tight drop-shadow">
                                    CEK ALARM 3
                                </span>
                            </div>

                            {/* BUTTON 4: CEK ALARM 4 */}
                            <div
                                className="relative rounded-lg sm:rounded-xl border-2 border-slate-700 bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-md transition-transform active:scale-95"
                                style={{
                                    boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                <span className="text-[9px] sm:text-[11px] font-black text-slate-200 tracking-wider uppercase leading-tight drop-shadow">
                                    CEK ALARM 4
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
