'use client';

import React from 'react';

interface MobileCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

/** Contenedor base para filas convertidas a cards en mobile */
export function MobileCard({ children, onClick, className = '' }: MobileCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

interface MobileCardRowProps {
    label: string;
    children: React.ReactNode;
}

/** Fila label/valor dentro de un MobileCard */
export function MobileCardRow({ label, children }: MobileCardRowProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mt-0.5 min-w-[80px]">
                {label}
            </span>
            <div className="text-right text-sm text-zinc-700 dark:text-zinc-300">
                {children}
            </div>
        </div>
    );
}

interface MobileCardActionsProps {
    children: React.ReactNode;
}

/** Sección de botones de acción al pie del MobileCard */
export function MobileCardActions({ children }: MobileCardActionsProps) {
    return (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {children}
        </div>
    );
}
