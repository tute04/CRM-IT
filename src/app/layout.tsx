import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // ACÁ CAMBIAMOS EL TÍTULO DE LA PESTAÑA:
  title: 'Neumáticos Bonavia | CRM',
  description: 'Sistema de gestión rápida de clientes y vehículos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-100">{children}</body>
    </html>
  );
}
