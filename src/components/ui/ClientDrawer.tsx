import React, { useEffect } from 'react';
import { Cliente, Venta } from '@/types';
import { formatCurrency, formatDate, whatsappUrl } from '@/utils/helpers';
import Badge from '@/components/ui/Badge';

interface ClientDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    ventas: Venta[];
    onEdit: (c: Cliente) => void;
    onDelete: (id: string) => void;
}

export default function ClientDrawer({ isOpen, onClose, cliente, ventas, onEdit, onDelete }: ClientDrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!cliente) return null;

    const totalComprado = ventas.reduce((acc, v) => acc + (v.monto || 0), 0);

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-zinc-200 dark:border-zinc-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header Actions */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50">
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                        aria-label="Cerrar panel"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { onClose(); onEdit(cliente); }} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 transition-colors">
                            Editar
                        </button>
                        <button onClick={() => { onClose(); onDelete(cliente.id); }} className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium text-red-600 dark:text-red-400 transition-colors">
                            Archivar
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full">
                    {/* Header Info */}
                    <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 text-2xl font-bold shrink-0">
                                {cliente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{cliente.nombre}</h2>
                                {cliente.rubro && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{cliente.rubro}</p>}
                            </div>
                        </div>

                        {/* Etiquetas */}
                        {(cliente.etiquetas || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {(cliente.etiquetas || []).map(t => <Badge key={t} variant={t.toLowerCase() === 'vip' ? 'orange' : 'default'}>{t}</Badge>)}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Gastado</p>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-500 mt-0.5">{formatCurrency(totalComprado)}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Ventas asociadas</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{ventas.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Details section */}
                    <div className="p-6 space-y-6">
                        {/* Contact Data */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                Contacto
                            </h3>
                            <div className="space-y-3 text-sm">
                                {cliente.telefono && (
                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700">📞</div>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-medium flex-1">{cliente.telefono}</span>
                                            <a 
                                                href={whatsappUrl(cliente.telefono)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {cliente.email && (
                                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                        <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700">📧</div>
                                        <span className="truncate">{cliente.email}</span>
                                    </div>
                                )}
                                {cliente.direccion && (
                                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                                        <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">📍</div>
                                        <span className="text-sm">{cliente.direccion}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes Section */}
                        {cliente.notas && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                    Notas y contexto
                                </h3>
                                <div className="p-4 bg-orange-50/50 dark:bg-orange-500/5 rounded-xl border border-orange-100 dark:border-orange-500/10">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{cliente.notas}</p>
                                </div>
                            </div>
                        )}

                        {/* Recent History / Timeline */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2"/></svg>
                                Historial Reciente
                            </h3>

                            <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-0 before:top-2 antes:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                                {/* Auto-generated event: Creation */}
                                <div className="relative">
                                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600 ring-4 ring-white dark:ring-zinc-950" />
                                    <p className="text-xs text-zinc-500 font-medium">{formatDate(cliente.created_at)}</p>
                                    <p className="text-sm text-zinc-900 dark:text-zinc-200 mt-1">Cliente registrado en el sistema</p>
                                </div>
                                
                                {/* Sales timeline */}
                                {ventas.map(v => (
                                    <div key={v.id} className="relative">
                                        <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-zinc-950 ${v.estado === 'cobrada' ? 'bg-emerald-500' : v.estado === 'pendiente' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 font-medium">{formatDate(v.fecha)}</p>
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mt-1">{v.detalle}</p>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(v.monto)}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty State if only creation exists */}
                                {ventas.length === 0 && (
                                    <div className="relative py-4">
                                        <span className="absolute -left-[21px] top-5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-white dark:ring-zinc-950" />
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¡Aún no hay compras!</p>
                                        <p className="text-xs text-zinc-500 mt-1 pb-4">Registrá la primera venta para este cliente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
