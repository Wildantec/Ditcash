'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function Home() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const manejarLoginCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aceptaPrivacidad) {
      setShowModal(true);
      return;
    }

    if (cedula.length < 10) {
      alert("Por favor, ingresa una cédula válida.");
      return;
    }

    setLoading(true);
    try {
      // Aquí se conectará con el flujo de autenticación que valida contra el sistema contable
      router.push(`/clientes/dashboard`);
    } catch (error) {
      alert("Error al ingresar. Verifique sus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FA]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10 md:py-24 relative overflow-hidden">
        
        {/* ELEMENTOS DECORATIVOS DE FONDO */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-10 left-0 w-96 h-96 bg-[#FFB800] opacity-[0.04] rounded-full blur-[120px]" />
            <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[#001F3F] opacity-[0.04] rounded-full blur-[120px]" />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center z-10">
          
          {/* LADO IZQUIERDO: ACERCA DE NOSOTROS */}
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-[#001F3F] uppercase italic leading-[0.9] tracking-tighter text-left">
                Acerca de <br />
                <span className="text-[#FFB800]">Nosotros</span>
                </h2>
                <div className="h-1.5 w-24 bg-[#FFB800] rounded-full" />
            </div>

            <div className="space-y-6 max-w-2xl text-left">
                <p className="text-slate-600 text-base md:text-xl leading-relaxed font-medium">
                    Nuestro objetivo principal es brindar a nuestros clientes la oportunidad de adquirir los productos que necesitan de manera <strong>accesible y conveniente</strong>, sin comprometer la calidad.
                </p>
                
                <div className="border-l-4 border-[#FFB800] pl-6 py-3 space-y-3 bg-[#001F3F]/[0.02] rounded-r-2xl">
                    <p className="text-slate-500 text-sm md:text-lg leading-relaxed italic font-bold">
                        Puedes consultar tus estados de cuenta y recuerda que con DITEC puedes obtener premios increíbles.
                    </p>
                    <p className="text-[#001F3F] text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FFB800] rounded-full animate-pulse" />
                        DITEC PENSANDO EN EL FUTURO
                    </p>
                </div>
            </div>
          </div>

          {/* LADO DERECHO: CARD DE LOGIN (TODO INTEGRADO) */}
          <div className="lg:col-span-5 w-full max-w-[430px] mx-auto animate-in fade-in slide-in-from-right duration-1000">
            <div className="bg-white p-8 md:p-11 rounded-[3rem] shadow-[0_50px_100px_rgba(0,31,63,0.1)] border border-white relative overflow-hidden">
                
                {/* Badge Superior Estilizado */}
                <div className="absolute top-0 right-0">
                    <div className="bg-[#FFB800] text-[#001F3F] text-[9px] font-black px-6 py-2 rounded-bl-3xl shadow-sm uppercase tracking-tighter">
                        Portal Clientes
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#001F3F] uppercase italic">Iniciar Sesión</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestiona tus créditos hoy</p>
                </div>

                <form onSubmit={manejarLoginCliente} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Cédula</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F] transition-all placeholder:text-slate-200"
                      required
                    />
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 group transition-colors hover:bg-slate-100/50">
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
                      aceptaPrivacidad && !loading ? 'bg-[#001F3F] text-[#FFB800] hover:bg-black' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Validando...' : 'Entrar a mi Cuenta ➔'}
                  </button>
                </form>

                {/* SECCIÓN DE ENLACES INTEGRADOS CON MEJOR DISEÑO */}
                <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                    <div className="text-center group">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">¿Primera vez en el portal?</p>
                        <Link href="/register" className="text-[#001F3F] text-xs font-black uppercase inline-block border-b-2 border-[#FFB800] hover:text-black transition-all pb-1 scale-100 hover:scale-105">
                            Crear cuenta de cliente
                        </Link>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                        <div className="relative flex justify-center text-[8px] uppercase font-black text-slate-200"><span className="bg-white px-2">Uso Administrativo</span></div>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-50 rounded-full text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-[#001F3F] hover:text-[#FFB800] transition-all border border-slate-100">
                           <span>Acceso Vendedores</span>
                           <span className="text-[10px]">🔒</span>
                        </Link>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />

      {/* MODAL LEGAL OFICIAL (MANTENIDO ÍNTEGRO SEGÚN TU SOLICITUD) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#001F3F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-[#001F3F] font-black text-xl">✕</button>
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