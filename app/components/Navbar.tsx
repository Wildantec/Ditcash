// src/components/Navbar.tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Nombre */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-orange-600 tracking-tight">
              Clientes<span className="text-slate-800">APP</span>
            </Link>
          </div>

          {/* Menú de navegación (Desktop) */}
          <div className="hidden md:flex space-x-8 items-center">            
            {/* Botón de Login */}
            <Link 
              href="/login" 
              className="ml-4 bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all shadow-md active:scale-95"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}