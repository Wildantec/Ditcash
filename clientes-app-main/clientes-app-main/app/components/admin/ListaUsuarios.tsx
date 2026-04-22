'use client'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react'

export default function ListaUsuarios({ usuarios }: { usuarios: any[] }) {
  const router = useRouter()

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const res = await fetch(`/api/admin/usuarios?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh() // Esto actualiza la lista al instante
      } else {
        alert("Error al eliminar el usuario")
      }
    }
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
        <h2 className="text-2xl font-bold text-[#001F3F]">Usuarios Registrados</h2>
        <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold">
          {usuarios.length} Total
        </span>
      </div>

      {usuarios.length === 0 ? (
        <div className="p-20 text-center text-slate-400 font-medium italic">
          No hay usuarios registrados en la base de datos.
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuario</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#001F3F]">
                      <UserIcon size={18} />
                    </div>
                    <span className="font-bold text-slate-700">{user.nombre}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-sm font-medium text-slate-500">{user.username || user.cedula}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    user.rol?.toLowerCase() === 'admin' 
                    ? 'bg-amber-50 text-[#D4AF37] border border-amber-100' 
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {user.rol?.toLowerCase() === 'admin' && <ShieldCheck size={12} />}
                    {user.rol}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-2">
                    <button 
                      className="p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-amber-50 rounded-xl transition-all"
                      title="Editar Usuario"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleEliminar(user.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar Usuario"
                    >
                      <Trash2 size={18} />
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