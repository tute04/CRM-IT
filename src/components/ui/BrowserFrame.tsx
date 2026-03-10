import React from 'react';

interface BrowserFrameProps {
    children: React.ReactNode;
    url?: string;
    className?: string;
}

export default function BrowserFrame({ children, url = 'app.itrium.com/panel', className = '' }: BrowserFrameProps) {
    return (
        <div className={`overflow-hidden rounded-xl border border-[#222222] shadow-[0_25px_50px_rgba(249,115,22,0.1)] bg-[#0a0a0a] flex flex-col ${className}`}>
            {/* Top Bar */}
            <div className="h-[32px] bg-[#1a1a1a] border-b border-[#222222] flex items-center px-4 relative shrink-0 z-10">
                <div className="flex items-center gap-1.5 absolute left-4">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                    <span className="text-xs text-zinc-500 font-medium tracking-wide flex items-center gap-1.5 px-3 py-1 bg-[#0a0a0a] rounded-md border border-[#222222]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        {url}
                    </span>
                </div>
            </div>
            {/* Content Container */}
            <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                {children}
            </div>
        </div>
    );
}
