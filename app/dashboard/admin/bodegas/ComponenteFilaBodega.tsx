'use client'

import { useState, useTransition } from 'react'
import { toggleBodegaPrincipal } from '@/app/actions/bodegas'

interface FilaProps {
  id: string
  name: string
  isMainInicial: boolean
}

export default function ComponenteFilaBodega({ id, name, isMainInicial }: FilaProps) {
  const [esPrincipal, setEsPrincipal] = useState(isMainInicial)
  const [isPending, startTransition] = useTransition()

  const handleChange = (checked: boolean) => {
    setEsPrincipal(checked)
    
    // Disparamos la acción asíncrona hacia el backend de forma optimista
    startTransition(async () => {
      const res = await toggleBodegaPrincipal(id, checked)
      if (!res.success) {
        // Si por alguna razón falla la base de datos, revertimos el checkbox visual
        setEsPrincipal(!checked)
        alert("Ocurrió un inconveniente al actualizar el estado de la bodega.")
      }
    })
  }

  return (
    <div className="flex items-center justify-between px-8 py-5 hover:bg-slate-50/60 transition-colors">
      <div className="space-y-0.5">
        <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
          ID Contable Araujos: {id}
        </p>
        <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
          {name}
        </p>
      </div>
      
      <label className="inline-flex items-center cursor-pointer gap-3 select-none">
        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
          isPending ? 'text-blue-500 animate-pulse' : esPrincipal ? 'text-amber-500' : 'text-slate-400'
        }`}>
          {isPending ? 'Guardando...' : esPrincipal ? 'Bodega Principal' : 'Bodega Secundaria'}
        </span>
        <input 
          type="checkbox" 
          checked={esPrincipal}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        />
      </label>
    </div>
  )
}