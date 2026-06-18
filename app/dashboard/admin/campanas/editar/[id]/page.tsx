'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getCampanaById, updateCampana } from '../../../../../actions/campanas'
import Swal from 'sweetalert2'
import { Rocket, Loader2 } from 'lucide-react'

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
    estado: 'Activa',
    valor: '2.00'
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
          estado: campana.activa ? 'Activa' : 'Pausada',
          valor: campana.valor?.toString() || '2.00'
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
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
        text: res.error,
        icon: 'error',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'ENTENDIDO'
      })
      setUpdating(false)
    } else {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡ACTUALIZADO!</span>',
        text: 'Los parámetros de la campaña fueron guardados en MySQL.',
        icon: 'success',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'CONTINUAR'
      }).then(() => {
        router.push('/dashboard/admin/campanas')
        router.refresh()
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 text-[#001F3F] font-black text-[11px] uppercase tracking-[0.2em]">
        <Loader2 className="animate-spin text-[#FFB800]" size={28} strokeWidth={2.5} />
        <span>Cargando Datos de MySQL...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-[#001F3F]">
      <div className="bg-white w-full max-w-[550px] rounded-[3.5rem] p-12 shadow-xl border border-slate-100">
        <header className="mb-10 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner mb-2">
            <Rocket size={20} strokeWidth={2.5} className="text-[#FFB800]" />
          </div>
          <h2 className="text-3xl font-black text-[#001F3F] tracking-tighter italic uppercase leading-none">Editar Campaña</h2>
          <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.4em] mt-1">DITCASH - Actualizar Registro</p>
        </header>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre de la Campaña</label>
            <input 
              type="text"
              value={datos.nombre}
              onChange={(e) => setDatos({...datos, nombre: e.target.value.toUpperCase()})}
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs uppercase text-[#001F3F] focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner tracking-wider" 
              required 
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest ml-4">Valor por Evidencia ($)</label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-[#001F3F] text-sm">$</span>
              <input 
                type="number"
                step="0.01"
                min="0"
                value={datos.valor}
                onChange={(e) => setDatos({...datos, valor: e.target.value})}
                className="w-full px-12 py-4 bg-amber-50/30 border border-amber-100 rounded-[1.8rem] font-black text-sm text-[#001F3F] focus:outline-none focus:border-[#FFB800] transition-all shadow-inner font-mono tracking-widest" 
                required 
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Indicaciones / Detalle</label>
            <textarea 
              value={datos.detalle}
              onChange={(e) => setDatos({...datos, detalle: e.target.value})}
              rows={3}
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-bold text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner resize-none tracking-wide"
            />
          </div>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Inicio</label>
              <input 
                type="date" 
                value={datos.fecha_inicio}
                onChange={(e) => setDatos({...datos, fecha_inicio: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] focus:outline-none focus:bg-white cursor-pointer shadow-inner font-mono tracking-widest" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-4">Fecha Cierre</label>
              <input 
                type="date" 
                value={datos.fecha_cierre}
                onChange={(e) => setDatos({...datos, fecha_cierre: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-red-500 focus:outline-none focus:bg-white cursor-pointer shadow-inner font-mono tracking-widest" 
                required 
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado de Campaña</label>
            <select 
              value={datos.estado}
              onChange={(e) => setDatos({...datos, estado: e.target.value})}
              className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] tracking-widest cursor-pointer shadow-inner appearance-none"
            >
              <option value="Activa">ACTIVA</option>
              <option value="Pausada">PAUSADA</option>
            </select>
          </div>
          <div className="flex justify-end gap-6 pt-4 items-center">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors pb-0.5 border-b-2 border-transparent hover:border-red-500"
            >
              Cancelar
            </button>
            <button 
              disabled={updating} 
              className="bg-[#001F3F] text-[#FFB800] border border-[#001F3F] px-8 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {updating ? 'ACTUALIZANDO...' : 'GUARDAR CAMBIOS ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}