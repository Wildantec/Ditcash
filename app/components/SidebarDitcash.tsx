'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getActiveCampanaId } from '../actions/campanas'

export default function SidebarDitcash({ role }: { role: 'admin' | 'vendedor' }) {
  const router = useRouter()
  const [activeCampanaId, setActiveCampanaId] = useState<number | null>(null)

  const handleLogout = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/')
  }

  useEffect(() => {
    if (role === 'vendedor') {
      async function fetchActiveCampana() {
        const id = await getActiveCampanaId()
        if (id) {
          setActiveCampanaId(id)
        }
      }
      fetchActiveCampana()
    }
  }, [role])

  return (
    <aside className="w-64 bg-[#001F3F] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-[#D4AF37] text-2xl font-bold">DITCASH</h2>
        <p className="text-[10px] text-slate-400 tracking-[3px] uppercase">
          {role === 'admin' ? 'Panel Admin' : 'Panel Vendedor'}
        </p>
      </div>

      <nav className="flex-grow flex flex-col mt-4">
        {role === 'admin' ? (
          <>
            <NavLink href="/dashboard/admin" label="Resumen Global" />
            <NavLink href="/dashboard/admin/usuarios" label="Usuarios" />
            <NavLink href="/dashboard/admin/vendedores" label="Vendedores" />
            <NavLink href="/dashboard/admin/campanas" label="Campañas" />
            <NavLink href="/dashboard/admin/premios" label="Premios" />
            <NavLink href="/dashboard/admin/reportes" label="Reportes" />
          </>
        ) : (
          <>
            <NavLink href="/dashboard/vendedor"label="Mis Puntos" />
            
            {/* Si hay una campaña activa, mostramos acceso directo */}
            {/*activeCampanaId && (
              <NavLink 
                href={`/dashboard/vendedor/campanas/${activeCampanaId}`} 
                label="Campaña Actual" 
              />
            )*/}

            {/* Acceso fijo al historial que pediste */}
            <NavLink 
              href="/dashboard/vendedor/campanas/historial"  
              label="Mis Campañas" 
            />
            <NavLink 
              href="/dashboard/vendedor/premios"  
              label="Premios" 
            />
          </>
        )}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-400 font-bold hover:text-red-300 transition w-full"
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({ href, icon, label }: any) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-6 py-4 text-slate-400 hover:bg-[#002d5c] hover:text-white transition-all"
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  )
}