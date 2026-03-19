import './globals.css';
import type { Metadata } from 'next';
import { NegocioProvider } from '@/contexts/NegocioContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Analytics from '@/components/Analytics';

export const metadata: Metadata = {
  title: 'ITrium | CRM con IA para Negocios Argentinos',
  description: 'Gestioná tus ventas, clientes y facturas automáticamente con IA. El CRM más simple diseñado para PyMEs en Argentina.',
  keywords: ['CRM Argentina', 'gestión de ventas', 'escaneo de facturas IA', 'pymes', 'control de stock', 'ITrium'],
  authors: [{ name: 'ITrium Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ITrium CRM',
  },
  openGraph: {
    title: 'ITrium | El CRM que lee tus facturas con IA',
    description: 'Dejá de cargar datos manualmente. Organizá tu negocio con ITirium.',
    url: 'https://itirium-crm.vercel.app',
    siteName: 'ITirium',
    images: [
      {
        url: 'https://itirium-crm.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ITrium CRM Dashboard',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
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
            <Analytics />
          </ToastProvider>
        </NegocioProvider>
      </body>
    </html>
  );
}
