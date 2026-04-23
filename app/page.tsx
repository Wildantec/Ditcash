'use client'
import { useState } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function Home() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const manejarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aceptaPrivacidad) {
      alert("Debes aceptar la política de privacidad para ingresar.");
      return;
    }

    if (cedula.length < 10) {
      alert("Por favor, ingresa una cédula válida.");
      return;
    }

    setLoading(true);
    try {
      // Simulación de ingreso
      console.log("Ingresando...");
      router.push(`/clientes/estado-cuenta/${cedula}`);
    } catch (error) {
      alert("Error al ingresar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-16">
        
        {/* SECCIÓN DEL LOGO SIN CÍRCULO */}
        <div className="mb-10 animate-in fade-in slide-in-from-top duration-1000 flex flex-col items-center">
          <div className="relative p-2">
            {/* Contenedor simple para el logo */}
            <Image 
              src="/logo-ditec.png" 
              alt="DITCASH Logo"
              width={220} // Aumenté un poco el tamaño para que luzca más
              height={100}
              className="object-contain"
              priority 
            />
          </div>
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-10">
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">
            Gestión de incentivos y estados de cuenta
          </p>
        </div>
        
        {/* CARD DE LOGIN */}
        <div className="w-full max-w-[400px] bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_80px_rgba(0,31,63,0.08)] border border-slate-100">
          <form onSubmit={manejarConsulta} className="space-y-6">
            
            {/* CÉDULA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest ml-1">
                Identificación (Cédula)
              </label>
              <input 
                type="text" 
                maxLength={10}
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                placeholder="0000000000"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-lg font-bold text-[#001F3F] transition-all"
                required
              />
            </div>

            {/* CONTRASEÑA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-lg font-bold text-[#001F3F] transition-all"
                required
              />
            </div>

            {/* PRIVACIDAD */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={aceptaPrivacidad}
                  onChange={() => setAceptaPrivacidad(!aceptaPrivacidad)}
                  className="mt-1 w-4 h-4 accent-[#001F3F] cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 font-bold leading-tight uppercase">
                  Acepto los términos y la <span className="text-[#D4AF37] underline">política de datos</span>.
                </span>
              </label>
            </div>

            {/* BOTÓN */}
            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 ${
                aceptaPrivacidad && !loading
                ? 'bg-[#001F3F] text-white hover:bg-black hover:translate-y-[-2px]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Cargando...' : 'Entrar'}
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/login" className="text-[10px] font-black text-[#D4AF37] uppercase tracking-tighter hover:text-[#001F3F] transition-colors">
              Acceso exclusivo para Vendedores ➔
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}