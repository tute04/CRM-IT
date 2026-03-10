import './globals.css';
import type { Metadata } from 'next';
import { NegocioProvider } from '@/contexts/NegocioContext';
import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'ITIRIUM | El CRM simple para negocios que crecen',
  description: 'Gestioná clientes, ventas y cobros desde un solo lugar. 14 días gratis, sin tarjeta.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <NegocioProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NegocioProvider>
      </body>
    </html>
  );
}
