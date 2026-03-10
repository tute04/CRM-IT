'use client';

import { createClient } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';
import { useNegocio } from '@/contexts/NegocioContext';

export default function SuscripcionVencidaPage() {
    const router = useRouter();
    const supabase = createClient();
    const { negocio } = useNegocio();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-10 text-center border-b border-zinc-200 dark:border-zinc-800">
                    <div className="w-14 h-14 mx-auto bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-5">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        Tu período de prueba terminó
                    </h1>
                    {negocio && (
                        <p className="text-zinc-500 text-sm">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{negocio.nombre}</span> · {negocio.rubro}
                        </p>
                    )}
                </div>

                <div className="p-8 flex flex-col gap-5">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-5">
                        <h3 className="text-zinc-900 dark:text-white font-medium text-sm mb-3">
                            Suscribite para seguir usando:
                        </h3>
                        <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                            {['Clientes y ventas ilimitados', 'Panel de estadísticas', 'Carga de facturas con IA', 'Presupuestos PDF'].map((f) => (
                                <li key={f} className="flex items-center gap-2">
                                    <svg className="text-orange-500 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => router.push('/suscripcion')}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        Suscribirse ahora
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
