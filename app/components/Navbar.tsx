// src/components/Navbar.tsx
import Link from 'next/link'
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> {/* Aumentamos ligeramente la altura a h-20 para que el logo luzca mejor */}
          
          {/* Contenedor del Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="https://ditec-ec.com/" className="transition-opacity hover:opacity-80">
              <Image 
                src="/logo_ditec-2.png" 
                alt="DITCASH Logo"
                width={60} 
                height={60}
                className="object-contain"
                priority 
              />
            </Link>
          </div>

          {/* Menú de navegación (Desktop) */}
          <div className="hidden md:flex space-x-8 items-center">            
            
            {/* Enlace de ayuda o soporte opcional */}
            <Link href="/politica-privacidad" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#001F3F] transition-colors">
              Centro Legal
            </Link>

            {/* Botón de Login Estilo DITCASH */}
            <Link 
              href="/login" 
              className="ml-4 bg-[#001F3F] text-[#FFB800] px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}