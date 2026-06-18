'use client'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ShieldCheck, User as UserIcon, Briefcase, Users } from 'lucide-react'
import Swal from 'sweetalert2'

export default function ListaUsuarios({ usuarios }: { usuarios: any[] }) {
  const router = useRouter()

  const handleEliminar = async (id: number, nombre: string) => {
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
        const res = await fetch(`/api/admin/usuarios?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
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
            text: 'No se pudo eliminar el usuario seleccionado.',
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

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden text-[#001F3F]">
      <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-[#001F3F]">
        <h2 className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.25em]">Usuarios Registrados</h2>
        <span className="bg-white/10 text-[#FFB800] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          {usuarios.length} Totales
        </span>
      </div>

      {usuarios.length === 0 ? (
        <div className="p-20 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest italic bg-slate-50/50">
          No hay usuarios registrados en la base de datos de Ditcash.
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[#001F3F]">
              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-[0.25em]">Usuario / Personal</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em]">Identificación</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Rol Asignado</th>
              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-[#001F3F] transition-all text-[#001F3F]">
                      {user.role?.toUpperCase() === 'ADMIN' || user.rol?.toUpperCase() === 'ADMIN' ? (
                        <ShieldCheck size={16} strokeWidth={2.5} />
                      ) : user.role?.toUpperCase() === 'MARKETING' || user.rol?.toUpperCase() === 'MARKETING' ? (
                        <Users size={16} strokeWidth={2.5} />
                      ) : (
                        <Briefcase size={16} strokeWidth={2.5} />
                      )}
                    </div>
                    <p className="text-[13px] font-black uppercase tracking-tight text-[#001F3F]">
                      {user.nombre}
                    </p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[12px] font-bold text-slate-400 tracking-widest font-mono">
                    {user.username || user.cedula}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    user.rol?.toUpperCase() === 'ADMIN' 
                      ? 'bg-purple-50 text-purple-600 border-purple-100' 
                      : user.rol?.toUpperCase() === 'MARKETING'
                      ? 'bg-orange-50 text-orange-600 border-orange-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {(user.rol?.toUpperCase() === 'ADMIN') && <ShieldCheck size={11} strokeWidth={2.5} />}
                    {user.rol}
                  </span>
                </td>
                <td className="px-10 py-5 text-right">
                  <div className="flex justify-end items-center gap-6">
                    <button 
                      onClick={() => router.push(`/dashboard/admin/usuarios/editar/${user.id}`)}
                      className="text-[10px] font-black text-[#001F3F] uppercase hover:text-[#FFB800] transition-colors tracking-widest border-b-2 border-transparent hover:border-[#FFB800] pb-0.5"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleEliminar(user.id, user.nombre)}
                      className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors tracking-widest border-b-2 border-transparent hover:border-red-600 pb-0.5"
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
      )}
    </div>
  )
}