'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampana } from '@/app/actions/campanas'
import Swal from 'sweetalert2'
import { Rocket, Loader2 } from 'lucide-react'

export default function NuevaCampanaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false) 

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createCampana(formData)

    if (res?.error) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
        text: res.error,
        icon: 'error',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'ENTENDIDO'
      })
      setLoading(false)
    } else {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡CAMPAÑA CREADA!</span>',
        text: 'La nueva estrategia operacional ha sido guardada en MySQL.',
        icon: 'success',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'CONTINUAR'
      }).then(() => {
        router.push('/dashboard/admin/campanas')
        router.refresh()
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-[#001F3F]">
      <div className="bg-white w-full max-w-[550px] rounded-[3.5rem] p-12 shadow-xl border border-slate-100 animate-fadeIn">
        <header className="mb-10 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner mb-2">
            <Rocket size={20} strokeWidth={2.5} className="text-[#FFB800]" />
          </div>
          <h2 className="text-3xl font-black text-[#001F3F] tracking-tighter italic uppercase leading-none">Nueva Campaña</h2>
          <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.4em] mt-1">DITCASH - Inicializar Registro</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre de la Campaña</label>
            <input 
              name="nombre" 
              type="text"
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs uppercase text-[#001F3F] focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner tracking-wider" 
              required 
              placeholder="EJ: CAMPAÑA EVIDENCIAS OTOÑO" 
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest ml-4">Valor por Evidencia ($)</label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-[#001F3F] text-sm">$</span>
              <input 
                name="valor" 
                type="number" 
                step="0.01" 
                min="0"
                defaultValue="2.00"
                className="w-full px-12 py-4 bg-amber-50/30 border border-amber-100 rounded-[1.8rem] font-black text-sm text-[#001F3F] focus:outline-none focus:border-[#FFB800] transition-all shadow-inner font-mono tracking-widest" 
                required 
                placeholder="0.00" 
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Indicaciones / Detalle</label>
            <textarea 
              name="detalle" 
              rows={3}
              placeholder="ESCRIBA AQUÍ LAS INSTRUCCIONES OPERACIONALES PARA LOS VENDEDORES..."
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-bold text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner resize-none tracking-wide placeholder:text-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Inicio</label>
              <input 
                name="fecha_inicio" 
                type="date" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] focus:outline-none focus:bg-white cursor-pointer shadow-inner font-mono tracking-widest" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-4">Cierre</label>
              <input 
                name="fecha_cierre" 
                type="date" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-red-500 focus:outline-none focus:bg-white cursor-pointer shadow-inner font-mono tracking-widest" 
                required 
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado Inicial</label>
            <select 
              name="estado" 
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] tracking-widest cursor-pointer shadow-inner appearance-none"
            >
              <option value="Activa">ACTIVA</option>
              <option value="Pausada">PAUSADA</option>
            </select>
          </div>
          <div className="flex justify-end gap-6 pt-4 items-center">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors pb-0.5 border-b-2 border-transparent hover:border-red-500"
            >
              Cancelar
            </button>
            <button 
              disabled={loading} 
              className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] px-8 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" strokeWidth={2.5} />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Crear Campaña ➔</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}