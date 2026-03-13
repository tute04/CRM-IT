'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Send, 
  Users, 
  Zap, 
  Target, 
  BarChart3, 
  Play,
  MessageSquare,
  ExternalLink,
  Phone,
  Eye
} from 'lucide-react';
import { createClient } from '@/utils/supabase-client';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';

export default function LeadHunterPage() {
  const [isActive, setIsActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [targetNicho, setTargetNicho] = useState('Ferreterías');
  const [targetCiudad, setTargetCiudad] = useState('Córdoba');
  const [stats, setStats] = useState({
    encontrados: 0,
    enviados: 0,
    respuestas: 0,
    conversion: '0%'
  });

  const { toast } = useToast();

  const supabase = createClient();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads_hunter')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      
      // Calcular stats básicas
      const total = data?.length || 0;
      const contactados = data?.filter((l: any) => l.estado !== 'nuevo').length || 0;
      setStats({
        encontrados: total,
        enviados: contactados,
        respuestas: 0, // Mock por ahora
        conversion: total > 0 ? `${((contactados / total) * 100).toFixed(1)}%` : '0%'
      });

    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    setIsActive(true);
    setScanProgress(10);
    
    try {
      const resp = await fetch('/api/hunter/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicho: targetNicho, ciudad: targetCiudad })
      });
      
      const result = await resp.json();
      
      if (result.success) {
        setScanProgress(100);
        toast(`Se encontraron ${result.count} leads nuevos!`, 'success');
        fetchLeads();
      } else {
        toast(result.error || 'Error al escanear', 'error');
      }
    } catch (err) {
      toast('Error de conexión', 'error');
    } finally {
      setTimeout(() => {
        setIsActive(false);
        setScanProgress(0);
      }, 1000);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setScanProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 50);
    } else {
      setScanProgress(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-3">
            <Zap className="text-orange-500 fill-orange-500" /> Lead Hunter AI
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Tu agente autónomo de ventas trabajando 24/7.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={isActive ? undefined : startScan}
            disabled={isActive}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
              isActive 
                ? 'bg-zinc-700 text-white animate-pulse cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            {isActive ? <Zap size={20} className="animate-bounce" /> : <Play size={20} fill="currentColor" />}
            {isActive ? 'Agente Trabajando...' : 'Activar Agente'}
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leads Encontrados', val: stats.encontrados, icon: Users, color: 'text-blue-500' },
          { label: 'Mensajes Enviados', val: stats.enviados, icon: Send, color: 'text-orange-500' },
          { label: 'Respuestas IA', val: stats.respuestas, icon: MessageSquare, color: 'text-green-500' },
          { label: 'Tasa de Conversión', val: stats.conversion, icon: BarChart3, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-none mt-1">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RADAR / SCANNER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-orange-500/20 rounded-3xl p-8 relative overflow-hidden h-[400px] flex flex-col items-center justify-center text-center">
            {/* Radar Background Animation */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-orange-500/50 rounded-full animate-ping shadow-[0_0_100px_rgba(249,115,22,0.3)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-orange-500/30 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] border border-orange-500/20 rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse border border-orange-500/50">
                <Target size={40} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isActive ? 'Escaneando Leads...' : 'Agente en Espera'}
              </h2>
              <p className="text-zinc-400 max-w-md">
                {isActive 
                  ? `Buscando ${targetNicho} en ${targetCiudad} que coincidan con el perfil de ITrium.` 
                  : 'Pulsa el botón superior para iniciar la búsqueda automática de clientes.'}
              </p>
              
              {isActive && (
                <div className="mt-8 w-64 bg-zinc-800 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500 ease-linear shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Floating Lead Nodes (Visual garnish) */}
            {isActive && [1,2,3,4,5].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]"
                style={{
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
                  transition: 'all 2s ease-in-out'
                }}
              />
            ))}
          </div>

          {/* RECENT ACTIVITY TABLE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Actividad Reciente</h3>
              <button className="text-sm font-medium text-orange-500 hover:text-orange-600">Ver todo</button>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leads.length === 0 && !loading && (
                <div className="p-20 text-center text-zinc-500">
                  Click en Activar Agente para buscar prospectos.
                </div>
              )}
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                      {lead.nombre[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white">{lead.nombre}</h4>
                      <p className="text-xs text-zinc-500">{lead.ciudad} · {new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    {lead.scoring > 0 && (
                      <div className="flex flex-col items-end mr-2">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Score</div>
                        <div className={`text-sm font-black ${
                          lead.scoring >= 8 ? 'text-green-500' : 
                          lead.scoring >= 5 ? 'text-orange-500' : 'text-zinc-500'
                        }`}>
                          {lead.scoring}/10
                        </div>
                      </div>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      lead.estado === 'contactado' ? 'bg-blue-500/10 text-blue-500' :
                      lead.estado === 'interesado' ? 'bg-green-500/10 text-green-500' :
                      lead.estado === 'nuevo' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {lead.estado}
                    </span>
                    <button 
                      onClick={() => setSelectedLead(lead)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL DE DETALLES DEL LEAD */}
        <Modal 
          isOpen={!!selectedLead} 
          onClose={() => setSelectedLead(null)}
          title="Detalles del Prospecto"
        >
          {selectedLead && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">{selectedLead.nombre}</h3>
                  <p className="text-zinc-500 flex items-center gap-2">
                    <Target size={14} /> {selectedLead.nicho} en {selectedLead.ciudad}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedLead.sitio_web && (
                    <a 
                      href={selectedLead.sitio_web} 
                      target="_blank" 
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:text-orange-500 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <a 
                    href={`https://wa.me/${selectedLead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(selectedLead.propuesta_ia)}`}
                    target="_blank"
                    className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                  >
                    <Phone size={18} />
                  </a>
                </div>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest mb-3">
                  <Zap size={14} /> Propuesta Generada por IA
                </div>
                <p className="text-sm dark:text-zinc-300 leading-relaxed italic">
                  "{selectedLead.propuesta_ia}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                  <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Puntaje Lead</span>
                  <div className={`text-lg font-bold ${
                    selectedLead.scoring >= 8 ? 'text-green-500' : 
                    selectedLead.scoring >= 5 ? 'text-orange-500' : 'text-zinc-500'
                  }`}>
                    {selectedLead.scoring || 'N/A'} / 10
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                  <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Motivo IA</span>
                  <div className="text-xs font-medium dark:text-zinc-400 line-clamp-2">
                    {selectedLead.scoring_motivo || 'Buscando nicho rentable...'}
                  </div>
                </div>
              </div>

              {selectedLead.contenido_web && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 rounded-xl text-[10px] text-zinc-500 font-mono line-clamp-3">
                  <span className="font-bold uppercase block mb-1">Data Extraída Ojo Mágico:</span>
                  {selectedLead.contenido_web}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    window.open(`https://wa.me/${selectedLead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(selectedLead.propuesta_ia)}`, '_blank');
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
                >
                  <Phone size={20} /> WhatsApp
                </button>
                
                {!selectedLead.convertido_cliente_id && (
                  <button 
                    onClick={async () => {
                      const resp = await fetch('/api/hunter/convert', {
                        method: 'POST',
                        body: JSON.stringify({ leadId: selectedLead.id })
                      });
                      if (resp.ok) {
                        toast('Convertido a cliente con éxito!', 'success');
                        setSelectedLead(null);
                        fetchLeads();
                      }
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Users size={20} /> Al CRM
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* SETTINGS / CONFIGURATION */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 dark:text-white flex items-center gap-2">
              <Search size={20} className="text-orange-500" /> Configurar Target
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nichos de Mercado</label>
                <div className="flex flex-wrap gap-2">
                  {['Ferreterías', 'Talleres', 'Peluquerías', 'Pinturerías'].map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => setTargetNicho(tag)}
                      className={`px-3 py-1 border rounded-lg text-sm font-medium cursor-pointer transition-all ${
                        targetNicho === tag 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Ciudades Objetivo</label>
                <input 
                  type="text" 
                  placeholder="Ej: Córdoba, Rosario..." 
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                  value={targetCiudad}
                  onChange={(e) => setTargetCiudad(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tono del Bot</label>
                <select className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                  <option>Profesional y Amigable</option>
                  <option>Agresivo de Ventas</option>
                  <option>Informativo / Educativo</option>
                </select>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium dark:text-white">Límite Diario</span>
                  <span className="text-sm font-bold text-orange-500">50 mails/día</span>
                </div>
                <input type="range" className="w-full accent-orange-500" defaultValue="50" min="10" max="200" />
              </div>
            </div>
          </div>

          <div className="bg-orange-500 rounded-3xl p-6 text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)]">
            <h4 className="font-bold text-lg mb-2">Tip de Ventas</h4>
            <p className="text-sm text-orange-100 leading-relaxed mb-4">
              "Los leads que no tienen sitio web son 3 veces más propensos a contratar ITrium."
            </p>
            <div className="bg-white/20 h-1 rounded-full overflow-hidden">
              <div className="bg-white w-[75%] h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
