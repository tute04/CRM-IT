export interface Cliente {
    id: string;
    nombre: string;
    telefono: string;
    negocio_id?: string;
}

export interface Venta {
    id: string;
    cliente_id: string;
    fecha: string;
    detalle: string;
    monto: number;
    vendedor: string;
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
}
