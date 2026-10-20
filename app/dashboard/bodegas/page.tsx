'use client'

import { useState, useEffect, useTransition } from 'react'
import { toggleBodegaPrincipal } from '@/app/actions/bodegas'
import ComponenteFilaBodega from './ComponenteFilaBodega'
import { Warehouse, Save, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface BodegaEstructura {
  id: string
  name: string
  is_main: boolean
}

export default function AdminBodegasPage() {
  const [listaBodegas, setListaBodegas] = useState<BodegaEstructura[]>([])
  const [cargando, setCargando] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function sincronizarLocaciones() {
      try {
        setCargando(true)
        const response = await fetch('/api/admin/bodegas/sincronizar')
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'No se pudieron sincronizar las bodegas.')
        }
        setListaBodegas(result.data)
      } catch (error) {
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    sincronizarLocaciones()
  }, [])

  const handleFilaChange = (id: string, checked: boolean) => {
    setListaBodegas(prev => prev.map(b => b.id === id ? { ...b, is_main: checked } : b))
  }

  const ejecutarGuardadoMasivo = () => {
    startTransition(async () => {
      try {
        let conErrores = false
        for (const bodega of listaBodegas) {
          const res = await toggleBodegaPrincipal(bodega.id, bodega.is_main)
          if (!res.success) conErrores = true
        }

        if (!conErrores) {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase;">¡BODEGAS GUARDADAS!</span>',
            text: 'Las ubicaciones principales se actualizaron en MySQL.',
            icon: 'success',
            confirmButtonColor: '#001F3F'
          })
        } else {
          Swal.fire('Atención', 'Hubo problemas con ciertos registros contables.', 'warning')
        }
      } catch {
        Swal.fire('Error', 'Fallo crítico de conexión.', 'error')
      }
    })
  }

  if (cargando) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-[#001F3F] font-black text-[11px] uppercase tracking-[0.2em]">
        <Loader2 className="animate-spin text-[#FFB800]" size={28} strokeWidth={2.5} />
        <span>Sincronizando Locaciones Contables...</span>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Warehouse className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Control de Bodegas
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Habilita qué bodegas sincronizadas de Araujos ven los vendedores</p>
        </div>
        <button
          onClick={ejecutarGuardadoMasivo}
          disabled={isPending || listaBodegas.length === 0}
          className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] text-[10px] font-black px-6 py-3.5 rounded-xl uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center gap-2"
        >
          <Save size={14} strokeWidth={2.5} />
          <span>{isPending ? 'Sincronizando Lote...' : 'Guardar Cambios'}</span>
        </button>
      </header>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Información Locación</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Código Interno</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Clasificación Operativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaBodegas.map((bodega) => (
                <tr key={bodega.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-[#FFB800] group-hover:text-white transition-all text-[#001F3F]">
                        <Warehouse size={16} strokeWidth={2.5} />
                      </div>
                      <p className="text-[13px] font-black uppercase tracking-tight text-[#001F3F]">{bodega.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-[12px] font-bold text-slate-400 tracking-widest font-mono">ID-{bodega.id}</p>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <ComponenteFilaBodega
                      id={bodega.id}
                      name={bodega.name}
                      isMainInicial={bodega.is_main}
                      disabled={isPending}
                      onChange={(checked) => handleFilaChange(bodega.id, checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
