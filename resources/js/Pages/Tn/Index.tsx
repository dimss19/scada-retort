import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import TnCard from '@/Components/Tn/TnCard';

interface TnController {
    id: number;
    name: string;
    slave_id: number;
    model_type: string;
    is_online: boolean;
    readings: any[];
}

interface Props extends PageProps {
    controllers: TnController[];
}

export default function Index({ auth, controllers }: Props) {
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">TN Controllers</h2>}
        >
            <Head title="TN Controllers" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route('tn.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            Add New Controller
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {controllers.length === 0 ? (
                            <div className="col-span-full bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                                No TN Controllers registered yet.
                            </div>
                        ) : (
                            controllers.map((controller) => (
                                <TnCard key={controller.id} controller={controller} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
