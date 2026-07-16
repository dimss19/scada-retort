import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';

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
        if (confirm('Are you sure you want to delete this recipe?')) {
            router.delete(route('tn.recipes.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Recipe Templates</h2>}
        >
            <Head title="Recipe Templates" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-700">Manage Pattern Profiles</h3>
                        <Link
                            href={route('tn.recipes.create')}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded shadow"
                        >
                            + Create New Recipe
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-slate-200">
                        {recipes.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <div className="text-4xl mb-4">📋</div>
                                <p className="text-lg font-medium">No recipe templates found.</p>
                                <p className="text-sm">Create one to start defining your temperature profiles.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recipe Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target F₀</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Steps</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {recipes.map((recipe) => (
                                            <tr key={recipe.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{recipe.name}</div>
                                                    <div className="text-sm text-slate-500 truncate max-w-xs">{recipe.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-bold text-sm">
                                                        F₀ {recipe.target_f0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                                                    {recipe.step_count} steps
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {recipe.creator?.name || 'System'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        <Link href={route('tn.recipes.edit', recipe.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        <button onClick={() => handleDelete(recipe.id)} className="text-red-600 hover:text-red-900">Delete</button>
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
