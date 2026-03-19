'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNegocio } from '@/contexts/NegocioContext';
import Logo from '@/components/ui/Logo';
import { createClient } from '@/utils/supabase-client';

const ADMIN_EMAIL = 'matebonavia@gmail.com';

const navItems = [
    {
        href: '/panel',
        label: 'Dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: '/panel/clientes',
        label: 'Clientes',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        href: '/panel/ventas',
        label: 'Ventas',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        href: '/panel/cotizaciones',
        label: 'Cotizaciones',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        href: '/panel/inventario',
        label: 'Inventario',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
        ),
    },
    {
        href: '/panel/alertas',
        label: 'Alertas',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
    },
    {
        href: '/panel/papelera',
        label: 'Papelera',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
        ),
    },
];

const bottomItems = [
    {
        href: '/panel/configuracion',
        label: 'Config.',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
    const pathname = usePathname();
    const { negocio } = useNegocio();
    const [userEmail, setUserEmail] = React.useState<string | null>(null);
    const supabase = createClient();

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || null);
        };
        getUser();
    }, []);

    const isHunterVisible = userEmail === ADMIN_EMAIL;


    const isActive = (href: string) => {
        if (href === '/panel' || href === '/panel/hunter') return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <aside className="hidden lg:flex w-[240px] h-screen flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shrink-0 sticky top-0">
            {/* Logo */}
            <div className="px-5 h-16 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
                <Logo size="md" variant="dark" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 sidebar-scroll overflow-y-auto">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive(item.href)
                            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-[3px] border-orange-500 pl-[9px]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                            }`}
                    >
                        <span className={`shrink-0 ${isActive(item.href) ? 'text-orange-500' : ''}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                ))}

                {isHunterVisible && (
                    <>
                        <div className="px-3 pt-6 pb-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Admin Itrium
                        </div>
                        <Link
                            href="/panel/admin"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive('/panel/admin')
                                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-[3px] border-orange-500 pl-[9px]'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                }`}
                        >
                            <span className={`shrink-0 ${isActive('/panel/admin') ? 'text-orange-500' : ''}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </span>
                            God Mode Dashboard
                        </Link>
                        <Link
                            href="/panel/hunter"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive('/panel/hunter')
                                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-[3px] border-orange-500 pl-[9px]'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                }`}
                        >
                            <span className={`shrink-0 ${isActive('/panel/hunter') ? 'text-orange-500' : ''}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </span>
                            Lead Hunter Manual
                        </Link>
                        <Link
                            href="/panel/hunter/autopilot"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive('/panel/hunter/autopilot')
                                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-[3px] border-orange-500 pl-[9px]'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                }`}
                        >
                            <span className={`shrink-0 ${isActive('/panel/hunter/autopilot') ? 'text-orange-500' : ''}`}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                </svg>
                            </span>
                            Piloto Automático
                        </Link>
                    </>
                )}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800/60 space-y-0.5 shrink-0">
                {bottomItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-[3px] border-orange-500 pl-[9px]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Salir
                </button>
            </div>
        </aside>
    );
}
