'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getCampanaById, updateCampana } from '../../../../../actions/campanas'

export default function EditarCampanaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = parseInt(resolvedParams.id)
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [datos, setDatos] = useState({
    nombre: '',
    detalle: '',
    fecha_inicio: '',
    fecha_cierre: '',
    estado: 'Activa'
  })

  useEffect(() => {
    async function cargarDatos() {
      const campana = await getCampanaById(id)
      if (campana) {
        setDatos({
          nombre: campana.nombre,
          detalle: campana.descripcion || '',
          fecha_inicio: new Date(campana.fechaInicio).toISOString().split('T')[0],
          fecha_cierre: new Date(campana.fechaFin).toISOString().split('T')[0],
          estado: campana.activa ? 'Activa' : 'Pausada'
        })
      }
      setLoading(false)
    }
    cargarDatos()
  }, [id])

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUpdating(true)

    const res = await updateCampana(id, datos)

    if (res.error) {
      alert(res.error)
      setUpdating(false)
    } else {
      router.push('/dashboard/admin/campanas')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-[#001F3F] uppercase tracking-widest text-xs">Cargando Datos de MySQL...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-[550px] rounded-[3.5rem] p-12 shadow-xl border border-slate-100">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-[#001F3F] tracking-tighter italic uppercase">Editar Campaña</h2>
          <p className="text-[#FF8C00] text-[9px] font-bold uppercase tracking-[0.4em] mt-2">DITCASH - Actualizar Registro</p>
        </header>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
            <input 
              value={datos.nombre}
              onChange={(e) => setDatos({...datos, nombre: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#FF8C00]" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Indicaciones / Detalle</label>
            <textarea 
              value={datos.detalle}
              onChange={(e) => setDatos({...datos, detalle: e.target.value})}
              rows={3}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#FF8C00] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Fecha Inicio</label>
              <input 
                type="date" 
                value={datos.fecha_inicio}
                onChange={(e) => setDatos({...datos, fecha_inicio: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F]" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-4">Fecha Cierre</label>
              <input 
                type="date" 
                value={datos.fecha_cierre}
                onChange={(e) => setDatos({...datos, fecha_cierre: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-red-500" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Estado de Campaña</label>
            <select 
              value={datos.estado}
              onChange={(e) => setDatos({...datos, estado: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-[#001F3F] appearance-none outline-none focus:ring-2 focus:ring-[#FF8C00]"
            >
              <option value="Activa">ACTIVA</option>
              <option value="Pausada">PAUSADA</option>
            </select>
          </div>

          <div className="flex justify-end gap-6 pt-6">
            <button type="button" onClick={() => router.back()} className="text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:text-red-500">Cancelar</button>
            <button disabled={updating} className="bg-[#001F3F] text-[#FF8C00] px-10 py-5 rounded-[1.8rem] font-bold text-[11px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
              {updating ? 'ACTUALIZANDO...' : 'GUARDAR CAMBIOS ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}