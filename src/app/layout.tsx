import './globals.css';
import type { Metadata } from 'next';
import { NegocioProvider } from '@/contexts/NegocioContext';
import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'ITrium | CRM para negocios',
  description: 'El CRM simple para negocios argentinos que quieren crecer. Clientes, ventas, cotizaciones e inventario en un solo lugar.',
  icons: {
    icon: '/favicon.svg',
  },
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
