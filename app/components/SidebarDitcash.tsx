'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getActiveCampanaId } from '../actions/campanas'
import { 
  BarChart3, Users, Briefcase, Package, Rocket, Gift, Bell, 
  Coins, FolderOpen, LogOut, Menu, X, Warehouse, ShieldCheck, 
  Fuel, ChevronDown, ChevronUp, Receipt, Settings
} from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'MARKETING' | 'VENDEDOR' | 'CONTABILIDAD' | 'COBRANZAS' | 'FACTURACION'
}

export default function SidebarDitcash({ role }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [activeCampanaId, setActiveCampanaId] = useState<number | null>(null)
  const [openContabilidad, setOpenContabilidad] = useState(false)

  if (pathname === '/') return null

  const handleLogout = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/'
  }

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-4 left-4 z-[60] bg-[#001F3F] text-[#FFB800] p-3 rounded-xl shadow-2xl">
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden" onClick={closeSidebar} />}

      <aside className={`fixed top-0 left-0 h-screen bg-[#001F3F] text-white flex flex-col z-[50] transition-transform duration-300 w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:w-64`}>
        <div className="p-8">
          <h2 className="text-[#FFB800] text-3xl font-black italic tracking-tighter">DITCASH</h2>
          <p className="text-[10px] text-slate-400 tracking-[1px] uppercase font-bold mt-1">Panel Control</p>
        </div>

        <nav className="flex-grow flex flex-col mt-4 overflow-y-auto select-none">
          <NavLink href="/dashboard/admin" label="Resumen Global" icon={BarChart3} onClick={closeSidebar} />
          {(role === 'ADMIN' || role === 'CONTABILIDAD') && (
            <div>
              <button 
                onClick={() => setOpenContabilidad(!openContabilidad)}
                className={`w-full flex items-center justify-between px-8 py-4 text-slate-400 hover:bg-[#002d5c] hover:text-white transition-all border-l-4 border-transparent`}
              >
                <div className="flex items-center gap-4">
                  <Fuel size={16} strokeWidth={2.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Contabilidad</span>
                </div>
                {openContabilidad ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {openContabilidad && (
                <div className="bg-[#001833]/50 border-y border-white/5">
                  <SubNavLink href="/dashboard/admin/combustible/vehiculos" label="Vehículos" onClick={closeSidebar} />
                  <SubNavLink href="/dashboard/admin/combustible/estaciones" label="Estaciones" onClick={closeSidebar} />
                  <SubNavLink href="/dashboard/admin/combustible/facturas" label="Ingresar Factura" onClick={closeSidebar} />
                </div>
              )}
            </div>
          )}
          {role === 'ADMIN' && (
            <>
              <NavLink href="/dashboard/admin/usuarios" label="Usuarios" icon={Users} onClick={closeSidebar} />
              <NavLink href="/dashboard/admin/campanas" label="Campañas" icon={Rocket} onClick={closeSidebar} />
              <NavLink href="/dashboard/inventario" label="Inventario Global" icon={Package} onClick={closeSidebar} />
              <NavLink href="/dashboard/permisos" label="Configuración" icon={Settings} onClick={closeSidebar} />
            </>
          )}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-4 px-8 py-4 text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 rounded-2xl w-full text-left">
            <LogOut size={16} /> <span>Cerrar Sesión</span>
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
    <Link href={href} onClick={onClick} className={`flex items-center gap-4 px-8 py-4 transition-all border-l-4 ${isActive ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800] font-black' : 'text-slate-400 border-transparent hover:bg-[#002d5c] hover:text-white font-medium'}`}>
      <IconComponent size={16} strokeWidth={2.5} />
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </Link>
  )
}
function SubNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} onClick={onClick} className={`flex items-center pl-16 py-3 text-[11px] uppercase tracking-widest transition-all ${isActive ? 'text-[#FFB800] font-black' : 'text-slate-400 hover:text-white'}`}>
      <span className="mr-2">•</span> {label}
    </Link>
  )
}