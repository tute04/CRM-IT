import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | ITrium',
        default: 'ITrium',
    },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 text-zinc-100">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-orange-500/5 to-transparent rounded-full blur-3xl" />
            </div>
            {children}
        </div>
    );
}
