'use client'
import { useState, useEffect, useCallback } from 'react'
import { getVendedoresRanking } from '../../../actions/vendedores'
import { getEvidenciasByVendedor, revisarEvidenciaAction, eliminarEvidenciaAction } from '../../../actions/evidencias'
import Swal from 'sweetalert2'

export default function GestionVendedoresConAuditoria() {
  const [vendedores, setVendedores] = useState<any[]>([])
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<any>(null)
  const [evidencias, setEvidencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const inicializar = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getVendedoresRanking()
      setVendedores(data || [])
      
      if (vendedorSeleccionado) {
        const actualizado = data.find((v: any) => v.id === vendedorSeleccionado.id)
        if (actualizado) setVendedorSeleccionado(actualizado)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [vendedorSeleccionado])

  const cargarEvidencias = useCallback(async () => {
    if (!vendedorSeleccionado?.id) return
    const data = await getEvidenciasByVendedor(vendedorSeleccionado.id)
    setEvidencias(data as any[] || [])
  }, [vendedorSeleccionado?.id])

  useEffect(() => { inicializar() }, []) 
  useEffect(() => { cargarEvidencias() }, [cargarEvidencias])

  const handleRevisar = async (id: number, aprobado: boolean) => {
    let motivo = ""
    if (!aprobado) {
      const { value: text, isConfirmed } = await Swal.fire({
        title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase;">Motivo del Rechazo</span>',
        input: 'textarea',
        inputPlaceholder: 'Escriba aquí la razón del rechazo...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#001F3F',
        confirmButtonText: 'RECHAZAR',
        cancelButtonText: 'CANCELAR',
        inputValidator: (value) => !value && '¡Es obligatorio poner un motivo!'
      })
      if (!isConfirmed) return
      motivo = text
    }

    const res = await revisarEvidenciaAction(id, aprobado, motivo)
    if (res.success) {
      await cargarEvidencias()
      await inicializar() 
    }
  }

  const handleEliminar = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar registro?',
      text: 'Esta acción borrará la foto de Cloudinary y la base de datos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonColor: '#001F3F',
    })
    if (confirm.isConfirmed) {
      const res = await eliminarEvidenciaAction(id)
      if (res.success) {
        await cargarEvidencias()
        await inicializar()
      }
    }
  }

  // Función para descargar la imagen
  const handleDownload = (url: string, nombre: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `Ditec_Evidencia_${nombre}.jpg`
    link.target = "_blank"
    link.click()
  }

  if (loading && vendedores.length === 0) return (
    <div className="p-20 text-center font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Sincronizando DITCASH...</div>
  )

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      
      {!vendedorSeleccionado ? (
        <>
          <header className="mb-8 pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Gestión de Vendedores</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Control de personal y auditoría</p>
          </header>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#001F3F] text-white">
                  <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em]">Vendedor</th>
                  <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Auditoría</th>
                  <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-center">Saldo</th>
                  <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendedores.map((v) => {
                  const pendientes = v.evidencias?.filter((e: any) => e.estado === 'pendiente') || [];
                  const tienePendientes = pendientes.length > 0;
                  return (
                    <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-6 font-black uppercase text-[13px]">
                        {v.nombre}
                        <p className="text-[9px] text-slate-300 font-bold normal-case italic">CI: {v.cedula}</p>
                      </td>
                      <td className="px-10 py-6 text-center">
                        {tienePendientes ? (
                          <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse shadow-md">
                            {pendientes.length} PENDIENTES
                          </div>
                        ) : (
                          <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">AL DÍA ✔</div>
                        )}
                      </td>
                      <td className="px-10 py-6 text-center font-black italic">${v.puntosAcumulados.toFixed(2)}</td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => setVendedorSeleccionado(v)} className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all ${tienePendientes ? 'bg-[#FFB800] text-[#001F3F] shadow-lg' : 'bg-slate-100 text-[#001F3F]'}`}>
                          {tienePendientes ? 'AUDITAR AHORA' : 'DETALLES'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div>
           <header className="mb-10 flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border">
              <div className="flex items-center gap-6">
                 <button onClick={() => setVendedorSeleccionado(null)} className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center hover:bg-[#FFB800] transition-colors shadow-lg font-bold text-xl">←</button>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter">{vendedorSeleccionado.nombre}</h2>
              </div>
              <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
                 <p className="text-xl font-black text-[#FFB800] italic leading-none">${vendedorSeleccionado.puntosAcumulados.toFixed(2)}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Saldo Aprobado</p>
              </div>
           </header>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {evidencias.map((evi: any) => (
                <div key={evi.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg flex flex-col group transition-all hover:scale-[1.02]">
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    <img src={evi.urlImagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="evidencia" />
                    
                    {/* Botones Flotantes (Borrar y Guardar) */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownload(evi.urlImagen, evi.clienteNombre)} title="Guardar Imagen" className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all text-lg">💾</button>
                        <button onClick={() => handleEliminar(evi.id)} title="Borrar Permanente" className="bg-white text-red-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:text-white transition-all text-lg">🗑️</button>
                    </div>

                    <div className={`absolute top-4 left-4 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase text-white shadow-md ${evi.estado === 'pendiente' ? 'bg-orange-500 animate-pulse' : evi.estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {evi.estado}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Cliente Validado:</p>
                    <p className="text-xs font-black uppercase text-[#001F3F] mb-4 truncate">{evi.clienteNombre}</p>
                    
                    {/* MOTIVO DE RECHAZO (Igual a la imagen que me mostraste) */}
                    {evi.estado === 'rechazado' && (
                      <div className="mb-4 p-4 bg-red-50 rounded-[1.5rem] border border-red-100">
                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Motivo Ditec:</p>
                        <p className="text-[10px] text-red-600 font-bold italic leading-tight uppercase">
                          {evi.motivoRechazo || "No cumple requisitos"}
                        </p>
                      </div>
                    )}

                    {evi.estado === 'aprobado' && (
                       <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mb-4 italic">✓ Acreditado +$2.00</p>
                    )}

                    {evi.estado === 'pendiente' && (
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleRevisar(evi.id, true)} className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg hover:bg-green-600 transition-all">Aprobar</button>
                        <button onClick={() => handleRevisar(evi.id, false)} className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg hover:bg-red-600 transition-all">Rechazar</button>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t flex justify-between items-center opacity-40">
                       <p className="text-[8px] font-bold uppercase">{new Date(evi.createdAt).toLocaleDateString()}</p>
                       <p className="text-[8px] font-black italic">DITCASH</p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  )
}