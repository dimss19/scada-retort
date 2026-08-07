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
            alert('Maksimal 20 langkah diperbolehkan per pattern pada TN Series.');
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            {isEditing ? `Edit Pattern: ${recipe.name}` : 'Buat Pattern Baru'}
                        </h1>
                        <p className="text-sm font-semibold text-slate-600">Konfigurasi parameter detail dan langkah operasi pattern.</p>
                    </div>
                    <Link
                        href={route('tn.recipes.index')}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        ← Kembali ke Daftar Pattern
                    </Link>
                </div>
            }
        >
            <Head title={isEditing ? 'Edit Pattern' : 'Buat Pattern'} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">
                    {/* General Information */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/90 backdrop-blur-xl">
                        <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-200 pb-3">Informasi Umum</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Kode Resep / Pattern</label>
                                <input type="text" value={data.recipe_code} onChange={e => setData('recipe_code', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2.5 px-3.5" />
                                {errors.recipe_code && <p className="mt-1 text-xs font-bold text-rose-600">{errors.recipe_code}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Nama Pattern</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2.5 px-3.5" />
                                {errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Nama Produk</label>
                                <input type="text" value={data.product_name} onChange={e => setData('product_name', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2.5 px-3.5" />
                                {errors.product_name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.product_name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Status</label>
                                <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2.5 px-3.5">
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pattern Settings */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/90 backdrop-blur-xl">
                        <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-200 pb-3">Konfigurasi Pattern Modbus</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Satuan Waktu</label>
                                <select value={data.time_unit} onChange={e => setData('time_unit', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3">
                                    <option value="MM.SS">MM.SS (Menit.Detik)</option>
                                    <option value="HH.MM">HH.MM (Jam.Menit)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Kondisi Awal</label>
                                <select value={data.start_condition} onChange={e => setData('start_condition', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3">
                                    <option value="SSV">Start from Target (SSV)</option>
                                    <option value="SPV">Start from Current PV (SPV)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Status Akhir</label>
                                <select value={data.pattern_end_state} onChange={e => setData('pattern_end_state', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3">
                                    <option value="STOP">STOP</option>
                                    <option value="HOLD">HOLD</option>
                                    <option value="NEXT">NEXT</option>
                                    <option value="PRE">PRE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Nomor Pattern (0-9)</label>
                                <input type="number" min="0" max="9" value={data.pattern_number} onChange={e => setData('pattern_number', parseInt(e.target.value) || 0)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Pengulangan (Repetitions)</label>
                                <input type="number" min="0" max="10000" value={data.repetitions} onChange={e => setData('repetitions', parseInt(e.target.value) || 0)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Grup PID</label>
                                <input type="number" min="0" max="7" value={data.pid_group} onChange={e => setData('pid_group', parseInt(e.target.value) || 0)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Wait Width</label>
                                <input type="number" min="0" value={data.wait_width} onChange={e => setData('wait_width', parseInt(e.target.value) || 0)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase">Wait Time</label>
                                <input type="number" min="0" value={data.wait_time} onChange={e => setData('wait_time', parseInt(e.target.value) || 0)} className="mt-1.5 block w-full rounded-xl border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-blue-600 text-sm py-2 px-3" />
                            </div>
                        </div>
                    </div>

                    {/* Steps Table */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/90 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-slate-900">Langkah Operasi (Pattern Steps)</h3>
                            <button type="button" onClick={addStep} className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-4 py-2 text-xs rounded-xl shadow-sm transition-all">
                                Tambah Step
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-[#0f172a] text-white">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-xs font-black uppercase tracking-wider">Nama Step</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-black uppercase tracking-wider">Target SV (Suhu °C)</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-black uppercase tracking-wider">Durasi</th>
                                        <th className="px-3 py-3.5 text-center text-xs font-black uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {data.steps.map((step: any, index: number) => (
                                        <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm">
                                                <input type="text" value={step.step_name} onChange={e => updateStep(index, 'step_name', e.target.value)} className="block w-full rounded-xl border-slate-300 bg-slate-50 font-extrabold text-slate-800 text-xs py-2 px-3 shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                <input type="number" value={step.target_sv} onChange={e => updateStep(index, 'target_sv', parseInt(e.target.value) || 0)} className="block w-full rounded-xl border-slate-300 bg-slate-50 font-mono font-bold text-slate-900 text-xs py-2 px-3 shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                <input type="number" min="0" value={step.duration} onChange={e => updateStep(index, 'duration', parseInt(e.target.value) || 0)} className="block w-full rounded-xl border-slate-300 bg-slate-50 font-mono font-bold text-slate-900 text-xs py-2 px-3 shadow-sm focus:border-blue-600 focus:ring-blue-600" />
                                            </td>
                                            <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-center text-sm font-medium">
                                                <button type="button" onClick={() => removeStep(index)} disabled={data.steps.length <= 1} className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-black rounded-xl px-3 py-1.5 disabled:opacity-30 transition-all">
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-2">
                        <Link href={route('tn.recipes.index')} className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all border-none disabled:opacity-50">
                            {isEditing ? 'Simpan Perubahan' : 'Buat Pattern'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
