'use client'
import { useState, useEffect, useCallback } from 'react'
import { getPremios, solicitarCanjeAction } from '@/app/actions/premios'
import { getSaldoVendedorAction } from '@/app/actions/vendedores'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import Swal from 'sweetalert2'

interface PantallaPremiosVendedorProps {
  accionesPermitidas: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  }
}

export default function PantallaPremiosVendedor({ accionesPermitidas }: PantallaPremiosVendedorProps) {
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
      console.error("Error al cargar premios:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleCanjear = async (premio: any) => {
    const valorPremio = Number(premio.puntos);

    if (saldo < valorPremio) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">SALDO INSUFICIENTE</span>',
        text: `Aún te faltan $${(valorPremio - saldo).toFixed(2)} para solicitar este premio.`,
        icon: 'info',
        confirmButtonColor: '#001F3F'
      })
      return
    }
    const confirmacion = await Swal.fire({
      title: `<span style="font-size:15px; font-weight:900; text-transform:uppercase; color:#001F3F; letter-spacing:0.02em;">¿CONFIRMAR SOLICITUD DE CANJE?</span>`,
      html: `
        <div style="text-align: left; font-size: 13px; color: #475569; line-height: 1.6;">
          <p>Solicitarás el premio:<br><span style="color:#001F3F; font-weight:900; text-transform:uppercase;">${premio.nombre}</span></p>
          <p style="margin-top: 10px;">Se debitarán <b>$${valorPremio.toFixed(2)}</b> de tu saldo disponible.</p>
          
          <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 14px 0;" />
          
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 12px;">
            <p style="color: #b45309; font-weight: 800; font-size: 10px; text-transform: uppercase; tracking-wider: 0.05em; margin: 0;">
              ⚠️ NOTA IMPORTANTE DE CONTROL OPERATIVO:
            </p>
            <p style="color: #78350f; font-size: 11px; font-weight: 600; margin: 4px 0 0 0; text-transform: uppercase; font-style: italic;">
              Esta solicitud entrará en cola de revisión para validación administrativa. Recuerda que los artículos del catálogo de incentivos son para uso personal y no deben confundirse ni mezclarse con el stock de productos asignados a tu bodega móvil para la venta regular.
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#001F3F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'SÍ, SOLICITAR CANJE',
      cancelButtonText: 'CANCELAR'
    })

    if (confirmacion.isConfirmed) {
      Swal.fire({
        title: 'Sincronizando con Ditec...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      })

      const res = await solicitarCanjeAction(premio.id)

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡SOLICITUD ENVIADA!</span>',
          text: 'Tu petición de canje ha sido registrada. El administrador la validará pronto.',
          confirmButtonColor: '#001F3F'
        })
        cargarDatos()
      } else {
        Swal.fire('Error', res.error || 'No se pudo procesar el canje', 'error')
      }
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-black text-[#001F3F] text-[12px] uppercase tracking-[0.4em] animate-pulse">
      Cargando catálogo...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 text-[#001F3F]">
      <header className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 shadow-xl border border-slate-100 mb-8 md:mb-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFB800]" />
        
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <Link href="/dashboard" className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-sm font-black text-[#001F3F] hover:bg-[#001F3F] hover:text-white transition-all shadow-sm shrink-0">
            ←
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none flex items-center gap-2">
              <Gift className="text-[#FFB800]" size={24} /> Catálogo de Premios
            </h1>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Beneficios corporativos acumulados por metas</p>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-4 md:px-10 md:py-6 rounded-[1.5rem] border border-slate-100 text-center w-full md:w-auto shadow-inner">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tu Saldo Disponible</p>
          <p className="text-2xl md:text-4xl font-black italic text-[#001F3F]">
            <span className="text-[#FFB800] text-xl mr-1">$</span>{saldo.toFixed(2)}
          </p>
        </div>
      </header>
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-[1.5rem] p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
        <div className="w-10 h-10 bg-[#FFB800] rounded-xl flex items-center justify-center text-[#001F3F] font-black text-sm shrink-0 shadow-sm">
          ⚠️
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
            Políticas de Canje e Inventario Corporativo Ditec
          </h4>
          <p className="text-[11px] font-bold text-amber-700/90 uppercase leading-tight tracking-wide">
            Toda solicitud de incentivos es auditada de forma interna antes de su despacho. Se recuerda al personal en ruta que los bienes del catálogo son de asignación directa y <span className="underline decoration-2 font-black text-amber-900">no pertenecen ni deben ser integrados</span> al stock de productos destinados para la venta en bodegas.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {premios.map((p) => {
          const valorPremio = Number(p.puntos);
          const progreso = Math.min((saldo / valorPremio) * 100, 100);
          const faltante = Math.max(valorPremio - saldo, 0);

          return (
            <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-md hover:shadow-xl transition-all group flex flex-col h-fit">
              
              <div className="aspect-video bg-slate-50 relative overflow-hidden border-b border-slate-100">
                <img 
                  src={p.urlImagen} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={p.nombre} 
                />
                {progreso >= 100 && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">
                    DISPONIBLE
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 flex-col space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-black uppercase text-[#001F3F] leading-tight italic tracking-tight">
                    {p.nombre}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                    {p.descripcion || "Canjea este beneficio acumulando tus validaciones."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta Requerida</p>
                    <p className="text-base md:text-lg font-black italic text-[#001F3F] font-mono">
                      <span className="text-[#FFB800] text-xs">$</span>{valorPremio.toFixed(2)}
                    </p>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${progreso >= 100 ? 'bg-emerald-500' : 'bg-[#001F3F]'}`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>

                  <button 
                    onClick={() => handleCanjear(p)}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 border min-h-[46px] ${
                      progreso >= 100 
                        ? 'bg-[#001F3F] text-[#FFB800] border-[#001F3F] hover:bg-black hover:text-[#FFB800]' 
                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    }`}
                  >
                    {progreso >= 100 ? 'Canjear ahora ➔' : `Faltan $${faltante.toFixed(0)}`}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {premios.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 mt-10">
          <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">El catálogo está vacío o no hay premios disponibles en Ditec.</p>
        </div>
      )}
    </div>
  )
}