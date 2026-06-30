'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { 
  ShieldCheck, Save, Loader2, Users, Briefcase, 
  Gift, ChevronDown, FileText, Wrench, Search, Settings, 
  FileSpreadsheet as GasIcon, Wallet, FileSpreadsheet
} from 'lucide-react';
import Swal from 'sweetalert2';

const ROLES_DISPONIBLES = [
  { value: 'ADMIN', label: 'ADMINISTRADOR', icon: ShieldCheck },
  { value: 'MARKETING', label: 'MARKETING', icon: Users },
  { value: 'VENDEDOR', label: 'VENDEDOR', icon: Briefcase },
  { value: 'CONTABILIDAD', label: 'CONTABILIDAD', icon: FileSpreadsheet },
  { value: 'COBRANZAS', label: 'COBRANZAS', icon: Wallet },
  { value: 'FACTURACION', label: 'FACTURACIÓN', icon: FileText },
  { value: 'SERVICIO_TECNICO', label: 'SERVICIO TÉCNICO', icon: Wrench }
];

// 🟢 MAPEO CORPORATIVO: Accesos de lectura base asignados automáticamente por rol
const MODULOS_POR_DEFECTO: { [key: string]: string[] } = {
  VENDEDOR: ['campanas', 'premios', 'inventario'],
  MARKETING: ['vendedores', 'campanas', 'canjes', 'historial', 'premios', 'inventario'],
  CONTABILIDAD: ['estaciones', 'facturas_comb', 'vehiculos'],
  SERVICIO_TECNICO: ['vehiculos', 'estaciones'],
  COBRANZAS: [],
  FACTURACION: [],
  ADMIN: [] // El Administrador maneja una cláusula de omisión total para control total
};

