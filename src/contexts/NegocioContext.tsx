'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase-client';
import { Negocio } from '@/types';

interface NegocioContextType {
    negocio: Negocio | null;
    loading: boolean;
    diasRestantes: number | null;
    refreshNegocio: () => Promise<void>;
}

const NegocioContext = createContext<NegocioContextType>({
    negocio: null,
    loading: true,
    diasRestantes: null,
    refreshNegocio: async () => { },
});

export function NegocioProvider({ children }: { children: React.ReactNode }) {
    const [negocio, setNegocio] = useState<Negocio | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchNegocio = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setNegocio(null);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('negocios')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching negocio:', error);
                setNegocio(null);
            } else {
                if (user.email === 'matebonavia@gmail.com') {
                    data.plan = 'activo';
                }
                setNegocio(data as Negocio);
            }
        } catch (err) {
            console.error('Error in fetchNegocio:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNegocio();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchNegocio();
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const diasRestantes = negocio?.plan === 'trial' && negocio.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(negocio.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <NegocioContext.Provider value={{ negocio, loading, diasRestantes, refreshNegocio: fetchNegocio }}>
            {children}
        </NegocioContext.Provider>
    );
}

export function useNegocio() {
    const context = useContext(NegocioContext);
    if (!context) {
        throw new Error('useNegocio must be used within a NegocioProvider');
    }
    return context;
}
