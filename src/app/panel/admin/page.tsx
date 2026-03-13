'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase-client';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    trial: 0,
    mrr: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Validar si es el dueño
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email !== 'matebonavia@gmail.com') {
        window.location.href = '/panel';
        return;
      }

      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNegocios(data || []);
      
      // Calcular stats
      const activos = data?.filter(n => n.plan === 'activo' || n.plan === 'pro').length || 0;
      const trial = data?.filter(n => n.plan === 'trial').length || 0;
      // Asumiendo un precio promedio de $5000 por el momento
      const mrr = activos * 5000;

      setStats({
        total: data?.length || 0,
        activos,
        trial,
        mrr
      });

    } catch (err) {
      console.error('Admin Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNegocios = negocios.filter(n => 
    n.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8"><SkeletonCard /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="text-orange-500" /> Modo Dios ITrium
          </h1>
          <p className="text-zinc-500">Control total de la plataforma y suscripciones.</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Negocios Totales', val: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Suscripciones Activas', val: stats.activos, icon: CreditCard, color: 'text-emerald-500' },
          { label: 'En Período Trial', val: stats.trial, icon: Calendar, color: 'text-orange-500' },
          { label: 'MRR Proyectado', val: formatCurrency(stats.mrr), icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
            <div className={`p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 w-fit mb-4 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <h3 className="text-2xl font-black dark:text-white">{stat.val}</h3>
          </div>
        ))}
      </div>

      {/* LISTADO DE NEGOCIOS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-lg dark:text-white text-zinc-900">Empresas Registradas</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar negocio..."
              className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Negocio</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Dueño / Email</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Plan</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Creado</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredNegocios.map((n) => (
                <tr key={n.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">{n.nombre}</td>
                  <td className="p-4 text-sm text-zinc-500">{n.email || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      n.plan === 'activo' || n.plan === 'pro' ? 'bg-emerald-500/10 text-emerald-500' : 
                      n.plan === 'trial' ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {n.plan}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-500">
                    {new Date(n.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
