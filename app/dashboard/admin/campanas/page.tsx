'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCampanas, deleteCampana } from '@/app/actions/campanas'
import Swal from 'sweetalert2'

interface Campana {
  id: number;
  nombre: string;
  descripcion: string | null;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  activa: boolean;
  valor?: number; // Añadimos el campo opcional para evitar errores de tipado
}

export default function ControlCampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const cargarCampanas = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllCampanas()
      if (data) setCampanas(data as Campana[])
    } catch (error) {
      console.error("Error al cargar campañas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCampanas()
  }, [cargarCampanas])

  const eliminarCampana = async (id: number, nombre: string) => {
    const { isConfirmed } = await Swal.fire({
      title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase;">¿Eliminar Campaña?</span>',
      text: `Esta acción borrará: ${nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonText: 'CANCELAR'
    })

    if (isConfirmed) {
      const res = await deleteCampana(id)
      if (res.error) {
        Swal.fire('Error', res.error, 'error')
      } else {
        await cargarCampanas()
        Swal.fire('¡Eliminado!', '', 'success')
      }
    }
  }

  return (
    <div className="p-4 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      
      {/* HEADER SUPERIOR RESPONSIVE */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 pb-4 border-b border-slate-200">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Control de Campañas</h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mt-1">Configuración y periodos DITCASH</p>
        </div>
        
        <Link href="/dashboard/admin/campanas/nueva" className="w-full sm:w-auto">
          <button className="w-full bg-[#001F3F] text-[#FFB800] px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
            <span className="text-lg">+</span> Nueva Campaña
          </button>
        </Link>
      </header>

      {/* VISTA PARA ESCRITORIO (TABLA) */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-[#001F3F] text-white text-[9px] font-bold uppercase tracking-[0.2em]">
              <th className="w-[18%] px-8 py-6">Campaña</th>
              <th className="w-[27%] px-8 py-6">Indicaciones</th>
              <th className="w-[12%] px-6 py-6 text-center">Recompensa</th>
              <th className="w-[15%] px-6 py-6 text-center">Vigencia</th>
              <th className="w-[10%] px-6 py-6 text-center">Estado</th>
              <th className="w-[18%] px-8 py-6 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campanas.map((c) => (
              <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6 align-top">
                  <p className="text-[13px] font-black text-[#001F3F] uppercase tracking-tight group-hover:text-[#FFB800] transition-colors leading-tight">
                    {c.nombre}
                  </p>
                  <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest mt-1">ID: #{c.id}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="max-h-[100px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed whitespace-pre-line">
                      {c.descripcion || 'Sin especificaciones...'}
                    </p>
                  </div>
                </td>
                {/* COLUMNA DE VALOR */}
                <td className="px-6 py-6 align-top text-center">
                   <div className="inline-block bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                      <p className="text-[14px] font-black text-[#FF8C00] italic leading-none">
                        ${Number(c.valor || 0).toFixed(2)}
                      </p>
                      <p className="text-[7px] font-bold text-[#FF8C00] uppercase mt-1">X Foto</p>
                   </div>
                </td>
                <td className="px-6 py-6 align-top">
                  <div className="flex flex-col items-center justify-center bg-slate-50 py-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-[#001F3F]">
                      {c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString() : '--/--/--'}
                    </span>
                    <span className="text-[7px] font-black text-[#FFB800] uppercase my-1">AL</span>
                    <span className="text-[10px] font-black text-red-500">
                      {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : '--/--/--'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center align-top">
                  <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest inline-block ${
                    c.activa ? 'bg-green-500 text-white shadow-md shadow-green-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right align-top">
                  <div className="flex justify-end items-center gap-4">
                    <Link href={`/dashboard/admin/campanas/editar/${c.id}`}>
                      <button className="text-[9px] font-black text-[#001F3F] uppercase hover:text-[#FFB800] transition-all tracking-widest">
                        EDITAR
                      </button>
                    </Link>
                    <button 
                      onClick={() => eliminarCampana(c.id, c.nombre)}
                      className="text-[9px] font-black text-red-400 uppercase hover:text-red-600 transition-all tracking-widest"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA PARA MÓVIL Y TABLET (TARJETAS) */}
      <div className="lg:hidden flex flex-col gap-6">
        {campanas.map((c) => (
          <div key={c.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-[#001F3F] uppercase italic leading-tight">{c.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">ID: #{c.id}</span>
                   <span className="text-[9px] font-black text-[#FF8C00] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                     ${Number(c.valor || 0).toFixed(2)}
                   </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase ${
                c.activa ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-4 max-h-[150px] overflow-y-auto">
              <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-line">
                {c.descripcion || 'Sin especificaciones...'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="text-center">
                  <p className="text-[7px] font-bold text-slate-400 uppercase">Inicio</p>
                  <p className="text-[10px] font-black">{new Date(c.fechaInicio).toLocaleDateString()}</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[7px] font-bold text-slate-400 uppercase">Fin</p>
                  <p className="text-[10px] font-black text-red-500">{new Date(c.fechaFin).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Link href={`/dashboard/admin/campanas/editar/${c.id}`} className="text-[9px] font-black text-[#001F3F] uppercase tracking-tighter">Editar</Link>
                <button onClick={() => eliminarCampana(c.id, c.nombre)} className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ESTADOS CARGANDO/VACÍO */}
      {loading && campanas.length === 0 && (
        <div className="p-14 text-center">
          <div className="w-8 h-8 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Sincronizando DITEC...</p>
        </div>
      )}
      
      {!loading && campanas.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">No existen campañas registradas actualmente.</p>
        </div>
      )}
    </div>
  )
}