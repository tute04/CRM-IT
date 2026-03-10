'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RUBROS = [
    'Gomería / Neumáticos',
    'Taller Mecánico',
    'Ferretería',
    'Peluquería / Barbería',
    'Veterinaria',
    'Panadería / Pastelería',
    'Kiosco / Almacén',
    'Lavadero de autos',
    'Librería / Papelería',
    'Electrónica / Celulares',
    'Indumentaria / Moda',
    'Gastronomía / Restaurante',
    'Salud / Consultorio',
    'Servicios Profesionales',
    'Otro',
];

export default function RegistroPage() {
    const [nombreNegocio, setNombreNegocio] = useState('');
    const [rubro, setRubro] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (nombreNegocio.trim().length < 2) {
            setError('El nombre del negocio debe tener al menos 2 caracteres');
            return;
        }
        if (!rubro) {
            setError('Seleccioná un rubro para tu negocio');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre_negocio: nombreNegocio.trim(),
                    rubro: rubro,
                },
            },
        });

        if (authError) {
            setError(
                authError.message === 'User already registered'
                    ? 'Este email ya está registrado'
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
                        Crear cuenta
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        14 días gratis · Sin tarjeta
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegistro} className="p-8 flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Nombre del Negocio
                        </label>
                        <input
                            type="text"
                            required
                            value={nombreNegocio}
                            onChange={(e) => setNombreNegocio(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                            placeholder="Ej: Taller Don Pedro"
                            autoComplete="organization"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Rubro
                        </label>
                        <select
                            required
                            value={rubro}
                            onChange={(e) => setRubro(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                        >
                            <option value="" disabled>Seleccioná tu rubro...</option>
                            {RUBROS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="grid grid-cols-2 gap-3">
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
                                placeholder="••••••"
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                                Confirmar
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:outline-none transition-all text-sm"
                                placeholder="••••••"
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 disabled:cursor-wait text-white font-semibold rounded-lg transition-colors text-sm mt-1"
                    >
                        {loading ? 'Creando cuenta...' : 'Empezar 14 días gratis'}
                    </button>

                    <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/login" className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors">
                            Iniciar sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
