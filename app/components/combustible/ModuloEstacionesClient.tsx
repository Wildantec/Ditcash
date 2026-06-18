'use client'

import { useState } from 'react'
import { crearGasolineraAction, editarGasolineraAction, eliminarGasolineraAction } from '@/app/actions/combustible'
import { exportarEstacionesExcel } from '@/app/actions/reportes'
import { Fuel, MapPin, Plus, ShieldCheck, Edit, Trash2, X, Loader2, FileSpreadsheet, Search } from 'lucide-react'
import Swal from 'sweetalert2'

export default function ModuloEstacionesClient({ gasolinerasIniciales }: { gasolinerasIniciales: any[] }) {
  const [listaGasolineras, setListaGasolineras] = useState(gasolinerasIniciales)
  const [estacionesFiltradas, setEstacionesFiltradas] = useState(gasolinerasIniciales)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [estacionId, setEstacionId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [tieneConvenio, setTieneConvenio] = useState(false)
  const handleConsultar = () => {
    const filtrados = listaGasolineras.filter((g) => {
      return g.ciudad.toUpperCase().includes(filtroCiudad.toUpperCase().trim())
    })
    setEstacionesFiltradas(filtrados)
  }

  const handleDescargaExcel = async () => {
    setExportando(true)
    const res = await exportarEstacionesExcel()
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DITCASH_Catalogo_Gasolineras_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const abrirModal = (estacion?: any) => {
    if (estacion) {
      setEstacionId(estacion.id)
      setNombre(estacion.nombre)
      setCiudad(estacion.ciudad)
      setTieneConvenio(estacion.tieneConvenio)
    } else {
      setEstacionId(null)
      setNombre('')
      setCiudad('')
      setTieneConvenio(false)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = { nombre, ciudad, tieneConvenio }

    const res = estacionId 
      ? await editarGasolineraAction(estacionId, payload)
      : await crearGasolineraAction(payload)

    if (res.success) {
      Swal.fire({ title: '¡ESTACIÓN GUARDADA!', icon: 'success', confirmButtonColor: '#001F3F' }).then(() => window.location.reload())
    } else {
      Swal.fire('Error', res.error, 'error')
      setLoading(false)
    }
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ title: '¿ELIMINAR?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
    if (result.isConfirmed) {
      const res = await eliminarGasolineraAction(id)
      if (res.success) window.location.reload()
    }
  }

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F] relative">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Fuel className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Puntos de Despacho
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Catálogo de estaciones de servicio autorizadas y externas
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleDescargaExcel} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-md">
            {exportando ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
            <span>Exportar Puntos</span>
          </button>
          <button onClick={() => abrirModal()} className="bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg">
            <Plus size={13} strokeWidth={3} /> Nueva Estación
          </button>
        </div>
      </header>
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-end gap-4 max-w-xl shadow-inner">
        <div className="flex flex-col gap-1.5 flex-1 w-full">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-2">Ubicación / Ciudad</label>
          <input 
            type="text" 
            placeholder="EJ: SANTO DOMINGO" 
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
            className="w-full px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 uppercase text-[#001F3F] bg-white focus:outline-none"
          />
        </div>
        <button 
          onClick={handleConsultar}
          className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow transition-all hover:bg-black active:scale-95 whitespace-nowrap"
        >
          <Search size={12} strokeWidth={3} />
          <span>Consultar ➔</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[850px]">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-5 pl-8 w-[30%]">Estación de Servicio</th>
                <th className="p-5 w-[25%]">Ubicación / Ciudad</th>
                <th className="p-5 w-[25%] text-center">Convenio Corporativo</th>
                <th className="p-5 w-[20%] text-right pr-8">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold text-slate-600">
              {estacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No existen estaciones que coincidan.</td>
                </tr>
              ) : (
                estacionesFiltradas.map((g: any) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 pl-8 font-black text-[#001F3F] text-sm uppercase tracking-wide w-[30%] truncate">
                      <div className="flex items-center gap-2"><Fuel size={14} className="text-slate-400" /><span>{g.nombre}</span></div>
                    </td>
                    <td className="p-5 uppercase text-slate-700 w-[25%] truncate">
                      <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /><span>{g.ciudad}</span></div>
                    </td>
                    <td className="p-5 text-center w-[25%]">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                        g.tieneConvenio ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}><ShieldCheck size={10} /> {g.tieneConvenio ? 'AUTORIZADO' : 'SIN CONVENIO'}</span>
                    </td>
                    <td className="p-5 text-right pr-8 w-[20%]">
                      <div className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <button onClick={() => abrirModal(g)} className="text-[#001F3F] hover:text-[#FFB800] flex items-center gap-1"><Edit size={12} /> Editar</button>
                        <button onClick={() => handleEliminar(g.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Borrar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[500px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 focus:outline-none"><X size={20} strokeWidth={2.5} /></button>
            <header className="mb-8 text-center flex flex-col items-center justify-center gap-1">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-2"><Fuel size={20} strokeWidth={2.5} className="text-[#FFB800]" /></div>
              <h2 className="text-2xl font-black text-[#001F3F] italic uppercase">{estacionId ? 'Modificar Punto' : 'Nueva Estación'}</h2>
              <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.4em] mt-1">DITCASH - Inicializar Registro</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre de la Estación</label><input type="text" required placeholder="EJ: PRIMAX AV. QUITO" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs uppercase text-[#001F3F] shadow-inner" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación / Ciudad</label><input type="text" required placeholder="EJ: SANTO DOMINGO" value={ciudad} onChange={(e) => setCiudad(e.target.value.toUpperCase())} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs uppercase text-[#001F3F] shadow-inner" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Convenio Corporativo</label><select value={tieneConvenio ? 'true' : 'false'} onChange={(e) => setTieneConvenio(e.target.value === 'true')} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] shadow-inner"><option value="false">SIN CONVENIO DE CRÉDITO</option><option value="true">AUTORIZADO / CONVENIO ACTIVO</option></select></div>
              <div className="flex justify-end gap-5 pt-3 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-6 py-3.5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">{loading ? <Loader2 size={12} className="animate-spin" /> : <span>Asentar Punto ➔</span>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}