'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { 
  ShieldCheck, Save, Loader2, Plus,
  Gift, ChevronDown, FileText, Wrench, Search, Settings, 
  FileSpreadsheet as GasIcon
} from 'lucide-react';
import Swal from 'sweetalert2';

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
    label: 'Finanzas y Facturación',
    icon: FileText,
    submodulos: [
      { id: 'facturacion', label: 'Facturación - Evaluación y Reportes' },
      { id: 'cobranzas', label: 'Gestión de Cartera' }
    ]
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    submodulos: [
      { id: 'usuarios', label: 'Gestión Usuarios' },
      { id: 'permisos', label: 'Seguridad Corp.' }
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
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [rolNuevo, setRolNuevo] = useState<string | null>(null);
  const [nombreRolNuevo, setNombreRolNuevo] = useState('');
  const [puedeCrearRoles, setPuedeCrearRoles] = useState(false);
  const [puedeEditarRoles, setPuedeEditarRoles] = useState(false);
  const [matrizPermisos, setMatrizPermisos] = useState<PermisoMatriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<{ [key: string]: boolean }>({
    operaciones: true,
    incentivos: true,
    contabilidad_modulo: true,
    finanzas: true
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

  const cargarPermisosDelServidor = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/permisos');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar los permisos')
      }
      setMatrizPermisos(json.data || []);
      setRoles(json.roles || []);
      setPuedeCrearRoles(!!json.canCreateRoles);
      setPuedeEditarRoles(!!json.canEditRoles);
      setRolSeleccionado((current) => {
        if (current) return current;
        if (json.currentRole === 'ADMIN') {
          return json.roles?.find((role: string) => role === 'CONTABILIDAD') ||
            json.roles?.find((role: string) => role !== 'ADMIN') ||
            'ADMIN';
        }
        return json.currentRole || json.roles?.[0] || '';
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err instanceof Error ? err.message : 'No se pudieron cargar los permisos.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarPermisosDelServidor();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [cargarPermisosDelServidor]);

  const toggleSeccion = (id: string) => {
    setSeccionesAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const esModuloObligatorioPorRol = () => {
    return rolSeleccionado === 'ADMIN';
  };

  const buscarPermiso = (submoduloId: string) => {
    const permisoExistente = matrizPermisos.find(p => p.rol === rolSeleccionado && p.modulo === submoduloId);
    if (permisoExistente) return permisoExistente;

    return {
      rol: rolSeleccionado, 
      modulo: submoduloId, 
      ver: false,
      crear: false, 
      editar: false, 
      eliminar: false
    };
  };

  const handleSwitchChange = (submoduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    if (rolSeleccionado === 'ADMIN') return; // El administrador no se puede editar, goza de control total absoluto

    const registroActual = buscarPermiso(submoduloId);
    const nuevoValor = !registroActual[campo];
    
    const registroActualizado = { ...registroActual, [campo]: nuevoValor };
    
    // Si se apaga visualizar, se caen los privilegios de acción en cascada
    if (campo === 'ver' && !nuevoValor) {
      if (esModuloObligatorioPorRol()) return; // Evita apagar vistas obligatorias
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
            if (rolSeleccionado === 'ADMIN') {
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
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'No se pudo guardar la configuración.')
        }
        if (json.success) {
          setRolNuevo(null);
          await cargarPermisosDelServidor();
          Swal.fire({ 
            title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡SEGURIDAD ACTUALIZADA!</span>', 
            text: `Estructura de accesos guardada para el rol seleccionado.`, 
            icon: 'success', 
            confirmButtonColor: '#001F3F' 
          });
        }
      } catch (err) {
        Swal.fire('Error', err instanceof Error ? err.message : 'No se pudo guardar la configuración.', 'error');
      }
    });
  };

  const crearRolEnEditor = () => {
    const role = nombreRolNuevo.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (!/^[A-Z0-9_]{2,40}$/.test(role)) {
      Swal.fire('Nombre inválido', 'Usa de 2 a 40 letras, números, espacios o guiones.', 'warning');
      return;
    }
    if (role === 'ADMIN' || roles.includes(role) || rolNuevo === role) {
      Swal.fire('Rol existente', 'Ese nombre ya está registrado.', 'warning');
      return;
    }

    setRolNuevo(role);
    setRolSeleccionado(role);
    setMatrizPermisos((previous) => [
      ...previous,
      ...ESTRUCTURA_PERMISOS.flatMap((section) => section.submodulos.map((module) => ({
        rol: role,
        modulo: module.id,
        ver: false,
        crear: false,
        editar: false,
        eliminar: false
      })))
    ]);
    setNombreRolNuevo('');
  };

  const rolesVisibles = rolNuevo ? [...roles, rolNuevo] : roles;
  const puedeGuardarRolSeleccionado = rolSeleccionado === 'ADMIN'
    ? false
    : rolNuevo === rolSeleccionado
      ? puedeCrearRoles
      : puedeEditarRoles;

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Matriz de Privilegios
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión avanzada de accesos por módulos y submódulos</p>
          <p className="text-slate-500 text-[11px] mt-3 max-w-2xl">
            Los roles disponibles se obtienen de los usuarios existentes y de esta matriz. Selecciona un rol y abre
            <strong> Finanzas y Facturación </strong> para habilitar o retirar el acceso al módulo Facturación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto" ref={dropdownRef}>
          <div className="relative w-56">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] transition-all shadow-sm flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#FFB800]" />
                <span>{rolSeleccionado.replace(/_/g, ' ')}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {rolesVisibles.map((role) => {
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setRolSeleccionado(role);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left font-black text-xs transition-colors flex items-center gap-2 ${
                        rolSeleccionado === role
                          ? 'bg-[#001F3F] text-[#FFB800]' 
                          : 'text-[#001F3F] hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck size={13} className={rolSeleccionado === role ? 'text-[#FFB800]' : 'text-slate-400'} />
                      <span>{role.replace(/_/g, ' ')}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {puedeCrearRoles && (
            <div className="flex gap-2">
              <input
                value={nombreRolNuevo}
                onChange={(event) => setNombreRolNuevo(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    crearRolEnEditor();
                  }
                }}
                placeholder="NOMBRE DEL ROL"
                aria-label="Nombre del nuevo rol"
                className="w-44 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-[#001F3F]"
              />
              <button
                type="button"
                onClick={crearRolEnEditor}
                className="h-[48px] px-4 bg-white border border-slate-200 text-[#001F3F] rounded-xl hover:bg-slate-50 transition-all"
                aria-label="Agregar rol"
                title="Agregar rol"
              >
                <Plus size={16} />
              </button>
              <button 
                  onClick={guardarCambiosMatriz} 
                  disabled={isPending || loading || !puedeGuardarRolSeleccionado}
                  className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-6 py-4 rounded-2xl uppercase flex items-center gap-2 shadow-md hover:bg-black hover:text-[#FFB800] transition-all duration-300 h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? <Loader2 size={13} className="animate-spin" strokeWidth={2.5} /> : <Save size={13} />}
                  <span>Guardar Ajustes</span>
                </button>
            </div>
          )}
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
                          const esFijo = esModuloObligatorioPorRol();
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