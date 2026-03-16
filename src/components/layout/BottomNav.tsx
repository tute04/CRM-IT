'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase-client';

const ADMIN_EMAIL = 'matebonavia@gmail.com';

const items = [
    {
        href: '/panel',
        label: 'Inicio',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: '/panel/clientes',
        label: 'Clientes',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
        ),
    },
    {
        href: '/panel/ventas',
        label: 'Ventas',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        href: '/panel/cotizaciones',
        label: 'Cotizar',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
        ),
    },
    {
        href: '/panel/inventario',
        label: 'Inventario',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
        ),
    },
    {
        href: '/panel/configuracion',
        label: 'Config.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();
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
        if (href === '/panel') return pathname === '/panel';
        return pathname.startsWith(href);
    };

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-2 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around">
                {items.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-semibold transition-colors ${isActive(item.href)
                            ? 'text-orange-500'
                            : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                    >
                        <span className={isActive(item.href) ? 'text-orange-500' : ''}>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}

                {isHunterVisible && (
                    <Link
                        href="/panel/hunter"
                        className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-semibold transition-colors ${isActive('/panel/hunter')
                            ? 'text-orange-500'
                            : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                    >
                        <span className={isActive('/panel/hunter') ? 'text-orange-500' : ''}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </span>
                        Hunter
                    </Link>
                )}
            </div>
        </nav>
    );
}
