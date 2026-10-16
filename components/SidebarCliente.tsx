'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  ChevronDown, 
  LogOut 
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const esRutaCompras = pathname.startsWith('/compras')
  const [isComprasOpen, setIsComprasOpen] = useState(esRutaCompras)

  useEffect(() => {
    if (esRutaCompras) {
      setIsComprasOpen(true)
    }
  }, [pathname, esRutaCompras])

  const activeClass = (path: string) => 
    pathname === path 
      ? "bg-blue-600 text-white font-semibold" 
      : "text-slate-400 hover:bg-slate-800 hover:text-white"

  const subActiveClass = (path: string) =>
    pathname === path
      ? "text-blue-400 font-bold"
      : "text-slate-400 hover:text-white"

  const handleCerrarSesion = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;"
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col transition-all select-none shrink-0">
      
      {/* BRANDING */}
      <div className="p-6">
        <h2 className="text-2xl font-black text-white tracking-tighter">
          CLIENTE<span className="text-blue-500">APP</span>
        </h2>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
        <Link href="/" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeClass('/')}`}>
          <LayoutDashboard size={20} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        {/* MENÚ DESPLEGABLE COMPRAS */}
        <div>
          <button 
            type="button"
            onClick={() => setIsComprasOpen(!isComprasOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              esRutaCompras ? 'text-white bg-slate-800/60 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span className="text-sm font-medium">Compras</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isComprasOpen ? 'rotate-180' : ''}`} />
          </button>

          {isComprasOpen && (
            <div className="ml-9 mt-1.5 space-y-1 border-l border-slate-700/80 pl-4">
              <Link href="/compras/nueva" className={`block py-1.5 text-xs transition-colors ${subActiveClass('/compras/nueva')}`}>
                Nueva Compra
              </Link>
              <Link href="/compras/historial" className={`block py-1.5 text-xs transition-colors ${subActiveClass('/compras/historial')}`}>
                Historial
              </Link>
            </div>
          )}
        </div>

        <Link href="/usuarios" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeClass('/usuarios')}`}>
          <Users size={20} />
          <span className="text-sm font-medium">Usuarios</span>
        </Link>
      </nav>

      {/* BOTÓN CERRAR SESIÓN */}
      <div className="p-4 border-t border-slate-800">
        <button 
          type="button"
          onClick={handleCerrarSesion}
          className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left font-medium text-sm cursor-pointer"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

    </aside>
  )
}