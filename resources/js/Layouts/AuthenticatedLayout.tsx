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
    { label: 'Controller', routeName: 'tn.index', activePattern: 'tn.*', excludePattern: 'tn.recipes.*', requiresController: true },
    { label: 'Recipe', routeName: 'tn.recipes.index', activePattern: 'tn.recipes.*', requiresController: true },
    { label: 'History', routeName: 'historian.index', activePattern: 'historian.*', requiresController: true },
    { label: 'Alarm', routeName: 'alarm.index', activePattern: 'alarm.*', requiresController: true },
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
        <div className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-lg">
                <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
                    <Link href={route('dashboard')} className="flex shrink-0 items-center gap-3">
                        <ApplicationLogo className="h-9 w-9" />
                        <div className="hidden xl:block">
                            <p className="text-sm font-bold tracking-wide">SCADA RETORT</p>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-400">Control System</p>
                        </div>
                    </Link>

                    <nav className="ml-4 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:ml-8">
                        {visibleNavigation.map((item) => {
                            const active = (route().current(item.activePattern) ?? false) && !(item.excludePattern && route().current(item.excludePattern));
                            return (
                                <Link
                                    key={item.label}
                                    href={route(item.routeName)}
                                    className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-cyan-500/15 text-cyan-300'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-3 flex shrink-0 items-center gap-1 border-l border-slate-800 pl-3">
                        <Link href={route('notifications.index')} aria-label="Notifications" title="Notifications" className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                        </Link>
                        <Link href={route('profile.edit')} aria-label="Profile" title={user.name} className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30">
                            {user.name.charAt(0).toUpperCase()}
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white md:block"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </header>

            {header && (
                <div className="border-b border-slate-200 bg-white">
                    <div className="px-4 py-5 sm:px-6 lg:px-8">{header}</div>
                </div>
            )}

            <main>{children}</main>
        </div>
    );
}
