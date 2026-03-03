'use client';

import { useState, useEffect } from 'react';
import FastEntryBar from '@/components/FastEntryBar';
import ActionableTable from '@/components/ActionableTable';
import DashboardStats from '@/components/DashboardStats';
import CotizadorRapido from '@/components/CotizadorRapido';
import DirectorioClientes from '@/components/DirectorioClientes';
import { supabase } from '@/utils/supabase';
import { Cliente, Venta } from '@/types';

export default function Home() {
  const [tab, setTab] = useState<'OPERATIVO' | 'DIRECTORIO' | 'ESTADISTICAS'>('OPERATIVO');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'SEMANA' | 'MES'>('SEMANA');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();

    // Supabase Real-Time Subscriptions
    const clientesSub = supabase.channel('public:clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        fetchData();
      }).subscribe();

    const ventasSub = supabase.channel('public:ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        fetchData();
      }).subscribe();

    return () => {
      supabase.removeChannel(clientesSub);
      supabase.removeChannel(ventasSub);
    };
  }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from('clientes').select('*');
    if (cData) {
      setClientes(cData.map(c => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono
      })));
    }
    const { data: vData } = await supabase.from('ventas').select('*').order('fecha', { ascending: false });
    if (vData) {
      setVentas(vData.map(v => ({
        id: v.id,
        cliente_id: v.clienteId || v.cliente_id,
        fecha: v.fecha,
        detalle: v.detalleProducto || v.detalle_producto || v.detalle,
        monto: v.montoFacturado || v.monto_facturado || v.monto,
        vendedor: v.vendedor
      })));
    }
  };

  const handleAddData = async (c: Omit<Cliente, 'id'>) => {
    const { data, error } = await supabase.from('clientes').insert([{
      nombre: c.nombre,
      telefono: c.telefono
    }]).select().single();

    if (error) {
      console.error("Error Supabase Clientes:", error);
      alert("Error al guardar cliente: " + error.message);
      return undefined;
    }

    if (data) {
      setClientes(prev => {
        if (!prev.find(existing => existing.id === data.id)) return [...prev, data];
        return prev;
      });
      return data.id as string;
    }
    return undefined;
  };

  const handleAddVenta = async (clienteId: string, detalleProducto: string, monto: number, vendedor: string) => {
    const { data, error } = await supabase
      .from('ventas')
      .insert([{
        cliente_id: clienteId,
        detalle: detalleProducto,
        monto: parseFloat(monto.toString()), // Force parsing explicitly
        vendedor: vendedor
      }])
      .select().single();

    if (error) {
      console.error("Error Supabase Ventas:", error);
      alert("Error al guardar la venta: " + error.message);
      return;
    }

    if (data) {
      fetchData(); // Reload safely to get ID mapping
    }
  };

  const hoy = new Date();
  const getWeekStart = (d: Date) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
  const getMonthStart = (d: Date) => { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; };

  const startOfWeek = getWeekStart(hoy);
  const startOfMonth = getMonthStart(hoy);

  const ventasSemana = ventas.filter(v => v.fecha >= startOfWeek);
  const ventasMes = ventas.filter(v => v.fecha >= startOfMonth);

  const totalFacturadoSemana = ventasSemana.reduce((acc, v) => acc + (v.monto || 0), 0);
  const totalFacturadoMes = ventasMes.reduce((acc, v) => acc + (v.monto || 0), 0);

  const facturadoActual = timeFilter === 'SEMANA' ? totalFacturadoSemana : totalFacturadoMes;
  const cantidadVentasActual = timeFilter === 'SEMANA' ? ventasSemana.length : ventasMes.length;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <main className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col transition-colors duration-300">
        <FastEntryBar
          clientes={clientes}
          ventas={ventas}
          onAddData={handleAddData}
          onAddServicio={handleAddVenta}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Pestañas de Navegación */}
        <div className="w-full bg-white dark:bg-neutral-900 shadow-sm px-6 flex gap-4 justify-center border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300">
          <button
            onClick={() => setTab('OPERATIVO')}
            className={`px-6 py-4 font-bold uppercase tracking-wide transition-colors border-b-4 ${tab === 'OPERATIVO' ? 'border-yellow-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-neutral-800'}`}
          >
            Panel de Ventas
          </button>
          <button
            onClick={() => setTab('DIRECTORIO')}
            className={`px-6 py-4 font-bold uppercase tracking-wide transition-colors border-b-4 ${tab === 'DIRECTORIO' ? 'border-yellow-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-neutral-800'}`}
          >
            Directorio Clientes
          </button>
          <button
            onClick={() => setTab('ESTADISTICAS')}
            className={`px-6 py-4 font-bold uppercase tracking-wide transition-colors border-b-4 ${tab === 'ESTADISTICAS' ? 'border-yellow-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-neutral-800'}`}
          >
            Estadísticas & Cotizador
          </button>
        </div>

        <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Métricas Principales</h2>
            <div className="flex gap-2 bg-gray-100 dark:bg-neutral-950 p-1 rounded-lg border border-gray-200 dark:border-neutral-800">
              <button
                onClick={() => setTimeFilter('SEMANA')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${timeFilter === 'SEMANA' ? 'bg-yellow-400 text-black shadow-sm' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'}`}>
                Esta Semana
              </button>
              <button
                onClick={() => setTimeFilter('MES')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${timeFilter === 'MES' ? 'bg-yellow-400 text-black shadow-sm' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'}`}>
                Este Mes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 transition-colors duration-300 shadow-sm">
              <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-bold uppercase tracking-tight">Clientes en Base</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{clientes.length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 transition-colors duration-300 shadow-sm">
              <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-bold uppercase tracking-tight">Facturado ({timeFilter === 'SEMANA' ? 'Esta Semana' : 'Este Mes'})</h3>
              <p className="text-3xl font-black text-yellow-500 dark:text-yellow-400 mt-2">$ {facturadoActual.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 transition-colors duration-300 shadow-sm">
              <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-bold uppercase tracking-tight">Ventas ({timeFilter === 'SEMANA' ? 'Esta Semana' : 'Este Mes'})</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{cantidadVentasActual}</p>
            </div>
          </div>

          {tab === 'OPERATIVO' ? (
            <ActionableTable ventas={ventas} clientes={clientes} searchTerm={searchTerm} />
          ) : tab === 'DIRECTORIO' ? (
            <DirectorioClientes clientes={clientes} ventas={ventas} searchTerm={searchTerm} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardStats />
              </div>
              <div className="lg:col-span-1">
                <CotizadorRapido clientes={clientes} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
