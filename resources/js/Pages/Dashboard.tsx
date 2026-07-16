import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface DashboardProps extends PageProps {
    tnCount: number;
    tnOnline: number;
    deviceCount: number;
    recipeCount: number;
}

export default function Dashboard({ auth, tnCount, tnOnline, deviceCount, recipeCount }: DashboardProps) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    System Overview
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Welcome Banner */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-slate-200">
                        <div className="p-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                            <h3 className="text-2xl font-bold mb-2">Welcome back, {auth.user.name}!</h3>
                            <p className="text-slate-300">Here's the current status of your SCADA monitoring system.</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* TN Controllers Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">TN Controllers</p>
                                    <h4 className="text-3xl font-bold text-slate-900 mt-1">{tnCount}</h4>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                                    🌡️
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">
                                    <span className="text-green-500 font-bold">{tnOnline}</span> Online
                                </span>
                                <Link href={route('tn.index')} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                    View details &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Devices Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Edge Devices (ESP32)</p>
                                    <h4 className="text-3xl font-bold text-slate-900 mt-1">{deviceCount}</h4>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
                                    📱
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">
                                    Total registered
                                </span>
                                <Link href={route('devices.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                    View details &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Recipes Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Recipe Templates</p>
                                    <h4 className="text-3xl font-bold text-slate-900 mt-1">{recipeCount}</h4>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 text-xl">
                                    📋
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">
                                    Ready to deploy
                                </span>
                                <Link href={route('tn.recipes.index')} className="text-sm font-medium text-cyan-600 hover:text-cyan-800">
                                    View details &rarr;
                                </Link>
                            </div>
                        </div>
                        
                        {/* System Health Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">System Status</p>
                                    <h4 className="text-xl font-bold text-green-500 mt-2">All Systems Go</h4>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-xl">
                                    ⚡
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">
                                    Modbus Daemon Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="flex flex-wrap gap-4">
                            <Link 
                                href={route('tn.create')}
                                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                            >
                                <span className="mr-2">➕</span> Add TN Controller
                            </Link>
                            <Link 
                                href={route('tn.recipes.create')}
                                className="inline-flex items-center px-4 py-2 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-100 font-medium transition-colors"
                            >
                                <span className="mr-2">📝</span> Create New Recipe
                            </Link>
                            <Link 
                                href={route('ota.index')}
                                className="inline-flex items-center px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                            >
                                <span className="mr-2">🚀</span> Manage Firmware
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
