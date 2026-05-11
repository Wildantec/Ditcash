'use client'
import { useState } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function RegisterPage() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Aquí llamarás a la Server Action que valida contra el sistema contable
      console.log({ cedula, password, role: 'CLIENTE' });
      
      // Simulación de validación y creación
      setTimeout(() => {
        router.push('/'); 
      }, 1500);
    } catch (error) {
      alert("Error al validar los datos con el sistema contable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FA]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 md:py-16 relative overflow-hidden">
        
        {/* ELEMENTOS DECORATIVOS DE FONDO (Iguales a la Home) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none hidden sm:block">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFB800] opacity-[0.03] rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#001F3F] opacity-[0.03] rounded-full blur-[100px]" />
        </div>

        {/* CONTENEDOR DE CABECERA DE REGISTRO */}
        <div className="mb-8 text-center z-10 animate-in fade-in zoom-in duration-1000">
            <h1 className="text-3xl md:text-5xl font-black text-[#001F3F] uppercase italic leading-none tracking-tighter">
              Activar <span className="text-[#FFB800]">Cuenta Web</span>
            </h1>
            <p className="text-slate-400 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.3em] mt-3">
              Portal Exclusivo para Clientes Wildantec
            </p>
        </div>

        {/* CARD DE REGISTRO RESPONSIVE */}
        <div className="w-full max-w-[440px] bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_50px_100px_rgba(0,31,63,0.1)] border border-white relative z-10 overflow-hidden">
          
          {/* Badge de estado */}
          <div className="absolute top-0 right-0">
              <div className="bg-[#001F3F] text-[#FFB800] text-[9px] font-black px-6 py-2 rounded-bl-3xl shadow-sm uppercase tracking-tighter">
                  Registro Seguro
              </div>
          </div>

          <div className="mb-8">
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Ingresa tu número de identificación para verificar tu registro en nuestro sistema contable y establecer tu contraseña de acceso.
              </p>
          </div>
          
          <form onSubmit={manejarRegistro} className="space-y-5">
            {/* CÉDULA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Cédula de Identidad
              </label>
              <input 
                type="text" 
                maxLength={10}
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                placeholder="0000000000"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F] transition-all placeholder:text-slate-200"
                required
              />
            </div>

            {/* CONTRASEÑA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Crear Contraseña Web
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F] transition-all placeholder:text-slate-200"
                required
              />
              <p className="text-[9px] text-slate-400 font-medium ml-1 italic">
                * Esta será tu clave para consultar tus estados de cuenta.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 bg-[#001F3F] text-[#FFB800] hover:bg-black disabled:bg-slate-100 disabled:text-slate-300`}
            >
              {loading ? 'Verificando Cliente...' : 'Activar mi Cuenta ➔'}
            </button>
          </form>

          {/* FOOTER DE LA TARJETA */}
          <div className="mt-10 pt-8 border-t border-slate-100 text-center space-y-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              ¿Ya activaste tu cuenta?
            </p>
            <Link href="/" className="text-[#001F3F] text-xs font-black uppercase inline-block border-b-2 border-[#FFB800] hover:scale-105 transition-transform pb-1">
                Regresar al Login
            </Link>
          </div>
        </div>

        {/* NOTA ACLARATORIA FUERA DE LA CARD */}
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest z-10 text-center max-w-xs">
            Solo disponible para clientes registrados físicamente en Wildantec.
        </p>
      </main>

      <Footer />
    </div>
  );
}