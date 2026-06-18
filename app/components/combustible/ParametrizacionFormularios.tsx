'use client'

import { useState } from 'react'
import { crearVehiculoAction, editarVehiculoAction, eliminarVehiculoAction } from '@/app/actions/combustible'
import { exportarVehiculosExcel } from '@/app/actions/reportes'
import { Car, Plus, Edit, Trash2, X, Loader2, FileSpreadsheet, Search } from 'lucide-react'
import Swal from 'sweetalert2'

interface ModuloVehiculosProps {
  vehiculosIniciales: any[]
  vendedores: any[]
}

export default function ModuloVehiculosAdmin({ vehiculosIniciales, vendedores }: ModuloVehiculosProps) {
  const [listaVehiculos, setListaVehiculos] = useState(vehiculosIniciales)
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState(vehiculosIniciales)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [vehiculoId, setVehiculoId] = useState<number | null>(null)
  const [placa, setPlaca] = useState('')
  const [marcaModelo, setMarcaModelo] = useState('')
  const [kmActual, setKmActual] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const handleConsultar = () => {
    const filtrados = listaVehiculos.filter((v) => {
      return filtroVendedor === '' || v.asignaciones?.[0]?.userId?.toString() === filtroVendedor
    })
    setVehiculosFiltrados(filtrados)
  }

  const handleDescargaExcel = async () => {
    setExportando(true)
    const res = await exportarVehiculosExcel()
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DITCASH_Reporte_Flota_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const abrirModal = (vehiculo?: any) => {
    if (vehiculo) {
      setVehiculoId(vehiculo.id)
      setPlaca(vehiculo.placa)
      setMarcaModelo(vehiculo.marcaModelo)
      setKmActual(vehiculo.kmActual.toString())
      setVendedorId(vehiculo.asignaciones?.[0]?.userId?.toString() || '')
    } else {
      setVehiculoId(null)
      setPlaca('')
      setMarcaModelo('')
      setKmActual('')
      setVendedorId('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      placa,
      marcaModelo,
      kmActual: parseFloat(kmActual),
      userId: vendedorId ? parseInt(vendedorId) : undefined
    }

    const res = vehiculoId 
      ? await editarVehiculoAction(vehiculoId, payload)
      : await crearVehiculoAction(payload)

    if (res.success) {
      Swal.fire({ title: '¡UNIDAD REGISTRADA!', icon: 'success', confirmButtonColor: '#001F3F' }).then(() => window.location.reload())
    } else {
      Swal.fire('Error', res.error, 'error')
      setLoading(false)
    }
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ title: '¿ELIMINAR?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
    if (result.isConfirmed) {
      const res = await eliminarVehiculoAction(id)
      if (res.success) window.location.reload()
    }
  }

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F] relative">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Car className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Control de Flota Móvil
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Configuración y odómetros generales del personal de campo
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleDescargaExcel} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-md">
            {exportando ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
            <span>Exportar Flota</span>
          </button>
          <button onClick={() => abrirModal()} className="bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg">
            <Plus size={13} strokeWidth={3} /> Nuevo Vehículo
          </button>
        </div>
      </header>
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-end gap-4 max-w-xl shadow-inner">
        <div className="flex flex-col gap-1.5 flex-1 w-full">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-2">Seleccionar Chofer / Responsable</label>
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] focus:outline-none bg-white"
          >
            <option value="">-- VER TODOS --</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre.toUpperCase()}</option>
            ))}
          </select>
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
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-5 pl-8 w-[18%]">Placa Vehicular</th>
                <th className="p-5 w-[27%]">Descripción / Modelo</th>
                <th className="p-5 w-[25%] text-center">Conductor Asignado</th>
                <th className="p-5 w-[15%] text-center">Odómetro</th>
                <th className="p-5 w-[15%] text-right pr-8">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold text-slate-600">
              {vehiculosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    No coinciden unidades con el filtro consultado.
                  </td>
                </tr>
              ) : (
                vehiculosFiltrados.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 pl-8 font-mono font-black text-[#001F3F] text-sm tracking-wider w-[18%] truncate">{v.placa}</td>
                    <td className="p-5 uppercase text-slate-700 tracking-wide w-[27%] truncate">{v.marcaModelo}</td>
                    <td className="p-5 text-center w-[25%]">
                      <span className={`inline-block px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                        v.asignaciones?.[0] ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>{v.asignaciones?.[0] ? v.asignaciones[0].user.nombre : 'SIN ASIGNAR'}</span>
                    </td>
                    <td className="p-5 text-center font-mono text-xs font-black text-slate-900 w-[15%]">{v.kmActual.toLocaleString()} KM</td>
                    <td className="p-5 text-right pr-8 w-[15%]">
                      <div className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <button onClick={() => abrirModal(v)} className="text-[#001F3F] hover:text-[#FFB800] flex items-center gap-1"><Edit size={12} /> Editar</button>
                        <button onClick={() => handleEliminar(v.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Borrar</button>
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
          <div className="bg-white w-full max-w-[500px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={20} strokeWidth={2.5} /></button>
            <header className="mb-8 text-center flex flex-col items-center justify-center gap-1">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-2"><Car size={20} strokeWidth={2.5} className="text-[#FFB800]" /></div>
              <h2 className="text-2xl font-black text-[#001F3F] italic uppercase">{vehiculoId ? 'Modificar Unidad' : 'Nuevo Vehículo'}</h2>
              <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.4em] mt-1">DITCASH - Inicializar Registro</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número de Placa</label><input type="text" required placeholder="EJ: PBA-1234" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] shadow-inner focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Marca y Modelo</label><input type="text" required placeholder="EJ: CHEVROLET D-MAX" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value.toUpperCase())} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] shadow-inner focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje del Tablero</label><input type="number" required placeholder="EJ: 105400" value={kmActual} onChange={(e) => setKmActual(e.target.value)} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] shadow-inner focus:outline-none font-mono" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chofer Asignado</label><select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-xs text-[#001F3F] shadow-inner focus:outline-none uppercase"><option value="">-- SIN ASIGNAR --</option>{vendedores.map(v => (<option key={v.id} value={v.id}>{v.nombre}</option>))}</select></div>
              <div className="flex justify-end gap-5 pt-3 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-6 py-3.5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2">{loading ? <Loader2 size={12} className="animate-spin" /> : <span>Confirmar ➔</span>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}