'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { crearPremioAction, getPremios, eliminarPremioAction, actualizarPremioAction } from '../../../actions/premios'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'

export default function GestionPremios() {
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
  }, [cargarPremios]) // Nota: Asegúrate que esta dependencia sea cargarPremios en tu código real

  // Función para preparar la edición
  const prepararEdicion = (premio: any) => {
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
          title: editandoId ? '¡ACTUALIZADO!' : '¡REGISTRADO!',
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
    const confirm = await Swal.fire({
      title: '¿Eliminar del Catálogo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirm.isConfirmed) {
      const res = await eliminarPremioAction(id)
      if (res.success) {
        cargarPremios()
        Swal.fire('Eliminado', 'Premio eliminado.', 'success')
      }
    }
  }

  return (
    <div className="p-4 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Gestión de Catálogo</h1>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Administración de Premios DITCASH 2026</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* FORMULARIO */}
        <div className="lg:col-span-4 h-fit lg:sticky lg:top-10 order-1">
          <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 transition-all ${editandoId ? 'border-[#FFB800]' : 'border-transparent'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${editandoId ? 'bg-blue-500' : 'bg-[#FFB800]'}`} />
                <h2 className="text-sm font-black uppercase tracking-widest italic">
                  {editandoId ? 'Editando Registro' : 'Nuevo Registro'}
                </h2>
              </div>
              {editandoId && (
                <button onClick={cancelarEdicion} className="text-[10px] font-black text-red-500 uppercase hover:underline">Cancelar</button>
              )}
            </div>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre del Producto</label>
                <input name="nombre" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-100 outline-none focus:border-[#FFB800]" required />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Valor en Puntos ($)</label>
                <input name="puntos" type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-black text-[#FFB800] border border-slate-100 outline-none" required />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción</label>
                <textarea name="descripcion" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium border border-slate-100 min-h-[80px] outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Imagen {editandoId && '(Opcional)'}</label>
                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <input name="foto" type="file" accept="image/*" className="text-[10px] font-bold text-slate-400 w-full" required={!editandoId} />
                </div>
              </div>

              <button className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${editandoId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#001F3F] text-[#FFB800] hover:bg-[#FFB800] hover:text-[#001F3F]'}`}>
                {editandoId ? 'Guardar Cambios ➔' : 'Guardar Premio ➔'}
              </button>
            </form>
          </div>
        </div>

        {/* GRILLA DE PREMIOS */}
        <div className="lg:col-span-8 order-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {premios.map(p => (
              <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img src={p.urlImagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.nombre} />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => prepararEdicion(p)} className="w-9 h-9 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-colors">✎</button>
                    <button onClick={() => handleEliminar(p.id)} className="w-9 h-9 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors">🗑</button>
                  </div>
                </div>
                <div className="p-6 text-center flex-grow flex flex-col justify-center">
                  <p className="font-black text-[11px] uppercase text-[#001F3F] mb-1 tracking-tight line-clamp-2">{p.nombre}</p>
                  <p className="text-[#FFB800] font-black text-xl italic">${Number(p.puntos).toFixed(2)}</p>
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