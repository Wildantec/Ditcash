'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Rocket, 
  Gift, 
  Bell, 
  Warehouse, 
  Package, 
  BellRing, 
  ShieldCheck, 
  Save 
} from 'lucide-react';
import Swal from 'sweetalert2';

const ROLES_DISPONIBLES = ['ADMIN', 'MARKETING', 'VENDEDOR'];
const MODULOS_SISTEMA = [
  { id: 'dashboard', name: 'Panel de Control (Dashboard)', icon: BarChart3, obligatorio: true },
  { id: 'usuarios', name: 'Gestión de Usuarios Admin', icon: Users },
  { id: 'vendedores', name: 'Control de Vendedores', icon: Briefcase },
  { id: 'clientes', name: 'Estado de Cuenta Clientes', icon: Users },
  { id: 'campanas', name: 'Campañas de Evidencias / Historial', icon: Rocket },
  { id: 'premios', name: 'Catálogo de Premios', icon: Gift },
  { id: 'canjes', name: 'Control de Canjes & Solicitudes', icon: Bell },
  { id: 'bodegas', name: 'Configuración de Bodegas', icon: Warehouse },
  { id: 'inventario', name: 'Kardex / Inventario Global', icon: Package },
  { id: 'publicidad', name: 'Banners Publicitarios', icon: BellRing }
];

interface PermisoMatriz {
  rol: string;
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export default function ModuloPermisosAdmin() {
  const [rolSeleccionado, setRolSeleccionado] = useState('VENDEDOR');
  const [matrizPermisos, setMatrizPermisos] = useState<PermisoMatriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function cargarPermisos() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/permisos');
        const json = await res.json();
        if (json.success) setMatrizPermisos(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    cargarPermisos();
  }, [rolSeleccionado]);

  const buscarPermiso = (moduloId: string) => {
    const moduloConfig = MODULOS_SISTEMA.find(m => m.id === moduloId);
    if (moduloConfig?.obligatorio) {
      return { rol: rolSeleccionado, modulo: moduloId, ver: true, crear: true, editar: true, eliminar: true };
    }
    return matrizPermisos.find(p => p.rol === rolSeleccionado && p.modulo === moduloId) || {
      rol: rolSeleccionado, modulo: moduloId, ver: false, crear: false, editar: false, eliminar: false
    };
  };

  const handleSwitchChange = (moduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    const moduloConfig = MODULOS_SISTEMA.find(m => m.id === moduloId);
    if (moduloConfig?.obligatorio) return;

    const registroActual = buscarPermiso(moduloId);
    const nuevoValor = !registroActual[campo];
    const registroActualizado = { ...registroActual, [campo]: nuevoValor };

    setMatrizPermisos(prev => {
      const filtrados = prev.filter(p => !(p.rol === rolSeleccionado && p.modulo === moduloId));
      return [...filtrados, registroActualizado];
    });
  };

  const guardarCambiosMatriz = () => {
    startTransition(async () => {
      try {
        for (const mod of MODULOS_SISTEMA) {
          if (mod.obligatorio) continue;
          const configModulo = buscarPermiso(mod.id);
          await fetch('/api/admin/permisos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configModulo)
          });
        }
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase;">¡PERMISOS ACTUALIZADOS!</span>',
          text: `La matriz de acceso para ${rolSeleccionado} se guardó con éxito.`,
          icon: 'success',
          confirmButtonColor: '#001F3F'
        });
      } catch (err) {
        Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
      }
    });
  };

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Seguridad Corporativa
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Matriz dinámica de accesos y restricciones en caliente</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={rolSeleccionado} 
            onChange={(e) => setRolSeleccionado(e.target.value)}
            className="bg-white border border-slate-200 text-[#001F3F] text-[11px] font-black rounded-xl px-4 py-3 focus:outline-none uppercase tracking-wider shadow-sm cursor-pointer"
          >
            {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <button
            onClick={guardarCambiosMatriz}
            disabled={isPending || loading}
            className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-6 py-3.5 rounded-xl uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} strokeWidth={2.5} />
            <span>{isPending ? 'Guardando...' : 'Guardar Permisos'}</span>
          </button>
        </div>
      </header>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Módulo Operativo</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Visualizar</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Crear</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Editar</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULOS_SISTEMA.map((mod) => {
                const perm = buscarPermiso(mod.id);
                const Icono = mod.icon;
                return (
                  <tr key={mod.id} className={`group hover:bg-slate-50 transition-colors ${mod.obligatorio ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-white transition-all text-[#001F3F]">
                          <Icono size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-black uppercase tracking-tight text-[#001F3F]">{mod.name}</p>
                          {mod.obligatorio && (
                            <span className="bg-[#001F3F]/10 text-[#001F3F] text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">Fijo</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <input type="checkbox" checked={perm.ver} disabled={mod.obligatorio || loading} onChange={() => handleSwitchChange(mod.id, 'ver')} className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40" />
                    </td>
                    <td className="px-6 py-6 text-center">
                      <input type="checkbox" checked={perm.crear} disabled={mod.obligatorio || loading} onChange={() => handleSwitchChange(mod.id, 'crear')} className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40" />
                    </td>
                    <td className="px-6 py-6 text-center">
                      <input type="checkbox" checked={perm.editar} disabled={mod.obligatorio || loading} onChange={() => handleSwitchChange(mod.id, 'editar')} className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40" />
                    </td>
                    <td className="px-6 py-6 text-center">
                      <input type="checkbox" checked={perm.eliminar} disabled={mod.obligatorio || loading} onChange={() => handleSwitchChange(mod.id, 'eliminar')} className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}