'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getHistorialVendedor } from '@/app/actions/evidencias'

export default function HistorialRendimientoPage() {
  const [datos, setDatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarHistorial() {
      const res = await getHistorialVendedor()
      setDatos(res)
      setLoading(false)
    }
    cargarHistorial()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-black text-[#001F3F] text-[11px] uppercase tracking-[0.4em] animate-pulse">
      Sincronizando con DITCASH...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 text-[#001F3F]">
      
      {/* HEADER SUPERIOR */}
      <header className="mb-10 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Historial de Campañas</h1>
        <p className="text-slate-400 font-bold mt-1 text-[11px] uppercase tracking-[0.2em] opacity-70">
          Rendimiento y ganancias acumuladas en Ditec
        </p>
      </header>

      {/* TABLA ESTILO PRO */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* HEADER AZUL MARINO */}
              <tr className="bg-[#001F3F] text-[#FFB800]">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Campaña</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Dinero Ganado</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Estatus</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Estado</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datos.length > 0 ? datos.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-8">
                    <p className="font-black text-[15px] tracking-tight uppercase text-[#001F3F] group-hover:text-[#FFB800] transition-colors">
                      {item.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                        {item.fecha_inicio}
                      </span>
                      <span className="text-[9px] font-bold text-[#FFB800]">/</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                        {item.fecha_cierre}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-8 py-8 text-center">
                    <p className="text-xl font-black text-[#001F3F] italic tracking-tighter">
                      <span className="text-[#FFB800] text-sm mr-0.5">$</span>
                      {item.total_acumulado.toFixed(2)}
                    </p>
                  </td>

                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      item.total_acumulado > 0 
                      ? 'bg-blue-50 text-blue-600 border-blue-100' 
                      : 'bg-slate-50 text-slate-300 border-slate-100'
                    }`}>
                      {item.puesto}
                    </span>
                  </td>

                  <td className="px-8 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.estado === 'Activa' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        item.estado === 'Activa' ? 'text-green-600' : 'text-red-400'
                      }`}>
                        {item.estado}
                      </span>
                    </div>
                  </td>

                  <td className="px-10 py-8 text-right">
                    <Link href={`/dashboard/vendedor/campanas/${item.id}`}>
                      <button className="bg-[#001F3F] text-[#FFB800] px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#FFB800] hover:text-[#001F3F] transition-all shadow-md active:scale-95 border-b-2 border-[#FFB800]/20">
                        Ver Mi Gestión ➔
                      </button>
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.3em] italic opacity-50">
                      No tienes historial de participación aún
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}