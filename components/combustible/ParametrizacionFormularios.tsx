'use client'

import { useState, useRef, useEffect } from 'react'
import { crearVehiculoAction, editarVehiculoAction, eliminarVehiculoAction } from '@/app/actions/combustible'
import { exportarVehiculosExcel } from '@/app/actions/reportes'
import { Car, Plus, Edit2, Trash2, Eye, X, Loader2, FileSpreadsheet, ChevronDown, User, Wrench, AlertTriangle, CheckCircle2, Search } from 'lucide-react'
import Swal from 'sweetalert2'

interface ModuloVehiculosProps {
  vehiculosIniciales: any[]
  vendedores: any[]
}

export default function ModuloVehiculosAdmin({ vehiculosIniciales, vendedores }: ModuloVehiculosProps) {
  const [listaVehiculos, setListaVehiculos] = useState(vehiculosIniciales)
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState(vehiculosIniciales)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVerModalOpen, setIsVerModalOpen] = useState(false)
  const [vehiculoSeleccionadoVer, setVehiculoSeleccionadoVer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPlacaDropdownOpen, setIsPlacaDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const placaDropdownRef = useRef<HTMLDivElement>(null)
  
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [filtroPlaca, setFiltroPlaca] = useState('')
  const [vehiculoId, setVehiculoId] = useState<number | null>(null)
  const [placa, setPlaca] = useState('')
  const [marcaModelo, setMarcaModelo] = useState('')
  const [kmActual, setKmActual] = useState('')
  const [vendedorId, setVendedorId] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (placaDropdownRef.current && !placaDropdownRef.current.contains(event.target as Node)) {
        setIsPlacaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const filtrados = listaVehiculos.filter((v) => {
      const cumpleVendedor = filtroVendedor === '' || v.asignaciones?.[0]?.userId?.toString() === filtroVendedor
      const cumplePlaca = filtroPlaca === '' || v.placa === filtroPlaca
      return cumpleVendedor && cumplePlaca
    })
    setVehiculosFiltrados(filtrados)
  }, [listaVehiculos, filtroVendedor, filtroPlaca])

  const handleConsultar = () => {
    const filtrados = listaVehiculos.filter((v) => {
      const cumpleVendedor = filtroVendedor === '' || v.asignaciones?.[0]?.userId?.toString() === filtroVendedor
      const cumplePlaca = filtroPlaca === '' || v.placa === filtroPlaca
      return cumpleVendedor && cumplePlaca
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
      a.download = `DITCASH_Mantenimiento_${new Date().toISOString().split('T')[0]}.xlsx`
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

  const abrirModalVer = (vehiculo: any) => {
    setVehiculoSeleccionadoVer(vehiculo)
    setIsVerModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      placa: placa.trim().toUpperCase(),
      marcaModelo: marcaModelo.trim().toUpperCase(),
      kmActual: parseFloat(kmActual),
      userId: vendedorId ? parseInt(vendedorId) : undefined
    }

    const res = vehiculoId 
      ? await editarVehiculoAction(vehiculoId, payload)
      : await crearVehiculoAction(payload)

    if (res.success) {
      const nuevoId = vehiculoId || (res as any).id || Math.floor(Math.random() * 100000);

      setListaVehiculos(prev => {
        if (vehiculoId) {
          return prev.map(v => v.id === vehiculoId ? { ...v, ...payload, asignaciones: vendedorId ? [{ userId: payload.userId, user: vendedores.find(vend => vend.id === payload.userId) }] : [] } : v)
        } else {
          return [...prev, { id: nuevoId, ...payload, asignaciones: vendedorId ? [{ userId: payload.userId, user: vendedores.find(vend => vend.id === payload.userId) }] : [] }]
        }
      })
      
      Swal.fire({ title: '¡REGISTRO ACTUALIZADO!', text: 'Los datos de la unidad se sincronizaron con éxito.', icon: 'success', confirmButtonColor: '#001F3F' })
      setIsModalOpen(false)
    } else {
      Swal.fire('Error', (res as any).error || 'No se pudo procesar', 'error')
    }
    setLoading(false)
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ 
      title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¿ELIMINAR UNIDAD?</span>', 
      text: 'Esta acción removerá el vehículo de la base central.',
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, ELIMINAR'
    })
    
    if (result.isConfirmed) {
      const res = await eliminarVehiculoAction(id)
      if (res.success) {
        setListaVehiculos(prev => prev.filter(v => v.id !== id))
        Swal.fire({ title: 'Eliminado', icon: 'success', confirmButtonColor: '#001F3F' })
      } else {
        Swal.fire('Error', (res as any).error || 'No se pudo eliminar', 'error')
      }
    }
  }

  const evaluarEstadoMecanico = (km: number) => {
    if (km <= 0) return { texto: 'ÓPTIMO', tareas: 'Sin novedades mecánicas reportadas.', estilo: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 }
    
    const residuo40k = km % 40000;
    if (residuo40k >= 39500 || residuo40k <= 500) {
      return { texto: 'ALERTA FRENO / CABINA (40K)', tareas: 'Sustituir el líquido de frenos por completo y cambiar filtro de cabina de aire acondicionado.', estilo: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle }
    }
    
    const residuo35k = km % 35000;
    if (residuo35k >= 34500 || residuo35k <= 500) {
      return { texto: 'ACEITE Y TRANSMISIÓN (35K)', tareas: 'Realizar cambio de aceite de motor y mantenimiento completo del fluido de la caja de transmisión.', estilo: 'bg-orange-50 text-orange-700 border-orange-200', icon: Wrench }
    }
    const residuo5k = km % 5000;
    if (residuo5k >= 4700 || residuo5k <= 300) {
      return { texto: 'URGENCIA GENERAL (5K)', tareas: 'Inspección de urgencia obligatoria: cambio de aceite de rutina, revisión de pastillas de frenos.', estilo: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle }
    }
    
    return { texto: 'ESTABLE', tareas: 'Chequeo rutinario normal sin alertas activas.', estilo: 'bg-slate-50 text-slate-500 border-slate-100', icon: CheckCircle2 }
  }

  const vendedorSeleccionado = vendedorId ? vendedores.find(v => v.id.toString() === vendedorId) : null
  const alertaVer = vehiculoSeleccionadoVer ? evaluarEstadoMecanico(vehiculoSeleccionadoVer.kmActual) : null

  return (
    <div className="p-3 md:p-6 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-1.5">
            <Wrench className="text-[#FFB800]" size={20} strokeWidth={2.5} /> Mantenimiento de Flota
          </h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.15em]">
            Configuración técnica y tareas de taller mecánico preventivo DITEC
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          <button onClick={handleDescargaExcel} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1 shadow-md">
            {exportando ? <Loader2 size={11} className="animate-spin" /> : <FileSpreadsheet size={11} />}
            <span>Exportar</span>
          </button>
          <button onClick={() => abrirModal()} className="bg-[#001F3F] text-[#FFB800] font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1 shadow-lg">
            <Plus size={11} strokeWidth={3} /> Nuevo Vehículo
          </button>
        </div>
      </header>
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 mb-4 flex flex-col sm:flex-row items-end gap-3 shadow-inner max-w-3xl">
        <div className="flex flex-col gap-0.5 flex-1 w-full relative" ref={placaDropdownRef}>
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Seleccionar Placa</label>
          <button
            type="button"
            onClick={() => setIsPlacaDropdownOpen(!isPlacaDropdownOpen)}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-[#001F3F] flex items-center justify-between uppercase text-left h-[34px] shadow-sm"
          >
            <span>{filtroPlaca ? filtroPlaca : '-- VER TODAS --'}</span>
            <ChevronDown size={12} />
          </button>
          {isPlacaDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[140px] overflow-y-auto font-mono">
              <button onClick={() => { setFiltroPlaca(''); setIsPlacaDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-xs font-black text-amber-600 hover:bg-slate-50">-- RESTABLECER --</button>
              {listaVehiculos.map(v => (
                <button key={v.id} onClick={() => { setFiltroPlaca(v.placa); setIsPlacaDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-xs text-[#001F3F] hover:bg-slate-50 border-b border-slate-50">{v.placa}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Filtrar por Chofer</label>
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-[#001F3F] focus:outline-none bg-white uppercase h-[34px] shadow-sm cursor-pointer"
          >
            <option value="">-- VER TODOS --</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleConsultar}
          className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[9px] uppercase tracking-widest px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow transition-all hover:bg-black whitespace-nowrap h-[34px]"
        >
          <Search size={11} strokeWidth={3} />
          <span>Consultar</span>
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-3 pl-5 w-[14%]">Placa Vehicular</th>
                <th className="p-3 w-[18%]">Descripción / Modelo</th>
                <th className="p-3 w-[22%] text-center">Conductor Asignado</th>
                <th className="p-3 w-[16%] text-center">Kilometraje</th>
                <th className="p-3 w-[22%] text-center">Estado Mecánico</th>
                <th className="p-3 text-right pr-5 w-[8%]">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
              {vehiculosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-black uppercase text-[9px] tracking-widest">No se encontraron unidades móviles.</td>
                </tr>
              ) : (
                vehiculosFiltrados.map((v: any) => {
                  const alerta = evaluarEstadoMecanico(v.kmActual)
                  const IconoAlerta = alerta.icon

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 pl-5 font-mono font-black text-[#001F3F] text-xs tracking-wider">{v.placa}</td>
                      <td className="p-3 uppercase text-slate-700 tracking-wide truncate">{v.marcaModelo}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                          v.asignaciones?.[0] ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>{v.asignaciones?.[0] ? v.asignaciones[0].user.nombre : 'SIN ASIGNAR'}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-900">{v.kmActual.toLocaleString()} KM</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-wide ${alerta.estilo}`}>
                          <IconoAlerta size={10} />
                          {alerta.texto}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5">
                        <div className="inline-flex items-center gap-2.5 justify-end w-full">
                          <button onClick={() => abrirModalVer(v)} className="text-[#001F3F] hover:text-blue-600 transition-colors" title="Ver Detalles de Taller"><Eye size={13} strokeWidth={2.5} /></button>
                          <button onClick={() => abrirModal(v)} className="text-slate-400 hover:text-[#FFB800] transition-colors" title="Editar Unidad"><Edit2 size={12} strokeWidth={2.5} /></button>
                          <button onClick={() => handleEliminar(v.id)} className="text-rose-500 hover:text-rose-700 transition-colors" title="Eliminar Registro"><Trash2 size={12} strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isVerModalOpen && vehiculoSeleccionadoVer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[400px] rounded-[2rem] p-6 shadow-2xl border border-slate-100 relative text-[#001F3F]">
            <button onClick={() => setIsVerModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={16} strokeWidth={2.5} /></button>
            <header className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-[#001F3F]"><Eye size={16} /></div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight font-mono text-[#001F3F]">Ficha Técnica: {vehiculoSeleccionadoVer.placa}</h3>
                <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider">Historial de alertas preventivas</p>
              </div>
            </header>
            
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold text-xs">
                <div><p className="text-[8px] uppercase text-slate-400">Modelo</p><p className="uppercase text-[#001F3F] font-black truncate">{vehiculoSeleccionadoVer.marcaModelo}</p></div>
                <div><p className="text-[8px] uppercase text-slate-400">Kilometraje</p><p className="font-mono text-[#001F3F] font-black">{vehiculoSeleccionadoVer.kmActual.toLocaleString()} KM</p></div>
              </div>

              <div>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">Estado de Diagnóstico</p>
                <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${alertaVer?.estilo}`}>
                  <p className="text-[9px] font-black uppercase flex items-center gap-1 tracking-wide">{alertaVer?.texto}</p>
                  <p className="text-[10px] font-semibold text-slate-700 border-t border-black/5 pt-1.5 leading-snug">{alertaVer?.tareas}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 mt-2"><button onClick={() => setIsVerModalOpen(false)} className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest px-5 py-2 rounded-lg">Cerrar Ficha</button></div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[380px] rounded-2xl p-6 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={16} strokeWidth={2.5} /></button>
            <header className="mb-4 text-center flex flex-col items-center justify-center">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center mb-1"><Car size={16} className="text-[#FFB800]" /></div>
              <h2 className="text-base font-black text-[#001F3F] italic uppercase">{vehiculoId ? 'Modificar Ficha' : 'Nueva Ficha'}</h2>
              <p className="text-[#FFB800] text-[8px] font-black uppercase tracking-[0.3em]">Mantenimiento Técnico Flotas</p>
            </header>
            
            <form onSubmit={handleSubmit} className="space-y-2.5 text-[#001F3F]">
              <div className="space-y-0.5"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Placa</label><input type="text" required placeholder="EJ: PBA-1234" value={placa} onChange={(e) => setPlaca(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] focus:outline-none uppercase font-mono tracking-widest" /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca y Modelo</label><input type="text" required placeholder="EJ: CHEVROLET D-MAX" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] focus:outline-none uppercase" /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kilometraje Actual</label><input type="number" required placeholder="EJ: 105400" value={kmActual} onChange={(e) => setKmActual(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] focus:outline-none font-mono" /></div>
              <div className="flex flex-col gap-0.5 relative" ref={dropdownRef}>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={10} /> Conductor Asignado</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] flex items-center justify-between uppercase text-left h-[34px]"
                >
                  <span>{vendedorSeleccionado ? (vendedorSeleccionado as any).nombre : '-- SIN ASIGNAR --'}</span>
                  <ChevronDown size={14} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[120px] overflow-y-auto">
                    <button type="button" onClick={() => { setVendedorId(''); setIsDropdownOpen(false) }} className="w-full px-3 py-2 text-left font-black text-[10px] text-amber-600 border-b border-slate-100 hover:bg-slate-50">-- DEJAR SIN ASIGNAR --</button>
                    {vendedores.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVendedorId(v.id.toString())
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left font-black text-[10px] border-b border-slate-50 transition-colors uppercase ${
                          vendedorId === v.id.toString() ? 'bg-[#001F3F] text-[#FFB800]' : 'text-[#001F3F] hover:bg-slate-50'
                        }`}
                      >
                        {v.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1">{loading ? <Loader2 size={11} className="animate-spin" /> : <span>Confirmar ➔</span>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}