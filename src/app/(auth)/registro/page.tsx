'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

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
            <div className="bg-[#111111] border border-[#222222] rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-0 text-center flex flex-col items-center">
                    <div className="mb-6">
                        <Logo size="lg" variant="dark" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Crear cuenta
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
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
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Nombre del Negocio
                        </label>
                        <input
                            type="text"
                            required
                            value={nombreNegocio}
                            onChange={(e) => setNombreNegocio(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                            placeholder="Ej: Taller Don Pedro"
                            autoComplete="organization"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Rubro
                        </label>
                        <select
                            required
                            value={rubro}
                            onChange={(e) => setRubro(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                        >
                            <option value="" disabled>Seleccioná tu rubro...</option>
                            {RUBROS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                            placeholder="tu@email.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                                placeholder="••••••"
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                                Confirmar
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all text-sm"
                                placeholder="••••••"
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-wait text-[#0a0a0a] font-semibold rounded-lg transition-colors text-sm mt-1"
                    >
                        {loading ? 'Creando cuenta...' : 'Empezar 14 días gratis'}
                    </button>

                    <p className="text-center text-zinc-400 text-sm">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
                            Iniciar sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
