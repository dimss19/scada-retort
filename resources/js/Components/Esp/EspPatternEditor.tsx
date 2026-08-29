import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Trash2, Send, CheckCircle2, AlertTriangle, Layers, Play, Square, Clock, Activity } from 'lucide-react';
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

interface Props {
    machineCode: string;
    initialPattern?: EspPatternData;
    isOnline: boolean;
    telemetry?: EspTelemetryData;
}

export default function EspPatternEditor({ machineCode, initialPattern, isOnline, telemetry }: Props) {
    const [selectedPatternNum, setSelectedPatternNum] = useState<number>(initialPattern?.pattern_number ?? 0);
    const [steps, setSteps] = useState<EspStep[]>(
        initialPattern?.steps && initialPattern.steps.length > 0
            ? initialPattern.steps
            : [
                  { step_number: 0, step_name: 'Step 1', target_sv: 1170, duration: 2, end_action: 'CONT' },
                  { step_number: 1, step_name: 'Step 2', target_sv: 1170, duration: 35, end_action: 'CONT' },
                  { step_number: 2, step_name: 'Step 2', target_sv: 1250, duration: 3, end_action: 'CONT' },
                  { step_number: 3, step_name: 'Step 3', target_sv: 1250, duration: 100, end_action: 'CONT' },
              ]
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Active ESP Pattern & Step Telemetry
    const activeEspPattern = telemetry?.pattern ?? 0;
    const activeEspStep = telemetry?.step ?? 0;
    const isRunning = Boolean(telemetry?.run || (telemetry as any)?.running || (telemetry?.phase && telemetry.phase !== 'IDLE' && telemetry.phase !== 'Offline' && telemetry.phase !== 'Waiting'));
    const psText = telemetry?.ps || `${activeEspPattern}-${activeEspStep.toString().padStart(2, '0')}`;
    const totText = telemetry?.tot || '00:00';
    const stpText = telemetry?.stp || '00:00';

    const handleAddStep = () => {
        if (steps.length >= 20) return;
        const nextIdx = steps.length;
        const lastStep = steps[steps.length - 1];
        setSteps([
            ...steps,
            {
                step_number: nextIdx,
                step_name: `Step ${nextIdx + 1}`,
                target_sv: lastStep ? lastStep.target_sv : 1210,
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
                pattern_number: selectedPatternNum,
                steps: steps as any,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setStatusMsg({
                        type: 'success',
                        text: `Pattern #${selectedPatternNum} berhasil disinkronkan ke ESP32 via MQTT!`,
                    });
                    setTimeout(() => setStatusMsg(null), 5000);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setStatusMsg({
                        type: 'error',
                        text: Object.values(errors)[0] || 'Gagal menyimpan pattern. Periksa input Anda.',
                    });
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Live Active Pattern & Step Status Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                                <Activity size={13} className="text-blue-600" />
                                STATUS OPERASI ESP32
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black border ${
                                    isRunning
                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                            >
                                {isRunning ? (
                                    <>
                                        <Play size={12} className="text-amber-600 fill-amber-500 animate-pulse" />
                                        <span>PROSES RUNNING ({telemetry?.phase || 'HEATING'})</span>
                                    </>
                                ) : (
                                    <>
                                        <Square size={12} className="text-slate-500" />
                                        <span>PROSES STOP / IDLE</span>
                                    </>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-3 pt-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Pattern Aktif Saat Ini: <span className="text-blue-700">Pattern #{activeEspPattern}</span>
                            </h2>
                            <span className="text-sm font-bold text-slate-500">
                                (Step Aktif: <strong className="text-amber-700 font-mono">Step #{activeEspStep}</strong>)
                            </span>
                        </div>
                    </div>

                    {/* Quick Telemetry Indicators */}
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center min-w-[100px]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">P / S</p>
                            <p className="mt-1 font-mono text-lg font-black text-blue-700">{psText}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center min-w-[100px]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">STP (SISA)</p>
                            <p className="mt-1 font-mono text-lg font-black text-amber-700">{stpText}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center min-w-[100px]">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">TOT (TOTAL)</p>
                            <p className="mt-1 font-mono text-lg font-black text-slate-800">{totText}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pattern Configuration Form */}
            <form onSubmit={handleSavePattern} className="space-y-6">
                <div className="rounded-3xl border-2 border-amber-300 bg-white p-6 sm:p-8 shadow-xl ring-4 ring-amber-400/10 backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-200/80 pb-5 mb-6">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                                <h3 className="text-xl font-black tracking-tight text-slate-900">
                                    Langkah Operasi Sterilisasi (Pattern ESP32)
                                </h3>
                            </div>
                            <p className="text-xs font-bold text-amber-900 mt-1">
                                Parameter kunci sterilisasi: Target Suhu ( <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-slate-900">Ts0 .. Ts19</code> ), Durasi Waktu ( <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-slate-900">Tm0 .. Tm19</code> ), dan Aksi Akhir Tiap Langkah.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Pattern Number Selector */}
                            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1 border border-slate-200">
                                <span className="text-[11px] font-extrabold text-slate-600 pl-2">Pattern:</span>
                                <select
                                    value={selectedPatternNum}
                                    onChange={(e) => setSelectedPatternNum(Number(e.target.value))}
                                    className="rounded-xl border-none bg-white text-xs font-black text-slate-900 shadow-sm py-1.5 px-2.5 focus:ring-amber-500"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <option key={num} value={num}>
                                            Pattern {num} {num === activeEspPattern ? '(Aktif)' : ''}
                                        </option>
                                    ))}
                                </select>
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
                                    const isStepCurrentlyRunning = isRunning && activeEspStep === index && activeEspPattern === selectedPatternNum;

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
                                                        value={step.target_sv ?? 0}
                                                        onChange={(e) =>
                                                            handleUpdateStep(
                                                                index,
                                                                'target_sv',
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        className="block w-full rounded-xl border-amber-300 bg-amber-50/50 pl-14 pr-7 font-mono font-bold text-slate-900 text-xs py-2 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-right"
                                                    />
                                                    <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-500">
                                                        °C
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Tm Input (Duration MM.SS) */}
                                            <td className="whitespace-nowrap py-3 px-4">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-2 text-[10px] font-mono font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                                                        Tm{index}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={step.duration ?? 0}
                                                        onChange={(e) =>
                                                            handleUpdateStep(
                                                                index,
                                                                'duration',
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="block w-full rounded-xl border-blue-300 bg-blue-50/50 pl-14 pr-3 font-mono font-bold text-slate-900 text-xs py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                                                    />
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
                            <span>Total Step Aktif: <strong>{steps.length}</strong> langkah pada <strong>Pattern #{selectedPatternNum}</strong>.</span>
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
                                <span>{isSubmitting ? 'Mengirim ke ESP via MQTT...' : `Kirim Pattern #${selectedPatternNum} ke ESP`}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
