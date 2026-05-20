'use client';

import Link from 'next/link';
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  esCliente?: boolean;              // Si está en el portal del cliente
  clienteCedula?: string | null;    // El número de cédula del cliente activo
}

export default function Navbar({ esCliente = false, clienteCedula = null }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Detectamos si la URL actual pertenece al panel administrativo de los vendedores
  const esRutaVendedor = pathname.startsWith('/vendedor') || pathname.startsWith('/admin');

  // Función quirúrgica para cerrar la consulta del cliente borrando su cookie/sesión
  const handleSalirPortalCliente = () => {
    // Si usas una ruta de backend para borrar cookies de servidor, puedes llamarla aquí.
    // Por ahora, destruimos el rastro y mandamos al usuario al inicio de consulta pública.
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> 
          
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
            
            <Link href="/politica-privacidad" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#001F3F] transition-colors">
              Centro Legal
            </Link>

            {/* 🔒 RENDERIZADO DINÁMICO DE LOGINS (SOLO CÉDULA) */}
            {esCliente ? (
              // CASO 1: Es un Cliente viendo su Estado de Cuenta desde el número de Cédula
              <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                <button 
                  onClick={handleSalirPortalCliente}
                  className="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Salir del Portal
                </button>
              </div>
            ) : esRutaVendedor ? (
              // CASO 2: Los vendedores ya están dentro de su sistema (No duplicamos botón de login)
              <span className="text-[10px] font-black text-[#001F3F] bg-slate-50 px-3 py-1 rounded-md uppercase tracking-widest">
                Panel Ventas
              </span>
            ) : (
              // CASO 3: Ruta pública general, mantenemos el botón de acceso para tus vendedores al /login
              <Link 
                href="/login" 
                className="ml-4 bg-[#001F3F] text-[#FFB800] px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
              >
                Iniciar Sesión
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}