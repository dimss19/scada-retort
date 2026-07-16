import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-slate-900 text-slate-100">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center border-r border-slate-800">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                
                {/* Gradient Glow */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-lg">
                    <ApplicationLogo className="w-48 h-48 mb-8 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        SCADA Retort
                    </h1>
                    <p className="text-xl text-slate-400 font-light tracking-wide">
                        Monitor. Control. Optimize.
                    </p>
                    
                    <div className="mt-12 grid grid-cols-2 gap-6 text-sm text-slate-500 text-left w-full">
                        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-green-500 glow-cyan"></div>
                            Real-time Telemetry
                        </div>
                        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 glow-cyan"></div>
                            Remote Configuration
                        </div>
                        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-blue-500 glow-cyan"></div>
                            OTA Updates
                        </div>
                        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 glow-cyan"></div>
                            Recipe Management
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-slate-900 lg:bg-transparent">
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <ApplicationLogo className="w-24 h-24 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    </Link>
                </div>
                
                <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
