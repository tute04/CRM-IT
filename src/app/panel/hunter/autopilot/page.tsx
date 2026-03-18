'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot,
  Play,
  Square,
  Plus,
  Settings,
  Mail,
  Users,
  Calendar,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { createClient } from '@/utils/supabase-client';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';

export default function AutopilotPage() {
  const [campanas, setCampanas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [nicho, setNicho] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [limiteDiario, setLimiteDiario] = useState(5);
  const [promptPersonalizado, setPromptPersonalizado] = useState('Eres un vendedor experto de ITirium CRM. Redacta un correo corto, profesional y amigable.');

  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchCampanas();
  }, []);

  const fetchCampanas = async () => {
    try {
      setLoading(true);
      console.log('Fetching campanas...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.error('No se pudo obtener el usuario', userError);
        setLoading(false);
        return;
      }

      console.log('Usuario obtenido:', userData.user.id);

      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();
        
      if (negocioError || !negocioData) {
        console.error('No se pudo obtener el negocio del usuario', negocioError);
        setLoading(false);
        return;
      }

      console.log('Negocio obtenido:', negocioData.id);

      const { data, error } = await supabase
        .from('campanas_autopilot')
        .select('*')
        .eq('negocio_id', negocioData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error supabase campanas:', error);
        throw error;
      }
      
      console.log('Campañas obtenidas:', data?.length);
      setCampanas(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error catch fetching campanas:', err);
      toast(err?.message || 'Error al cargar campañas', 'error');
      setLoading(false);
    }
  };

  const toggleCampana = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('campanas_autopilot')
        .update({ activa: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast(`Campaña ${!currentStatus ? 'Activada' : 'Pausada'}`, 'success');
      fetchCampanas();
    } catch (err) {
      toast('Error al cambiar estado', 'error');
    }
  };

  const deleteCampana = async (id: string) => {
    if(!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    try {
      const { error } = await supabase
        .from('campanas_autopilot')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Campaña eliminada', 'success');
      fetchCampanas();
    } catch (err) {
      toast('Error al eliminar', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: negocioData } = await supabase
        .from('negocios')
        .select('id')
        .eq('owner_id', userData.user?.id)
        .single();

      if (!negocioData) throw new Error("Negocio no encontrado");

      const { error } = await supabase
        .from('campanas_autopilot')
        .insert([{
          negocio_id: negocioData.id,
          nombre_campana: nombre,
          nicho,
          ciudad,
          limite_diario: limiteDiario,
          activa: true,
          prompt_personalizado: promptPersonalizado
        }]);

      if (error) throw error;
      toast('Campaña creada y activada', 'success');
      setIsModalOpen(false);
      
      // Reset form
      setNombre('');
      setNicho('');
      setCiudad('');
      setLimiteDiario(5);
      
      fetchCampanas();
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Error al crear campaña', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-3">
            <Bot className="text-orange-500" /> Piloto Automático
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Configura campañas para prospectar y contactar 100% en automático.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              toast('Ejecutando prueba del Autopilot...', 'info');
              try {
                const res = await fetch('/api/hunter/autopilot', {
                  headers: { 'Authorization': 'Bearer itirium_autopilot_cron_secret_1234' }
                });
                const data = await res.json();
                if (data.success) {
                  toast(`Cron finalizado: ${data.emails_enviados} emails enviados!`, 'success');
                  fetchCampanas(); // Refrescar para ver cambios
                } else {
                  toast(`Resultado: ${data.message || data.error}`, data.error ? 'error' : 'info');
                }
              } catch(e) {
                toast('Error al lanzar prueba', 'error');
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700 text-white"
            title="Simula ser las 10:00 AM y dispara los mails"
          >
            <Play size={20} className="fill-white" /> Forzar Envío Ahora
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
          >
            <Plus size={20} /> Crear Campaña
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">Campañas Activas</p>
            <h3 className="text-2xl font-black dark:text-white mt-1">
              {campanas.filter(c => c.activa).length}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">Emails Enviados Hoy</p>
            <h3 className="text-2xl font-black dark:text-white mt-1">0</h3>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl flex items-center gap-4 shadow-xl shadow-orange-500/20 text-white">
          <div className="p-4 bg-white/20 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-orange-100 font-bold">Estado del Servidor</p>
            <h3 className="text-2xl font-black mt-1">Online (Cron 10 AM)</h3>
          </div>
        </div>
      </div>

      {/* LISTA DE CAMPAÑAS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg dark:text-white">Campañas Configuradas</h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading ? (
             <div className="p-10 text-center text-zinc-500">Cargando campañas...</div>
          ) : campanas.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <Bot size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <h4 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Sin Campañas</h4>
              <p className="text-zinc-500">No tienes ninguna campaña configurada. ¡Crea una para arrancar el piloto automático!</p>
            </div>
          ) : (
            campanas.map((campana) => (
              <div key={campana.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors gap-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-3 rounded-2xl ${campana.activa ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                      {campana.nombre_campana}
                      {campana.activa ? (
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Activa</span>
                      ) : (
                        <span className="text-[10px] bg-zinc-500/10 text-zinc-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Pausada</span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><Users size={14}/> {campana.nicho}</span>
                      <span className="flex items-center gap-1"><Calendar size={14}/> {campana.ciudad}</span>
                      <span className="flex items-center gap-1"><Mail size={14}/> {campana.limite_diario} diarios</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button 
                    onClick={() => toggleCampana(campana.id, campana.activa)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                      campana.activa 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200' 
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                    }`}
                  >
                    {campana.activa ? <><Square size={16}/> Pausar</> : <><Play size={16}/> Activar</>}
                  </button>
                  <button 
                    onClick={() => deleteCampana(campana.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Eliminar campaña"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Campaña Autopilot">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nombre de Referencia</label>
            <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                   placeholder="Ej: Clínicas Dentales CABA" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nicho</label>
              <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                     placeholder="Ej: Odontólogos" value={nicho} onChange={e => setNicho(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Ciudad</label>
              <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                     placeholder="Ej: Buenos Aires" value={ciudad} onChange={e => setCiudad(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Límite Diario</label>
              <span className="font-bold text-orange-500 text-sm">{limiteDiario} contactos/día</span>
            </div>
            <input type="range" className="w-full accent-orange-500" min="1" max="20" value={limiteDiario} onChange={e => setLimiteDiario(parseInt(e.target.value))} />
            <p className="text-xs text-zinc-400 mt-1">Recomendamos máx. 10 para evitar caer en spam rápido.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Instrucciones para la IA (Prompt)</label>
            <textarea required rows={3} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white resize-none"
                      value={promptPersonalizado} onChange={e => setPromptPersonalizado(e.target.value)} />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all">Activar Campaña</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
