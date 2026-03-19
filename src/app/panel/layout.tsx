'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import OnboardingModal from '@/components/ui/OnboardingModal';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const { negocio, loading: negocioLoading } = useNegocio();

    useEffect(() => {
        const saved = localStorage.getItem('itrium-dark-mode');
        if (saved !== null) {
            setIsDarkMode(saved === 'true');
        } else {
            setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('itrium-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    useEffect(() => {
        if (negocio?.nombre) {
            document.title = `${negocio.nombre} | ITrium`;
        } else if (!negocioLoading) {
            document.title = 'Panel | ITrium';
        }
    }, [negocio, negocioLoading]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (negocioLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 font-medium text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden">
                        {children}
                    </main>
                </div>
                <BottomNav />
            </div>
            <OnboardingModal />
        </div>
    );
}
