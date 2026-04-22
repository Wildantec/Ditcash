'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampana } from '@/app/actions/campanas'

export default function NuevaCampanaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false) 

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Llamamos a la Server Action de Prisma
    const res = await createCampana(formData)

    if (res?.error) {
      alert("Error: " + res.error)
      setLoading(false)
    } else {
      // Redirigimos al control de campañas
      router.push('/dashboard/admin/campanas')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-[550px] rounded-[3.5rem] p-12 shadow-xl border border-slate-100">
        <h2 className="text-3xl font-bold text-[#001F3F] mb-10 tracking-tighter italic text-center">Nueva Campaña</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
            <input name="nombre" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#FF8C00]" required placeholder="Ej: CAMPAÑA OTOÑO" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Indicaciones / Detalle</label>
            <textarea 
              name="detalle" 
              rows={3}
              placeholder="Escribe aquí las instrucciones para los vendedores..."
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#FF8C00] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Inicio</label>
              <input name="fecha_inicio" type="date" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F]" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-4">Cierre</label>
              <input name="fecha_cierre" type="date" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-red-500" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Estado Inicial</label>
            <select name="estado" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] appearance-none outline-none focus:ring-2 focus:ring-[#FF8C00]">
              <option value="Activa">ACTIVA</option>
              <option value="Pausada">PAUSADA</option>
            </select>
          </div>

          <div className="flex justify-end gap-6 pt-6">
            <button type="button" onClick={() => router.back()} className="text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:text-red-500">Cancelar</button>
            <button disabled={loading} className="bg-[#001F3F] text-[#FF8C00] px-10 py-5 rounded-[1.8rem] font-bold text-[11px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
              {loading ? 'Guardando...' : 'Crear Campaña ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}