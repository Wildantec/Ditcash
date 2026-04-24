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

    // Alerta con estilo Ditec
    Swal.fire({
      title: 'Optimizando Evidencia...',
      text: 'Comprimiendo imagen para asegurar el envío',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      if (imageFile && imageFile.size > 0) {
        // COMPRESIÓN FUERTE: 0.7MB es el punto dulce para calidad/velocidad
        const options = {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1280,
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
        text: 'Gestión registrada. El administrador validará el sello de tiempo.',
        confirmButtonColor: '#001F3F'
      })

      if (preview) URL.revokeObjectURL(preview)
      setPreview(null) 
      form.reset() 
      await cargarDatos() 

    } catch (error) {
      console.error("Error al procesar:", error)
      Swal.fire('Error', 'La imagen es muy pesada. Intenta capturarla nuevamente.', 'error')
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
              {campana?.descripcion || "Sube tus evidencias con sello de tiempo."}
            </p>
            {campana?.valor && (
                <span className="bg-[#FFB800] text-[#001F3F] px-2 py-0.5 rounded-lg font-black text-[10px] uppercase">
                    Paga: ${Number(campana.valor).toFixed(2)}
                </span>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* LADO IZQUIERDO: FORMULARIO DE CAPTURA */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-100 h-fit">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <div className="w-1.5 h-5 bg-[#FFB800] rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest italic">Captura de Campo</h3>
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

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Evidencia con Fecha y Hora</label>
              <div className="w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden transition-all hover:border-[#FFB800] group">
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-5xl block mb-2">📸</span>
                    <p className="text-[10px] font-black uppercase tracking-widest px-4 leading-tight">
                        Toque para abrir <br/> Cámara Timestamp
                    </p>
                  </div>
                )}
                {/* INPUT OPTIMIZADO PARA CÁMARA TRASERA Y GALERÍA */}
                <input 
                  type="file" 
                  name="foto" 
                  // Cambiamos el accept para que sea más específico pero abierto
                  accept="image/jpeg, image/png, image/jpg" 
                  // ELIMINAMOS por completo capture
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
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
              {loading ? 'ENVIANDO...' : 'SUBIR GESTIÓN ➔'}
            </button>
          </form>
        </div>

        {/* LADO DERECHO: HISTORIAL */}
        <div className="lg:col-span-8">
          <h3 className="text-lg md:text-xl font-black mb-6 italic uppercase tracking-tighter border-l-4 border-[#001F3F] pl-4">Mis Envios Recientes</h3>
          
          {evidencias.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {evidencias.map((ev: any) => (
                <div key={ev.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100 flex flex-col group hover:shadow-xl transition-all">
                  <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                    <img src={ev.urlImagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Evidencia" />
                    <div className={`absolute top-4 right-4 text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest text-white shadow-lg ${
                      ev.estado === 'pendiente' ? 'bg-orange-500' : 
                      ev.estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {ev.estado}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Cliente:</p>
                    <p className="font-black text-[11px] uppercase text-[#001F3F] truncate mb-4">{ev.clienteNombre}</p>

                    {ev.estado === 'aprobado' && (
                      <div className="flex items-center gap-2 text-green-500 mb-4">
                        <span className="text-xs font-bold">✔</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          +$ {Number(ev.valorPagado || 0).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center opacity-50">
                       <p className="text-[7px] text-slate-400 font-black uppercase italic">
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </p>
                      <span className="text-[7px] font-black text-[#FFB800]">DIT-FIELD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 opacity-40">
              <p className="font-black text-[9px] uppercase tracking-[0.3em]">Sin registros previos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}