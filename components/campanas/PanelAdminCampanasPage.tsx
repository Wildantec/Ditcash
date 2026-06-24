'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCampana, createCampana, updateCampana } from '@/app/actions/campanas'
import Swal from 'sweetalert2'
import { Rocket, Loader2, X, Plus, Eye, Edit2, Trash2 } from 'lucide-react'

interface PanelAdminCampanasProps {
  accionesPermitidas: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
  campanasIniciales: any[];
}

export default function PanelAdminCampanasPage({ accionesPermitidas, campanasIniciales }: PanelAdminCampanasProps) {
  const [campanas, setCampanas] = useState<any[]>(campanasIniciales)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [campanaAEditar, setCampanaAEditar] = useState<any>(null)

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [campanaAVer, setCampanaAVer] = useState<any>(null)

  const router = useRouter()

  async function handleSubmitCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setModalLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createCampana(formData)

    if (res?.error) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
        text: res.error,
        icon: 'error',
        confirmButtonColor: '#001F3F'
      })
      setModalLoading(false)
    } else {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡CAMPAÑA CREADA!</span>',
        text: 'Estrategia comercial indexada correctamente en Prisma.',
        icon: 'success',
        confirmButtonColor: '#001F3F'
      }).then(() => {
        setIsModalOpen(false)
        setModalLoading(false)
        window.location.reload()
      })
    }
  }
  const abrirModalEditar = (campana: any) => {
    const fInicio = campana.fechaInicio ? new Date(campana.fechaInicio).toISOString().split('T')[0] : ''
    const fFin = campana.fechaFin ? new Date(campana.fechaFin).toISOString().split('T')[0] : ''

    setCampanaAEditar({
      ...campana,
      fechaInicio: fInicio,
      fechaFin: fFin
    })
    setIsEditModalOpen(true)
  }
  async function handleSubmitEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      nombre: formData.get('nombre') as string,
      valor: formData.get('valor') as string,
      detalle: formData.get('detalle') as string,
      fecha_inicio: formData.get('fecha_inicio') as string,
      fecha_cierre: formData.get('fecha_cierre') as string,
      estado: formData.get('estado') as string,
    }

    const res = await updateCampana(campanaAEditar.id, payload)

    if (res?.error) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR</span>',
        text: res.error,
        icon: 'error',
        confirmButtonColor: '#001F3F'
      })
      setEditLoading(false)
    } else {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡ACTUALIZADA!</span>',
        text: 'Estrategia modificada con éxito.',
        icon: 'success',
        confirmButtonColor: '#001F3F'
      }).then(() => {
        setIsEditModalOpen(false)
        setEditLoading(false)
        window.location.reload()
      })
    }
  }

  const eliminarCampana = async (id: number, nombre: string) => {
    const { isConfirmed } = await Swal.fire({
      title: '<span style="font-size:18px; font-weight:bold; text-transform:uppercase;">¿Eliminar Campaña?</span>',
      text: `Esta acción borrará: ${nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR',
      cancelButtonText: 'CANCELAR'
    })

    if (isConfirmed) {
      const res = await deleteCampana(id)
      if (res.error) {
        Swal.fire('Error', res.error, 'error')
      } else {
        setCampanas(campanas.filter(c => c.id !== id))
        router.refresh()
        Swal.fire('¡Eliminado!', '', 'success')
      }
    }
  }

  return (
    <div className="p-4 md:p-10 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 pb-4 border-b border-slate-200">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Rocket className="text-[#FFB800]" size={22} strokeWidth={2.5} /> Control de Campañas
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mt-1">Configuración y periodos DITCASH</p>
        </div>
        
        {accionesPermitidas.crear && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} strokeWidth={3} /> Nueva Campaña
          </button>
        )}
      </header>

      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-[#001F3F] text-white text-[9px] font-bold uppercase tracking-[0.2em]">
              <th className="w-[18%] px-8 py-6">Campaña</th>
              <th className="w-[27%] px-8 py-6">Indicaciones</th>
              <th className="w-[12%] px-6 py-6 text-center">Recompensa</th>
              <th className="w-[15%] px-6 py-6 text-center">Vigencia</th>
              <th className="w-[10%] px-6 py-6 text-center">Estado</th>
              <th className="w-[18%] px-8 py-6 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campanas.map((c) => (
              <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6 align-top">
                  <p className="text-[13px] font-black text-[#001F3F] uppercase tracking-tight group-hover:text-[#FFB800] transition-colors leading-tight">
                    {c.nombre}
                  </p>
                  <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest mt-1">ID: #{c.id}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="max-h-[100px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed whitespace-pre-line">
                      {c.descripcion || 'Sin especificaciones...'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-6 align-top text-center">
                   <div className="inline-block bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                      <p className="text-[14px] font-black text-[#FF8C00] italic leading-none">
                        ${Number(c.valor || 0).toFixed(2)}
                      </p>
                      <p className="text-[7px] font-bold text-[#FF8C00] uppercase mt-1">X Foto</p>
                   </div>
                </td>
                <td className="px-6 py-6 align-top">
                  <div className="flex flex-col items-center justify-center bg-slate-50 py-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-[#001F3F]">
                      {c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString() : '--/--/--'}
                    </span>
                    <span className="text-[7px] font-black text-[#FFB800] uppercase my-1">AL</span>
                    <span className="text-[10px] font-black text-red-500">
                      {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : '--/--/--'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center align-top">
                  <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest inline-block ${
                    c.activa ? 'bg-green-500 text-white shadow-md shadow-green-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right align-top">
                  <div className="flex justify-end items-center gap-4 text-[10px] font-black tracking-wider">
                    <button onClick={() => { setCampanaAVer(c); setIsViewModalOpen(true) }} className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                      <Eye size={12} />
                    </button>
                    {accionesPermitidas.editar && (
                      <button onClick={() => abrirModalEditar(c)} className="text-[#001F3F] hover:text-[#FFB800] transition-all flex items-center gap-1">
                        <Edit2 size={12} />
                      </button>
                    )}
                    {accionesPermitidas.eliminar && (
                      <button onClick={() => eliminarCampana(c.id, c.nombre)} className="text-red-400 hover:text-red-600 transition-all flex items-center gap-1">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden flex flex-col gap-6">
        {campanas.map((c) => (
          <div key={c.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-[#001F3F] uppercase italic leading-tight">{c.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">ID: #{c.id}</span>
                   <span className="text-[9px] font-black text-[#FF8C00] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                     ${Number(c.valor || 0).toFixed(2)}
                   </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase ${
                c.activa ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-4 max-h-[150px] overflow-y-auto">
              <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-line">
                {c.descripcion || 'Sin especificaciones...'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="text-center">
                  <p className="text-[7px] font-bold text-slate-400 uppercase">Inicio</p>
                  <p className="text-[10px] font-black">{new Date(c.fechaInicio).toLocaleDateString()}</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[7px] font-bold text-slate-400 uppercase">Fin</p>
                  <p className="text-[10px] font-black text-red-500">{new Date(c.fechaFin).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex gap-4 text-[9px] font-black tracking-widest">
                <button onClick={() => { setCampanaAVer(c); setIsViewModalOpen(true) }} className="text-slate-500">VER</button>
                {accionesPermitidas.editar && <button onClick={() => abrirModalEditar(c)} className="text-[#001F3F]">EDITAR</button>}
                {accionesPermitidas.eliminar && <button onClick={() => eliminarCampana(c.id, c.nombre)} className="text-red-400">ELIMINAR</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {campanas.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">No existen campañas registradas actualmente.</p>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[500px] rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsModalOpen(false)}>
              <X size={18} strokeWidth={2.5} />
            </button>
            <header className="mb-4 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-1 mx-auto"><Rocket size={18} className="text-[#FFB800]" /></div>
              <h2 className="text-sm font-black text-[#001F3F] italic uppercase">Estructurar Nueva Campaña</h2>
            </header>
            <form onSubmit={handleSubmitCrear} className="space-y-4 text-xs">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Estrategia *</label>
                <input name="nombre" type="text" required placeholder="EJ: CAMPAÑA PRODUCTOS CLARO" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs uppercase text-[#001F3F] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest ml-1">Valor Recompensa por Evidencia *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <input name="valor" type="number" step="0.01" min="0" defaultValue="2.00" required className="w-full px-7 py-2 bg-amber-50/10 border border-amber-200 rounded-lg font-black text-xs text-[#001F3F] font-mono focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Indicaciones Operativas</label>
                <textarea name="detalle" rows={2} placeholder="Describa el flujo o requerimiento fotográfico..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#001F3F] focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio *</label>
                  <input name="fecha_inicio" type="date" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono text-[#001F3F]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-1">Fecha Cierre *</label>
                  <input name="fecha_cierre" type="date" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono text-red-500" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Inicial</label>
                <select name="estado" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-[#001F3F]">
                  <option value="Activa">ACTIVA</option>
                  <option value="Pausada">PAUSADA</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button disabled={modalLoading} className="bg-[#001F3F] text-[#FFB800] px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1 hover:bg-slate-800 transition-all">
                  {modalLoading ? <Loader2 size={11} className="animate-spin" /> : <span>Confirmar Registro ➔</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditModalOpen && campanaAEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[500px] rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsEditModalOpen(false)}>
              <X size={18} strokeWidth={2.5} />
            </button>
            <header className="mb-4 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-1 mx-auto"><Edit2 size={16} className="text-[#FFB800]" /></div>
              <h2 className="text-sm font-black text-[#001F3F] italic uppercase">Modificar Parámetros</h2>
              <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">ID: #{campanaAEditar.id}</p>
            </header>
            <form onSubmit={handleSubmitEditar} className="space-y-4 text-xs">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Estrategia *</label>
                <input name="nombre" type="text" required defaultValue={campanaAEditar.nombre} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs uppercase text-[#001F3F] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest ml-1">Valor Recompensa *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <input name="valor" type="number" step="0.01" min="0" defaultValue={campanaAEditar.valor} required className="w-full px-7 py-2 bg-amber-50/10 border border-amber-200 rounded-lg font-black text-xs text-[#001F3F] font-mono focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Indicaciones Operativas</label>
                <textarea name="detalle" rows={2} defaultValue={campanaAEditar.descripcion} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#001F3F] focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Inicio *</label>
                  <input name="fecha_inicio" type="date" required defaultValue={campanaAEditar.fechaInicio} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono text-[#001F3F]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-1">Fecha Cierre *</label>
                  <input name="fecha_cierre" type="date" required defaultValue={campanaAEditar.fechaFin} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono text-red-500" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Operativo</label>
                <select name="estado" defaultValue={campanaAEditar.activa ? 'Activa' : 'Pausada'} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-[#001F3F]">
                  <option value="Activa">ACTIVA</option>
                  <option value="Pausada">PAUSADA</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button disabled={editLoading} className="bg-[#001F3F] text-[#FFB800] px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1 hover:bg-slate-800 transition-all">
                  {editLoading ? <Loader2 size={11} className="animate-spin" /> : <span>Aplicar Cambios ➔</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isViewModalOpen && campanaAVer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[480px] rounded-[2rem] p-6 shadow-2xl border border-slate-200 relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsViewModalOpen(false)}>
              <X size={18} strokeWidth={2.5} />
            </button>
            <header className="mb-4 text-center border-b pb-2">
              <h2 className="text-sm font-black text-[#001F3F] uppercase tracking-wider">Ficha de Campaña</h2>
              <p className="text-slate-300 text-[8px] font-black">ID UNIFICADO: #{campanaAVer.id}</p>
            </header>
            <div className="space-y-3 text-xs font-bold text-slate-600 uppercase">
              <div className="bg-slate-50 p-3 rounded-xl"><span className="text-[8px] text-slate-400 block">Estrategia:</span>{campanaAVer.nombre}</div>
              <div className="bg-slate-50 p-3 rounded-xl"><span className="text-[8px] text-slate-400 block">Recompensa:</span>${Number(campanaAVer.valor || 0).toFixed(2)} X validación</div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[8px] text-slate-400 block">Vigencia Operativa:</span>
                <p className="font-mono text-[10px] text-[#001F3F] mt-1">
                  {new Date(campanaAVer.fechaInicio).toLocaleDateString()} AL {new Date(campanaAVer.fechaFin).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[8px] text-slate-400 block">Indicaciones Generales:</span>
                <p className="normal-case text-slate-500 italic mt-1 text-[11px] max-h-[100px] overflow-y-auto whitespace-pre-line">{campanaAVer.descripcion || 'Sin indicaciones adicionales.'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t mt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="bg-[#001F3F] text-[#FFB800] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}