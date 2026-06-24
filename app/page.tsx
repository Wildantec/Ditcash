'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { manejarFlujoClienteAction } from '@/app/actions/login';
import Swal from 'sweetalert2';

export default function Home() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [step, setStep] = useState<'formulario' | 'confirm_activation' | 'change_password'>('formulario');
  const [clienteNombre, setClienteNombre] = useState('');
  
  const router = useRouter();

  const manejarFlujoPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceptaPrivacidad) { setShowModal(true); return; }
    
    setLoading(true);
    setClienteNombre(''); 
    
    try {
      const passEnvio = modo === 'registro' ? undefined : password;
      const res = await manejarFlujoClienteAction(cedula, passEnvio);

      if (res?.error) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">CONTROL DE ACCESOS</span>',
          text: res.error,
          icon: 'error',
          confirmButtonColor: '#001F3F',
          confirmButtonText: 'ENTENDIDO'
        });
        setLoading(false);
        return;
      }

      if (res.status === "LOGIN_SUCCESS") {
        window.location.href = `/clientes/estado-cuenta/${cedula}`;
      } else if (res.status === "REQUIERE_ACTIVACION") {
        setClienteNombre(res.nombre || "CLIENTE");
        setStep('confirm_activation');
      }
    } catch (error: any) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">FALLO DE CONEXIÓN</span>',
        text: 'Error de comunicación. Revise los logs de Docker.',
        icon: 'warning',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'ENTENDIDO'
      });
    } finally {
      setLoading(false);
    }
  };

  const manejarActivacionClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">SEGURIDAD</span>',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'CORREGIR'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await manejarFlujoClienteAction(cedula, password);
      if (res?.error) { 
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR</span>',
          text: res.error,
          icon: 'error',
          confirmButtonColor: '#001F3F'
        });
        return; 
      }
      
      if (res.status === "ACTIVACION_COMPLETA") {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡CUENTA ACTIVADA!</span>',
          text: 'Su contraseña ha sido guardada. Ingresando a su panel...',
          icon: 'success',
          confirmButtonColor: '#001F3F',
          confirmButtonText: 'CONTINUAR ➔'
        }).then(() => {
          window.location.href = `/clientes/estado-cuenta/${cedula}`;
        });
      }
    } catch (error: any) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR CRÍTICO</span>',
        text: 'No se pudo establecer la contraseña corporativa.',
        icon: 'error',
        confirmButtonColor: '#001F3F'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FA]">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10 md:py-24 relative overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center z-10">
          
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-1000 text-left">
            <h2 className="text-4xl md:text-6xl font-black text-[#001F3F] uppercase italic leading-[0.9] tracking-tighter">
              Acerca de <br />
              <span className="text-[#FFB800]">Nosotros</span>
            </h2>
            <div className="space-y-6 max-w-2xl">
              <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                Brindamos soluciones accesibles sin comprometer la calidad.
              </p>
              <div className="border-l-4 border-[#FFB800] pl-6 py-2 space-y-2">
                <p className="text-slate-500 text-sm md:text-base leading-relaxed italic font-bold">
                  Consulta tus estados de cuenta y gana premios con DITEC.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full max-w-[420px] mx-auto z-10">
            <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,31,63,0.08)] border border-white overflow-hidden relative">
                
                {step === 'formulario' && (
                  <>
                    <div className="flex border-b border-slate-100">
                      <button onClick={() => setModo('login')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'login' ? 'bg-white text-[#001F3F] border-b-2 border-[#FFB800]' : 'bg-slate-50 text-slate-400'}`}>Ya tengo clave</button>
                      <button onClick={() => {setModo('registro'); setPassword('');}} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'registro' ? 'bg-white text-[#001F3F] border-b-2 border-[#FFB800]' : 'bg-slate-50 text-slate-400'}`}>Soy Nuevo / Activar</button>
                    </div>

                    <div className="p-8 md:p-10">
                      <form onSubmit={manejarFlujoPrincipal} className="space-y-5">
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Cédula</label>
                          <input type="text" maxLength={10} value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))} placeholder="0000000000" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F]" required />
                        </div>

                        {modo === 'login' && (
                          <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F]" required />
                          </div>
                        )}

                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-left">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={aceptaPrivacidad} onChange={() => setAceptaPrivacidad(!aceptaPrivacidad)} className="mt-1 w-4 h-4 accent-[#001F3F] cursor-pointer" />
                            <span className="text-[9px] text-slate-400 font-bold leading-tight uppercase tracking-tight">Acepto la <button type="button" onClick={() => setShowModal(true)} className="text-[#001F3F] underline decoration-[#FFB800]">POLÍTICA DE DATOS</button></span>
                          </label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl bg-[#001F3F] text-[#FFB800] transition-all active:scale-[0.98]">
                          {loading ? 'Procesando...' : (modo === 'login' ? 'Ingresar ➔' : 'Verificar Cliente ➔')}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {step === 'confirm_activation' && (
                  <div className="p-10 text-center space-y-6 animate-fadeIn">
                    <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">👋</div>
                    <h3 className="text-xl font-black text-[#001F3F] uppercase italic">¡Hola, {clienteNombre}!</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase tracking-tight text-xs">Hemos detectado que eres cliente registrado en el sistema. ¿Deseas activar tu cuenta web ahora?</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button onClick={() => setStep('formulario')} className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all">No, luego</button>
                        <button onClick={() => setStep('change_password')} className="py-3.5 bg-[#001F3F] text-[#FFB800] rounded-xl font-black uppercase text-[10px] tracking-wider transition-all shadow-md">Sí, Activar</button>
                    </div>
                  </div>
                )}

                {step === 'change_password' && (
                  <div className="p-10 text-left animate-fadeIn">
                    <form onSubmit={manejarActivacionClave} className="space-y-5">
                      <h3 className="text-lg font-black text-[#001F3F] uppercase italic border-b border-slate-100 pb-2">Establecer Nueva Clave</h3>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nueva Contraseña</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-lg font-bold text-[#001F3F]" required />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] bg-[#001F3F] text-[#FFB800] shadow-xl transition-all active:scale-[0.98]">
                          Guardar e Ingresar ➔
                      </button>
                    </form>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showModal && (
        <div className="fixed inset-0 bg-[#001F3F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl border border-white">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-[#001F3F] font-black text-xl transition-colors">✕</button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
              <h2 className="text-xl font-black uppercase italic text-[#001F3F] tracking-tight">Política de Privacidad y Protección de Datos Personales</h2>
            </div>
            <div className="max-h-64 overflow-y-auto text-[10px] text-slate-500 pr-4 space-y-4 leading-relaxed custom-scrollbar text-justify font-medium uppercase tracking-wide">
              <p className="italic font-black text-[#001F3F]">DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</p>
              <p>En cumplimiento de la Ley Orgánica de Protección de Datos Personales, sus datos serán tratados para las finalidades de: evaluación de crédito, gestión contractual, facturación y cobranza.</p>
              <p>Al ingresar, usted autoriza el tratamiento de sus datos conforme a nuestra política oficial disponible en la web. Puede ejercer sus derechos de acceso o rectificación escribiendo a: <strong className="text-[#001F3F]">protecciondedatos@ditec-ec.com</strong>.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-8">
                <button onClick={() => { setAceptaPrivacidad(true); setShowModal(false); }} className="w-full py-4 bg-[#001F3F] text-[#FFB800] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg">Aceptar Política y Continuar</button>
                <Link href="/politica-privacidad" className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-2 hover:text-[#001F3F] transition-colors">Ver documento completo ➔</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}