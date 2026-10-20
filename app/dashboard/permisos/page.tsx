'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  ShieldCheck, Save, Loader2, Plus, Settings, Pencil, Trash2, X, ChevronDown, 
  Search, Gift, Wrench, FileSpreadsheet as GasIcon, FileText, Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import { obtenerRolesAction, guardarRolAction, eliminarRolAction, PermisoModulo } from '@/app/actions/roles';
import CrearRolForm from '@/components/admin/CrearRolForm';

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
      { id: 'facturacion', label: 'Facturación Comercial' },
      { id: 'cobranzas', label: 'Gestión de Cartera' }
    ]
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    submodulos: [
      { id: 'usuarios', label: 'Gestión Usuarios' },
      { id: 'roles', label: 'Gestión de Roles y Permisos' }
    ]
  }
];

export default function ModuloPermisosAdmin() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modales
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [isModalPermisosOpen, setIsModalPermisosOpen] = useState(false);
  const [isModalEditarNombreOpen, setIsModalEditarNombreOpen] = useState(false);
  
  // Estado para rol a editar
  const [rolEditar, setRolEditar] = useState<any | null>(null);
  const [nombreEditar, setNombreEditar] = useState('');
  const [descEditar, setDescEditar] = useState('');

  const [matrizPermisos, setMatrizPermisos] = useState<PermisoModulo[]>([]);
  
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);

  async function cargarRoles() {
    try {
      setLoading(true);
      const res = await obtenerRolesAction();
      if (res.success && res.roles) {
        setRoles(res.roles);
      }
    } catch (err) {
      console.error('Error cargando roles desde la BD:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarRoles();
  }, []);

  const abrirModalPermisos = (rol: any) => {
    setRolEditar(rol);
    const permisosExistentes = (rol.permisos as PermisoModulo[]) || [];
    setMatrizPermisos(permisosExistentes);
    setSeccionAbierta(null);
    setIsModalPermisosOpen(true);
  };

  const abrirModalEditarDatos = (rol: any) => {
    setRolEditar(rol);
    setNombreEditar(rol.nombre);
    setDescEditar(rol.descripcion || '');
    setIsModalEditarNombreOpen(true);
  };

  // Alterna módulos cerrando automáticamente los demás
  const toggleSeccionExclusiva = (id: string) => {
    setSeccionAbierta(prev => (prev === id ? null : id));
  };

  const buscarPermiso = (submoduloId: string): PermisoModulo => {
    const permisoExistente = matrizPermisos.find(p => p.modulo === submoduloId);
    if (permisoExistente) return permisoExistente;

    const isAdmin = rolEditar?.nombre === 'ADMIN';
    return {
      modulo: submoduloId,
      ver: isAdmin,
      crear: isAdmin,
      editar: isAdmin,
      eliminar: isAdmin
    };
  };

  const handleSwitchChange = (submoduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    if (rolEditar?.nombre === 'ADMIN') return;

    const registroActual = buscarPermiso(submoduloId);
    const nuevoValor = !registroActual[campo];
    const registroActualizado = { ...registroActual, [campo]: nuevoValor };

    if (campo === 'ver' && !nuevoValor) {
      registroActualizado.crear = false;
      registroActualizado.editar = false;
      registroActualizado.eliminar = false;
    }

    if ((campo === 'crear' || campo === 'editar' || campo === 'eliminar') && nuevoValor) {
      registroActualizado.ver = true;
    }

    setMatrizPermisos(prev => {
      const filtrados = prev.filter(p => p.modulo !== submoduloId);
      return [...filtrados, registroActualizado];
    });
  };

  const guardarMatrizModal = () => {
    if (!rolEditar) return;

    startTransition(async () => {
      try {
        const payloadPermisos: PermisoModulo[] = [];
        for (const seccion of ESTRUCTURA_PERMISOS) {
          for (const sub of seccion.submodulos) {
            payloadPermisos.push(buscarPermiso(sub.id));
          }
        }

        const res = await guardarRolAction({
          id: rolEditar.id,
          nombre: rolEditar.nombre,
          descripcion: rolEditar.descripcion,
          permisos: payloadPermisos
        });

        if (res.success) {
          await cargarRoles();
          setIsModalPermisosOpen(false);
          setRolEditar(null);
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡PERMISOS ACTUALIZADOS!</span>',
            text: `Se guardaron los accesos para el rol ${rolEditar.nombre}.`,
            icon: 'success',
            confirmButtonColor: '#001F3F'
          });
        } else {
          Swal.fire('Error', res.error || 'No se pudieron guardar los permisos', 'error');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Error en el servidor', 'error');
      }
    });
  };

  const guardarEdicionNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolEditar) return;

    const res = await guardarRolAction({
      id: rolEditar.id,
      nombre: nombreEditar,
      descripcion: descEditar,
      permisos: rolEditar.permisos || []
    });

    if (res.success) {
      await cargarRoles();
      setIsModalEditarNombreOpen(false);
      setRolEditar(null);
      Swal.fire('¡Actualizado!', 'El rol ha sido modificado correctamente.', 'success');
    } else {
      Swal.fire('Error', res.error || 'No se pudo actualizar el rol.', 'error');
    }
  };

  const handleEliminarRol = async (id: number, nombre: string) => {
    const { isConfirmed } = await Swal.fire({
      title: `<span style="font-size:18px; font-weight:bold;">¿ELIMINAR ROL "${nombre}"?</span>`,
      text: 'No podrás deshacer esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonText: 'CANCELAR'
    });

    if (isConfirmed) {
      const res = await eliminarRolAction(id);
      if (res.success) {
        Swal.fire('Rol Eliminado', '', 'success');
        cargarRoles();
      } else {
        Swal.fire('Atención', res.error || 'No se pudo eliminar el rol', 'warning');
      }
    }
  };

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Control de Roles y Permisos
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            Lista de roles dinámicos gestionados en Base de Datos
          </p>
        </div>

        <button
          onClick={() => setIsModalCrearOpen(true)}
          className="bg-[#001F3F] text-[#FFB800] hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Crear Nuevo Rol</span>
        </button>
      </header>

      {/* Tabla de Roles Dinámicos */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Rol</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Descripción</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Usuarios</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                    Cargando roles desde la BD...
                  </td>
                </tr>
              ) : (
                roles.map((rol: any) => (
                  <tr key={rol.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#001F3F] group-hover:bg-[#FFB800] transition-colors">
                          <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight text-[#001F3F]">
                          {rol.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium">
                        {rol.descripcion || 'Sin descripción asignada.'}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-[#001F3F] rounded-full text-xs font-black">
                        <Users size={12} />
                        {rol._count?.usuarios || 0}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => abrirModalEditarDatos(rol)}
                          className="p-2.5 text-slate-400 hover:text-[#001F3F] hover:bg-slate-100 rounded-xl transition-all"
                          title="Editar Datos del Rol"
                        >
                          <Pencil size={17} strokeWidth={2.2} />
                        </button>

                        <button
                          onClick={() => abrirModalPermisos(rol)}
                          className="p-2.5 text-[#001F3F] hover:text-[#FFB800] hover:bg-slate-100 rounded-xl transition-all"
                          title="Configurar Permisos del Rol"
                        >
                          <Settings size={18} strokeWidth={2.2} />
                        </button>

                        {rol.nombre !== 'ADMIN' && (
                          <button
                            onClick={() => handleEliminarRol(rol.id, rol.nombre)}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar Rol"
                          >
                            <Trash2 size={18} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && roles.length === 0 && (
          <div className="p-16 text-center bg-slate-50">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
              No existen roles registrados en la base de datos.
            </p>
          </div>
        )}
      </div>

      {/* Modal 1: Crear Nuevo Rol */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[550px] rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalCrearOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <CrearRolForm
              onSuccess={() => {
                cargarRoles();
                setIsModalCrearOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal 2: Editar Datos del Rol */}
      {isModalEditarNombreOpen && rolEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[480px] rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => {
                setIsModalEditarNombreOpen(false);
                setRolEditar(null);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <form onSubmit={guardarEdicionNombre} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Pencil className="text-[#FFB800]" size={20} />
                <h2 className="text-base font-black uppercase text-[#001F3F]">Editar Rol</h2>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nombre del Rol</label>
                <input
                  type="text"
                  value={nombreEditar}
                  onChange={e => setNombreEditar(e.target.value)}
                  disabled={rolEditar.nombre === 'ADMIN'}
                  className="w-full border border-slate-200 p-3 rounded-xl font-black uppercase text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] bg-slate-50/50 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Descripción</label>
                <input
                  type="text"
                  value={descEditar}
                  onChange={e => setDescEditar(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl font-medium text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#001F3F] text-[#FFB800] p-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md"
              >
                Actualizar Datos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Configuración de Permisos (Engranaje) - NO abarca todo el alto y Módulos Cerrados Inicialmente */}
      {isModalPermisosOpen && rolEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F8FAFC] w-full max-w-[850px] rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-100 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalPermisosOpen(false);
                setRolEditar(null);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-slate-200 gap-3">
              <div>
                <span className="text-[9px] font-black uppercase text-[#FFB800] tracking-widest bg-[#001F3F] px-2.5 py-0.5 rounded-full">
                  Configuración de Accesos
                </span>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#001F3F] mt-1.5">
                  Matriz para Rol: {rolEditar.nombre}
                </h2>
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mt-0.5">
                  Haz clic en un módulo para desplegar sus submódulos y definir permisos.
                </p>
              </div>

              <button
                onClick={guardarMatrizModal}
                disabled={isPending || rolEditar.nombre === 'ADMIN'}
                className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-5 py-3 rounded-xl uppercase flex items-center gap-2 shadow-md hover:bg-black transition-all disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Guardar Cambios</span>
              </button>
            </div>

            {/* Lista de Módulos (Todos colapsados por defecto) */}
            <div className="space-y-2.5">
              {ESTRUCTURA_PERMISOS.map(seccion => {
                const isAbierto = seccionAbierta === seccion.id;

                return (
                  <div key={seccion.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSeccionExclusiva(seccion.id)}
                      className="w-full bg-slate-50/50 px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white shadow-sm rounded-lg border border-slate-100 text-[#001F3F]">
                          <seccion.icon size={15} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest text-[#001F3F]">{seccion.label}</span>
                      </div>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform duration-300 ${isAbierto ? 'rotate-180 text-[#FFB800]' : ''}`} />
                    </button>

                    {isAbierto && (
                      <div className="border-t border-slate-100">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                              <th className="px-8 py-2.5 text-[9px] font-black uppercase tracking-widest w-1/2">Submódulo</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Visualizar</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Crear</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Editar</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Eliminar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {seccion.submodulos.map(sub => {
                              const perm = buscarPermiso(sub.id);
                              const isAdmin = rolEditar.nombre === 'ADMIN';

                              return (
                                <tr key={sub.id} className="hover:bg-blue-50/10 transition-colors">
                                  <td className="px-8 py-2.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                                    <span className="font-bold text-xs text-slate-700 uppercase">{sub.label}</span>
                                  </td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={isAdmin ? true : perm.ver}
                                      disabled={isAdmin}
                                      onChange={() => handleSwitchChange(sub.id, 'ver')}
                                      className="w-4 h-4 accent-[#001F3F] cursor-pointer"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={isAdmin ? true : perm.crear}
                                      disabled={isAdmin}
                                      onChange={() => handleSwitchChange(sub.id, 'crear')}
                                      className="w-4 h-4 accent-[#001F3F] cursor-pointer"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={isAdmin ? true : perm.editar}
                                      disabled={isAdmin}
                                      onChange={() => handleSwitchChange(sub.id, 'editar')}
                                      className="w-4 h-4 accent-[#001F3F] cursor-pointer"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={isAdmin ? true : perm.eliminar}
                                      disabled={isAdmin}
                                      onChange={() => handleSwitchChange(sub.id, 'eliminar')}
                                      className="w-4 h-4 accent-[#001F3F] cursor-pointer"
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
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}