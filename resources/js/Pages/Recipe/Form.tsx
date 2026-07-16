import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Form({ recipe, users = [] }: { recipe?: any; users?: any[] }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Create Recipe</h2>
                    <p className="mt-1 text-sm text-slate-500">Add a new recipe template.</p>
                </div>
            }
        >
            <Head title="Create Recipe" />
            <div className="p-8">
                <div className="mx-auto max-w-7xl rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white">
                    Recipe form template.
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
