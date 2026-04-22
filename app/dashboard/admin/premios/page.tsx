'use client'
import { useState, useEffect, useCallback } from 'react'
import { crearPremioAction, getPremios, eliminarPremioAction } from '../../../actions/premios'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression' // <--- LIBRERÍA DE COMPRESIÓN

export default function GestionPremios() {
  const [premios, setPremios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargarPremios = useCallback(async () => {
    setLoading(true)
    const data = await getPremios()
    setPremios(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarPremios()
  }, [cargarPremios])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const currentForm = e.currentTarget;
    const formData = new FormData(currentForm)
    const imageFile = formData.get('foto') as File

    // 1. Alerta de inicio de proceso
    Swal.fire({
      title: 'Procesando Premio...',
      text: 'Optimizando imagen y sincronizando datos',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      // 2. COMPRESIÓN DE IMAGEN (Si existe archivo)
      if (imageFile && imageFile.size > 0) {
        const options = {
          maxSizeMB: 1,           // Máximo 1MB para que suba rápido
          maxWidthOrHeight: 1280, // Resolución ideal para web
          useWebWorker: true
        }
        
        const compressedFile = await imageCompression(imageFile, options)
        // Sustituimos la foto original por la comprimida en el FormData
        formData.set('foto', compressedFile, imageFile.name)
      }

      // 3. Envío al Servidor (Action)
      const res = await crearPremioAction(formData)

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: '¡REGISTRADO!',
          text: 'El premio se añadió al catálogo de DITCASH.',
          confirmButtonColor: '#001F3F'
        })
        
        currentForm.reset()
        cargarPremios()
      } else {
        Swal.fire('Error', res.error || 'No se pudo subir', 'error')
      }
    } catch (error) {
      console.error("Error en el cliente:", error)
      Swal.fire('Error de Procesamiento', 'La imagen es demasiado pesada o incompatible.', 'error')
    }
  }

  async function handleEliminar(id: number) {
    const confirm = await Swal.fire({
      title: '¿Eliminar del Catálogo?',
      text: 'Esta acción no se puede deshacer.',
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
        Swal.fire('Eliminado', 'El premio salió de circulación.', 'success')
      }
    }
  }

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Gestión de Catálogo</h1>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Administración de Premios DITCASH 2026</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-4 h-fit sticky top-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-[#FFB800] rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-widest italic">Nuevo Registro</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre del Producto</label>
                <input name="nombre" placeholder="Ej: Smart TV 50'" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-100 outline-none focus:border-[#FFB800] transition-all" required />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Valor en Puntos ($)</label>
                <input name="puntos" type="number" step="0.01" placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-black text-[#FFB800] border border-slate-100 outline-none focus:border-[#FFB800] transition-all" required />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción</label>
                <textarea name="descripcion" placeholder="Detalles del canje..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium border border-slate-100 min-h-[100px] outline-none focus:border-[#FFB800]" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Imagen Fotográfica</label>
                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <input name="foto" type="file" accept="image/*" className="text-[10px] font-bold text-slate-400 cursor-pointer" required />
                </div>
              </div>

              <button className="w-full bg-[#001F3F] text-[#FFB800] py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#FFB800] hover:text-[#001F3F] transition-all active:scale-95">
                Guardar Premio ➔
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: GRILLA */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {premios.map(p => (
              <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img src={p.urlImagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.nombre} />
                  <button 
                    onClick={() => handleEliminar(p.id)} 
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  >
                    🗑
                  </button>
                </div>
                <div className="p-6 text-center">
                  <p className="font-black text-xs uppercase text-[#001F3F] mb-2 tracking-tighter line-clamp-1">{p.nombre}</p>
                  <p className="text-[#FFB800] font-black text-2xl italic">
                    <span className="text-sm mr-0.5">$</span>{Number(p.puntos).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            {premios.length === 0 && !loading && (
              <div className="col-span-full py-24 text-center">
                <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">El catálogo está vacío</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}