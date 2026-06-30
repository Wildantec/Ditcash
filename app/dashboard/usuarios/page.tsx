'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUsuariosAction, eliminarUsuarioAction } from '@/app/actions/usuarios'
import CrearUsuario from '@/components/admin/CrearUsuario'
import EditarUsuarioForm from '@/components/admin/EditarUsuarioForm'
import Swal from 'sweetalert2'
import { ShieldCheck, Users, Briefcase, UserPlus, X, Eye, Pencil, Trash2, IdCard, ToggleLeft } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false)
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false)
  const [isModalVerOpen, setIsModalVerOpen] = useState(false)
  
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any | null>(null)

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getUsuariosAction()
      setUsuarios(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const abrirVerModal = (u: any) => {
    setUsuarioSeleccionado(u)
    setIsModalVerOpen(true)
  }

  const abrirEditarModal = (id: number) => {
    setUsuarioSeleccionado(id)
    setIsModalEditarOpen(true)
  }

  const handleEliminar = async (id: number, nombre: string) => {
    const { isConfirmed } = await Swal.fire({
      title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase;">¿Eliminar Usuario?</span>',
      text: `Se quitará el acceso a: ${nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonText: 'CANCELAR'
    })

    if (isConfirmed) {
      const res = await eliminarUsuarioAction(id)
      if (res.success) {
        Swal.fire('Eliminado', '', 'success')
        cargarUsuarios()
      } else {
        Swal.fire('Error', res.error || 'No se pudo eliminar', 'error')
      }
    }
  }

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Control de Accesos</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Gestiona quién entra al sistema y sus permisos</p>
        </div>
        <button 
          onClick={() => setIsModalCrearOpen(true)}
          className="bg-[#001F3F] text-[#FFB800] hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg"
        >
          <UserPlus size={14} strokeWidth={3} />
          <span>Crear Usuario</span>
        </button>
      </header>
      {isModalCrearOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[550px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalCrearOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"><X size={20} strokeWidth={2.5} /></button>
            <CrearUsuario onSuccess={() => { cargarUsuarios(); setIsModalCrearOpen(false) }} />
          </div>
        </div>
      )}
      {isModalEditarOpen && usuarioSeleccionado && typeof usuarioSeleccionado === 'number' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[650px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setIsModalEditarOpen(false); setUsuarioSeleccionado(null) }} 
              className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <EditarUsuarioForm 
              usuarioId={usuarioSeleccionado} 
              onFormSuccess={() => {
                cargarUsuarios()
                setIsModalEditarOpen(false)
                setUsuarioSeleccionado(null)
              }}
            />
          </div>
        </div>
      )}
      {isModalVerOpen && usuarioSeleccionado && typeof usuarioSeleccionado === 'object' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[480px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
            <button onClick={() => { setIsModalVerOpen(false); setUsuarioSeleccionado(null) }} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"><X size={20} strokeWidth={2.5} /></button>
            
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
              <h2 className="text-[#001F3F] font-black text-lg uppercase italic tracking-tighter">Vista de Credencial</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner flex items-center gap-3">
                <Briefcase size={16} className="text-slate-400" />
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</p>
                  <p className="text-sm font-black text-[#001F3F] uppercase">{usuarioSeleccionado.vendedor?.nombre || usuarioSeleccionado.nombre}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner flex items-center gap-3">
                <IdCard size={16} className="text-slate-400" />
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cédula de Identidad</p>
                  <p className="text-sm font-bold tracking-widest font-mono text-[#001F3F]">{usuarioSeleccionado.cedula}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Rol Asignado</p>
                  <span className="text-[9px] font-black px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg uppercase tracking-wider block text-center">
                    {usuarioSeleccionado.rol}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Estado Acceso</p>
                  <div className="flex items-center gap-2 justify-center py-0.5">
                    <div className={`w-2 h-2 rounded-full ${usuarioSeleccionado.activo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`font-black text-[10px] uppercase tracking-widest ${usuarioSeleccionado.activo ? 'text-green-600' : 'text-red-500'}`}>
                      {usuarioSeleccionado.activo ? 'Activo' : 'Bloqueado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Usuario / Personal</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Cédula</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Rol</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Estado</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                    Cargando ecosistema operativo...
                  </td>
                </tr>
              ) : (
                usuarios.map((u: any) => (
                  <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-[#001F3F] transition-all text-[#001F3F]">
                          {u.rol === 'ADMIN' ? (
                            <ShieldCheck size={16} strokeWidth={2.5} />
                          ) : u.rol === 'MARKETING' ? (
                            <Users size={16} strokeWidth={2.5} />
                          ) : (
                            <Briefcase size={16} strokeWidth={2.5} />
                          )}
                        </div>
                        <p className="text-[13px] font-black uppercase tracking-tight text-[#001F3F]">
                          {u.vendedor?.nombre || u.nombre || 'Administrador Ditec'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <p className="text-[12px] font-bold text-slate-400 tracking-widest font-mono">{u.cedula}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.activo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`font-black text-[10px] uppercase tracking-widest ${u.activo ? 'text-green-600' : 'text-red-500'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end items-center gap-5">
                        <button 
                          onClick={() => abrirVerModal(u)}
                          className="text-[#001F3F] hover:text-[#FFB800] transition-colors p-1 focus:outline-none"
                          title="Ver Detalle"
                        >
                          <Eye size={18} strokeWidth={2.2} />
                        </button>
                        
                        <button 
                          onClick={() => abrirEditarModal(u.id)}
                          className="text-slate-400 hover:text-[#001F3F] transition-colors p-1 focus:outline-none"
                          title="Editar Perfil"
                        >
                          <Pencil size={17} strokeWidth={2.2} />
                        </button>
                        
                        <button 
                          onClick={() => handleEliminar(u.id, u.vendedor?.nombre || u.nombre || 'Usuario')}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 focus:outline-none"
                          title="Borrar Acceso"
                        >
                          <Trash2 size={17} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && usuarios.length === 0 && (
          <div className="p-20 text-center bg-slate-50">
            <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">No existen accesos configurados.</p>
          </div>
        )}
      </div>
    </div>
  )
}