'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { ArrowLeft, Gift, ShieldCheck, Download, Trash2, Camera } from 'lucide-react'
import { getHistorialEntregas, procesarAprobacionConEvidenciaAction } from '@/app/actions/premios'
import Link from 'next/link'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'

export default function DetalleCanjesVendedor({ params }: { params: Promise<{ id: string }> }) {
  const { id: vendedorId } = use(params)
  const [canjes, setCanjes] = useState<any[]>([])
  const [vendedor, setVendedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const cargarCanjes = useCallback(async () => {
    try {
      setLoading(true)
      const allCanjes = await getHistorialEntregas()
      const filtrados = allCanjes.filter((c: any) => c.vendedor.id === parseInt(vendedorId))
      
      // 📊 PASO 1: Ordenamos cronológicamente de más antiguos a más nuevos para construir el Kárdex base
      const ordenadosCronologico = filtrados.sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      setCanjes(ordenadosCronologico)
      if (filtrados.length > 0) {
        setVendedor(filtrados[0].vendedor)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [vendedorId])

  useEffect(() => {
    cargarCanjes()
  }, [cargarCanjes])

  const abrirCámaraAuditoria = async (canjeId: number, premioNombre: string) => {
    const { value: file } = await Swal.fire({
      title: `<span style="font-size:16px; font-weight:900; text-transform:uppercase; color:#001F3F;">ENTREGA FÍSICA</span>`,
      html: `<p style="font-size:12px; color:#475569;">Captura el acta firmada o la foto real entregando: <b>${premioNombre.toUpperCase()}</b></p>`,
      input: 'file',
      inputAttributes: { accept: 'image/*', capture: 'environment' },
      customClass: { popup: 'rounded-[2rem]', input: 'custom-swal-file-input' },
      showCancelButton: true,
      confirmButtonColor: '#001F3F',
      confirmButtonText: 'GUARDAR EVIDENCIA ➔',
      cancelButtonText: 'CANCELAR'
    })

    if (file) {
      Swal.fire({ title: 'Subiendo evidencia...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
      try {
        const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1024, useWebWorker: true }
        const compressedFile = await imageCompression(file, options)
        const formData = new FormData()
        formData.set('fotoEvidencia', compressedFile, file.name)

        const res = await procesarAprobacionConEvidenciaAction(canjeId, formData)
        if (res.success) {
          Swal.fire('¡Éxito!', 'Evidencia física integrada correctamente.', 'success')
          cargarCanjes()
        } else {
          Swal.fire('Error', res.error, 'error')
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo procesar la imagen', 'error')
      }
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest bg-[#F8FAFC]">Cargando expediente...</div>
  }

  const puntosAcumuladosBase = vendedor ? Number(vendedor.puntosAcumulados || 0) : 0
  const saldoDisponibleTop = vendedor ? (puntosAcumuladosBase - Number(vendedor.saldoGastado || 0)) : 0

  // 📊 PASO 2: ESTRUCTURACIÓN DEL KÁRDEX EN MEMORIA
  let balanceTemporal = puntosAcumuladosBase

  const canjesConKardex = canjes.map((c) => {
    const costoPremio = Number(c.premio.puntos || 0)
    const saldoAntesDeEsteCanje = balanceTemporal
    const saldoDespuesDeEsteCanje = balanceTemporal - costoPremio

    // El balance corriente se actualiza restando el costo para el siguiente evento en la iteración
    balanceTemporal = saldoDespuesDeEsteCanje

    return {
      ...c,
      kardex: {
        inicial: saldoAntesDeEsteCanje,
        restado: costoPremio,
        final: saldoDespuesDeEsteCanje
      }
    }
  })

  // Invertimos de nuevo el array procesado para renderizar arriba los canjes más recientes
  const canjesFinalesRender = [...canjesConKardex].reverse()

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-[#001F3F]">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/canjes/historial">
            <button className="w-12 h-12 bg-[#001F3F] text-white rounded-xl flex items-center justify-center hover:bg-black transition-all">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          </Link>
          <h2 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">{vendedor?.nombre || 'Expediente'}</h2>
        </div>
        <div className="bg-[#F8FAFC] border border-slate-100 px-6 py-2.5 rounded-2xl text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo Aprobado</p>
          <p className="text-lg font-black text-[#FFB800] mt-1 font-mono">${saldoDisponibleTop.toFixed(2)}</p>
        </div>
      </div>
      
      {/* h-[495px] modificado para dar espacio correcto a la caja de Kárdex sin desborde */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {canjesFinalesRender.map((c) => {
          const esPendiente = !c.urlEvidencia
          const expandirEvidenciaConDescarga = (url: string, premioNombre: string) => {
            Swal.fire({
              title: `<span style="font-size:15px; font-weight:900; color:#001F3F; text-transform:uppercase; letter-spacing:0.05em;">Visualizador de Auditoría</span>`,
              html: `
                <div style="text-align: center; margin-top: 10px;">
                  <p style="font-size:11px; text-transform:uppercase; font-weight:bold; color:gray; margin-bottom:15px;">
                    Premio: ${premioNombre}
                  </p>
                  <div style="border-radius: 1.5rem; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border: 1px solid #f1f5f9; background: #f8fafc; max-height: 60vh; display: flex; items-center; justify-content: center;">
                    <img src="${url}" style="max-width: 100%; max-height: 60vh; object-fit: contain;" alt="Evidencia Ditec" />
                  </div>
                </div>
              `,
              showCancelButton: true,
              confirmButtonColor: '#001F3F',
              cancelButtonColor: '#475569',
              confirmButtonText: 'DESCARGAR ARCHIVO ↓',
              cancelButtonText: 'CERRAR',
              customClass: {
                popup: 'rounded-[2.5rem] p-6 max-w-2xl',
                confirmButton: 'custom-swal-confirm-btn',
                cancelButton: 'custom-swal-cancel-btn'
              }
            }).then((result) => {
              if (result.isConfirmed) {
                const link = document.createElement('a')
                link.href = url
                link.download = `EVIDENCIA_${premioNombre.toUpperCase().replace(/\s+/g, '_')}.jpg`
                link.target = '_blank'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }
            })
          }

          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col justify-between group h-[495px]">
              
              <div 
                onClick={() => !esPendiente && expandirEvidenciaConDescarga(c.urlEvidencia, c.premio.nombre)}
                className={`relative h-48 bg-slate-50 border-b overflow-hidden ${!esPendiente ? 'cursor-zoom-in' : 'cursor-default'}`}
              >
                <img 
                  src={esPendiente ? c.premio.urlImagen : c.urlEvidencia} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={c.premio.nombre} 
                />
                <span className={`absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md shadow-sm ${
                  esPendiente ? 'bg-[#FF6B00] text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {esPendiente ? 'PENDIE_ENTREGA' : 'ENTREGADO ✓'}
                </span>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PREMIO SOLICITADO:</p>
                  <h4 className="font-black text-sm uppercase text-[#001F3F] tracking-tight leading-tight mb-2 truncate">{c.premio.nombre}</h4>
                  <p className="text-[11px] font-medium text-slate-500 italic">Valor canjeado: ${Number(c.premio.puntos).toFixed(2)} Ditcash.</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-2 flex items-center gap-1 opacity-70">
                    <span>{esPendiente ? '📅 Solicitado el:' : '📅 Entregado el:'}</span>
                    <span className="font-mono text-[10px] text-[#001F3F]">
                      {new Date(c.createdAt).toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </p>

                  {/* 📊 DISEÑO DE RECUADRO KÁRDEX INTEGRADO DENTRO DE LA CARD */}
                  <div className="mt-3.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 font-mono text-[10px] font-bold text-slate-500 select-none">
                    <div className="flex justify-between items-center">
                      <span className="uppercase text-[8px] text-slate-400 font-sans tracking-tight">Saldo Inicial:</span>
                      <span className="text-[#001F3F]">${c.kardex.inicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-600 border-b border-dashed border-slate-200 pb-1.5">
                      <span className="uppercase text-[8px] text-rose-400 font-sans tracking-tight">Monto Canje:</span>
                      <span>-${c.kardex.restado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-emerald-600 font-black">
                      <span className="uppercase text-[8px] text-emerald-500 font-sans tracking-tight">Saldo Restante:</span>
                      <span>${c.kardex.final.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {esPendiente ? (
                    <button 
                      onClick={() => abrirCámaraAuditoria(c.id, c.premio.nombre)}
                      className="w-full py-3.5 bg-[#FFB800] text-[#001F3F] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-black hover:text-[#FFB800] transition-all"
                    >
                      <Camera size={13} strokeWidth={2.5} /> SUBIR EVIDENCIA
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <span className="w-full text-center py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest">
                        ✓ LEGALIZADO
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}