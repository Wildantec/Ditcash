'use client'
import { useState, useEffect, useCallback } from 'react'
import { getPremios } from '@/app/actions/premios'
import { getSaldoVendedorAction } from '@/app/actions/vendedores'
import Link from 'next/link'
import Swal from 'sweetalert2'

export default function PantallaPremiosVendedor() {
  const [premios, setPremios] = useState<any[]>([])
  const [saldo, setSaldo] = useState(0)
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      const [listaPremios, saldoActual] = await Promise.all([
        getPremios(),
        getSaldoVendedorAction()
      ])
      setPremios(listaPremios || [])
      setSaldo(saldoActual || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleCanjear = (premio: any) => {
    if (saldo < premio.puntos) {
      Swal.fire({
        title: 'Saldo insuficiente',
        text: `Aún te faltan $${(premio.puntos - saldo).toFixed(2)} para este premio.`,
        icon: 'info',
        confirmButtonColor: '#001F3F'
      })
      return
    }

    Swal.fire({
      title: `¿Confirmar Canje?`,
      text: `Solicitarás el premio: ${premio.nombre} por $${premio.puntos}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#001F3F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, solicitar',
      cancelButtonText: 'Volver'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Solicitud Enviada', 'El administrador procesará tu canje pronto.', 'success')
      }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-black text-[#001F3F] text-[12px] uppercase tracking-[0.4em] animate-pulse">
      Cargando catálogo...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-[#001F3F]">
      
      {/* HEADER LIMPIO Y PROFESIONAL */}
      <header className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFB800]" />
        
        <div className="flex items-center gap-6">
          <Link href="/dashboard/vendedor" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl hover:bg-[#001F3F] hover:text-white transition-all shadow-sm border border-slate-100">
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Catálogo de Premios</h1>
          </div>
        </div>

        <div className="bg-slate-50 px-10 py-6 rounded-[1.5rem] border border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tu Saldo Disponible</p>
          <p className="text-4xl font-black italic text-[#001F3F]">
            <span className="text-[#FFB800] text-xl mr-1">$</span>{saldo.toFixed(2)}
          </p>
        </div>
      </header>

      {/* GRILLA DE PREMIOS ESTILO TARJETAS PROFESIONALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {premios.map((p) => {
          const valorPremio = Number(p.puntos);
          const progreso = Math.min((saldo / valorPremio) * 100, 100);
          const faltante = Math.max(valorPremio - saldo, 0);

          return (
            <div key={p.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-[480px]">
              
              {/* Imagen */}
              <div className="h-48 bg-slate-50 relative overflow-hidden">
                <img 
                  src={p.urlImagen} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={p.nombre} 
                />
                {progreso >= 100 && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest animate-pulse">
                    Disponible
                  </div>
                )}
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#001F3F] leading-tight mb-3 line-clamp-2 italic">
                    {p.nombre}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                    {p.descripcion || "Canjea este beneficio acumulando tus validaciones diarias aprobadas."}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Progreso del objetivo
                    </p>
                    <p className="text-lg font-black italic text-[#001F3F]">
                      <span className="text-[#FFB800] text-xs">$</span>{valorPremio.toFixed(0)}
                    </p>
                  </div>

                  {/* Barra de Progreso Minimalista */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 rounded-full ${progreso >= 100 ? 'bg-green-500' : 'bg-[#001F3F]'}`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>

                  {/* Botón de Canje Principal */}
                  <button 
                    onClick={() => handleCanjear(p)}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      progreso >= 100 
                        ? 'bg-[#001F3F] text-[#FFB800] shadow-xl hover:bg-[#FFB800] hover:text-[#001F3F]' 
                        : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                    }`}
                  >
                    {progreso >= 100 ? 'Canjear ahora' : `Faltan $${faltante.toFixed(0)}`}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}