'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getActiveCampanaId } from '../actions/campanas'
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Package, 
  Rocket, 
  Gift, 
  Bell, 
  Coins, 
  FolderOpen, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'MARKETING' | 'VENDEDOR'
}

export default function SidebarDitcash({ role }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname() // 🎯 Detecta la URL real en el navegador del cliente
  const [activeCampanaId, setActiveCampanaId] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  //  CONTROL TOTAL: Si el usuario está en la página principal (/), el Sidebar se destruye por completo
  if (pathname === '/') {
    return null
  }

  const handleLogout = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Forzamos la salida limpia a la raíz
    window.location.href = '/'
  }

  useEffect(() => {
    if (role === 'VENDEDOR') {
      async function fetchActiveCampana() {
        const id = await getActiveCampanaId()
        if (id) setActiveCampanaId(id)
      }
      fetchActiveCampana()
    }
  }, [role])

  const closeSidebar = () => setIsOpen(false)

  const obtenerEtiquetaPanel = () => {
    if (role === 'ADMIN') return 'Panel Admin Global'
    if (role === 'MARKETING') return 'Panel Marketing'
    return 'Panel Vendedor'
  }

  return (
    <>
      {/* 1. BOTÓN HAMBURGUESA (Móviles) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-[#001F3F] text-[#FFB800] p-3 rounded-xl shadow-2xl border border-white/10 active:scale-95 transition-all flex items-center justify-center"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 2. OVERLAY */}
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
          <p className="text-[10px] text-slate-400 tracking-[1px] uppercase font-bold mt-1">
            {obtenerEtiquetaPanel()}
          </p>
        </div>

        <nav className="flex-grow flex flex-col mt-4 overflow-y-auto">
          {/* MENÚ 1: ADMIN GLOBAL */}
          {role === 'ADMIN' && (
            <>
              <NavLink href="/dashboard/admin" label="Resumen Global" icon={BarChart3} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/usuarios" label="Usuarios" icon={Users} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/vendedores" label="Vendedores" icon={Briefcase} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/campanas" label="Campañas" icon={Rocket} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/premios" label="Premios" icon={Gift} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/canjes" label="Canjes" icon={Bell} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/bodegas" label="Bodegas" icon={Gift} onClick={closeSidebar} />
              <NavLink href="/dashboard/inventario" label="Inventario Global" icon={Package} onClick={closeSidebar} />
            </>
          )}

          {/* MENÚ 2: ADMIN DE MARKETING */}
          {role === 'MARKETING' && (
            <>
              <NavLink href="/dashboard/admin" label="Resumen Marketing" icon={BarChart3} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/campanas" label="Campañas" icon={Rocket} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/premios" label="Premios" icon={Gift} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/vendedores" label="Vendedores" icon={Briefcase} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/canjes" label="Canjes" icon={Bell} onClick={closeSidebar} />
              <NavLink href="/dashboard/inventario" label="Inventario & Publicidad" icon={Package} onClick={closeSidebar} />
            </>
          )}

          {/* MENÚ 3: VENDEDOR */}
          {role === 'VENDEDOR' && (
            <>
              <NavLink href="/dashboard/vendedor" label="Mis Puntos" icon={Coins} onClick={closeSidebar} />
              <NavLink href="/dashboard/vendedor/campanas/historial" label="Mis Campañas" icon={FolderOpen} onClick={closeSidebar} />
              <NavLink href="/dashboard/vendedor/premios" label="Premios" icon={Gift} onClick={closeSidebar} />
              <NavLink href="/dashboard/inventario" label="Inventario" icon={Package} onClick={closeSidebar} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-8 py-4 text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 rounded-2xl transition-all w-full text-left"
          >
            <LogOut size={16} className="text-red-400" /> 
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function NavLink({ href, icon: IconComponent, label, onClick }: any) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-8 py-4 transition-all border-l-4
        ${isActive 
          ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800] font-black' 
          : 'text-slate-400 border-transparent hover:bg-[#002d5c] hover:text-white font-medium'}
      `}
    >
      <IconComponent size={16} strokeWidth={2.5} />
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </Link>
  )
}