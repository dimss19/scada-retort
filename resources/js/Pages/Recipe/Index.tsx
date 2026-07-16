import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ recipes = [] }: { recipes?: any[] }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Recipe Management</h2>
                    <p className="mt-1 text-sm text-slate-500">Build your sterilization recipes from scratch.</p>
                </div>
            }
        >
            <Head title="Recipe Management" />
            <div className="p-8">
                <div className="mx-auto max-w-7xl rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white">
                    Start building your recipe page here.
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
