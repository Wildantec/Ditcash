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
  const [showModal, setShowModal] = useState(false); // Estado para el modal legal
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const manejarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aceptaPrivacidad) {
      setShowModal(true); // Si no acepta, le mostramos el modal para que lea y acepte
      return;
    }

    if (cedula.length < 10) {
      alert("Por favor, ingresa una cédula válida.");
      return;
    }

    setLoading(true);
    try {
      // Simulación de ingreso al estado de cuenta del cliente
      router.push(`/clientes/estado-cuenta/${cedula}`);
    } catch (error) {
      alert("Error al ingresar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FA]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden">
        
        {/* ELEMENTOS DECORATIVOS DE FONDO */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFB800] opacity-[0.03] rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#001F3F] opacity-[0.03] rounded-full blur-[100px]" />
        </div>

        {/* CONTENEDOR LOGO */}
        <div className="mb-12 animate-in fade-in zoom-in duration-1000 flex flex-col items-center z-10">
            <Image 
              src="/logo_ditec-2.png" 
              alt="DITCASH Logo"
              width={240} 
              height={110}
              className="object-contain"
              priority 
            />
        </div>

        {/* GRID PRINCIPAL: FORMULARIO Y TEXTO INFORMATIVO */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          
          {/* LADO IZQUIERDO: TEXTO PROFESIONAL */}
          <div className="hidden lg:block space-y-6 text-left">
            <h2 className="text-4xl font-black text-[#001F3F] uppercase italic leading-none tracking-tighter">
              Soluciones para <br />
              <span className="text-[#FFB800]">Clientes</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md font-medium">
              Bienvenido a la plataforma oficial de <strong>DITEC</strong>. Consulta tu estado de cuenta, gestiona incentivos y revisa el progreso de tus pagos en tiempo real con la seguridad que nos caracteriza.
            </p>
          </div>

          {/* LADO DERECHO: CARD DE LOGIN */}
          <div className="w-full max-w-[420px] mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,31,63,0.06)] border border-white/50 relative">
            <div className="absolute -top-4 -right-4 bg-[#FFB800] text-[#001F3F] text-[10px] font-black px-4 py-2 rounded-xl shadow-lg">
                ACCESO CLIENTES
            </div>

            <form onSubmit={manejarConsulta} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Número de Cédula
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F] transition-all placeholder:text-slate-200"
                  required
                />
              </div>

              {/* PRIVACIDAD INTERACTIVA */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={aceptaPrivacidad}
                    onChange={() => setAceptaPrivacidad(!aceptaPrivacidad)}
                    className="mt-1 w-4 h-4 accent-[#001F3F] cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-400 font-bold leading-tight uppercase tracking-tight">
                    He leído y acepto la <button type="button" onClick={() => setShowModal(true)} className="text-[#001F3F] underline decoration-[#FFB800] decoration-2">POLITICA DE DATOS</button> de Ditec.
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                  aceptaPrivacidad && !loading
                  ? 'bg-[#001F3F] text-[#FFB800] hover:bg-black' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Procesando...' : 'Consultar Estado ➔'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <Link href="/login" className="inline-block px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-[#001F3F] border border-slate-100 uppercase tracking-tighter hover:bg-[#FFB800] transition-all">
                Portal para Vendedores ➔
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* MODAL LEGAL OFICIAL WILDANTEC */}
      {showModal && (
        <div className="fixed inset-0 bg-[#001F3F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-[#001F3F] font-black text-xl"
            >✕</button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
              <h2 className="text-xl font-black uppercase italic text-[#001F3F]">Política de Privacidad y Protección de Datos Personales</h2>
            </div>

            <div className="max-h-64 overflow-y-auto text-[10px] text-slate-500 pr-4 space-y-4 leading-relaxed custom-scrollbar text-justify">
              <p className="italic font-bold">DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</p>
              <p>En cumplimiento de la Ley Orgánica de Protección de Datos Personales, sus datos serán tratados para las finalidades de: evaluación de crédito, gestión contractual, facturación y cobranza.</p>
              <p>Al ingresar, usted autoriza el tratamiento de sus datos conforme a nuestra política oficial disponible en la web. Puede ejercer sus derechos de acceso o rectificación escribiendo a: <strong>protecciondedatos@ditec-ec.com</strong>.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-8">
                <button 
                onClick={() => { setAceptaPrivacidad(true); setShowModal(false); }}
                className="w-full py-4 bg-[#001F3F] text-[#FFB800] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg"
                >
                Aceptar Política y Continuar
                </button>
                <Link href="/politica-privacidad" className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">
                    Ver documento completo ➔
                </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}