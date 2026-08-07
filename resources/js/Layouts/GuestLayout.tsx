import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-[#060c1e] text-slate-100 selection:bg-yellow-400 selection:text-slate-950 font-sans">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#09132e] overflow-hidden items-center justify-center border-r border-blue-900/50">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
                
                {/* Gradient Glows */}
                <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-blue-600/25 rounded-full filter blur-[140px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-amber-500/20 rounded-full filter blur-[150px]"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-lg">
                    <ApplicationLogo className="w-44 h-44 mb-8 filter drop-shadow-[0_0_20px_rgba(250,204,21,0.7)]" />
                    <h1 className="text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-yellow-400">
                        SCADA Retort
                    </h1>
                    <p className="text-lg text-slate-300 font-medium tracking-wide">
                        Monitor. Control. Optimize.
                    </p>
                    
                    <div className="mt-12 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300 text-left w-full">
                        <div className="flex items-center gap-3 bg-blue-950/60 p-3.5 rounded-xl border border-blue-800/50 backdrop-blur-md shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 glow-yellow"></div>
                            Real-time Telemetry
                        </div>
                        <div className="flex items-center gap-3 bg-blue-950/60 p-3.5 rounded-xl border border-blue-800/50 backdrop-blur-md shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 glow-blue"></div>
                            Remote Configuration
                        </div>
                        <div className="flex items-center gap-3 bg-blue-950/60 p-3.5 rounded-xl border border-blue-800/50 backdrop-blur-md shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 glow-yellow"></div>
                            Recipe Management
                        </div>
                        <div className="flex items-center gap-3 bg-blue-950/60 p-3.5 rounded-xl border border-blue-800/50 backdrop-blur-md shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 glow-blue"></div>
                            SCADA Canvas POV
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-[#060c1e]">
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <ApplicationLogo className="w-24 h-24 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]" />
                    </Link>
                </div>
                
                <div className="w-full max-w-md bg-[#0d1b3e]/70 backdrop-blur-2xl p-8 rounded-3xl border border-blue-800/60 shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] hover:border-amber-400/40 transition-all duration-300">
                    {children}
                </div>
            </div>
        </div>
    );
}
