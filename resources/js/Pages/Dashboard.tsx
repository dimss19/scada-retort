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
            <div className="space-y-8 p-4 sm:p-6 lg:p-8">
                {/* Hero Banner with Blue & Yellow Glassmorphism */}
                <div className="relative overflow-hidden rounded-3xl border border-blue-800/60 bg-gradient-to-r from-[#0c183b]/80 via-[#0d1b3e]/70 to-[#070e24]/90 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.2)]">
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            SCADA Control System
                        </div>
                        <h3 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Welcome back, {auth.user.name} 👋</h3>
                        <p className="mt-2 max-w-2xl text-base text-slate-300">Pilih tipe controller TNS, TNH, atau TNL untuk langsung mengakses halaman monitoring dan kontrol sistem retort.</p>
                    </div>
                </div>

                {/* Controller Cards Grid (Blue & Yellow) */}
                <div className="grid gap-6 md:grid-cols-3">
                    {controllerTypes.map((item) => (
                        <Link
                            key={item.model}
                            href={route('tn.quick-start', item.model)}
                            method="post"
                            as="button"
                            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/65 p-7 text-left text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-[0_12px_40px_0_rgba(250,204,21,0.25)]"
                        >
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-blue-600 to-amber-500 opacity-20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                            <div>
                                <span className="inline-block rounded-xl bg-blue-950/80 border border-blue-700/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300 shadow-md">
                                    Controller {item.model}
                                </span>
                                <h3 className="mt-4 text-4xl font-black tracking-tight text-white">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.desc}</p>
                            </div>
                            <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-yellow-300 backdrop-blur-md group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shadow-md">
                                Buka Monitoring {item.title} <span className="transition-transform group-hover:translate-x-1">→</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Activity Feed */}
                <div className="rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/65 p-6 shadow-xl backdrop-blur-xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Latest Activity Log</h3>
                            <p className="text-xs text-slate-400">Aktivitas & telemetri sistem terbaru</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            Live Updates
                        </span>
                    </div>
                    <div className="divide-y divide-blue-900/40">
                        {activity.map(([time, message, status]) => (
                            <div key={time} className="flex items-center gap-4 py-3.5 transition-colors hover:bg-blue-900/25 px-3 rounded-xl">
                                <span className="font-mono text-xs font-bold text-yellow-300 bg-blue-950/80 border border-blue-800/60 px-2.5 py-1 rounded-md">{time}</span>
                                <span className="flex-1 text-sm font-medium text-slate-200">{message}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                                    status === 'Critical'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        : status === 'Running' || status === 'Online'
                                        ? 'bg-amber-500/20 text-yellow-300 border-amber-400/40'
                                        : 'bg-blue-950 text-blue-200 border-blue-800'
                                }`}>
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
