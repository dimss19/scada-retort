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

            <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_left,_#dff7ff_0,_transparent_35%),linear-gradient(135deg,#f8fafc,#eef2f7)] p-4 sm:p-8 lg:p-12">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">Controller Selection</p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Pilih tipe alat</h1>
                        <p className="mt-3 text-slate-600">Pilih TNS, TNH, atau TNL untuk langsung membuka halaman monitoring. Port serial akan dideteksi secara otomatis.</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {controllerTypes.map((controller) => (
                            <Link
                                key={controller.model}
                                href={route('tn.quick-start', controller.model)}
                                method="post"
                                as="button"
                                className={`group relative min-h-72 overflow-hidden rounded-3xl bg-gradient-to-br ${controller.accent} p-7 text-left text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                            >
                                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/20 bg-white/10 transition-transform duration-500 group-hover:scale-125" />
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">{controller.label}</p>
                                <h2 className="mt-5 text-5xl font-black tracking-tight">{controller.model}</h2>
                                <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">{controller.description}</p>
                                <span className="absolute bottom-7 left-7 inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                                    Buka monitoring <span aria-hidden="true">-&gt;</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
