import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Index({ recipes = [], controllers = [] }: { recipes?: any[], controllers?: any[] }) {
    const [selectedController, setSelectedController] = useState(controllers.length > 0 ? controllers[0].id : '');
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ text: '', type: '' });

    const handleAutoScan = async () => {
        if (!selectedController) {
            setScanMessage({ text: 'Please select a controller first.', type: 'error' });
            return;
        }

        if (!confirm('WARNING: Scanning all patterns requires the controller to be in STOP mode. Do you want to proceed?')) {
            return;
        }

        setIsScanning(true);
        setScanMessage({ text: 'Scanning in progress... Please wait up to 15 seconds.', type: 'info' });

        try {
            const response = await axios.post(route('tn.recipes.scan-all'), { tn_id: selectedController });
            setScanMessage({ text: response.data.message, type: 'success' });
            // Reload page to show new patterns
            router.reload();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to scan patterns.';
            setScanMessage({ text: msg, type: 'error' });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Pattern Management</h2>
                        <p className="mt-1 text-sm text-slate-500">Manage and scan sterilization patterns.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            className="rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={selectedController}
                            onChange={e => setSelectedController(e.target.value)}
                            disabled={isScanning}
                        >
                            <option value="">Select Controller...</option>
                            {controllers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAutoScan}
                            disabled={isScanning || !selectedController}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isScanning ? (
                                <>
                                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Scanning...
                                </>
                            ) : (
                                'Auto Scan All Patterns'
                            )}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Pattern Management" />

            <div className="p-8 max-w-7xl mx-auto">
                {scanMessage.text && (
                    <div className={`mb-6 rounded-lg p-4 ${scanMessage.type === 'error' ? 'bg-red-50 text-red-700' : scanMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        <p className="text-sm font-medium">{scanMessage.text}</p>
                    </div>
                )}

                {recipes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white shadow-sm">
                        No patterns found. Start by scanning from a device or creating one manually.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="relative flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-slate-900 truncate" title={recipe.name}>
                                        {recipe.name}
                                    </h3>
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                        {recipe.status}
                                    </span>
                                </div>
                                <dl className="mt-1 flex flex-grow flex-col justify-between">
                                    <div className="text-sm text-slate-500">
                                        <p><span className="font-medium">Code:</span> {recipe.recipe_code || 'N/A'}</p>
                                        <p><span className="font-medium">Steps:</span> {recipe.step_count || (recipe.steps ? recipe.steps.length : 0)}</p>
                                        <p><span className="font-medium">Time Unit:</span> {recipe.time_unit || 'N/A'}</p>
                                        <p><span className="font-medium">Created:</span> {new Date(recipe.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-x-4">
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this pattern?')) {
                                                    router.delete(route('tn.recipes.destroy', recipe.id));
                                                }
                                            }}
                                            className="text-sm font-medium text-red-600 hover:text-red-500"
                                        >
                                            Delete
                                        </button>
                                        <Link href={route('tn.recipes.edit', recipe.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                            Edit / View <span aria-hidden="true">&rarr;</span>
                                        </Link>
                                    </div>
                                </dl>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
