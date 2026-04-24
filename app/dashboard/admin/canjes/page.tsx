'use client'
import { useState, useEffect } from 'react'
import { getSolicitudesCanje, gestionarCanjeAction } from '@/app/actions/premios'
import Swal from 'sweetalert2'

export default function GestionCanjesAdmin() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function cargarSolicitudes() {
    setLoading(true)
    const data = await getSolicitudesCanje()
    setSolicitudes(data)
    setLoading(false)
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  async function handleGestion(id: number, aprobado: boolean, nombrePremio: string, nombreVendedor: string) {
    const accion = aprobado ? 'APROBAR' : 'RECHAZAR';
    
    const confirm = await Swal.fire({
      title: `¿${accion} CANJE?`,
      text: `${aprobado ? 'Confirmarás' : 'Anularás'} la entrega de ${nombrePremio} para ${nombreVendedor}.`,
      icon: aprobado ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonColor: aprobado ? '#001F3F' : '#ef4444',
      confirmButtonText: `SÍ, ${accion}`,
      cancelButtonText: 'CANCELAR'
    })

    if (confirm.isConfirmed) {
      Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
      
      const res = await gestionarCanjeAction(id, aprobado)
      
      if (res.success) {
        Swal.fire('Éxito', `Canje ${aprobado ? 'aprobado' : 'rechazado'} correctamente.`, 'success')
        cargarSolicitudes()
      } else {
        Swal.fire('Error', res.error, 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200 text-center md:text-left">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Solicitudes de Canje</h1>
        <p className="text-slate-400 font-bold mt-1 text-[11px] uppercase tracking-widest opacity-70">
          Valida la entrega de premios del catálogo DITCASH
        </p>
      </header>

      {solicitudes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {solicitudes.map((s) => (
            <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col group">
              {/* Info del Premio */}
              <div className="h-40 bg-slate-50 relative overflow-hidden">
                <img src={s.premio.urlImagen} className="w-full h-full object-cover" alt={s.premio.nombre} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001F3F]/80 to-transparent flex items-end p-6">
                  <h4 className="text-white font-black text-sm uppercase italic leading-tight">{s.premio.nombre}</h4>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-grow">
                {/* Info del Vendedor */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-[#001F3F] rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {s.vendedor.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solicitado por:</p>
                    <p className="text-xs font-black uppercase text-[#001F3F]">{s.vendedor.nombre}</p>
                    <p className="text-[10px] font-bold text-[#FFB800] uppercase italic">Vendedor Ditec</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  <span>Valor del Canje:</span>
                  <span className="text-[#001F3F] text-sm">${Number(s.premio.puntos).toFixed(2)}</span>
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => handleGestion(s.id, false, s.premio.nombre, s.vendedor.nombre)}
                    className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleGestion(s.id, true, s.premio.nombre, s.vendedor.nombre)}
                    className="py-4 bg-[#001F3F] text-[#FFB800] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#FFB800] hover:text-[#001F3F] transition-all"
                  >
                    Aprobar ➔
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  Fecha: {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200">
           <span className="text-5xl opacity-20 block mb-4">💎</span>
           <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-300 italic">No hay canjes pendientes de aprobación</p>
        </div>
      )}
    </div>
  )
}