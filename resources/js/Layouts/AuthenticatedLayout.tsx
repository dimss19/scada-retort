import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

type NavItem = {
    label: string;
    routeName: string;
    activePattern: string;
    excludePattern?: string;
    requiresController?: boolean;
    hideWhenControllerActive?: boolean;
};

const navigation: NavItem[] = [
    { label: 'Dashboard', routeName: 'dashboard', activePattern: 'dashboard', hideWhenControllerActive: true },
    { label: 'Monitoring', routeName: 'tn.index', activePattern: 'tn.*', excludePattern: 'tn.recipes.*', requiresController: true },
    { label: 'Pattern', routeName: 'tn.recipes.index', activePattern: 'tn.recipes.*', requiresController: true },
    { label: 'History', routeName: 'historian.index', activePattern: 'historian.*', requiresController: true },
];

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode; user?: unknown }>) {
    const user = usePage().props.auth.user;
    const hasActiveController = Boolean((usePage().props as any).ui?.active_tn_id);
    const visibleNavigation = navigation.filter((item) => {
        if (hasActiveController && item.hideWhenControllerActive) {
            return false;
        }

        if (!hasActiveController && item.requiresController) {
            return false;
        }

        return true;
    });

    return (
        <div className="relative min-h-screen bg-[#060c1e] font-sans text-slate-100 selection:bg-yellow-400 selection:text-slate-950">
            {/* Ambient Background Glowing Orbs (Blue & Yellow) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-blue-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] bg-amber-500/15 rounded-full blur-[150px]"></div>
                <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] bg-blue-500/15 rounded-full blur-[130px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
            </div>

            {/* Blue & Yellow Glassmorphism Header */}
            <header className="sticky top-0 z-40 border-b border-blue-900/60 bg-[#09132e]/80 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(2,6,23,0.5)]">
                <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
                    <Link href={route('dashboard')} className="flex shrink-0 items-center gap-3 group">
                        <ApplicationLogo className="h-9 w-9 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-transform duration-300 group-hover:scale-105" />
                        <div className="hidden xl:block">
                            <p className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-yellow-400">SCADA RETORT</p>
                            <p className="text-[9px] uppercase tracking-[0.22em] text-amber-400 font-bold">Control System</p>
                        </div>
                    </Link>

                    <nav className="ml-4 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:ml-8">
                        {visibleNavigation.map((item) => {
                            const active = (route().current(item.activePattern) ?? false) && !(item.excludePattern && route().current(item.excludePattern));
                            return (
                                <Link
                                    key={item.label}
                                    href={route(item.routeName)}
                                    className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                                        active
                                            ? 'bg-blue-600/30 text-yellow-300 border border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                                            : 'text-slate-300 hover:bg-blue-900/40 hover:text-white hover:border hover:border-blue-700/50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-3 flex shrink-0 items-center gap-2 border-l border-blue-900/60 pl-3">
                        <Link href={route('profile.edit')} aria-label="Profile" title={user.name} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/40 text-sm font-bold text-yellow-300 hover:bg-amber-500/30 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all">
                            {user.name.charAt(0).toUpperCase()}
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="hidden rounded-xl border border-blue-900/60 bg-blue-950/60 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:border-blue-700 hover:bg-blue-900/60 hover:text-white transition-all md:block"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </header>

            {header && (
                <div className="relative z-10 border-b border-blue-900/50 bg-[#0c183b]/60 backdrop-blur-md px-4 py-5 shadow-lg sm:px-6 lg:px-8">
                    {header}
                </div>
            )}

            <main className="relative z-10">{children}</main>
        </div>
    );
}