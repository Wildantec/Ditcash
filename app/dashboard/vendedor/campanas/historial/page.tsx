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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-[#001F3F]">
      
      {/* HEADER SUPERIOR */}
      <header className="mb-8 md:mb-10 pb-4 border-b border-slate-200 text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Historial de Campañas</h1>
        <p className="text-slate-400 font-bold mt-1 text-[10px] md:text-[11px] uppercase tracking-[0.2em] opacity-70">
          Rendimiento y ganancias acumuladas en Ditec
        </p>
      </header>

      {/* VISTA PARA ESCRITORIO (TABLA PRO) */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
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
                    <p className="font-black text-[15px] tracking-tight uppercase text-[#001F3F] group-hover:text-[#FFB800] transition-colors leading-tight">
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
                      {Number(item.total_acumulado).toFixed(2)}
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

      {/* VISTA PARA MÓVIL (TARJETAS) */}
      <div className="lg:hidden space-y-4">
        {datos.length > 0 ? datos.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-[14px] uppercase italic text-[#001F3F] leading-tight mb-1">{item.nombre}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.fecha_inicio} - {item.fecha_cierre}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${item.estado === 'Activa' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${item.estado === 'Activa' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{item.estado}</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ganancia Acumulada</p>
                <p className="text-2xl font-black text-[#001F3F] italic tracking-tighter">
                  <span className="text-[#FFB800] text-sm mr-0.5">$</span>
                  {Number(item.total_acumulado).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus</p>
                 <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{item.puesto}</span>
              </div>
            </div>

            <Link href={`/dashboard/vendedor/campanas/${item.id}`}>
              <button className="w-full bg-[#001F3F] text-[#FFB800] py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-md">
                Ver Detalles de Gestión ➔
              </button>
            </Link>
          </div>
        )) : (
          <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sin historial disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}