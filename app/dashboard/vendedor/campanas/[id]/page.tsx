'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { registrarEvidenciaAction, getMisEvidencias } from '@/app/actions/evidencias'
import { getCampanaPublica } from '@/app/actions/campanas'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'

export default function RegistroEvidenciasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const campanaId = parseInt(resolvedParams.id)

  const [loading, setLoading] = useState(false)
  const [campana, setCampana] = useState<any>(null)
  const [evidencias, setEvidencias] = useState<any[]>([])
  const [preview, setPreview] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    const cp = await getCampanaPublica(campanaId)
    setCampana(cp)
    const data = await getMisEvidencias(campanaId)
    setEvidencias(data)
  }, [campanaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const imageFile = formData.get('foto') as File

    Swal.fire({
      title: 'Optimizando Imagen...',
      text: 'Espere un momento, estamos preparando su gestión',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      if (imageFile && imageFile.size > 0) {
        const options = {
          maxSizeMB: 0.8,           // Un poco menos de 1MB para mayor rapidez
          maxWidthOrHeight: 1280, // Resolución ideal para móviles en campo
          useWebWorker: true
        }
        const compressedFile = await imageCompression(imageFile, options)
        formData.set('foto', compressedFile, imageFile.name)
      }

      formData.append('cliente_nombre', formData.get('cliente') as string)
      const result = await registrarEvidenciaAction(formData, campanaId.toString())

      if (result.error) {
        Swal.fire({ icon: 'error', title: 'Error', text: result.error, confirmButtonColor: '#001F3F' })
        setLoading(false)
        return
      }

      Swal.fire({
        icon: 'success',
        title: '¡ENVIADO!',
        text: 'Tu gestión entró a revisión. ¡Sigue así!',
        confirmButtonColor: '#001F3F'
      })

      if (preview) URL.revokeObjectURL(preview)
      setPreview(null) 
      form.reset() 
      await cargarDatos() 

    } catch (error) {
      console.error("Error al procesar:", error)
      Swal.fire('Error', 'No se pudo procesar la imagen.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-[#001F3F]">
      <header className="mb-8 md:mb-10 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-none">
          {campana?.nombre || "Campaña DITCASH"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-2 mt-2">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest opacity-70">
              {campana?.descripcion || "Sube tus evidencias para acumular saldo."}
            </p>
            {campana?.valor && (
                <span className="bg-[#FFB800] text-[#001F3F] px-2 py-0.5 rounded-lg font-black text-[10px] uppercase">
                    Paga: ${Number(campana.valor).toFixed(2)}
                </span>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-100 h-fit order-1 lg:order-1">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <div className="w-1.5 h-5 bg-[#FFB800] rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest italic">Nueva Evidencia</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre del Cliente</label>
              <input 
                name="cliente" 
                required 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm text-[#001F3F] outline-none mt-2 uppercase focus:border-[#FFB800] transition-all" 
                placeholder="Nombre completo..." 
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fotografía de Respaldo</label>
              <div className="w-full h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[2.5rem] mt-2 relative flex items-center justify-center overflow-hidden transition-all hover:border-[#FFB800] group">
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-5xl">📸</span>
                    <p className="text-[9px] font-black uppercase mt-3 tracking-widest px-4">Toque para abrir la cámara o galería</p>
                  </div>
                )}
                <input 
                  type="file" 
                  name="foto" 
                  accept="image/*" 
                  capture="environment" // <--- Sugiere abrir la cámara en móviles
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      if (preview) URL.revokeObjectURL(preview);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-[#001F3F] text-[#FFB800] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESANDO...' : 'ENVIAR GESTIÓN ➔'}
            </button>
          </form>
        </div>

        {/* LADO DERECHO: HISTORIAL */}
        <div className="lg:col-span-8 order-2 lg:order-2">
          <h3 className="text-lg md:text-xl font-black mb-6 md:mb-8 italic uppercase tracking-tighter border-l-4 border-[#001F3F] pl-4 text-center md:text-left">Mis Envios</h3>
          
          {evidencias.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {evidencias.map((ev: any) => (
                <div key={ev.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100 flex flex-col group hover:shadow-xl transition-all">
                  <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                    <img 
                      src={ev.urlImagen} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt="Evidencia" 
                    />
                    
                    <div className={`absolute top-4 right-4 text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest text-white shadow-lg ${
                      ev.estado === 'pendiente' ? 'bg-orange-500' : 
                      ev.estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {ev.estado}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Cliente validado:</p>
                    <p className="font-black text-[11px] uppercase tracking-tight text-[#001F3F] truncate mb-4">
                      {ev.clienteNombre || "Sin Registro"}
                    </p>

                    {ev.estado === 'rechazado' && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-100 mb-4">
                        <p className="text-[7px] font-black text-red-400 uppercase tracking-widest mb-1">Motivo Ditec:</p>
                        <p className="text-[9px] text-red-600 font-bold italic leading-tight uppercase">
                          {ev.motivoRechazo || "Documento no válido"}
                        </p>
                      </div>
                    )}

                    {ev.estado === 'aprobado' && (
                      <div className="flex items-center gap-2 text-green-500 mb-4">
                        <span className="text-xs font-bold">✔</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          Acreditado +${Number(ev.valorPagado || 0).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center opacity-50">
                       <p className="text-[7px] text-slate-400 font-black uppercase italic">
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </p>
                      <span className="text-[7px] font-black text-[#FFB800]">DITCASH</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 md:p-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 opacity-40">
              <span className="text-5xl mb-4">📤</span>
              <p className="font-black text-[9px] uppercase tracking-[0.3em] text-center px-4">Sin actividades registradas en esta campaña</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}