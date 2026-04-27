'use client'
import { useState } from 'react'
import { loginAction } from '@/app/actions/login'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [showModal, setShowModal] = useState(false) 

  async function handleForm(formData: FormData) {
    if (!aceptaTerminos) return; 
    
    setLoading(true)
    setError(null)
    
    const result = await loginAction(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#001F3F] p-6 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#FFB800] opacity-10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-white opacity-5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-white/20">
          
          <header className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo-ditec.png" 
                alt="Ditec Logo"
                width={180}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </header>

          <form action={handleForm} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase text-center animate-bounce">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">
                Usuario (Cédula)
              </label>
              <input 
                name="cedula"
                type="text"
                placeholder="Ingresa tu cédula"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#FFB800] font-bold text-[#001F3F] transition-all placeholder:text-slate-300 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">
                Contraseña
              </label>
              <input 
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#FFB800] font-bold text-[#001F3F] transition-all placeholder:text-slate-300 text-sm"
                required
              />
            </div>

            {/* CHECKBOX DE TÉRMINOS Y CONDICIONES */}
            <div className="flex items-start gap-3 px-2">
              <input 
                type="checkbox" 
                id="terminos"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#001F3F] cursor-pointer"
              />
              <label htmlFor="terminos" className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-tight cursor-pointer">
                Acepto la <button type="button" onClick={() => setShowModal(true)} className="text-[#001F3F] underline decoration-[#FFB800] decoration-2">POLITICA DE PRIVACIDAD</button> oficial de Ditec.
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading || !aceptaTerminos}
              className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                ${aceptaTerminos 
                  ? 'bg-[#001F3F] text-[#FFB800] hover:bg-[#FFB800] hover:text-[#001F3F]' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              {loading ? (
                <span className="animate-pulse">Validando...</span>
              ) : (
                'Ingresar ahora ➔'
              )}
            </button>
          </form>

          {/* FOOTER DEL LOGIN: SOLO BOTÓN REGRESAR */}
          <footer className="mt-10 text-center">
            <Link 
              href="/" 
              className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-[#001F3F] transition-colors flex items-center justify-center gap-2"
            >
              ← Volver al inicio
            </Link>
          </footer>
        </div>
      </div>

      {/* MODAL CON CONTENIDO OFICIAL WILDANTEC */}
      {showModal && (
        <div className="fixed inset-0 bg-[#001F3F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-[#001F3F] font-black text-xl"
            >✕</button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
              <h2 className="text-xl font-black uppercase italic text-[#001F3F]">Aviso de Privacidad</h2>
            </div>

            <div className="max-h-80 overflow-y-auto text-[10px] text-slate-500 pr-4 space-y-4 leading-relaxed custom-scrollbar">
              <p className="italic font-bold">Última actualización: Marzo 2026</p>
              
              <p><strong>DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</strong> (RUC: 1792490049001) informa sobre el tratamiento de sus datos personales conforme a la LOPDP.</p>
              
              <div>
                <p className="font-black text-[#001F3F] uppercase mb-1">¿Qué datos tratamos?</p>
                <p>Nombres, identificación, datos de contacto, datos económicos para evaluación de crédito y datos derivados de la relación contractual (evidencias de gestión).</p>
              </div>

              <div>
                <p className="font-black text-[#001F3F] uppercase mb-1">¿Para qué tratamos sus datos?</p>
                <p>Atender solicitudes, evaluar capacidad de pago, gestionar procesos contractuales, facturación, cobranza y prevención de fraude.</p>
              </div>

              <p className="bg-slate-50 p-3 rounded-xl border-l-4 border-[#FFB800] italic">
                Para conocer el detalle completo de nuestra política, bases legitimadoras y el ejercicio de sus derechos, haga clic en el botón de abajo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-8">
                <button 
                onClick={() => { setAceptaTerminos(true); setShowModal(false); }}
                className="w-full py-5 bg-[#001F3F] text-[#FFB800] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#FFB800] hover:text-[#001F3F] transition-all shadow-lg"
                >
                Aceptar y Continuar
                </button>
                
                <Link 
                href="/politica-privacidad"
                className="w-full py-4 text-center text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-[#FFB800] transition-colors"
                >
                Ver Política Completa ➔
                </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}