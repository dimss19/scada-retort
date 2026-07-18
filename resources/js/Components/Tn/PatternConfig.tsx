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
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase">Pattern Parameters</h3>
                    <p className="text-sm text-slate-500">Configure PATN operation mode.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleScan} disabled={loading} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300">
                        {loading ? 'Scanning...' : '🔄 Scan from Device'}
                    </button>
                    <button onClick={handleWrite} disabled={!pattern || loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50">
                        💾 Write to Device
                    </button>
                </div>
            </div>

            {!pattern ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    Click "Scan from Device" to load the current pattern configuration from the controller.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Basic Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">Pattern Number (0-9)</span>
                            <input type="number" min="0" max="9" value={pattern.pattern_number} onChange={e => updateConfig('pattern_number', parseInt(e.target.value))} className="rounded border-slate-300 w-24 text-right" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">Step Quantity (0-20)</span>
                            <input type="number" min="0" max="20" value={pattern.step_quantity} onChange={e => updateConfig('step_quantity', parseInt(e.target.value))} className="rounded border-slate-300 w-24 text-right" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">Time Unit</span>
                            <select value={pattern.time_unit} onChange={e => updateConfig('time_unit', parseInt(e.target.value))} className="rounded border-slate-300">
                                <option value="0">MM.SS</option>
                                <option value="1">HH.MM</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">Start Condition</span>
                            <select value={pattern.start_condition} onChange={e => updateConfig('start_condition', parseInt(e.target.value))} className="rounded border-slate-300">
                                <option value="0">SSV</option>
                                <option value="1">SPV</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">End State</span>
                            <select value={pattern.end_state} onChange={e => updateConfig('end_state', parseInt(e.target.value))} className="rounded border-slate-300">
                                <option value="0">STOP</option>
                                <option value="1">HOLD</option>
                                <option value="2">NEXT</option>
                                <option value="3">PRE</option>
                            </select>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">Repetitions</span>
                            <input type="number" min="0" max="10000" value={pattern.repetitions} onChange={e => updateConfig('repetitions', parseInt(e.target.value))} className="rounded border-slate-300 w-24 text-right" />
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 text-lg border-b pb-2">Steps (0-19)</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Step #</th>
                                        <th className="px-4 py-3">Target SV (TS)</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Duration (TM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pattern.steps.slice(0, pattern.step_quantity || 20).map((step: any, idx: number) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2 font-bold text-slate-600">Step {idx}</td>
                                            <td className="px-4 py-2">
                                                <input type="number" value={step.target_sv} onChange={e => updateStep(idx, 'target_sv', parseInt(e.target.value))} className="rounded border-slate-300 w-32" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" value={step.duration} onChange={e => updateStep(idx, 'duration', parseInt(e.target.value))} className="rounded border-slate-300 w-32" />
                                                <span className="ml-2 text-xs text-slate-400">({pattern.time_unit === 0 ? 'MM.SS' : 'HH.MM'})</span>
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
