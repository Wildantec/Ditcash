'use client'
import { useState, useEffect } from 'react'
import { getSolicitudesCanje, gestionarCanjeAction } from '@/app/actions/premios'
import Swal from 'sweetalert2'
import { Bell, Gift, User, Loader2 } from 'lucide-react'

export default function GestionCanjesAdmin() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function cargarSolicitudes() {
    try {
      setLoading(true)
      const data = await getSolicitudesCanje()
      setSolicitudes(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  async function handleGestion(id: number, aprobado: boolean, nombrePremio: string, nombreVendedor: string) {
    if (!aprobado) {
      const confirm = await Swal.fire({
        title: `<span style="font-size:16px; font-weight:900; text-transform:uppercase; color:#001F3F; letter-spacing:0.05em;">¿RECHAZAR CANJE?</span>`,
        text: `Anularás la entrega de ${nombrePremio.toUpperCase()} para ${nombreVendedor.toUpperCase()}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#475569',
        confirmButtonText: 'SÍ, RECHAZAR',
        cancelButtonText: 'CANCELAR'
      })

      if (confirm.isConfirmed) {
        Swal.fire({ 
          title: '<span style="font-size:14px; font-weight:bold; text-transform:uppercase; color:#001F3F;">PROCESANDO ANULACIÓN...</span>', 
          allowOutsideClick: false, 
          didOpen: () => Swal.showLoading() 
        })
        
        const res = await gestionarCanjeAction(id, false)
        if (res.success) {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡RECHAZADO!</span>',
            text: `Canje anulado correctamente.`,
            icon: 'success',
            confirmButtonColor: '#001F3F'
          })
          cargarSolicitudes()
        } else {
          Swal.fire('Error', res.error || 'No se pudo anular la solicitud.', 'error')
        }
      }
      return
    }
    const confirmAprobacion = await Swal.fire({
      title: `<span style="font-size:16px; font-weight:900; text-transform:uppercase; color:#001F3F; letter-spacing:0.05em;">¿APROBAR TRANSACCIÓN?</span>`,
      text: `Confirmarás el descuento de Ditcash para ${nombreVendedor.toUpperCase()}. El producto quedará en espera de entrega física.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#001F3F',
      cancelButtonColor: '#475569',
      confirmButtonText: 'SÍ, APROBAR CANJE',
      cancelButtonText: 'CANCELAR'
    })

    if (confirmAprobacion.isConfirmed) {
      Swal.fire({ 
        title: '<span style="font-size:14px; font-weight:bold; text-transform:uppercase; color:#001F3F;">PROCESANDO RESERVA...</span>', 
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading() 
      })

      try {
        const res = await gestionarCanjeAction(id, true)

        if (res.success) {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡SOLICITUD APROBADA!</span>',
            text: `El saldo de ${nombreVendedor.toUpperCase()} ha sido debitado. El premio ya figura en el módulo de auditoría física para su despacho.`,
            icon: 'success',
            confirmButtonColor: '#001F3F'
          })
          cargarSolicitudes()
        } else {
          Swal.fire({
            title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ACCIÓN DENEGADA</span>',
            text: res.error || 'No se pudo procesar la entrega por falta de fondos.',
            icon: 'error',
            confirmButtonColor: '#001F3F'
          })
        }
      } catch (err) {
        console.error(err)
        Swal.fire('Error', 'Hubo un inconveniente en los servidores de DITCASH.', 'error')
      }
    }
  }

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-[#001F3F] font-black text-[11px] uppercase tracking-[0.2em] bg-[#F8FAFC] min-h-screen">
        <Loader2 className="animate-spin text-[#FFB800]" size={28} strokeWidth={2.5} />
        <span>Sincronizando Solicitudes de Canjes...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-[#001F3F]">
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Bell className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Solicitudes de Canje
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Valida la entrega de premios del catálogo DITCASH
          </p>
        </div>
      </header>

      {solicitudes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {solicitudes.map((s) => {
            const valorUnitario = Number(s.premio.puntos) || 0;

            return (
              <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all group">
                
                <div>
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {s.premio.urlImagen ? (
                      <img src={s.premio.urlImagen} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={s.premio.nombre} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Gift size={32} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001F3F]/90 via-[#001F3F]/30 to-transparent flex items-end p-6">
                      <h4 className="text-white font-black text-sm uppercase italic leading-tight tracking-wide">{s.premio.nombre}</h4>
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                      <div className="w-11 h-11 bg-[#001F3F] rounded-xl flex items-center justify-center text-[#FFB800] shadow-md">
                        <User size={16} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Solicitado por:</p>
                        <p className="text-xs font-black uppercase text-[#001F3F] tracking-tight">{s.vendedor.nombre}</p>
                        <p className="text-[9px] font-black text-[#FFB800] uppercase italic tracking-wider mt-0.5">Vendedor Corporativo</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 border-b border-slate-100 pb-4 pt-2">
                      <span>Valor del Canje:</span>
                      <span className="text-[#001F3F] text-base font-mono font-black">${valorUnitario.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleGestion(s.id, false, s.premio.nombre, s.vendedor.nombre)}
                      className="py-4 bg-slate-100 text-slate-400 border border-transparent rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                    >
                      Rechazar
                    </button>
                    <button 
                      onClick={() => handleGestion(s.id, true, s.premio.nombre, s.vendedor.nombre)}
                      className="py-4 bg-[#001F3F] text-[#FFB800] border border-[#001F3F] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 active:scale-95"
                    >
                      Aprobar Canje
                    </button>
                  </div>
                  <div className="text-center pt-2 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] font-mono">
                      REGISTRO: {new Date(s.createdAt).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-slate-200 shadow-inner">
           <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-4 shadow-sm">
             <Gift size={22} strokeWidth={2.5} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
             No hay canjes pendientes de aprobación en la cola operativa.
           </p>
        </div>
      )}
    </div>
  )
}