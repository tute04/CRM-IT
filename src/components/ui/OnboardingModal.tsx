'use client';

import React, { useState, useEffect } from 'react';
import { useNegocio } from '@/contexts/NegocioContext';
import Link from 'next/link';

const STEPS = [
    {
        id: 1,
        icon: '🏢',
        title: 'Configurá tu negocio',
        desc: 'Agregá el nombre de tu empresa, rubro y moneda para personalizar el CRM.',
        cta: 'Ir a Configuración',
        href: '/panel/configuracion',
        color: 'orange',
    },
    {
        id: 2,
        icon: '👤',
        title: 'Cargá tu primer cliente',
        desc: 'Registrá un cliente con su nombre y teléfono para empezar a hacer seguimiento.',
        cta: 'Agregar Cliente',
        href: '/panel/clientes',
        color: 'blue',
    },
    {
        id: 3,
        icon: '📦',
        title: 'Creá tu primer producto',
        desc: 'Agregá tus productos o servicios con precio y stock mínimo para recibir alertas.',
        cta: 'Ir a Inventario',
        href: '/panel/inventario',
        color: 'amber',
    },
    {
        id: 4,
        icon: '💰',
        title: 'Registrá una venta',
        desc: 'Asociá una venta a un cliente para empezar a ver tus estadísticas en el Dashboard.',
        cta: 'Registrar Venta',
        href: '/panel/ventas',
        color: 'emerald',
    },
    {
        id: 5,
        icon: '🚀',
        title: '¡Todo listo!',
        desc: 'Tu CRM está configurado. A partir de ahora podés gestionar todo tu negocio desde acá.',
        cta: 'Ir al Dashboard',
        href: '/panel',
        color: 'orange',
    },
];

const COLOR_MAP: Record<string, { dot: string; bg: string; text: string; btn: string }> = {
    orange:  { dot: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',  btn: 'bg-orange-500 hover:bg-orange-600' },
    blue:    { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',      text: 'text-blue-600 dark:text-blue-400',      btn: 'bg-blue-500 hover:bg-blue-600' },
    amber:   { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-600 dark:text-amber-400',    btn: 'bg-amber-500 hover:bg-amber-600' },
    emerald: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-400',btn: 'bg-emerald-500 hover:bg-emerald-600' },
};

const LS_KEY = 'itrium-onboarding-done';
const LS_STEP_KEY = 'itrium-onboarding-step';

export default function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const { negocio } = useNegocio();

    useEffect(() => {
        const done = localStorage.getItem(LS_KEY);
        const savedStep = Number(localStorage.getItem(LS_STEP_KEY) || '0');
        if (!done) {
            setStep(savedStep);
            // Pequeño delay para que el layout cargue primero
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            const next = step + 1;
            setStep(next);
            localStorage.setItem(LS_STEP_KEY, String(next));
        } else {
            handleDone();
        }
    };

    const handleDone = () => {
        localStorage.setItem(LS_KEY, 'true');
        localStorage.removeItem(LS_STEP_KEY);
        setVisible(false);
    };

    const handleSkip = () => handleDone();

    if (!visible) return null;

    const current = STEPS[step];
    const colors = COLOR_MAP[current.color] || COLOR_MAP.orange;
    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-scale-in">
                {/* Progress bar */}
                <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-7">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-1.5">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`rounded-full transition-all duration-300 ${
                                        i === step
                                            ? `w-5 h-2 ${colors.dot}`
                                            : i < step
                                            ? `w-2 h-2 ${colors.dot} opacity-60`
                                            : 'w-2 h-2 bg-zinc-200 dark:bg-zinc-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Saltar →
                        </button>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center text-3xl mb-5 transition-all duration-300`}>
                        {current.icon}
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        {current.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                        {current.desc}
                    </p>

                    {/* Nombre del negocio personalizado */}
                    {step === 0 && negocio?.nombre && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${colors.bg} mb-5`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={colors.text}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <p className={`text-xs font-semibold ${colors.text}`}>
                                Bienvenido a ITrium, <strong>{negocio.nombre}</strong> 👋
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {step < STEPS.length - 1 ? (
                            <>
                                <Link
                                    href={current.href}
                                    onClick={handleNext}
                                    className={`flex-1 text-center py-3 rounded-xl text-white text-sm font-semibold transition-colors ${colors.btn}`}
                                >
                                    {current.cta}
                                </Link>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Ya lo hice →
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDone}
                                className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-colors ${colors.btn}`}
                            >
                                🚀 Comenzar a usar ITrium
                            </button>
                        )}
                    </div>

                    <p className="text-center text-[10px] text-zinc-400 mt-4">
                        Paso {step + 1} de {STEPS.length}
                    </p>
                </div>
            </div>
        </div>
    );
}
