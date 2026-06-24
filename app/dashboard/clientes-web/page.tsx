'use client';

import { useState, useEffect, useTransition } from 'react';
import { Users, Save, Trash2, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface ClienteWebEstructura {
  id: number; cedula: string; nombre: string; activo: boolean; password?: string;
}

export default function AdminClientesWebPage() {
  const [listaClientes, setListaClientes] = useState<ClienteWebEstructura[]>([]);
  const [idsEliminados, setIdsEliminados] = useState<number[]>([]);
  const [idsModificados, setIdsModificados] = useState<number[]>([]);
  const [cargando, setCargando] = useState(true);
  const [isPending, startTransition] = useTransition();

  const cargarClientesDesdeBase = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/admin/clientes-web');
      const json = await res.json();
      if (json.success) setListaClientes(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientesDesdeBase();
  }, []);

  const handleInputChange = (id: number, campo: keyof ClienteWebEstructura, valor: any) => {
    setListaClientes(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    if (!idsModificados.includes(id)) setIdsModificados(prev => [...prev, id]);
  };

  const handleEliminarFila = async (id: number, nombre: string) => {
    const { isConfirmed } = await Swal.fire({
      title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase;">¿Remover Cliente?</span>',
      text: `Se marcará para baja total a: ${nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, REMOVER',
      cancelButtonText: 'CANCELAR'
    });

    if (isConfirmed) {
      setIdsEliminados(prev => [...prev, id]);
    }
  };

  const guardarCambiosMasivos = () => {
    startTransition(async () => {
      try {
        const clientesAEnviar = listaClientes.filter(c => idsModificados.includes(c.id) && !idsEliminados.includes(c.id));
        const res = await fetch('/api/admin/clientes-web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modificados: clientesAEnviar, eliminadosIds: idsEliminados })
        });
        const json = await res.json();
        if (json.success) {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase;">¡SNC INDICES EXCI!</span>',
            text: 'Base relacional mapeada correctamente.',
            icon: 'success',
            confirmButtonColor: '#001F3F'
          });
          setIdsEliminados([]);
          setIdsModificados([]);
          await cargarClientesDesdeBase();
        }
      } catch (err) {
        Swal.fire('Error', 'Inconveniente de guardado.', 'error');
      }
    });
  };

  if (cargando) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-[#001F3F] font-black text-[11px] uppercase tracking-[0.2em]">
        <Loader2 className="animate-spin text-[#FFB800]" size={28} strokeWidth={2.5} />
        <span>Cargando Padrón de Clientes Web...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Users className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Cuentas de Clientes
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Control de identidades y credenciales de deudores externos</p>
        </div>
        <button
          onClick={guardarCambiosMasivos}
          disabled={isPending || (idsModificados.length === 0 && idsEliminados.length === 0)}
          className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-6 py-3.5 rounded-xl uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={14} strokeWidth={2.5} />
          <span>{isPending ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </header>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Razón Social / Cliente</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Identificación</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Nueva Credencial</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Estado</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaClientes.map((cliente) => {
                const eliminado = idsEliminados.includes(cliente.id);
                return (
                  <tr key={cliente.id} className={`group hover:bg-slate-50 transition-colors ${eliminado ? 'bg-red-50/40 opacity-50' : ''}`}>
                    <td className="px-10 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-white transition-all text-[#001F3F]">
                          <Users size={16} strokeWidth={2.5} />
                        </div>
                        <input 
                          type="text" value={cliente.nombre} disabled={eliminado || isPending}
                          onChange={(e) => handleInputChange(cliente.id, 'nombre', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#001F3F] text-[13px] font-black uppercase text-[#001F3F] py-1 focus:outline-none w-full transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="text" value={cliente.cedula} disabled={eliminado || isPending}
                        onChange={(e) => handleInputChange(cliente.id, 'cedula', e.target.value)}
                        className="bg-transparent text-center border-b border-transparent hover:border-slate-300 focus:border-[#001F3F] text-[12px] font-bold text-slate-400 font-mono focus:outline-none w-32 transition-all"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="password" placeholder="••••••••" value={cliente.password || ''} disabled={eliminado || isPending}
                        onChange={(e) => handleInputChange(cliente.id, 'password', e.target.value)}
                        className="bg-transparent text-center border-b border-transparent hover:border-slate-300 focus:border-[#001F3F] text-[12px] focus:outline-none w-32 transition-all"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={cliente.activo ? 'true' : 'false'} disabled={eliminado || isPending}
                        onChange={(e) => handleInputChange(cliente.id, 'activo', e.target.value === 'true')}
                        className="bg-transparent text-[11px] font-black uppercase text-slate-600 focus:outline-none cursor-pointer"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Suspendido</option>
                      </select>
                    </td>
                    <td className="px-10 py-4 text-right">
                      {eliminado ? (
                        <button 
                          onClick={() => setIdsEliminados(prev => prev.filter(id => id !== cliente.id))}
                          className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEliminarFila(cliente.id, cliente.nombre)}
                          disabled={isPending}
                          className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors tracking-widest border-b-2 border-transparent hover:border-red-600 pb-0.5"
                        >
                          Borrar
                        </button>
                      )}
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