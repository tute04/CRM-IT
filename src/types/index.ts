export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  etiquetas?: string[];
  ultimo_contacto?: string;
  rubro?: string;
  negocio_id?: string;
  created_at?: string;
}

export interface Venta {
  id: string;
  cliente_id: string;
  fecha: string;
  detalle: string;
  monto: number;
  vendedor: string;
  estado: 'cobrada' | 'pendiente' | 'cancelada';
  negocio_id?: string;
}

export interface Negocio {
  id: string;
  nombre: string;
  rubro: string;
  owner_id: string;
  plan: 'trial' | 'activo' | 'bloqueado';
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_url: string;
  moneda: string;
}

export interface CotizacionItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Cotizacion {
  id: string;
  negocio_id: string;
  cliente_id: string | null;
  items: CotizacionItem[];
  descuento: number;
  total: number;
  notas: string;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  validez_dias: number;
  created_at: string;
  updated_at: string;
  // joined
  cliente?: Cliente;
}

export interface Recordatorio {
  id: string;
  negocio_id: string;
  cliente_id: string | null;
  descripcion: string;
  fecha: string;
  completado: boolean;
  created_at: string;
  // joined
  cliente?: Cliente;
}

export interface Vendedor {
  id: string;
  negocio_id: string;
  nombre: string;
  email: string;
  created_at: string;
}
