import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-[#f0f4f9] text-slate-800 selection:bg-yellow-400 selection:text-slate-950 font-sans">
            {/* Left Panel - Clean Royal Blue */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f172a] overflow-hidden items-center justify-center border-r border-blue-900/40">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-lg text-white">
                    <ApplicationLogo className="w-44 h-44 mb-8" />
                    <h1 className="text-4xl font-black mb-3">
                        SCADA <span className="text-yellow-400">RETORT</span>
                    </h1>
                    <p className="text-lg text-blue-200 font-bold tracking-wide">
                        Monitor. Control. Optimize.
                    </p>
                </div>
            </div>

            {/* Right Panel - Fresh White Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-[#f0f4f9]">
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <ApplicationLogo className="w-24 h-24" />
                    </Link>
                </div>
                
                <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
