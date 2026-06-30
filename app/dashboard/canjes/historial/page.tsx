'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, Check } from 'lucide-react'
import { getHistorialEntregas } from '@/app/actions/premios'
import Link from 'next/link'

export default function HistorialEntregasAdmin() {
  const [vendedoresAuditados, setVendedoresAuditados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const procesarEstructuraAgrupada = useCallback((canjes: any[]) => {
    const mapa: { [key: number]: any } = {}

    canjes.forEach((item) => {
      const vId = item.vendedor.id
      if (!mapa[vId]) {
        mapa[vId] = {
          id: vId,
          nombre: item.vendedor.nombre,
          cedula: item.vendedor.cedula,
          saldoGastado: Number(item.vendedor.saldoGastado) || 0,
          puntosAcumulados: Number(item.vendedor.puntosAcumulados) || 0,
          pendientesCount: 0,
        }
      }
      if (!item.urlEvidencia) {
        mapa[vId].pendientesCount += 1
      }
    })

    return Object.values(mapa)
  }, [])

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getHistorialEntregas()
      const agrupados = procesarEstructuraAgrupada(data || [])
      setVendedoresAuditados(agrupados)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [procesarEstructuraAgrupada])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-[#001F3F] font-black text-[11px] uppercase tracking-[0.2em] bg-[#F8FAFC] min-h-screen">
        <Loader2 className="animate-spin text-[#FFB800]" size={28} strokeWidth={2.5} />
        <span>Sincronizando Módulo de Auditoría...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
          <Search className="text-[#FFB800]" size={24} strokeWidth={3} /> GESTIÓN DE CANJES
        </h1>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">
          CONTROL DE INCENTIVOS Y AUDITORÍA
        </p>
      </header>

      {vendedoresAuditados.length > 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-[#001F3F] text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-12 py-5 w-[30%] rounded-tl-[2.5rem]">VENDEDOR</th>
                  <th className="px-6 py-5 w-[25%] text-center">AUDITORÍA</th>
                  <th className="px-6 py-5 w-[25%] text-center">SALDO</th>
                  <th className="px-12 py-5 w-[20%] text-center rounded-tr-[2.5rem]">GESTIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {vendedoresAuditados.map((v) => {
                  const saldoDisponible = v.puntosAcumulados - v.saldoGastado
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-12 py-6 align-middle truncate">
                        <div className="font-black text-sm uppercase tracking-tight text-[#001F3F]">{v.nombre}</div>
                        {v.cedula && <div className="text-[10px] text-slate-400 font-bold mt-0.5">CI: {v.cedula}</div>}
                      </td>
                      <td className="px-6 py-6 align-middle text-center">
                        {v.pendientesCount > 0 ? (
                          <span className="px-4 py-2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {v.pendientesCount} PENDIENTES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            AL DÍA <Check size={12} className="text-blue-500" strokeWidth={3} />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 align-middle text-center font-black text-sm text-[#001F3F]">
                        ${saldoDisponible.toFixed(2)}
                      </td>
                      <td className="px-12 py-6 align-middle text-center">
                        <Link href={`/dashboard/canjes/historial/${v.id}`}>
                          <button className={`px-6 py-3 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm active:scale-95 ${
                            v.pendientesCount > 0 
                              ? 'bg-[#FFB800] text-[#001F3F] hover:bg-black hover:text-[#FFB800] animate-pulse' 
                              : 'bg-[#F1F5F9] text-[#001F3F] hover:bg-[#001F3F] hover:text-white'
                          }`}>
                            {v.pendientesCount > 0 ? 'AUDITAR AHORA' : 'DETALLES'}
                          </button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">No se registran solicitudes de canje.</p>
        </div>
      )}
    </div>
  )
}