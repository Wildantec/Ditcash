// src/components/Sidebar.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  ChevronDown, 
  LogOut 
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [isComprasOpen, setIsComprasOpen] = useState(false)

  // Función para estilos activos
  const activeClass = (path: string) => 
    pathname === path ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col transition-all">
      {/* Header del Sidebar */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white tracking-tighter">
          CLIENTE<span className="text-blue-500">APP</span>
        </h2>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        
        {/* Dashboard */}
        <Link href="/" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeClass('/')}`}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>

        {/* Grupo Compras (Con Submenú) */}
        <div>
          <button 
            onClick={() => setIsComprasOpen(!isComprasOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isComprasOpen ? 'text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span className="font-medium">Compras</span>
            </div>
            <ChevronDown size={16} className={`transition-transform ${isComprasOpen ? 'rotate-180' : ''}`} />
          </button>

          {isComprasOpen && (
            <div className="ml-9 mt-2 space-y-1 border-l border-slate-700 pl-4">
              <Link href="/compras/nueva" className="block p-2 text-sm text-slate-400 hover:text-white">Nueva Compra</Link>
              <Link href="/compras/historial" className="block p-2 text-sm text-slate-400 hover:text-white">Historial</Link>
            </div>
          )}
        </div>

        {/* Usuarios */}
        <Link href="/usuarios" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeClass('/usuarios')}`}>
          <Users size={20} />
          <span className="font-medium">Usuarios</span>
        </Link>
      </nav>

      {/* Botón Salir */}
      <div className="p-4 border-t border-slate-800">
        <Link href="/" className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </Link>
      </div>
    </aside>
  )
}