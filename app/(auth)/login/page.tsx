'use client'
import { useState } from 'react'
import { loginAction } from '@/app/actions/login'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false) // <--- Estado para los términos

  async function handleForm(formData: FormData) {
    if (!aceptaTerminos) return; // Seguridad extra
    
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
            {/* LOGO DE DITEC DESDE /PUBLIC */}
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
            <h1 className="text-2xl font-black text-[#001F3F] italic tracking-tighter leading-none uppercase">
              DIT<span className="text-[#FFB800]">CASH</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic opacity-60">
              Sistema de Gestión
            </p>
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
                Acepto los <span className="text-[#001F3F] underline">términos de uso</span> y la política de veracidad de datos de Ditec.
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading || !aceptaTerminos} // <--- Deshabilitado si no acepta
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

          <footer className="mt-10 text-center flex flex-col gap-2">
            <Link 
              href="/" 
              className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-[#FFB800] transition-colors italic"
            >
              ¿Olvidaste tu acceso? Contacta a Soporte
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}