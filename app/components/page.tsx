'use client'
import CrearUsuario from '@/app/components/admin/CrearUsuario'

export default function UsuariosPage() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#001F3F]">Gestión de Usuarios</h1>
        <p className="text-slate-500 font-medium italic">Administra los accesos y roles del sistema</p>
      </div>
      <CrearUsuario />
    </div>
  )
}