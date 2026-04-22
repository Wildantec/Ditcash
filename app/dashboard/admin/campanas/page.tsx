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
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      
      {/* HEADER SUPERIOR */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Control de Campañas</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Configuración y periodos DITCASH</p>
        </div>
        
        <Link href="/dashboard/admin/campanas/nueva">
          <button className="bg-[#001F3F] text-[#FFB800] px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <span className="text-lg">+</span> Nueva Campaña
          </button>
        </Link>
      </header>

      {/* TABLA PROFESIONAL */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* HEADER CON EL AZUL DE DITEC */}
              <tr className="bg-[#001F3F] text-white">
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Campaña</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Indicaciones</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Periodo de Vigencia</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Estado</th>
                <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campanas.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6">
                    <p className="text-[13px] font-black text-[#001F3F] uppercase tracking-tight group-hover:text-[#FFB800] transition-colors">
                      {c.nombre}
                    </p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter mt-0.5">ID Registro: #{c.id}</p>
                  </td>
                  <td className="px-8 py-6 max-w-[250px]">
                    <p className="text-[12px] text-slate-500 font-medium italic leading-tight">
                      {c.descripcion || 'Sin especificaciones...'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center justify-center bg-slate-50 py-2 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-[#001F3F]">
                        {c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString() : '--/--/--'}
                      </span>
                      <span className="text-[8px] font-bold text-[#FFB800] uppercase leading-none my-1">AL</span>
                      <span className="text-[11px] font-black text-red-500">
                        {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : '--/--/--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block shadow-sm ${
                      c.activa 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {c.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end items-center gap-6">
                      <Link href={`/dashboard/admin/campanas/editar/${c.id}`}>
                        <button className="text-[10px] font-black text-[#001F3F] uppercase hover:text-[#FFB800] transition-colors tracking-widest border-b-2 border-transparent hover:border-[#FFB800] pb-1">
                          Editar
                        </button>
                      </Link>
                      <button 
                        onClick={() => eliminarCampana(c.id, c.nombre)}
                        className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors tracking-widest border-b-2 border-transparent hover:border-red-600 pb-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOADING & EMPTY STATES */}
        {loading && campanas.length === 0 && (
          <div className="p-14 text-center animate-pulse">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Cargando base de datos Ditec...</p>
          </div>
        )}
        
        {!loading && campanas.length === 0 && (
          <div className="p-20 text-center bg-slate-50">
            <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">No existen campañas registradas actualmente.</p>
          </div>
        )}
      </div>
    </div>
  )
}