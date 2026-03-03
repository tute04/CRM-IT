export interface Cliente {
    id: string;
    nombre: string;
    telefono: string;
}

export interface Venta {
    id: string;
    cliente_id: string;
    fecha: string;
    detalle: string;
    monto: number;
    vendedor: string;
}
