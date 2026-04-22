'use client'
import { useState } from 'react'
import { loginAction } from '@/app/actions/login'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleForm(formData: FormData) {
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
      {/* Círculos decorativos de fondo para mantener el estilo visual */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#D4AF37] opacity-10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-white opacity-5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-white/20">
          
          <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#001F3F] italic tracking-tighter mb-2">
              DIT<span className="text-[#D4AF37]">CASH</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
              Sistema de Evidencias
            </p>
          </header>

          <form action={handleForm} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl text-[11px] font-bold uppercase text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                Usuario (Cédula)
              </label>
              <input 
                name="cedula"
                type="text"
                placeholder="0000000000"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#D4AF37] font-bold text-[#001F3F] transition-all placeholder:text-slate-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                Contraseña
              </label>
              <input 
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#D4AF37] font-bold text-[#001F3F] transition-all placeholder:text-slate-300"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#001F3F] text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#D4AF37] hover:text-[#001F3F] transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Validando...' : 'Ingresar al Dashboard ➔'}
            </button>
          </form>

          <footer className="mt-10 text-center">
            <Link 
              href="/" 
              className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
            >
              Volver al inicio
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}