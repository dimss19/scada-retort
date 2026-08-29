import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Trash2, Send, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { EspTelemetryData } from './EspMonitoringPanel';

export interface EspStep {
    step_number: number;
    step_name: string;
    target_sv: number;
    duration: number;
    end_action: 'CONT' | 'HOLD' | 'STOP';
}

export interface EspPatternData {
    machine_code?: string;
    time_unit?: 'MM.SS' | 'HH.MM';
    pattern_number?: number;
    steps: EspStep[];
}

export function durationToMmSs(val: number): { mm: number; ss: number } {
    const num = Math.max(0, Math.floor(Number(val) || 0));
    if (num >= 100) {
        const mm = Math.floor(num / 100);
        const ss = Math.min(59, num % 100);
        return { mm, ss };
    }
    return { mm: 0, ss: Math.min(59, num) };
}

export function mmSsToDuration(mm: number, ss: number): number {
    const validMm = Math.max(0, Math.min(999, Math.floor(Number(mm) || 0)));
    const validSs = Math.max(0, Math.min(59, Math.floor(Number(ss) || 0)));
    return (validMm * 100) + validSs;
}

interface Props {
    machineCode: string;
    initialPattern?: EspPatternData;
    isOnline: boolean;
    telemetry?: EspTelemetryData;
}

