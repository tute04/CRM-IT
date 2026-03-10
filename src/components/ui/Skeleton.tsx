'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

function SkeletonLine({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse ${className}`} />
    );
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonLine key={i} className="h-4 w-full" />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-6">
                    {[120, 80, 150, 60, 80].map((w, i) => (
                        <div key={i} className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" style={{ width: w }} />
                    ))}
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-5 py-4 border-b border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex gap-6">
                        {[120, 80, 150, 60, 80].map((w, j) => (
                            <div key={j} className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse" style={{ width: w + Math.random() * 40 }} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
