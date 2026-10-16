'use client'

import { useRouter } from 'next/navigation'
import { ShieldCheck, User as UserIcon, Briefcase, Users, Eye, Pencil, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { eliminarUsuarioAction } from '@/app/actions/usuarios'
import { tienePermiso } from '@/lib/permisos'

interface ListaUsuariosProps {
  usuarios: any[]
  usuarioSesion?: any
  onVerDetalle?: (user: any) => void
}

export default function ListaUsuarios({ usuarios, usuarioSesion, onVerDetalle }: ListaUsuariosProps) {
  const router = useRouter()

  const permisosSesion = usuarioSesion?.role?.permisos || usuarioSesion?.permisos || []
  const rolNombreSesion = usuarioSesion?.role?.nombre || usuarioSesion?.rol || 'ADMIN'

  const puedeVer = tienePermiso(permisosSesion, rolNombreSesion, 'usuarios', 'ver')
  const puedeEditar = tienePermiso(permisosSesion, rolNombreSesion, 'usuarios', 'editar')
  const puedeEliminar = tienePermiso(permisosSesion, rolNombreSesion, 'usuarios', 'eliminar')

  const handleEliminar = async (id: number, nombre: string) => {
    if (!puedeEliminar) {
      Swal.fire('Acceso Denegado', 'Tu rol no tiene permisos para eliminar usuarios.', 'warning')
      return
    }

    const { isConfirmed } = await Swal.fire({
      title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¿Eliminar Usuario?</span>',
      text: `Se quitará el acceso definitivo a: ${nombre.toUpperCase()}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonText: 'CANCELAR'
    })

    if (isConfirmed) {
      try {
        const res = await eliminarUsuarioAction(id, usuarioSesion?.id)
        if (res.success) {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ELIMINADO</span>',
            text: 'El usuario fue removido correctamente del sistema.',
            icon: 'success',
            confirmButtonColor: '#001F3F'
          })
          router.refresh()
        } else {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR</span>',
            text: res.error || 'No se pudo eliminar el usuario seleccionado.',
            icon: 'error',
            confirmButtonColor: '#001F3F'
          })
        }
      } catch (error) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">FALLO CRÍTICO</span>',
          text: 'Inconveniente de comunicación con el servidor local.',
          icon: 'error',
          confirmButtonColor: '#001F3F'
        })
      }
    }
  }

  const obtenerNombreRol = (u: any) => {
    return u.role?.nombre || u.rol || 'VENDEDOR'
  }

  const renderIconoRol = (u: any) => {
    const nombreRolUpper = obtenerNombreRol(u).toUpperCase()
    if (nombreRolUpper.includes('ADMIN')) {
      return <ShieldCheck size={16} strokeWidth={2.5} />
    }
    if (nombreRolUpper.includes('MARKETING') || nombreRolUpper.includes('ASESOR')) {
      return <Users size={16} strokeWidth={2.5} />
    }
    return <Briefcase size={16} strokeWidth={2.5} />
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden text-[#001F3F]">
      {usuarios.length === 0 ? (
        <div className="p-20 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest italic bg-slate-50/50">
          No hay usuarios registrados en la base de datos de Ditcash.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">USUARIO / PERSONAL</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">CÉDULA</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">ROL</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">ESTADO</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">GESTIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {usuarios.map((user) => {
                const nombreRol = obtenerNombreRol(user)
                const estaActivo = user.activo ?? true

                return (
                  <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                    {/* Usuario / Personal */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-[#001F3F] transition-all text-[#001F3F]">
                          {renderIconoRol(user)}
                        </div>
                        <p className="text-xs font-black uppercase tracking-tight text-[#001F3F]">
                          {user.vendedor?.nombre || user.nombre || 'SIN NOMBRE'}
                        </p>
                      </div>
                    </td>

                    {/* Cédula */}
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-bold text-slate-400 font-mono tracking-widest">
                        {user.cedula || user.username}
                      </span>
                    </td>

                    {/* Rol */}
                    <td className="px-6 py-5 text-center">
                      <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50/80 text-blue-600 border border-blue-100">
                        {nombreRol}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${estaActivo ? 'text-emerald-500' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${estaActivo ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {estaActivo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>

                    {/* Gestión (Iconos de Acción) */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Icono Ver */}
                        {puedeVer && (
                          <button
                            onClick={() => onVerDetalle && onVerDetalle(user)}
                            className="p-2 text-[#001F3F] hover:text-[#FFB800] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye size={17} strokeWidth={2.2} />
                          </button>
                        )}

                        {/* Icono Editar */}
                        {puedeEditar && (
                          <button
                            onClick={() => router.push(`/dashboard/admin/usuarios/editar/${user.id}`)}
                            className="p-2 text-slate-400 hover:text-[#001F3F] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Usuario"
                          >
                            <Pencil size={17} strokeWidth={2.2} />
                          </button>
                        )}

                        {/* Icono Eliminar */}
                        {puedeEliminar && (
                          <button
                            onClick={() => handleEliminar(user.id, user.vendedor?.nombre || user.nombre || 'Usuario')}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Usuario"
                          >
                            <Trash2 size={17} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}