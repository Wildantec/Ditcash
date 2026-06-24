'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/app/actions/login'
import { 
  BarChart3, Users, Package, Rocket, Gift, Bell, Briefcase, BellRing,
  LogOut, Menu, X, Warehouse, Settings, Fuel, ChevronDown, ChevronUp, Search
} from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'MARKETING' | 'VENDEDOR' | 'CONTABILIDAD' | 'COBRANZAS' | 'FACTURACION'
}

export default function SidebarDitcash({ role }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [openContabilidad, setOpenContabilidad] = useState(false)
  const [permisosCargados, setPermisosCargados] = useState<any[]>([])

  if (pathname === '/') return null

  useEffect(() => {
    async function obtenerAccesos() {
      try {
        const res = await fetch('/api/admin/permisos')
        const json = await res.json()
        if (json.success && json.data) {
          setPermisosCargados(json.data)
        }
      } catch (err) {
        console.error('Error cargando accesos del menú:', err)
      }
    }
    obtenerAccesos()
  }, [pathname])

  useEffect(() => {
    if (pathname.includes('/combustible/')) {
      setOpenContabilidad(true)
    }
  }, [pathname])

  const tieneAccAccessModulo = (moduloId: string) => {
    if (role === 'ADMIN') return true
    const permiso = permisosCargados.find(p => p.rol === role && p.modulo === moduloId)
    return permiso ? permiso.ver : false
  }

  const closeSidebar = () => setIsOpen(false)

  const esDashboardActivo = pathname === '/dashboard'
  const esCampanaActiva = pathname === '/dashboard/campanas' || pathname.startsWith('/dashboard/campanas/')
  const esPremioActivo = pathname === '/dashboard/premios' || pathname.startsWith('/dashboard/premios/')
  const esInventarioActivo = pathname === '/dashboard/inventario'
  const esBodegaActiva = pathname === '/dashboard/bodegas'
  const esUsuariosActivo = pathname === '/dashboard/usuarios'
  const esVendedoresActivo = pathname === '/dashboard/vendedores'
  const esCanjesActivo = pathname === '/dashboard/canjes'
  const esClientesActivo = pathname === '/dashboard/clientes-web'
  const esPublicidadActiva = pathname === '/dashboard/publicidad'

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

        <nav className="flex-grow flex flex-col mt-4 overflow-y-auto select-none gap-0.5">
          <NavLink href="/dashboard" label="Resumen Global" icon={BarChart3} onClick={closeSidebar} isActive={esDashboardActivo} />
          
          {tieneAccAccessModulo('vendedores') && (
            <NavLink href="/dashboard/vendedores" label="Auditoría Campo" icon={Search} onClick={closeSidebar} isActive={esVendedoresActivo} />
          )}

          {tieneAccAccessModulo('canjes') && (
            <NavLink href="/dashboard/canjes" label="Control Canjes" icon={Bell} onClick={closeSidebar} isActive={esCanjesActivo} />
          )}

          {tieneAccAccessModulo('clientes') && (
            <NavLink href="/dashboard/clientes-web" label="Clientes" icon={Users} onClick={closeSidebar} isActive={esClientesActivo} />
          )}

          {tieneAccAccessModulo('campanas') && (
            <NavLink href="/dashboard/campanas" label="Campañas" icon={Rocket} onClick={closeSidebar} isActive={esCampanaActiva} />
          )}

          {tieneAccAccessModulo('premios') && (
            <NavLink href="/dashboard/premios" label="Catálogo Premios" icon={Gift} onClick={closeSidebar} isActive={esPremioActivo} />
          )}
          
          {tieneAccAccessModulo('inventario') && (
            <NavLink href="/dashboard/inventario" label="Inventario Global" icon={Package} onClick={closeSidebar} isActive={esInventarioActivo} />
          )}

          {tieneAccAccessModulo('bodegas') && (
            <NavLink href="/dashboard/bodegas" label="Bodegas" icon={Warehouse} onClick={closeSidebar} isActive={esBodegaActiva} />
          )}

          {tieneAccAccessModulo('usuarios') && (
            <NavLink href="/dashboard/usuarios" label="Gestión Usuarios" icon={Users} onClick={closeSidebar} isActive={esUsuariosActivo} />
          )}

          {tieneAccAccessModulo('publicidad') && (
            <NavLink href="/dashboard/publicidad" label="Banners Publicidad" icon={BellRing} onClick={closeSidebar} isActive={esPublicidadActiva} />
          )}

          {(role === 'ADMIN' || role === 'CONTABILIDAD' || role === 'FACTURACION') && (
            <div>
              <button 
                onClick={() => setOpenContabilidad(!openContabilidad)}
                className="w-full flex items-center justify-between px-8 py-4 text-slate-400 hover:bg-[#002d5c] hover:text-white transition-all border-l-4 border-transparent"
              >
                <div className="flex items-center gap-4">
                  <Fuel size={16} strokeWidth={2.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Contabilidad</span>
                </div>
                {openContabilidad ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {openContabilidad && (
                <div className="bg-[#001833]/50 border-y border-white/5">
                  <SubNavLink href="/dashboard/combustible/vehiculos" label="Vehículos" onClick={closeSidebar} />
                  <SubNavLink href="/dashboard/combustible/estaciones" label="Estaciones" onClick={closeSidebar} />
                  <SubNavLink href="/dashboard/combustible/facturas" label="Ingresar Factura" onClick={closeSidebar} />
                </div>
              )}
            </div>
          )}
          
          {role === 'ADMIN' && (
            <NavLink href="/dashboard/permisos" label="Configuración" icon={Settings} onClick={closeSidebar} />
          )}
        </nav>

        <div className="p-6 border-t border-white/10">
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-4 px-8 py-4 text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 rounded-2xl w-full text-left transition-all">
              <LogOut size={16} /> <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function NavLink({ href, icon: IconComponent, label, onClick, isActive }: any) {
  const pathname = usePathname()
  const linkActive = isActive !== undefined ? isActive : pathname === href

  return (
    <Link href={href} onClick={onClick} className={`flex items-center gap-4 px-8 py-4 transition-all border-l-4 ${linkActive ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800] font-black' : 'text-slate-400 border-transparent hover:bg-[#002d5c] hover:text-white font-medium'}`}>
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