import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';

interface RecipeStep {
    target_sv: number;
    time_minutes: number;
    time_seconds: number;
}

export default function CreateEdit({ auth, recipe }: PageProps<{ recipe?: any }>) {
    const isEdit = !!recipe;

    const { data, setData, post, put, processing, errors } = useForm({
        name: recipe?.name || '',
        description: recipe?.description || '',
        time_unit: recipe?.time_unit || 'MM.SS',
        start_condition: recipe?.start_condition || 'SSV',
        pattern_end_state: recipe?.pattern_end_state || 'STOP',
        repetitions: recipe?.repetitions || 0,
        target_f0: recipe?.target_f0 || 6.0,
        z_value: recipe?.z_value || 10.0,
        t_ref: recipe?.t_ref || 121.1,
        steps: recipe?.steps?.map((s: any) => ({
            target_sv: s.target_sv,
            time_minutes: s.time_minutes,
            time_seconds: s.time_seconds
        })) || [
            { target_sv: 121, time_minutes: 30, time_seconds: 0 }
        ] as RecipeStep[]
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 200 });

    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setCanvasSize(prev => {
                        const w = Math.floor(entry.contentRect.width);
                        const h = Math.floor(entry.contentRect.width * 0.25);
                        return prev.width !== w || prev.height !== h ? { width: w, height: h } : prev;
                    });
                }
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.steps.length === 0) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 30;

        // Calculate total time (seconds) and max temp
        let totalTimeSec = 0;
        let maxTemp = 100;
        const points: {x: number, y: number, temp: number, accTime: number}[] = [];

        // Start from 0,0 assuming ambient 30C
        points.push({ x: 0, y: 30, temp: 30, accTime: 0 });

        data.steps.forEach((step: RecipeStep) => {
            const stepSec = (step.time_minutes * 60) + step.time_seconds;
            totalTimeSec += stepSec;
            if (step.target_sv > maxTemp) maxTemp = step.target_sv;
            points.push({ x: 0, y: step.target_sv, temp: step.target_sv, accTime: totalTimeSec });
        });

        // Add 10% padding to maxTemp and minTemp
        maxTemp = maxTemp * 1.2;
        const minTemp = 0;

        // Calculate actual x,y coordinates
        points.forEach(p => {
            p.x = padding + (totalTimeSec > 0 ? (p.accTime / totalTimeSec) * (width - 2 * padding) : 0);
            p.y = height - padding - ((p.temp - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding);
        });

        // Draw Grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height - 2 * padding) * (i / 4);
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            const val = maxTemp - ((maxTemp - minTemp) * (i / 4));
            ctx.fillText(Math.round(val).toString(), padding - 5, y + 3);
        }
        ctx.stroke();

        // Draw Line
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red for temperature profile
        ctx.lineWidth = 3;
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Draw Nodes
        ctx.fillStyle = '#b91c1c';
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

    }, [data.steps, canvasSize]);

    const addStep = () => {
        if (data.steps.length >= 20) {
            alert('Maximum 20 steps allowed.');
            return;
        }
        const lastStep = data.steps[data.steps.length - 1];
        setData('steps', [...data.steps, { 
            target_sv: lastStep ? lastStep.target_sv : 121, 
            time_minutes: 10, 
            time_seconds: 0 
        }]);
    };

    const removeStep = (index: number) => {
        if (data.steps.length <= 1) return;
        const newSteps = [...data.steps];
        newSteps.splice(index, 1);
        setData('steps', newSteps);
    };

    const updateStep = (index: number, field: keyof RecipeStep, value: number) => {
        const newSteps = [...data.steps];
        newSteps[index][field] = value;
        setData('steps', newSteps);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('tn.recipes.update', recipe.id));
        } else {
            post(route('tn.recipes.store'));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">{isEdit ? 'Edit Recipe Template' : 'Create New Recipe'}</h2>}
        >
            <Head title={isEdit ? 'Edit Recipe' : 'Create Recipe'} />

            <div className="py-4">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Info & F0 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white p-4 shadow-sm rounded-lg border border-slate-200">
                                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-3">General Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Recipe Name</label>
                                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Description</label>
                                        <textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 shadow-sm rounded-lg border border-slate-200">
                                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-3">Validation Target (Lethality)</h3>
                                <p className="text-xs text-slate-500 mb-3">Set the microbiological safety targets for this product recipe. SCADA will calculate the real-time F₀ based on these parameters.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Target F₀</label>
                                        <input type="number" step="0.1" value={data.target_f0} onChange={e => setData('target_f0', parseFloat(e.target.value))} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Z-Value (°C)</label>
                                        <input type="number" step="0.1" value={data.z_value} onChange={e => setData('z_value', parseFloat(e.target.value))} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">T-Ref (°C)</label>
                                        <input type="number" step="0.1" value={data.t_ref} onChange={e => setData('t_ref', parseFloat(e.target.value))} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Preview */}
                        <div className="bg-white p-4 shadow-sm rounded-lg border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-3">Temperature Profile Preview</h3>
                            <div ref={canvasContainerRef} className="w-full h-48 bg-slate-50 border border-slate-100 rounded overflow-hidden">
                                <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="w-full h-full" />
                            </div>
                        </div>

                        {/* Steps Builder */}
                        <div className="bg-white p-4 shadow-sm rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center border-b pb-2 mb-3">
                                <h3 className="text-base font-bold text-slate-800">Pattern Steps</h3>
                                <button type="button" onClick={addStep} className="bg-slate-800 text-white px-3 py-1 text-sm rounded hover:bg-slate-700">
                                    + Add Step
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[240px] overflow-y-auto">
                                {data.steps.map((step: RecipeStep, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                                        <div className="font-bold text-slate-400 w-6 text-center text-sm">#{idx + 1}</div>

                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500">SV (°C)</label>
                                                <input type="number" step="0.1" value={step.target_sv} onChange={e => updateStep(idx, 'target_sv', parseFloat(e.target.value))} className="mt-0.5 block w-full text-sm rounded-md border-slate-300 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500">Min</label>
                                                <input type="number" min="0" value={step.time_minutes} onChange={e => updateStep(idx, 'time_minutes', parseInt(e.target.value))} className="mt-0.5 block w-full text-sm rounded-md border-slate-300 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500">Sec</label>
                                                <input type="number" min="0" max="59" value={step.time_seconds} onChange={e => updateStep(idx, 'time_seconds', parseInt(e.target.value))} className="mt-0.5 block w-full text-sm rounded-md border-slate-300 shadow-sm" />
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => removeStep(idx)} disabled={data.steps.length === 1} className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1">
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {errors.steps && <p className="text-red-500 text-xs mt-2">Error in steps data.</p>}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={processing} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50">
                                {isEdit ? 'Update Recipe' : 'Save Recipe'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
