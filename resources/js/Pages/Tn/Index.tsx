import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const controllerTypes = [
    {
        model: 'TNS',
        label: 'Compact',
        description: 'Controller ringkas untuk sistem retort berkapasitas kecil.',
        accent: 'from-cyan-500 to-blue-600',
    },
    {
        model: 'TNH',
        label: 'Standard',
        description: 'Controller utama untuk proses produksi retort standar.',
        accent: 'from-slate-800 to-slate-950',
    },
    {
        model: 'TNL',
        label: 'Extended',
        description: 'Controller dengan dukungan I/O untuk sistem yang lebih besar.',
        accent: 'from-amber-500 to-orange-600',
    },
] as const;

export default function Index() {
    return (
        <AuthenticatedLayout>
            <Head title="Pilih Controller" />

            <main className="p-4 sm:p-8 lg:p-12">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 max-w-2xl rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/65 p-8 backdrop-blur-xl shadow-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.24em] text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.2)]">
                            Controller Selection
                        </span>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Pilih Tipe Alat Controller</h1>
                        <p className="mt-3 text-base text-slate-300 leading-relaxed">Pilih TNS, TNH, atau TNL untuk langsung membuka halaman monitoring. Port serial akan dideteksi secara otomatis oleh sistem.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {controllerTypes.map((controller) => (
                            <Link
                                key={controller.model}
                                href={route('tn.quick-start', controller.model)}
                                method="post"
                                as="button"
                                className="group relative flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl border border-blue-800/60 bg-[#0d1b3e]/65 p-8 text-left text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-[0_15px_45px_0_rgba(250,204,21,0.25)]"
                            >
                                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-600 to-amber-500 opacity-20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                                <div>
                                    <span className="inline-block rounded-xl bg-blue-950/80 border border-blue-700/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300 shadow-md">
                                        {controller.label}
                                    </span>
                                    <h2 className="mt-5 text-5xl font-black tracking-tight text-white">{controller.model}</h2>
                                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{controller.description}</p>
                                </div>
                                <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-yellow-300 backdrop-blur-md group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shadow-md">
                                    Buka Monitoring <span className="transition-transform group-hover:translate-x-1.5">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
