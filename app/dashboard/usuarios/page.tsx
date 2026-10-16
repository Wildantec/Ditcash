'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUsuariosAction } from '@/app/actions/usuarios'
import CrearUsuario from '@/components/admin/CrearUsuario'
import ListaUsuarios from '@/components/admin/ListaUsuarios'
import { UserPlus, X } from 'lucide-react'
import { tienePermiso } from '@/lib/permisos'

export default function UsuariosPage({ usuarioSesion }: { usuarioSesion?: any }) {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false)

  // Rol predeterminado ADMIN si no recibe parámetro
  const permisosSesion = usuarioSesion?.role?.permisos || usuarioSesion?.permisos || []
  const rolNombreSesion = usuarioSesion?.role?.nombre || usuarioSesion?.rol || 'ADMIN'

  const puedeCrear = tienePermiso(permisosSesion, rolNombreSesion, 'usuarios', 'crear')

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

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Control de Usuarios</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Gestiona quién entra al sistema y sus permisos</p>
        </div>

        {puedeCrear && (
          <button 
            onClick={() => setIsModalCrearOpen(true)}
            className="bg-[#001F3F] text-[#FFB800] hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg"
          >
            <UserPlus size={14} strokeWidth={3} />
            <span>Crear Usuario</span>
          </button>
        )}
      </header>

      {/* Modal Crear Usuario */}
      {isModalCrearOpen && puedeCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
            <button 
              onClick={() => setIsModalCrearOpen(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <CrearUsuario onSuccess={() => { cargarUsuarios(); setIsModalCrearOpen(false) }} />
          </div>
        </div>
      )}

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
          Cargando usuarios...
        </div>
      ) : (
        <ListaUsuarios 
          usuarios={usuarios} 
          usuarioSesion={usuarioSesion} 
        />
      )}
    </div>
  )
}