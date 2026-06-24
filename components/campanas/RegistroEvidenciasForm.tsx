'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { registrarEvidenciaAction, getMisEvidencias } from '@/app/actions/evidencias'
import { getCampanaPublica } from '@/app/actions/campanas'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'
import { Camera, Image as ImageIcon, CheckCircle, AlertCircle, Clock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function RegistroEvidenciasForm({ params }: { params: Promise<{ id: string }> }) {
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
      title: 'Optimizando Evidencia...',
      text: 'Comprimiendo imagen para asegurar el envío',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      if (imageFile && imageFile.size > 0) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-5 text-[#001F3F]">
      
      {/* HEADER SUPERIOR */}
      <header className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 justify-center sm:justify-start">
            <Camera className="text-[#FFB800]" size={22} /> {campana?.nombre || "Campaña DITCASH"}
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest mt-0.5">
            {campana?.descripcion || "Sube tus evidencias operacionales con sello de tiempo."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {campana?.valor && (
            <span className="bg-orange-50 text-[#FF8C00] border border-orange-100 px-4 py-2 rounded-xl font-black text-xs font-mono">
              Incentivo: ${Number(campana.valor).toFixed(2)} X Foto
            </span>
          )}
          <Link href="/dashboard">
            <button className="bg-slate-100 text-[#001F3F] p-2.5 rounded-xl hover:bg-slate-200 transition-colors">
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          </Link>
        </div>
      </header>

      {/* CUERPO CENTRAL DE LA INTERFAZ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* LADO IZQUIERDO: CAPTURA EN CAMPO */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xl border border-slate-200 h-fit space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-1.5 h-4 bg-[#FFB800] rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest italic">Captura de Campo</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente / Local</label>
              <input 
                name="cliente" 
                required 
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] focus:outline-none uppercase focus:border-[#FFB800] transition-all" 
                placeholder="EJ: DISTRIBUIDOR SANTA FE" 
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fotografía de Exhibición</label>
              <div className="w-full h-56 bg-slate-50 border border-dashed border-slate-200 rounded-xl relative flex items-center justify-center overflow-hidden transition-all hover:border-[#FFB800] group shadow-inner">
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" alt="Preview de Evidencia" />
                ) : (
                  <div className="text-center text-slate-400 flex flex-col items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-all">
                    <ImageIcon size={28} className="text-[#001F3F]/30 group-hover:text-[#FFB800] transition-colors" />
                    <p className="text-[9px] font-black uppercase tracking-widest px-4 leading-tight text-center">
                      Toque para cargar <br/> foto timestamp
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  name="foto" 
                  required
                  accept="image/jpeg, image/png, image/jpg" 
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
              className="w-full bg-[#001F3F] text-[#FFB800] py-3 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Procesando archivo...</span>
                </>
              ) : (
                <>
                  <span>Subir Gestión</span> <ArrowRight size={12} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* LADO DERECHO: RENDIMIENTO RECIENTE */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 pb-1.5">
            <div className="w-1.5 h-4 bg-[#001F3F] rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest italic">Mis Envíos Recientes</h3>
          </div>
          
          {evidencias.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {evidencias.map((ev: any) => (
                <div key={ev.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-200 flex flex-col group transition-all font-bold">
                  <div className="w-full h-40 bg-slate-50 relative overflow-hidden">
                    <img src={ev.urlImagen} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" alt="Evidencia_Enviada" />
                    
                    <div className={`absolute top-3 right-3 text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider text-white shadow-md inline-flex items-center gap-1 ${
                      ev.estado === 'pendiente' ? 'bg-orange-500' : 
                      ev.estado === 'aprobado' ? 'bg-emerald-600' : 'bg-red-500'
                    }`}>
                      {ev.estado === 'pendiente' && <Clock size={8} />}
                      {ev.estado === 'aprobado' && <CheckCircle size={8} />}
                      {ev.estado === 'rechazado' && <AlertCircle size={8} />}
                      {ev.estado}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow text-xs space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Cliente / Cuenta:</p>
                      <p className="font-black text-[11px] uppercase text-[#001F3F] truncate">{ev.clienteNombre}</p>
                    </div>

                    {ev.estado === 'aprobado' && (
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center font-mono font-black text-emerald-600 text-[10px]">
                        ✓ COMISIÓN CARGADA: +${Number(ev.valorPagado || 0).toFixed(2)}
                      </div>
                    )}

                    {ev.estado === 'rechazado' && (
                      <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-left text-red-600 font-sans space-y-0.5">
                        <p className="text-[7px] font-black uppercase text-red-400">Novedad registrada:</p>
                        <p className="text-[9px] font-bold italic uppercase line-clamp-2 leading-tight">
                          {ev.motivoRechazo || "No cumple con las directrices requeridas."}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center opacity-40 font-mono text-[8px] font-black text-slate-400">
                       <span>{new Date(ev.createdAt).toISOString().split('T')[0]}</span>
                       <span>DIT-FIELD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200 text-slate-300 text-xs font-black uppercase tracking-widest italic w-full">
              No tienes transacciones registradas en esta campaña.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}