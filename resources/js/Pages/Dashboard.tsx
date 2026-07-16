import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface DashboardProps extends PageProps { tnCount: number; tnOnline: number; recipeCount: number }

const cards = (online: number, total: number) => [
    ['Machine Online', String(online), 'Operational units', 'text-emerald-600', 'bg-emerald-100', '✓'],
    ['Machine Offline', String(Math.max(total - online, 0)), 'Requires attention', 'text-red-600', 'bg-red-100', '!'],
    ["Today's Alarm", '3', '1 critical · 2 warning', 'text-amber-600', 'bg-amber-100', '⚠'],
    ['Temperature', '121.2 °C', 'Retort-01 realtime', 'text-orange-600', 'bg-orange-100', '♨'],
    ['Pressure', '1.7 bar', 'Process pressure', 'text-blue-600', 'bg-blue-100', '↗'],
    ['Communication', 'Healthy', 'ESP32 & TNH online', 'text-cyan-600', 'bg-cyan-100', '⌁'],
];

export default function Dashboard({ auth, tnCount, tnOnline }: DashboardProps) {
    const activity = [
        ['10:42:18', 'Retort-01 temperature reached setpoint', 'Normal'],
        ['10:31:04', 'High temperature alarm acknowledged', 'Critical'],
        ['09:58:42', 'Boiler-01 started heating cycle', 'Running'],
        ['09:12:11', 'ESP32 communication restored', 'Online'],
    ];
    return <AuthenticatedLayout header={<div><h2 className="text-xl font-semibold text-slate-800">Dashboard</h2><p className="mt-1 text-sm text-slate-500">Realtime plant overview</p></div>}>
        <Head title="Dashboard" />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                <p className="text-sm text-cyan-300">SCADA CONTROL SYSTEM</p><h3 className="mt-1 text-2xl font-bold">Welcome back, {auth.user.name}</h3><p className="mt-2 text-sm text-slate-400">All realtime services are connected and monitoring your process.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards(tnOnline, tnCount).map(([label,value,detail,color,bg,icon]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${bg} ${color}`}>{icon}</span></div></div>)}</div>
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-slate-800">Latest Activity</h3><span className="text-xs text-slate-400">Live updates</span></div><div className="divide-y">{activity.map(([time,message,status]) => <div key={time} className="flex items-center gap-4 py-3"><span className="font-mono text-xs text-slate-400">{time}</span><span className="flex-1 text-sm text-slate-700">{message}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{status}</span></div>)}</div></section>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-800">Quick Access</h3><div className="mt-4 space-y-2"><Link href={route('tn.index')} className="block rounded-lg bg-cyan-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-cyan-700">Open Controller</Link><Link href={route('alarm.index')} className="block rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200">View Active Alarms</Link><Link href={route('historian.index')} className="block rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200">Open History</Link></div></section>
            </div>
        </div>
    </AuthenticatedLayout>;
}
