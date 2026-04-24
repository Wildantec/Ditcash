'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getActiveCampanaId } from '../actions/campanas'

export default function SidebarDitcash({ role }: { role: 'admin' | 'vendedor' }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeCampanaId, setActiveCampanaId] = useState<number | null>(null)
  
  // ESTADO PARA EL MENÚ MÓVIL
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/')
  }

  useEffect(() => {
    if (role === 'vendedor') {
      async function fetchActiveCampana() {
        const id = await getActiveCampanaId()
        if (id) setActiveCampanaId(id)
      }
      fetchActiveCampana()
    }
  }, [role])

  // Función para cerrar el sidebar al hacer clic en un link (solo en móvil)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* 1. BOTÓN HAMBURGUESA (Solo visible en móviles) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-[#001F3F] text-[#FFB800] p-3 rounded-xl shadow-2xl border border-white/10 active:scale-95 transition-all"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span> // Icono cerrar
        ) : (
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-[#FFB800]"></div>
            <div className="w-6 h-0.5 bg-[#FFB800]"></div>
            <div className="w-6 h-0.5 bg-[#FFB800]"></div>
          </div>
        )}
      </button>

      {/* 2. OVERLAY (Capa oscura al abrir menú en móvil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* 3. ASIDE (SIDEBAR) */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-[#001F3F] text-white flex flex-col z-[50]
        transition-transform duration-300 ease-in-out w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:sticky lg:w-64
      `}>
        <div className="p-8 mt-10 lg:mt-0">
          <h2 className="text-[#FFB800] text-3xl font-black italic tracking-tighter">DITCASH</h2>
          <p className="text-[10px] text-slate-400 tracking-[3px] uppercase font-bold mt-1">
            {role === 'admin' ? 'Panel Admin' : 'Panel Vendedor'}
          </p>
        </div>

        <nav className="flex-grow flex flex-col mt-4 overflow-y-auto">
          {role === 'admin' ? (
            <>
              <NavLink href="/dashboard/admin" label="Resumen Global" icon="📊" onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/usuarios" label="Usuarios" icon="👥" onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/vendedores" label="Vendedores" icon="💼" onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/campanas" label="Campañas" icon="🚀" onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/premios" label="Premios" icon="🎁" onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/canjes" label="Canjes" icon="🔔" onClick={closeSidebar} />
            </>
          ) : (
            <>
              <NavLink href="/dashboard/vendedor" label="Mis Puntos" icon="💰" onClick={closeSidebar} />
              <NavLink href="/dashboard/vendedor/campanas/historial" label="Mis Campañas" icon="📂" onClick={closeSidebar} />
              <NavLink href="/dashboard/vendedor/premios" label="Premios" icon="🎁" onClick={closeSidebar} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 rounded-2xl transition-all w-full"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}

function NavLink({ href, icon, label, onClick }: any) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-8 py-4 transition-all
        ${isActive 
          ? 'bg-[#FFB800] text-[#001F3F] font-black' 
          : 'text-slate-400 hover:bg-[#002d5c] hover:text-white font-medium'}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </Link>
  )
}