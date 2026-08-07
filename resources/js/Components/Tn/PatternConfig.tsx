import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function PatternConfig({ controllerId }: { controllerId: number }) {
    const [pattern, setPattern] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleScan = async () => {
        setLoading(true);
        try {
            const res = await (window as any).axios.get(route('tn.config.pattern.scan', controllerId));
            setPattern(res.data);
        } catch (err: any) {
            alert('Failed to scan pattern: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleWrite = () => {
        if (!pattern) return;
        router.post(route('tn.config.pattern.write', controllerId), pattern, {
            preserveScroll: true,
            onSuccess: () => alert('Pattern written to device successfully.')
        });
    };

    const updateConfig = (key: string, value: number) => {
        setPattern((prev: any) => ({ ...prev, [key]: value }));
    };

    const updateStep = (index: number, key: string, value: number) => {
        setPattern((prev: any) => {
            const newSteps = [...prev.steps];
            newSteps[index] = { ...newSteps[index], [key]: value };
            return { ...prev, steps: newSteps };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-5 border-b border-slate-200">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Pattern Parameters</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Konfigurasi profil mode operasi PATN.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleScan} disabled={loading} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-300 shadow-sm transition-all">
                        {loading ? 'Scanning...' : 'Scan from Device'}
                    </button>
                    <button onClick={handleWrite} disabled={!pattern || loading} className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all border-none disabled:opacity-50">
                        Write to Device
                    </button>
                </div>
            </div>

            {!pattern ? (
                <div className="text-center py-12 text-xs font-bold text-slate-500 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-8">
                    Klik "Scan from Device" untuk membaca konfigurasi pattern langsung dari controller.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Basic Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">Pattern Number (0-9)</span>
                            <input type="number" min="0" max="9" value={pattern.pattern_number} onChange={e => updateConfig('pattern_number', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-mono font-bold text-slate-900 w-24 text-right shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">Step Quantity (0-20)</span>
                            <input type="number" min="0" max="20" value={pattern.step_quantity} onChange={e => updateConfig('step_quantity', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-mono font-bold text-slate-900 w-24 text-right shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">Time Unit</span>
                            <select value={pattern.time_unit} onChange={e => updateConfig('time_unit', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-bold text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-sm">
                                <option value="0">MM.SS</option>
                                <option value="1">HH.MM</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">Start Condition</span>
                            <select value={pattern.start_condition} onChange={e => updateConfig('start_condition', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-bold text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-sm">
                                <option value="0">SSV</option>
                                <option value="1">SPV</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">End State</span>
                            <select value={pattern.end_state} onChange={e => updateConfig('end_state', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-bold text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-sm">
                                <option value="0">STOP</option>
                                <option value="1">HOLD</option>
                                <option value="2">NEXT</option>
                                <option value="3">PRE</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm">Repetitions</span>
                            <input type="number" min="0" max="10000" value={pattern.repetitions} onChange={e => updateConfig('repetitions', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-white font-mono font-bold text-slate-900 w-24 text-right shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <h4 className="font-black text-slate-900 mb-4 text-lg border-b border-slate-200 pb-2">Steps Profile</h4>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs font-black text-white uppercase bg-[#0f172a]">
                                    <tr>
                                        <th className="px-5 py-3.5">Step #</th>
                                        <th className="px-5 py-3.5">Target SV (TS)</th>
                                        <th className="px-5 py-3.5">Duration (TM)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                                    {pattern.steps.slice(0, pattern.step_quantity || 20).map((step: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-5 py-3 font-extrabold text-slate-800 font-sans">Step {idx}</td>
                                            <td className="px-5 py-3">
                                                <input type="number" value={step.target_sv} onChange={e => updateStep(idx, 'target_sv', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold w-36 focus:border-blue-600 focus:ring-blue-600" />
                                            </td>
                                            <td className="px-5 py-3">
                                                <input type="number" value={step.duration} onChange={e => updateStep(idx, 'duration', parseInt(e.target.value))} className="rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold w-36 focus:border-blue-600 focus:ring-blue-600" />
                                                <span className="ml-2 text-xs font-extrabold text-blue-700 font-sans">({pattern.time_unit === 0 ? 'MM.SS' : 'HH.MM'})</span>
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
    );
}
