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
      
      <main className="flex-grow flex flex-col items-center justify-start px-4 py-6 md:py-16 relative overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start z-10">
          
          {/* SECCIÓN 1: BANNER (En celular va de PRIMERO 'order-1', en PC va a la izquierda 'lg:order-1') */}
          <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-left duration-1000 order-1 lg:order-1 w-full">
            {/* Contenedor del Banner optimizado para que la imagen NUNCA se recorte (object-contain y h-auto) */}
            <div className="w-full overflow-hidden rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 bg-white p-2">
              <img 
                src="/Banner.png" 
                alt="DITEC Banner" 
                className="w-full h-auto object-contain rounded-[1.1rem] md:rounded-[1.6rem] hover:scale-[1.01] transition-transform duration-500"
              />
            </div>

            {/* Este bloque informativo se oculta en móviles dentro de esta columna para poder ordenarlo al final de todo */}
            <div className="hidden lg:block space-y-3 pl-2">
              <p className="text-slate-600 text-sm md:text-base leading-relaxed font-bold">
                Brindamos soluciones accesibles sin comprometer la calidad.
              </p>
              <div className="border-l-4 border-[#FFB800] pl-4 py-1">
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed italic font-bold">
                  Consulta tus estados de cuenta y gana premios con DITEC.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FORMULARIO DE ACCESOS (En celular va de SEGUNDO 'order-2', en PC va a la derecha 'lg:order-2') */}
          <div className="lg:col-span-5 w-full max-w-[400px] mx-auto lg:mx-0 lg:ml-auto z-10 order-2 lg:order-2">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,31,63,0.06)] md:shadow-[0_40px_80px_rgba(0,31,63,0.08)] border border-slate-50 overflow-hidden relative">
                
                {step === 'formulario' && (
                  <>
                    <div className="flex border-b border-slate-100">
                      <button onClick={() => setModo('login')} className={`flex-1 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'login' ? 'bg-white text-[#001F3F] border-b-2 border-[#FFB800]' : 'bg-slate-50 text-slate-400'}`}>Ya tengo clave</button>
                      <button onClick={() => {setModo('registro'); setPassword('');}} className={`flex-1 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${modo === 'registro' ? 'bg-white text-[#001F3F] border-b-2 border-[#FFB800]' : 'bg-slate-50 text-slate-400'}`}>Soy Nuevo / Activar</button>
                    </div>

                    <div className="p-6 md:p-10">
                      <form onSubmit={manejarFlujoPrincipal} className="space-y-4 md:space-y-5">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Cédula</label>
                          <input type="text" maxLength={10} value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))} placeholder="0000000000" className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-base md:text-lg font-bold text-[#001F3F]" required />
                        </div>

                        {modo === 'login' && (
                          <div className="space-y-1.5 text-left">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-base md:text-lg font-bold text-[#001F3F]" required />
                          </div>
                        )}

                        <div className="bg-slate-50/50 p-3.5 md:p-4 rounded-2xl border border-slate-100 text-left">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={aceptaPrivacidad} onChange={() => setAceptaPrivacidad(!aceptaPrivacidad)} className="mt-1 w-4 h-4 accent-[#001F3F] cursor-pointer" />
                            <span className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-tight uppercase tracking-tight">Acepto la <button type="button" onClick={() => setShowModal(true)} className="text-[#001F3F] underline decoration-[#FFB800]">POLÍTICA DE DATOS</button></span>
                          </label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg bg-[#001F3F] text-[#FFB800] transition-all active:scale-[0.98] text-xs md:text-sm">
                          {loading ? 'Procesando...' : (modo === 'login' ? 'Ingresar ➔' : 'Verificar Cliente ➔')}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {step === 'confirm_activation' && (
                  <div className="p-8 md:p-10 text-center space-y-5 md:space-y-6 animate-fadeIn">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto text-xl md:text-2xl shadow-inner">👋</div>
                    <h3 className="text-lg md:text-xl font-black text-[#001F3F] uppercase italic">¡Hola, {clienteNombre}!</h3>
                    <p className="text-slate-500 text-[11px] md:text-xs font-medium leading-relaxed uppercase tracking-tight">Hemos detectado que eres cliente registrado en el sistema. ¿Deseas activar tu cuenta web ahora?</p>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 pt-1">
                        <button onClick={() => setStep('formulario')} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-wider transition-all">No, luego</button>
                        <button onClick={() => setStep('change_password')} className="py-3 bg-[#001F3F] text-[#FFB800] rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-wider transition-all shadow-md">Sí, Activar</button>
                    </div>
                  </div>
                )}

                {step === 'change_password' && (
                  <div className="p-8 md:p-10 text-left animate-fadeIn">
                    <form onSubmit={manejarActivacionClave} className="space-y-4 md:space-y-5">
                      <h3 className="text-base md:text-lg font-black text-[#001F3F] uppercase italic border-b border-slate-100 pb-2">Establecer Nueva Clave</h3>
                      <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nueva Contraseña</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB800] text-base md:text-lg font-bold text-[#001F3F]" required />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] bg-[#001F3F] text-[#FFB800] shadow-lg transition-all active:scale-[0.98] text-xs md:text-sm">
                          Guardar e Ingresar ➔
                      </button>
                    </form>
                  </div>
                )}
            </div>
          </div>

          {/* SECCIÓN 3: TEXTOS INFORMATIVOS (En celular se muestra de TERCERO 'order-3', se oculta en PC para evitar duplicaciones) */}
          <div className="block lg:hidden w-full text-center space-y-4 px-4 order-3">
            <p className="text-slate-600 text-xs leading-relaxed font-extrabold uppercase tracking-tight">
              Brindamos soluciones accesibles sin comprometer la calidad.
            </p>
            <div className="border-t border-slate-200 pt-3 max-w-xs mx-auto">
              <p className="text-slate-400 text-[10px] leading-relaxed italic font-bold uppercase tracking-tight">
                Consulta tus estados de cuenta y gana premios con DITEC.
              </p>
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