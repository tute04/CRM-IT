'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(
                authError.message === 'Invalid login credentials'
                    ? 'Email o contraseña incorrectos'
                    : authError.message === 'Email not confirmed'
                        ? 'Email no confirmado. Revisá tu bandeja de entrada.'
                        : authError.message
            );
            setLoading(false);
            return;
        }

        router.push('/panel');
        router.refresh();
    };

    return (
        <div className="relative w-full max-w-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-xl mb-4">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Iniciar Sesión
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Ingresá a tu panel de ITIRIUM
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="p-8 flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                            placeholder="tu@email.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-wait text-white font-semibold rounded-lg transition-colors text-sm mt-1"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>

                    <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        ¿No tenés cuenta?{' '}
                        <Link href="/registro" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
                            Registrate gratis
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
