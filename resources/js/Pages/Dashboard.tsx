import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface DashboardProps extends PageProps {
    tnCount: number;
    tnOnline: number;
    recipeCount: number;
}

const controllerTypes = [
    { model: 'TNS', title: 'TNS', desc: 'Compact controller for smaller retort setups.', tone: 'from-cyan-500 to-blue-600' },
    { model: 'TNH', title: 'TNH', desc: 'Standard controller for common production lines.', tone: 'from-slate-900 to-slate-700' },
    { model: 'TNL', title: 'TNL', desc: 'Large controller for extended I/O and display.', tone: 'from-amber-500 to-orange-600' },
];

export default function Dashboard({ auth, tnCount, tnOnline }: DashboardProps) {
    const activity = [
        ['10:42:18', 'Retort-01 temperature reached setpoint', 'Normal'],
        ['10:31:04', 'High temperature alarm acknowledged', 'Critical'],
        ['09:58:42', 'Boiler-01 started heating cycle', 'Running'],
        ['09:12:11', 'ESP32 communication restored', 'Online'],
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                    <p className="text-sm text-cyan-300">SCADA CONTROL SYSTEM</p>
                    <h3 className="mt-1 text-2xl font-bold">Welcome back, {auth.user.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">Pilih TNS, TNH, atau TNL untuk langsung masuk ke halaman monitoring.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {controllerTypes.map((item) => (
                        <Link key={item.model} href={route('tn.quick-start', item.model)} method="post" as="button" className={`rounded-2xl bg-gradient-to-br ${item.tone} p-6 text-left text-white shadow-lg transition-transform hover:-translate-y-1`}>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Controller Type</p>
                            <h3 className="mt-2 text-3xl font-bold">{item.title}</h3>
                            <p className="mt-3 max-w-xs text-sm text-white/80">{item.desc}</p>
                            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                                Buka monitoring {item.title}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Latest Activity</h3>
                            <span className="text-xs text-slate-400">Live updates</span>
                        </div>
                        <div className="divide-y">
                            {activity.map(([time, message, status]) => (
                                <div key={time} className="flex items-center gap-4 py-3">
                                    <span className="font-mono text-xs text-slate-400">{time}</span>
                                    <span className="flex-1 text-sm text-slate-700">{message}</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-800">Quick Access</h3>
                        <div className="mt-4 space-y-2">
                            <Link href={route('tn.index')} className="block rounded-lg bg-cyan-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-cyan-700">Open Controller</Link>
                            <Link href={route('historian.index')} className="block rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200">Open History</Link>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
