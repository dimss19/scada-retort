import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface DashboardProps extends PageProps {
    tnCount: number;
    tnOnline: number;
    recipeCount: number;
}

const controllerTypes = [
    { model: 'TNS', title: 'TNS Controller', label: 'Compact Setup', desc: 'Controller ringkas untuk sistem retort berkapasitas kecil & medium.', tone: 'from-blue-600 to-blue-800' },
    { model: 'TNH', title: 'TNH Controller', label: 'Standard Line', desc: 'Controller utama untuk proses produksi retort standar pabrik.', tone: 'from-blue-800 to-slate-900' },
    { model: 'TNL', title: 'TNL Controller', label: 'Extended I/O', desc: 'Controller dengan dukungan I/O lengkap untuk sistem retort besar.', tone: 'from-amber-500 to-yellow-600' },
];

export default function Dashboard({ auth, tnCount, tnOnline }: DashboardProps) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Hero Banner (Royal Blue & Yellow Accent) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-8 shadow-xl text-white border border-blue-800/60">
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-yellow-300 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            SCADA Control Center
                        </div>
                        <h3 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">Selamat datang kembali, {auth.user.name}</h3>
                        <p className="mt-2 max-w-2xl text-base text-blue-100/90 leading-relaxed">
                            Pilih tipe controller Autonics TN Series di bawah untuk membuka sistem monitoring realtime, kurva temperatur, dan kontrol SCADA.
                        </p>
                    </div>
                </div>

                {/* Controller Selection Grid (Fresh White Glass Cards with Blue & Yellow Accents) */}
                <div className="grid gap-6 md:grid-cols-3">
                    {controllerTypes.map((item) => (
                        <Link
                            key={item.model}
                            href={route('tn.quick-start', item.model)}
                            method="post"
                            as="button"
                            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-7 text-left shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-2xl"
                        >
                            <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-100/60 transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
                            <div>
                                <span className="inline-block rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                                    {item.label}
                                </span>
                                <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                            </div>
                            <div className="mt-8 inline-flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-md group-hover:from-yellow-300 group-hover:to-amber-400 transition-all">
                                <span>Buka Monitoring {item.model}</span>
                                <span className="transition-transform group-hover:translate-x-1 font-black">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
