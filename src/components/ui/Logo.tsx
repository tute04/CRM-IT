import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'dark' | 'light';
    className?: string; // Additional classes
}

export default function Logo({ size = 'md', variant = 'dark', className = '' }: LogoProps) {
    const sizeMap = {
        sm: { icon: 20, text: 'text-lg', gap: 'gap-1.5' },
        md: { icon: 24, text: 'text-xl', gap: 'gap-2' },
        lg: { icon: 32, text: 'text-3xl', gap: 'gap-3' },
    };

    const s = sizeMap[size];

    return (
        <div className={`flex items-center ${s.gap} ${className}`}>
            <svg
                width={s.icon}
                height={s.icon}
                viewBox="0 0 32 32"
                fill="none"
                className="shrink-0"
            >
                <polygon
                    points="16,4 28,26 4,26"
                    fill="#f97316"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <polygon
                    points="16,10 23,23 9,23"
                    fill={variant === 'dark' ? '#0a0a0a' : '#ffffff'}
                    stroke={variant === 'dark' ? '#0a0a0a' : '#ffffff'}
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
            </svg>
            <span className={`font-bold tracking-tight ${s.text} font-sans`}>
                <span className={variant === 'dark' ? 'text-white' : 'text-[#0a0a0a]'}>IT</span>
                <span className="text-[#f97316]">rium</span>
            </span>
        </div>
    );
}