const ESTRUCTURA_PERMISOS = [
  {
    id: 'operaciones',
    label: 'Auditoría Campo',
    icon: Search,
    submodulos: [
      { id: 'vendedores', label: 'Monitoreo Asesores' },
      { id: 'campanas', label: 'Control Campañas' },
      { id: 'canjes', label: 'Validar Canjes' },
      { id: 'historial', label: 'Historial Entregas' }
    ]
  },
  {
    id: 'incentivos',
    label: 'Premios & Stock',
    icon: Gift,
    submodulos: [
      { id: 'premios', label: 'Catálogo Premios' },
      { id: 'inventario', label: 'Inventario Global' },
      { id: 'bodegas', label: 'Bodegas' }
    ]
  },
  {
    id: 'logistica',
    label: 'Logística y Activos',
    icon: Wrench,
    submodulos: [
      { id: 'vehiculos', label: 'Flota de Vehículos' },
      { id: 'mantenimientos', label: 'Servicio y Reparaciones' }
    ]
  },
  {
    id: 'contabilidad_modulo',
    label: 'Contabilidad',
    icon: GasIcon,
    submodulos: [
      { id: 'vehiculos_cont', label: 'Vehículos' },
      { id: 'estaciones', label: 'Estaciones' },
      { id: 'facturas_comb', label: 'Ingresar Factura' }
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: FileText,
    submodulos: [
      { id: 'facturacion', label: 'Emisión de Facturas' },
      { id: 'cobranzas', label: 'Gestión de Cartera' }
    ]
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    submodulos: [
      { id: 'usuarios', label: 'Gestión Usuarios' }
      // 🟢 Eliminado Banners Publicidad con éxito
    ]
  }
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
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<{ [key: string]: boolean }>({
    operaciones: true,
    incentivos: true,
    contabilidad_modulo: true
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleSeccion = (id: string) => {
    setSeccionesAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const esModuloObligatorioPorRol = (submoduloId: string) => {
    if (rolSeleccionado === 'ADMIN') return true;
    const modulosFijos = MODULOS_POR_DEFECTO[rolSeleccionado] || [];
    return modulosFijos.includes(submoduloId);
  };

  const buscarPermiso = (submoduloId: string) => {
    const permisoExistente = matrizPermisos.find(p => p.rol === rolSeleccionado && p.modulo === submoduloId);
    const tieneVerPorDefecto = esModuloObligatorioPorRol(submoduloId);

    if (permisoExistente) {
      if (tieneVerPorDefecto) {
        permisoExistente.ver = true;
      }
      return permisoExistente;
    }

    return {
      rol: rolSeleccionado, 
      modulo: submoduloId, 
      ver: tieneVerPorDefecto, 
      crear: false, 
      editar: false, 
      eliminar: false
    };
  };

  const handleSwitchChange = (submoduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    if (rolSeleccionado === 'ADMIN') return; // El administrador no se puede editar, goza de control total absoluto

    const registroActual = buscarPermiso(submoduloId);
    let nuevoValor = !registroActual[campo];
    
    const registroActualizado = { ...registroActual, [campo]: nuevoValor };
    
    // Si se apaga visualizar, se caen los privilegios de acción en cascada
    if (campo === 'ver' && !nuevoValor) {
      if (esModuloObligatorioPorRol(submoduloId)) return; // Evita apagar vistas obligatorias
      registroActualizado.crear = false;
      registroActualizado.editar = false;
      registroActualizado.eliminar = false;
    }
    
    // Si se enciende cualquier acción (crear, editar, eliminar), se activa "ver" automáticamente
    if ((campo === 'crear' || campo === 'editar' || campo === 'eliminar') && nuevoValor) {
      registroActualizado.ver = true;
    }

    setMatrizPermisos(prev => {
      const filtrados = prev.filter(p => !(p.rol === rolSeleccionado && p.modulo === submoduloId));
      return [...filtrados, registroActualizado];
    });
  };

  const guardarCambiosMatriz = () => {
    startTransition(async () => {
      try {
        const payloadEnvio: PermisoMatriz[] = [];
        for (const seccion of ESTRUCTURA_PERMISOS) {
          for (const sub of seccion.submodulos) {
            const permisoFinal = buscarPermiso(sub.id);
            if (esModuloObligatorioPorRol(sub.id) || rolSeleccionado === 'ADMIN') {
              permisoFinal.ver = true;
            }
            payloadEnvio.push(permisoFinal);
          }
        }

        const res = await fetch('/api/admin/permisos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rol: rolSeleccionado, permisos: payloadEnvio })
        });
        const json = await res.json();
        if (json.success) {
          await cargarPermisosDelServidor();
          Swal.fire({ 
            title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡SEGURIDAD ACTUALIZADA!</span>', 
            text: `Estructura de accesos guardada para el rol seleccionado.`, 
            icon: 'success', 
            confirmButtonColor: '#001F3F' 
          });
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
      }
    });
  };

  const currentRolObj = ROLES_DISPONIBLES.find(r => r.value === rolSeleccionado) || ROLES_DISPONIBLES[2];

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Matriz de Privilegios
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión avanzada de accesos por módulos y submódulos</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto" ref={dropdownRef}>
          <div className="relative w-56">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] transition-all shadow-sm flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <currentRolObj.icon size={14} className="text-[#FFB800]" />
                <span>{currentRolObj.label}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {ROLES_DISPONIBLES.map((rol) => {
                  const Icon = rol.icon;
                  return (
                    <button
                      key={rol.value}
                      type="button"
                      onClick={() => {
                        setRolSeleccionado(rol.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left font-black text-xs transition-colors flex items-center gap-2 ${
                        rolSeleccionado === rol.value 
                          ? 'bg-[#001F3F] text-[#FFB800]' 
                          : 'text-[#001F3F] hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={13} className={rolSeleccionado === rol.value ? 'text-[#FFB800]' : 'text-slate-400'} />
                      <span>{rol.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button 
            onClick={guardarCambiosMatriz} 
            disabled={isPending || loading || rolSeleccionado === 'ADMIN'} 
            className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-6 py-4 rounded-2xl uppercase flex items-center gap-2 shadow-md hover:bg-black hover:text-[#FFB800] transition-all duration-300 h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" strokeWidth={2.5} /> : <Save size={13} />}
            <span>Guardar Ajustes</span>
          </button>
        </div>
      </header>
      
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse border">
            Sincronizando módulos del sistema...
          </div>
        ) : (
          ESTRUCTURA_PERMISOS.map((seccion) => {
            const isAbierto = !!seccionesAbiertas[seccion.id];

            return (
              <div key={seccion.id} className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden transition-all">
                <button 
                  onClick={() => toggleSeccion(seccion.id)}
                  className="w-full bg-slate-50/50 px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white shadow-sm rounded-xl border border-slate-100 text-[#001F3F]">
                      <seccion.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest text-[#001F3F]">{seccion.label}</span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isAbierto ? 'rotate-180' : ''}`} />
                </button>
                {isAbierto && (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                          {/* 🟢 CORRECCIÓN: Título limpio solicitado */}
                          <th className="px-12 py-4 text-[9px] font-black uppercase tracking-widest w-1/2">SUBMÓDULOS</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Visualizar</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Crear</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Editar</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Eliminar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {seccion.submodulos.map((sub) => {
                          const perm = buscarPermiso(sub.id);
                          const esFijo = esModuloObligatorioPorRol(sub.id);
                          const isAdmin = rolSeleccionado === 'ADMIN';

                          return (
                            <tr key={sub.id} className="hover:bg-blue-50/10 transition-colors">
                              <td className="px-12 py-4.5 flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                                <span className="font-bold text-xs text-slate-700 uppercase tracking-tight">
                                  {sub.label}
                                </span>
                              </td>
                              <td className="text-center">
                                <input 
                                  type="checkbox" 
                                  checked={perm.ver}
                                  disabled={esFijo || isAdmin}
                                  onChange={() => handleSwitchChange(sub.id, 'ver')} 
                                  className={`w-4 h-4 rounded ${isAdmin || esFijo ? 'cursor-not-allowed opacity-60 accent-amber-500' : 'cursor-pointer accent-[#001F3F]'}`} 
                                />
                              </td>
                              <td className="text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isAdmin ? true : perm.crear} 
                                  disabled={isAdmin}
                                  onChange={() => handleSwitchChange(sub.id, 'crear')} 
                                  className={`w-4 h-4 rounded ${isAdmin ? 'cursor-not-allowed opacity-60 accent-amber-500' : 'cursor-pointer accent-[#001F3F]'}`} 
                                />
                              </td>
                              <td className="text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isAdmin ? true : perm.editar} 
                                  disabled={isAdmin}
                                  onChange={() => handleSwitchChange(sub.id, 'editar')} 
                                  className={`w-4 h-4 rounded ${isAdmin ? 'cursor-not-allowed opacity-60 accent-amber-500' : 'cursor-pointer accent-[#001F3F]'}`} 
                                />
                              </td>
                              <td className="text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isAdmin ? true : perm.eliminar} 
                                  disabled={isAdmin}
                                  onChange={() => handleSwitchChange(sub.id, 'eliminar')} 
                                  className={`w-4 h-4 rounded ${isAdmin ? 'cursor-not-allowed opacity-60 accent-amber-500' : 'cursor-pointer accent-[#001F3F]'}`} 
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}