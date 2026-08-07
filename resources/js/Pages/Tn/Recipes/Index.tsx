import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ClipboardList } from 'lucide-react';

interface Recipe {
    id: number;
    name: string;
    description: string;
    target_f0: number;
    step_count: number;
    creator?: {
        name: string;
    };
    created_at: string;
}

export default function Index({ auth, recipes }: PageProps<{ recipes: Recipe[] }>) {
    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus resep ini?')) {
            router.delete(route('tn.recipes.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Resep & Profil Temperatur</h1>
                        <p className="text-sm font-semibold text-slate-600">Kelola template profil temperatur retort (Patterns & Steps)</p>
                    </div>
                    <Link
                        href={route('tn.recipes.create')}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-5 rounded-xl shadow-md transition-all border-none"
                    >
                        Buat Resep Baru
                    </Link>
                </div>
            }
        >
            <Head title="Resep Retort" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden backdrop-blur-xl">
                        {recipes.length === 0 ? (
                            <div className="p-16 text-center text-slate-500">
                                <div className="w-16 h-16 mx-auto mb-4 text-blue-600 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center p-3">
                                    <ClipboardList size={36} />
                                </div>
                                <p className="text-xl font-black text-slate-900">Belum ada template resep.</p>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Buat resep baru untuk menentukan profil kurva temperatur retort Anda.</p>
                                <Link
                                    href={route('tn.recipes.create')}
                                    className="inline-block mt-6 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs py-3 px-6 rounded-xl shadow-md transition-all"
                                >
                                    Buat Resep Pertama
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-[#0f172a] text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Nama Resep</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Target F₀</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Jumlah Steps</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Pembuat</th>
                                            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {recipes.map((recipe) => (
                                            <tr key={recipe.id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-extrabold text-slate-900 text-sm">{recipe.name}</div>
                                                    <div className="text-xs font-medium text-slate-500 truncate max-w-xs mt-0.5">{recipe.description || 'Tidak ada deskripsi'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-mono font-black text-xs">
                                                        F₀ {recipe.target_f0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-mono font-bold text-xs">
                                                        {recipe.step_count} steps
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                                                    {recipe.creator?.name || 'System'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-black">
                                                    <div className="flex justify-end space-x-3">
                                                        <Link href={route('tn.recipes.edit', recipe.id)} className="text-blue-700 hover:text-blue-900 font-extrabold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">Edit</Link>
                                                        <button onClick={() => handleDelete(recipe.id)} className="text-rose-700 hover:text-rose-900 font-extrabold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors">Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}