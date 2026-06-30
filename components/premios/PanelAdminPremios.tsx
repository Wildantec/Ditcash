'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { crearPremioAction, getPremios, eliminarPremioAction, actualizarPremioAction } from '@/app/actions/premios'
import { Edit3, Trash2, Image, Sparkles, FolderPlus, Coins, Layers } from 'lucide-react'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'

interface PanelAdminPremiosProps {
  accionesPermitidas: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  }
}

export default function PanelAdminPremios({ accionesPermitidas }: PanelAdminPremiosProps) {
  const [premios, setPremios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const cargarPremios = useCallback(async () => {
    setLoading(true)
    const data = await getPremios()
    setPremios(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarPremios()
  }, [cargarPremios])

  const prepararEdicion = (premio: any) => {
    if (!accionesPermitidas.editar) return
    setEditandoId(premio.id)
    if (formRef.current) {
      formRef.current.nombre.value = premio.nombre
      formRef.current.puntos.value = premio.puntos
      formRef.current.descripcion.value = premio.descripcion || ''
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    formRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const currentForm = e.currentTarget
    const formData = new FormData(currentForm)
    const imageFile = formData.get('foto') as File

    Swal.fire({
      title: editandoId ? 'Actualizando Premio...' : 'Procesando Premio...',
      text: 'Optimizando imagen y sincronizando datos',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      if (imageFile && imageFile.size > 0) {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1024, useWebWorker: true }
        const compressedFile = await imageCompression(imageFile, options)
        formData.set('foto', compressedFile, imageFile.name)
      }

      let res;
      if (editandoId) {
        res = await actualizarPremioAction(editandoId, formData)
      } else {
        res = await crearPremioAction(formData)
      }

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: editandoId ? '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡ACTUALIZADO!</span>' : '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡REGISTRADO!</span>',
          text: 'El catálogo ha sido actualizado con éxito.',
          confirmButtonColor: '#001F3F'
        })
        cancelarEdicion()
        cargarPremios()
      } else {
        Swal.fire('Error', res.error || 'No se pudo procesar', 'error')
      }
    } catch (error) {
      Swal.fire('Error', 'Problema al procesar la imagen.', 'error')
    }
  }

  async function handleEliminar(id: number) {
    if (!accionesPermitidas.eliminar) return
    const confirm = await Swal.fire({
      title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¿ELIMINAR DEL CATÁLOGO?</span>',
      text: 'Esta acción removerá permanentemente el ítem.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirm.isConfirmed) {
      const res = await eliminarPremioAction(id)
      if (res.success) {
        cargarPremios()
        Swal.fire({ title: 'Eliminado', text: 'Premio removido con éxito.', icon: 'success', confirmButtonColor: '#001F3F' })
      }
    }
  }

  const columnasCatalogo = accionesPermitidas.crear ? 'lg:col-span-8' : 'lg:col-span-12'

  return (
    <div className="p-4 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Gestión de Catálogo</h1>
        </div>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Administración de Premios DITCASH 2026</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* FORMULARIO LATERAL */}
        {accionesPermitidas.crear && (
          <div className="lg:col-span-4 h-fit lg:sticky lg:top-10 order-1">
            <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 transition-all ${editandoId ? 'border-[#FFB800]' : 'border-transparent'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${editandoId ? 'bg-blue-500' : 'bg-[#FFB800]'}`} />
                  <h2 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-1.5">
                    {editandoId ? <Sparkles size={13} className="text-blue-500" /> : <FolderPlus size={13} className="text-[#FFB800]" />}
                    {editandoId ? 'Editando Registro' : 'Nuevo Registro'}
                  </h2>
                </div>
                {editandoId && (
                  <button onClick={cancelarEdicion} className="text-[9px] font-black text-red-500 uppercase tracking-wider hover:underline">Cancelar</button>
                )}
              </div>
              
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre del Producto</label>
                  <input name="nombre" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-[#001F3F] focus:bg-white transition-all uppercase shadow-inner" required />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Coins size={10} /> Valor en Puntos ($)</label>
                  <input name="puntos" type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all font-mono shadow-inner" required />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción</label>
                  <textarea name="descripcion" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#001F3F] focus:bg-white transition-all min-h-[80px] shadow-inner uppercase" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1"><Image size={10} /> Imagen {editandoId && '(Opcional)'}</label>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 shadow-inner flex items-center justify-center">
                    <input name="foto" type="file" accept="image/*" className="text-[10px] font-black text-slate-400 w-full cursor-pointer file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-black file:bg-[#001F3F] file:text-[#FFB800]" required={!editandoId} />
                  </div>
                </div>

                <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${editandoId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#001F3F] text-[#FFB800] hover:bg-black hover:text-[#FFB800]'}`}>
                  {editandoId ? 'Guardar Cambios ➔' : 'Guardar Premio ➔'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LISTADO DE TARJETAS */}
        <div className={`${columnasCatalogo} order-2`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {premios.map(p => (
              <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group flex flex-col relative">
                
                {/* INDICADOR EN VIVO SI EL PREMIO HA SIDO MULTI-CANJEADO */}
                {p.canjes && p.canjes.length > 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-[#001F3F] border border-white/10 text-[#FFB800] text-[8px] font-black px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                    <Layers size={9} /> Solicitudes: {p.canjes.length}
                  </div>
                )}

                <div className="aspect-square bg-slate-50 relative overflow-hidden border-b border-slate-100">
                  <img src={p.urlImagen} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.nombre} />
                  
                  {/* BOTONES FLOTANTES CON ICONOS DE LUCIDE */}
                  {(accionesPermitidas.editar || accionesPermitidas.eliminar) && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {accionesPermitidas.editar && (
                        <button onClick={() => prepararEdicion(p)} className="w-9 h-9 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all transform active:scale-90" title="Editar Premio">
                          <Edit3 size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      {accionesPermitidas.eliminar && (
                        <button onClick={() => handleEliminar(p.id)} className="w-9 h-9 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all transform active:scale-90" title="Eliminar del Catálogo">
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-5 text-center flex-grow flex flex-col justify-center bg-white">
                  <p className="font-black text-[10px] uppercase text-[#001F3F] mb-1 tracking-tight line-clamp-2 leading-tight">{p.nombre}</p>
                  <p className="text-[#FFB800] font-black text-base italic font-mono">${Number(p.puntos).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {!loading && premios.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">Catálogo Vacío</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}