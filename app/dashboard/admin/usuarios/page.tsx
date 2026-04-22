'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUsuariosAction, eliminarUsuarioAction } from '@/app/actions/usuarios'
import CrearUsuario from '@/app/components/admin/CrearUsuario'
import Link from 'next/link'
import Swal from 'sweetalert2'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      {/* HEADER */}
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Control de Accesos</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Gestiona quién entra al sistema y sus permisos</p>
        </div>
      </header>

      {/* Formulario para crear (se mantiene tu componente) */}
      <div className="mb-12">
        <CrearUsuario onSuccess={cargarUsuarios} />
      </div>
      
      {/* TABLA MAESTRA */}
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
              {usuarios.map((u: any) => (
                <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg shadow-inner group-hover:bg-[#FFB800] group-hover:text-white transition-all">
                        {u.rol === 'ADMIN' ? '🛡️' : '👤'}
                      </div>
                      <p className="text-[13px] font-black uppercase tracking-tight text-[#001F3F]">
                        {u.vendedor?.nombre || u.nombre || 'Administrador Ditec'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-[12px] font-bold text-slate-400 tracking-widest">{u.cedula}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border ${
                      u.rol === 'ADMIN' 
                      ? 'bg-purple-50 text-purple-600 border-purple-100' 
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
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
                    <div className="flex justify-end items-center gap-6">
                      <Link href={`/dashboard/admin/usuarios/editar/${u.id}`}>
                        <button className="text-[10px] font-black text-[#001F3F] uppercase hover:text-[#FFB800] transition-colors tracking-widest border-b-2 border-transparent hover:border-[#FFB800] pb-1">
                          Editar
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleEliminar(u.id, u.vendedor?.nombre || u.nombre || 'Usuario')}
                        className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors tracking-widest border-b-2 border-transparent hover:border-red-600 pb-1"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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