'use client';

import { useState } from 'react';
import { useNegocio } from '@/contexts/NegocioContext';
import { createClient } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuscripcionPage() {
    const { negocio, diasRestantes } = useNegocio();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handlePagar = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/pagos/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ negocio_id: negocio?.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear el pago');
            window.location.href = data.init_point;
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pago');
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const isPlanActivo = negocio?.plan === 'activo';

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-10 text-center border-b border-zinc-200 dark:border-zinc-800">
                    <div className="w-14 h-14 mx-auto bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-5">
                        {isPlanActivo ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        {isPlanActivo ? 'Plan activo' : 'Suscripción ITrium Pro'}
                    </h1>
                    {negocio && (
                        <p className="text-zinc-500 text-sm">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{negocio.nombre}</span> · {negocio.rubro}
                        </p>
                    )}
                </div>

                <div className="p-8 flex flex-col gap-5">
                    {isPlanActivo ? (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5 text-center">
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Tu suscripción está activa</p>
                            <p className="text-zinc-500 text-sm mt-1">Disfrutá de todas las funciones sin límites.</p>
                        </div>
                    ) : (
                        <>
                            {negocio?.plan === 'trial' && diasRestantes !== null && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-center">
                                    <p className="text-amber-600 dark:text-amber-400 font-medium text-sm">
                                        Te quedan {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} de prueba
                                    </p>
                                </div>
                            )}

                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6">
                                <div className="text-center mb-5">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plan Mensual</span>
                                    <div className="mt-2 flex items-baseline justify-center gap-0.5">
                                        <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">${process.env.NEXT_PUBLIC_PRECIO_MENSUAL || '8.990'}</span>
                                        <span className="text-zinc-500 text-sm font-medium">/mes</span>
                                    </div>
                                </div>

                                <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                                    {['Clientes y ventas ilimitados', 'Panel de estadísticas completo', 'Carga de facturas con IA', 'Presupuestos PDF profesionales', 'Datos 100% aislados y seguros', 'Soporte prioritario'].map((f) => (
                                        <li key={f} className="flex items-center gap-2">
                                            <svg className="text-orange-500 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePagar}
                                disabled={loading}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-wait text-white font-semibold rounded-xl transition-colors"
                            >
                                {loading ? 'Generando pago...' : 'Pagar con MercadoPago'}
                            </button>

                            <p className="text-center text-zinc-400 text-xs">
                                Pago seguro procesado por MercadoPago
                            </p>
                        </>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Link href="/panel" className="flex-1 py-2.5 text-center border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium rounded-xl transition-colors text-sm">
                            ← Volver al CRM
                        </Link>
                        <button onClick={handleLogout} className="py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium rounded-xl transition-colors text-sm">
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
