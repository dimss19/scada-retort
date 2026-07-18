import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Form({ recipe, users = [] }: { recipe?: any; users?: any[] }) {
    const isEditing = !!recipe;

    const { data, setData, post, put, processing, errors } = useForm({
        recipe_code: recipe?.recipe_code || '',
        name: recipe?.name || '',
        product_name: recipe?.product_name || 'N/A',
        product_category: recipe?.product_category || '',
        package_type: recipe?.package_type || '',
        package_size: recipe?.package_size || '',
        description: recipe?.description || '',
        revision: recipe?.revision || 1,
        version: recipe?.version || '1.0',
        status: recipe?.status || 'Draft',
        approved_by: recipe?.approved_by || '',
        process_parameters: recipe?.process_parameters || {},
        time_unit: recipe?.time_unit || 'MM.SS',
        start_condition: recipe?.start_condition || 'SSV',
        pattern_end_state: recipe?.pattern_end_state || 'STOP',
        pattern_number: recipe?.pattern_number || 0,
        repetitions: recipe?.repetitions || 0,
        pid_group: recipe?.pid_group || 0,
        wait_width: recipe?.wait_width || 0,
        wait_time: recipe?.wait_time || 0,
        steps: recipe?.steps?.length > 0 ? recipe.steps : [
            { step_name: 'Step 1', target_sv: 0, duration: 0, steam_enable: false, cooling_enable: false, drain_enable: false, alarm_enable: true }
        ],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('tn.recipes.update', recipe.id));
        } else {
            post(route('tn.recipes.store'));
        }
    };

    const addStep = () => {
        if (data.steps.length >= 20) {
            alert('Maximum 20 steps allowed per pattern for TN Series.');
            return;
        }
        setData('steps', [
            ...data.steps, 
            { step_name: `Step ${data.steps.length + 1}`, target_sv: 0, duration: 0, steam_enable: false, cooling_enable: false, drain_enable: false, alarm_enable: true }
        ]);
    };

    const removeStep = (index: number) => {
        if (data.steps.length <= 1) return;
        const newSteps = [...data.steps];
        newSteps.splice(index, 1);
        setData('steps', newSteps);
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...data.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setData('steps', newSteps);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {isEditing ? `Edit Pattern: ${recipe.name}` : 'Create Pattern'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">Configure pattern details and steps.</p>
                    </div>
                    <Link
                        href={route('tn.recipes.index')}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                        &larr; Back to Patterns
                    </Link>
                </div>
            }
        >
            <Head title={isEditing ? 'Edit Pattern' : 'Create Pattern'} />

            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <form onSubmit={submit} className="space-y-8">
                    {/* General Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">General Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Recipe Code</label>
                                <input type="text" value={data.recipe_code} onChange={e => setData('recipe_code', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                {errors.recipe_code && <p className="mt-1 text-sm text-red-600">{errors.recipe_code}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Product Name</label>
                                <input type="text" value={data.product_name} onChange={e => setData('product_name', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                {errors.product_name && <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Status</label>
                                <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pattern Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Pattern Configuration</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Time Unit</label>
                                <select value={data.time_unit} onChange={e => setData('time_unit', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                    <option value="MM.SS">MM.SS (Min.Sec)</option>
                                    <option value="HH.MM">HH.MM (Hour.Min)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Start Condition</label>
                                <select value={data.start_condition} onChange={e => setData('start_condition', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                    <option value="SSV">Start from Target (SSV)</option>
                                    <option value="SPV">Start from Current PV (SPV)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">End State</label>
                                <select value={data.pattern_end_state} onChange={e => setData('pattern_end_state', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                    <option value="STOP">STOP</option>
                                    <option value="HOLD">HOLD</option>
                                    <option value="NEXT">NEXT</option>
                                    <option value="PRE">PRE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Pattern Number</label>
                                <input type="number" min="0" max="9" value={data.pattern_number} onChange={e => setData('pattern_number', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Repetitions</label>
                                <input type="number" min="0" max="10000" value={data.repetitions} onChange={e => setData('repetitions', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">PID Group</label>
                                <input type="number" min="0" max="7" value={data.pid_group} onChange={e => setData('pid_group', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Wait Width</label>
                                <input type="number" min="0" value={data.wait_width} onChange={e => setData('wait_width', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Wait Time</label>
                                <input type="number" min="0" value={data.wait_time} onChange={e => setData('wait_time', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Steps Table */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-medium text-slate-900">Pattern Steps</h3>
                            <button type="button" onClick={addStep} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                + Add Step
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-300">
                                <thead>
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Step Name</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Target SV (Temp)</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Duration</th>
                                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {data.steps.map((step: any, index: number) => (
                                        <tr key={index}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                                                <input type="text" value={step.step_name} onChange={e => updateStep(index, 'step_name', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <input type="number" value={step.target_sv} onChange={e => updateStep(index, 'target_sv', parseInt(e.target.value) || 0)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <input type="number" min="0" value={step.duration} onChange={e => updateStep(index, 'duration', parseInt(e.target.value) || 0)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium">
                                                <button type="button" onClick={() => removeStep(index)} disabled={data.steps.length <= 1} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-x-4">
                        <Link href={route('tn.recipes.index')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
                            {isEditing ? 'Save Changes' : 'Create Pattern'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
