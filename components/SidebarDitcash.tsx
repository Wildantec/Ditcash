'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/app/actions/login'
import { 
  BarChart3, Users, Gift, ChevronDown, LogOut, Menu, X, Fuel, 
  Settings, Wrench, Search
} from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'MARKETING' | 'VENDEDOR' | 'CONTABILIDAD' | 'COBRANZAS' | 'FACTURACION' | 'SERVICIO_TECNICO'
}

const MODULOS_POR_DEFECTO: { [key: string]: string[] } = {
  VENDEDOR: ['campanas', 'premios', 'inventario'],
  MARKETING: ['vendedores', 'campanas', 'canjes', 'historial', 'premios', 'inventario'],
  CONTABILIDAD: ['estaciones', 'facturas_comb', 'vehiculos'],
  SERVICIO_TECNICO: ['vehiculos', 'estaciones'],
  COBRANZAS: [],
  FACTURACION: [],
  ADMIN: []
};

export default function SidebarDitcash({ role }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [permisosCargados, setPermisosCargados] = useState<any[]>([])
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    operaciones: false,
    incentivos: false,
    contabilidad: false,
    servicio_tecnico: false,
    configuracion: false
  })

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
      setOpenSections(prev => ({ ...prev, contabilidad: true }))
    } else if (pathname.includes('/servicio-tecnico/')) {
      setOpenSections(prev => ({ ...prev, servicio_tecnico: true }))
    } else if (pathname.includes('/vendedores') || pathname.includes('/campanas') || pathname.includes('/canjes')) {
      setOpenSections(prev => ({ ...prev, operaciones: true }))
    } else if (pathname.includes('/premios') || pathname.includes('/inventario') || pathname.includes('/bodegas')) {
      setOpenSections(prev => ({ ...prev, incentives: true }))
    } else if (pathname.includes('/usuarios') || pathname.includes('/permisos')) {
      setOpenSections(prev => ({ ...prev, configuracion: true }))
    }
  }, [pathname])

  const tieneAccAccessModulo = (moduloId: string) => {
    if (role === 'ADMIN') return true

    const modulosFijos = MODULOS_POR_DEFECTO[role] || []
    if (modulosFijos.includes(moduloId)) return true

    const permiso = permisosCargados.find(p => p.rol === role && p.modulo === moduloId)
    return permiso ? !!permiso.ver : false
  }

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const closeSidebar = () => setIsOpen(false)

  const menuEstructura = [
    {
      id: 'operaciones',
      label: 'Auditoría Campo',
      icon: Search,
      submodulos: [
        { href: '/dashboard/vendedores', label: 'Monitoreo Asesores', permisoKey: 'vendedores' },
        { href: '/dashboard/campanas', label: 'Control Campañas', permisoKey: 'campanas' },
        { href: '/dashboard/canjes', label: 'Validar Canjes', permisoKey: 'canjes' },
        { href: '/dashboard/canjes/historial', label: 'Historial Entregas', permisoKey: 'historial' }
      ]
    },
    {
      id: 'incentivos',
      label: 'Premios & Stock',
      icon: Gift,
      submodulos: [
        { href: '/dashboard/premios', label: 'Catálogo Premios', permisoKey: 'premios' },
        { href: '/dashboard/inventario', label: 'Inventario Global', permisoKey: 'inventario' },
        { href: '/dashboard/bodegas', label: 'Bodegas', permisoKey: 'bodegas' }
      ]
    },
    {
      id: 'contabilidad',
      label: 'Contabilidad',
      icon: Fuel,
      forzarMostrar: role === 'ADMIN' || role === 'CONTABILIDAD' || role === 'FACTURACION',
      submodulos: [
        { href: '/dashboard/combustible/estaciones', label: 'Estaciones', permisoKey: 'estaciones' },
        { href: '/dashboard/combustible/facturas', label: 'Ingresar Factura', permisoKey: 'facturas_comb' }
      ]
    },
    {
      id: 'servicio_tecnico',
      label: 'Servicio Técnico',
      icon: Wrench,
      // 🚀 CORREGIDO: Se removió 'VENDEDOR' para que no vea Servicio Técnico
      forzarMostrar: role === 'ADMIN' || role === 'SERVICIO_TECNICO',
      submodulos: [
        { href: '/dashboard/combustible/vehiculos', label: 'Flota de Vehículos', permisoKey: 'vehiculos' }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      submodulos: [
        { href: '/dashboard/usuarios', label: 'Gestión Usuarios', permisoKey: 'usuarios' },
        { href: '/dashboard/permisos', label: 'Seguridad Corp.', permisoKey: 'permisos', soloAdmin: true }
      ]
    }
  ]

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-4 left-4 z-[60] bg-[#001F3F] text-[#FFB800] p-3 rounded-xl shadow-2xl">
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden" onClick={closeSidebar} />}

      <aside className={`fixed top-0 left-0 h-screen bg-[#001F3F] text-white flex flex-col z-[50] transition-transform duration-300 w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:w-64 border-r border-white/5`}>
        <div className="p-8">
          <h2 className="text-[#FFB800] text-3xl font-black italic tracking-tighter">DIT<span className="text-white">CASH</span></h2>
          <p className="text-[10px] text-slate-400 tracking-[1px] uppercase font-bold mt-1">Panel Control</p>
        </div>
        <nav className="flex-grow flex flex-col mt-2 overflow-y-auto select-none gap-1 scrollbar-none">
          
          <NavLink href="/dashboard" label="Resumen Global" icon={BarChart3} onClick={closeSidebar} isActive={pathname === '/dashboard'} />
          
          {menuEstructura.map((seccion) => {
            const submodulosPermitidos = seccion.submodulos.filter((sub: any) => {
              if (sub.soloAdmin && role !== 'ADMIN') return false;
              if (seccion.forzarMostrar || role === 'ADMIN') return true;
              return tieneAccAccessModulo(sub.permisoKey);
            });

            if (submodulosPermitidos.length === 0) return null;

            const isOpenSection = !!openSections[seccion.id];

            return (
              <div key={seccion.id} className="w-full">
                <button 
                  onClick={() => toggleSection(seccion.id)}
                  className="w-full flex items-center justify-between px-8 py-3.5 text-slate-400 hover:bg-[#002d5c] hover:text-white transition-all border-l-4 border-transparent uppercase text-[11px] font-black tracking-widest"
                >
                  <div className="flex items-center gap-4">
                    <seccion.icon size={15} strokeWidth={2.5} />
                    <span>{seccion.label}</span>
                  </div>
                  <ChevronDown size={13} className={`transform transition-transform duration-200 ${isOpenSection ? 'rotate-180 text-[#FFB800]' : ''}`} />
                </button>
                {isOpenSection && (
                  <div className="bg-[#001833]/40 border-y border-white/5 py-1 space-y-0.5">
                    {submodulosPermitidos.map((sub, sIndex) => {
                      const isSubActive = sub.href === '/dashboard/canjes'
                        ? pathname === sub.href
                        : pathname === sub.href || pathname.startsWith(`${sub.href}/`);

                      return (
                        <SubNavLink 
                          key={sIndex}
                          href={sub.href}
                          label={sub.label}
                          onClick={closeSidebar}
                          isActive={isSubActive}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/10 bg-[#001730]">
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-4 px-8 py-3.5 text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 rounded-xl w-full text-left transition-all">
              <LogOut size={15} /> <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function NavLink({ href, icon: IconComponent, label, onClick, isActive }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={`flex items-center gap-4 px-8 py-3.5 transition-all border-l-4 ${
        isActive 
          ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800] font-black' 
          : 'text-slate-400 border-transparent hover:bg-[#002d5c] hover:text-white font-black'
      }`}
    >
      <IconComponent size={15} strokeWidth={2.5} />
      <span className="text-[11px] uppercase tracking-widest">{label}</span>
    </Link>
  )
}

function SubNavLink({ href, label, onClick, isActive }: { href: string; label: string; onClick: () => void; isActive: boolean }) {
  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={`flex items-center pl-16 py-2.5 text-[10px] uppercase tracking-widest transition-all font-bold ${
        isActive 
          ? 'text-[#FFB800] font-black bg-white/5' 
          : 'text-slate-400 hover:text-white hover:pl-17'
      }`}
    >
      <span className={`mr-2.5 transition-colors ${isActive ? 'text-[#FFB800]' : 'text-slate-500'}`}>•</span> 
      {label}
    </Link>
  )
}