export default function EspPatternEditor({ machineCode, initialPattern, isOnline, telemetry }: Props) {
    // Active ESP Pattern & Step Telemetry (Read-only from controller / ESP)
    const activeEspPattern = telemetry?.pattern ?? initialPattern?.pattern_number ?? 0;
    const activeEspStep = telemetry?.step ?? 0;
    const isRunning = Boolean(telemetry?.run || (telemetry as any)?.running || (telemetry?.phase && telemetry.phase !== 'IDLE' && telemetry.phase !== 'Offline' && telemetry.phase !== 'Waiting'));

    const [steps, setSteps] = useState<EspStep[]>(() => {
        const rawSteps = initialPattern?.steps && initialPattern.steps.length > 0
            ? initialPattern.steps
            : [
                  { step_number: 0, step_name: 'Step 1', target_sv: 117.0, duration: 2, end_action: 'CONT' },
                  { step_number: 1, step_name: 'Step 2', target_sv: 117.0, duration: 35, end_action: 'CONT' },
                  { step_number: 2, step_name: 'Step 2', target_sv: 125.0, duration: 3, end_action: 'CONT' },
                  { step_number: 3, step_name: 'Step 3', target_sv: 125.0, duration: 100, end_action: 'CONT' },
              ];
        return rawSteps.map((s, idx) => ({
            ...s,
            step_number: idx,
            target_sv: Number(s.target_sv) > 300 ? Number(s.target_sv) / 10 : Number(s.target_sv),
            end_action: (s.end_action || 'CONT') as 'CONT' | 'HOLD' | 'STOP',
        }));
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleAddStep = () => {
        if (steps.length >= 20) return;
        const nextIdx = steps.length;
        const lastStep = steps[steps.length - 1];
        setSteps([
            ...steps,
            {
                step_number: nextIdx,
                step_name: `Step ${nextIdx + 1}`,
                target_sv: lastStep ? lastStep.target_sv : 121.0,
                duration: 30,
                end_action: 'CONT',
            },
        ]);
    };

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) return;
        const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({
            ...s,
            step_number: idx,
        }));
        setSteps(updated);
    };

    const handleUpdateStep = (index: number, field: keyof EspStep, val: any) => {
        const updated = [...steps];
        updated[index] = { ...updated[index], [field]: val };
        setSteps(updated);
    };

    const handleSavePattern = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg(null);

        router.post(
            route('esp.pattern.save'),
            {
                machine_code: machineCode,
                time_unit: 'MM.SS',
                pattern_number: activeEspPattern,
                steps: steps as any,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setStatusMsg({
                        type: 'success',
                        text: `Step Pattern #${activeEspPattern} berhasil disinkronkan ke ESP32 via MQTT!`,
                    });
                    setTimeout(() => setStatusMsg(null), 5000);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setStatusMsg({
                        type: 'error',
                        text: Object.values(errors)[0] || 'Gagal menyimpan step. Periksa input Anda.',
                    });
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Pattern Configuration Form */}
            <form onSubmit={handleSavePattern} className="space-y-6">
                <div className="rounded-3xl border-2 border-amber-300 bg-white p-6 sm:p-8 shadow-xl ring-4 ring-amber-400/10 backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-200/80 pb-5 mb-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                            <h3 className="text-xl font-black tracking-tight text-slate-900">
                                Langkah Operasi Sterilisasi (Pattern ESP32)
                            </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Read-Only Active Pattern Badge */}
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-2xl px-3.5 py-2 shadow-sm">
                                <span className="text-xs font-bold text-slate-600">Pattern Terbaca:</span>
                                <span className="font-mono text-xs font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg">
                                    Pattern #{activeEspPattern}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddStep}
                                disabled={steps.length >= 20}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <Plus size={15} />
                                <span>Tambah Step ({steps.length}/20)</span>
                            </button>
                        </div>
                    </div>

                    {/* Table of Steps */}
                    <div className="overflow-x-auto rounded-2xl border border-amber-200/90 shadow-sm">
                        <table className="min-w-full divide-y divide-amber-200 text-sm">
                            <thead className="bg-[#0f172a] text-white">
                                <tr>
                                    <th className="py-3.5 px-3 text-center text-xs font-mono font-black text-yellow-400 w-12">
                                        #
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-xs font-black uppercase tracking-wider min-w-[170px]">
                                        NAMA STEP
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-xs font-mono font-black text-amber-300 uppercase tracking-wider min-w-[160px]">
                                        TS (TARGET SV °C)
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-xs font-mono font-black text-amber-300 uppercase tracking-wider min-w-[160px]">
                                        TM (DURASI MM.SS)
                                    </th>
                                    <th className="py-3.5 px-4 text-left text-xs font-black uppercase tracking-wider min-w-[190px]">
                                        END ACTION (HOLD / CONT)
                                    </th>
                                    <th className="py-3.5 px-3 text-center text-xs font-black uppercase tracking-wider w-16">
                                        AKSI
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {steps.map((step, index) => {
                                    const isStepCurrentlyRunning = isRunning && activeEspStep === index;

                                    return (
                                        <tr
                                            key={index}
                                            className={`transition-colors ${
                                                isStepCurrentlyRunning
                                                    ? 'bg-amber-100/70 ring-2 ring-amber-400 font-semibold'
                                                    : 'hover:bg-amber-50/50'
                                            }`}
                                        >
                                            {/* Step Number Badge */}
                                            <td className="whitespace-nowrap py-3 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span
                                                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-mono text-xs font-black shadow-sm ${
                                                            isStepCurrentlyRunning
                                                                ? 'bg-amber-600 text-white animate-bounce'
                                                                : 'bg-slate-900 text-yellow-400'
                                                        }`}
                                                    >
                                                        {index}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Step Name */}
                                            <td className="whitespace-nowrap py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={step.step_name || `Step ${index + 1}`}
                                                        onChange={(e) => handleUpdateStep(index, 'step_name', e.target.value)}
                                                        className="block w-full rounded-xl border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs py-2 px-3 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                                        placeholder={`Contoh: Step ${index + 1}`}
                                                    />
                                                    {isStepCurrentlyRunning && (
                                                        <span className="shrink-0 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Ts Input (Target SV) */}
                                            <td className="whitespace-nowrap py-3 px-4">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-2 text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                                        Ts{index}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={step.target_sv ?? ''}
                                                        onChange={(e) =>
                                                            handleUpdateStep(
                                                                index,
                                                                'target_sv',
                                                                e.target.value === '' ? '' : parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className="block w-full rounded-xl border-amber-300 bg-amber-50/50 pl-14 pr-7 font-mono font-bold text-slate-900 text-xs py-2 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-right"
                                                        placeholder="121.0"
                                                    />
                                                    <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-500">
                                                        °C
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Tm Input (Stopwatch MM:SS) */}
                                            <td className="whitespace-nowrap py-3 px-4">
                                                <div className="flex items-center gap-1 rounded-xl border border-blue-300 bg-blue-50/50 p-1 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/20">
                                                    <span className="shrink-0 text-[10px] font-mono font-bold text-blue-800 bg-blue-100 px-1.5 py-1 rounded">
                                                        Tm{index}
                                                    </span>
                                                    <div className="flex items-center flex-1 justify-center gap-1 font-mono">
                                                        {/* Minutes (MM) */}
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="999"
                                                                value={durationToMmSs(step.duration).mm}
                                                                onChange={(e) => {
                                                                    const newMm = Math.max(0, parseInt(e.target.value) || 0);
                                                                    const currSs = durationToMmSs(step.duration).ss;
                                                                    handleUpdateStep(index, 'duration', mmSsToDuration(newMm, currSs));
                                                                }}
                                                                className="w-12 text-center py-1 px-0.5 rounded-lg bg-white border border-blue-200 font-mono font-black text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                                                                placeholder="00"
                                                            />
                                                            <span className="text-[9px] font-bold text-slate-400 ml-0.5">m</span>
                                                        </div>

                                                        <span className="font-mono font-black text-blue-600 text-xs">:</span>

                                                        {/* Seconds (SS, max 59) */}
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="59"
                                                                value={durationToMmSs(step.duration).ss.toString().padStart(2, '0')}
                                                                onChange={(e) => {
                                                                    let newSs = parseInt(e.target.value) || 0;
                                                                    if (newSs > 59) newSs = 59;
                                                                    if (newSs < 0) newSs = 0;
                                                                    const currMm = durationToMmSs(step.duration).mm;
                                                                    handleUpdateStep(index, 'duration', mmSsToDuration(currMm, newSs));
                                                                }}
                                                                className="w-12 text-center py-1 px-0.5 rounded-lg bg-white border border-blue-200 font-mono font-black text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                                                                placeholder="00"
                                                            />
                                                            <span className="text-[9px] font-bold text-slate-400 ml-0.5">s</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* End Action Dropdown */}
                                            <td className="whitespace-nowrap py-3 px-4">
                                                <select
                                                    value={step.end_action || 'CONT'}
                                                    onChange={(e) =>
                                                        handleUpdateStep(index, 'end_action', e.target.value as any)
                                                    }
                                                    className="block w-full rounded-xl border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs py-2 px-3 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                                >
                                                    <option value="CONT">CONT (Lanjut Otomatis)</option>
                                                    <option value="HOLD">HOLD (Tahan Suhu)</option>
                                                    <option value="STOP">STOP (Selesai)</option>
                                                </select>
                                            </td>

                                            {/* Delete Button */}
                                            <td className="whitespace-nowrap py-3 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStep(index)}
                                                    disabled={steps.length <= 1}
                                                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                    title="Hapus step ini"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="mt-7 pt-5 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Layers size={16} className="text-amber-500" />
                            <span>Total Step Aktif: <strong>{steps.length}</strong> langkah pada <strong>Pattern #{activeEspPattern}</strong>.</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {statusMsg && (
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                                        statusMsg.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : 'bg-rose-50 text-rose-800 border-rose-300'
                                    }`}
                                >
                                    {statusMsg.type === 'success' ? (
                                        <CheckCircle2 size={14} className="text-emerald-600" />
                                    ) : (
                                        <AlertTriangle size={14} className="text-rose-600" />
                                    )}
                                    {statusMsg.text}
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black px-6 py-3 text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <Send size={16} className={isSubmitting ? 'animate-bounce' : ''} />
                                <span>{isSubmitting ? 'Mengirim ke ESP via MQTT...' : `Kirim Step Pattern #${activeEspPattern} ke ESP`}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
