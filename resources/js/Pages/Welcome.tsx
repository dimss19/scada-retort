import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    return (
        <>
            <Head title="Welcome" />
            <div className="bg-slate-900 text-slate-300 min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
                
                {/* Navbar */}
                <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo className="h-8 w-8 filter drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                SCADA Retort
                            </span>
                        </div>
                        <div className="flex gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="text-sm font-medium px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-600/40 transition-colors"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <main className="flex-grow flex flex-col relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 text-center z-10 flex-grow flex flex-col justify-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                            Industrial Temperature <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Control System
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            A centralized web-based SCADA platform for monitoring, configuring, and managing your retort processes. Monitor Autonics TN Series via Modbus RTU, update ESP32 firmwares Over-The-Air, and apply complex temperature profiles—all from your browser.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href={auth.user ? route('dashboard') : route('login')}
                                className="px-8 py-3 rounded-lg bg-cyan-600 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-500 transition-all"
                            >
                                Launch Dashboard
                            </Link>
                            <a
                                href="#features"
                                className="px-8 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition-all"
                            >
                                Explore Features
                            </a>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div id="features" className="relative z-10 bg-slate-900/50 border-t border-slate-800 pt-16 pb-24">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Feature 1 */}
                                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:border-cyan-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.3)] text-cyan-400">
                                        📊
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Real-Time Telemetry</h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        Monitor actual temperature (PV), set values (SV), and heating power (MV) across multiple controllers live via WebSocket streaming.
                                    </p>
                                </div>

                                {/* Feature 2 */}
                                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-400">
                                        ⚙️
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Remote Configuration</h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        Manage deep device parameters, trigger Auto-Tuning, reset alarms, and toggle RUN/STOP states without touching the physical hardware.
                                    </p>
                                </div>

                                {/* Feature 3 */}
                                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:border-indigo-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.3)] text-indigo-400">
                                        📋
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">Recipe Management</h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        Build complex multi-step temperature profiles (Patterns), save them as templates, and apply them instantly to your retort machines.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Stats Bar */}
                    <div className="relative z-10 border-t border-slate-800 bg-slate-950 py-8">
                        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-slate-800">
                            <div>
                                <div className="text-3xl font-black text-white">Modbus RTU</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">Protocol</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white">RS485</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">Interface</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white">&lt; 1s</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">Latency</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white">OTA</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">Firmware Updates</div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-slate-950 py-8 border-t border-slate-900 text-center text-sm text-slate-500">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                        <div>
                            SCADA Retort Dashboard &copy; 2026. All rights reserved.
                        </div>
                        <div className="mt-4 md:mt-0">
                            Powered by Laravel v{laravelVersion} & PHP v{phpVersion}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
