'use client';

import { useState, useEffect, useTransition } from 'react';
import { ShieldCheck, Save, Loader2, BarChart3, Users, Briefcase, Rocket, Gift, Bell, Warehouse, Package, BellRing } from 'lucide-react';
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

  async function cargarPermisosDelServidor() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/permisos');
      const json = await res.json();
      if (json.success && json.data) setMatrizPermisos(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPermisosDelServidor();
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

  // 🟢 SE ACTIVA O DESACTIVA INDEPENDIENTEMENTE SEGÚN LO QUE MARQUES libremente
  const handleSwitchChange = (moduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    const moduloConfig = MODULOS_SISTEMA.find(m => m.id === moduloId);
    if (moduloConfig?.obligatorio) return;

    const registroActual = buscarPermiso(moduloId);
    const registroActualizado = { ...registroActual, [campo]: !registroActual[campo] };

    setMatrizPermisos(prev => {
      const filtrados = prev.filter(p => !(p.rol === rolSeleccionado && p.modulo === moduloId));
      return [...filtrados, registroActualizado];
    });
  };

  const guardarCambiosMatriz = () => {
    startTransition(async () => {
      try {
        const payloadEnvio: PermisoMatriz[] = [];
        for (const mod of MODULOS_SISTEMA) {
          if (mod.obligatorio) continue;
          payloadEnvio.push(buscarPermiso(mod.id));
        }

        const res = await fetch('/api/admin/permisos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rol: rolSeleccionado, permisos: payloadEnvio })
        });
        const json = await res.json();
        if (json.success) {
          await cargarPermisosDelServidor();
          Swal.fire({ title: '¡PERMISOS GUARDADOS!', text: 'Configuración guardada.', icon: 'success', confirmButtonColor: '#001F3F' });
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo guardar.', 'error');
      }
    });
  };

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3"><ShieldCheck className="text-[#FFB800]" size={28} /> Seguridad Corporativa</h1>
        </div>
        <div className="flex items-center gap-4">
          <select value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value)} className="bg-white border rounded-xl px-4 py-3 text-[11px] font-black uppercase">
            {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={guardarCambiosMatriz} disabled={isPending || loading} className="bg-[#001F3F] text-[#FFB800] text-[10px] font-black px-6 py-3.5 rounded-xl uppercase flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Guardar</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#001F3F] text-[#FFB800]">
              <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest">Módulo Operativo</th>
              <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-center">Visualizar</th>
              <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-center">Crear</th>
              <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-center">Editar</th>
              <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-center">Eliminar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MODULOS_SISTEMA.map((mod) => {
              const perm = buscarPermiso(mod.id);
              const Icono = mod.icon;
              return (
                <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6 font-black uppercase text-xs">{mod.name}</td>
                  <td className="text-center"><input type="checkbox" checked={perm.ver} disabled={mod.obligatorio} onChange={() => handleSwitchChange(mod.id, 'ver')} className="w-4 h-4 cursor-pointer" /></td>
                  <td className="text-center"><input type="checkbox" checked={perm.crear} disabled={mod.obligatorio} onChange={() => handleSwitchChange(mod.id, 'crear')} className="w-4 h-4 cursor-pointer" /></td>
                  <td className="text-center"><input type="checkbox" checked={perm.editar} disabled={mod.obligatorio} onChange={() => handleSwitchChange(mod.id, 'editar')} className="w-4 h-4 cursor-pointer" /></td>
                  <td className="text-center"><input type="checkbox" checked={perm.eliminar} disabled={mod.obligatorio} onChange={() => handleSwitchChange(mod.id, 'eliminar')} className="w-4 h-4 cursor-pointer" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}