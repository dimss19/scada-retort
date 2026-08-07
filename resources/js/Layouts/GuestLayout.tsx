import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-[#f0f4f9] text-slate-800 selection:bg-yellow-400 selection:text-slate-950 font-sans">
            {/* Left Panel - Decorative Royal Blue & Gold */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f172a] overflow-hidden items-center justify-center border-r border-blue-900/40">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
                
                {/* Gradient Glows */}
                <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-600/30 rounded-full filter blur-[140px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-amber-400/25 rounded-full filter blur-[150px]"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-lg text-white">
                    <ApplicationLogo className="w-44 h-44 mb-8 filter drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                    <h1 className="text-4xl font-black mb-3">
                        SCADA <span className="text-yellow-400">RETORT</span>
                    </h1>
                    <p className="text-lg text-blue-200 font-bold tracking-wide">
                        Monitor. Control. Optimize.
                    </p>
                    
                    <div className="mt-12 grid grid-cols-2 gap-4 text-xs font-extrabold text-white text-left w-full">
                        <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-2xl border border-blue-700/50 backdrop-blur-md shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-yellow-400 glow-yellow-sm"></div>
                            Real-time Telemetry
                        </div>
                        <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-2xl border border-blue-700/50 backdrop-blur-md shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-blue-400 glow-blue-sm"></div>
                            Remote Configuration
                        </div>
                        <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-2xl border border-blue-700/50 backdrop-blur-md shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-amber-400 glow-yellow-sm"></div>
                            Recipe Management
                        </div>
                        <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-2xl border border-blue-700/50 backdrop-blur-md shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-cyan-400 glow-blue-sm"></div>
                            SCADA Canvas POV
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Fresh White Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-[#f0f4f9]">
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <ApplicationLogo className="w-24 h-24 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                    </Link>
                </div>
                
                <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl p-8 rounded-3xl border border-slate-200/90 shadow-2xl hover:border-amber-400 transition-all duration-300">
                    {children}
                </div>
            </div>
        </div>
    );
}
