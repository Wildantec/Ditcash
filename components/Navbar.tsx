'use client';

import Link from 'next/link';
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  esCliente?: boolean;
  clienteCedula?: string | null;
}

export default function Navbar({ esCliente = false, clienteCedula = null }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const esRutaVendedor = pathname.startsWith('/vendedor') || pathname.startsWith('/admin');

  const handleSalirPortalCliente = () => {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> 

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

          <div className="hidden md:flex space-x-8 items-center">            
            
            <Link href="/politica-privacidad" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#001F3F] transition-colors">
              Centro Legal
            </Link>
            {esCliente ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                <button 
                  onClick={handleSalirPortalCliente}
                  className="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Salir del Portal
                </button>
              </div>
            ) : esRutaVendedor ? (
              <span className="text-[10px] font-black text-[#001F3F] bg-slate-50 px-3 py-1 rounded-md uppercase tracking-widest">
                Panel Ventas
              </span>
            ) : (
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