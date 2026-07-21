'use client'

import { useState, useRef, useEffect } from 'react'
import { crearVehiculoAction, registrarMantenimientoAction, eliminarVehiculoAction } from '@/app/actions/combustible'
import { exportarVehiculosExcel } from '@/app/actions/reportes'
import { Car, Plus, Trash2, Edit2, X, Loader2, FileSpreadsheet, ChevronDown, User, Wrench, Calculator, RefreshCw, History, ShieldCheck, FileText, Calendar, DollarSign, RotateCcw } from 'lucide-react'
import Swal from 'sweetalert2'

import CalculadoraCombustibleModal from './CalculadoraCombustibleModal'

interface ModuloVehiculosProps {
  kardexInicial: any[]
  vehiculos: any[]
  vendedores: any[]
}

export default function ModuloVehiculosAdmin({ kardexInicial, vehiculos, vendedores }: ModuloVehiculosProps) {
  const [listaKardex, setListaKardex] = useState(kardexInicial)
  const [tablaRenderizada, setTablaRenderizada] = useState<any[]>([])

  const [isModalNuevoOpen, setIsModalNuevoOpen] = useState(false)
  const [isModalMantenimientoOpen, setIsModalMantenimientoOpen] = useState(false)
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false)
  const [calculadoraAbierta, setCalculadoraAbierta] = useState(false)

  const [vehiculoKardexSeleccionado, setVehiculoKardexSeleccionado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPlacaDropdownOpen, setIsPlacaDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const placaDropdownRef = useRef<HTMLDivElement>(null)
  
  // Filtros reactivos corporativos DITEC
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroPlaca, setFiltroPlaca] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')

  const [esModoTraspaso, setEsModoTraspaso] = useState(false)

  // Formulario Registro / Edición Completa de Fila Maestro
  const [vehiculoIdEditar, setVehiculoIdEditar] = useState<number | null>(null)
  const [placa, setPlaca] = useState('')
  const [marcaModelo, setMarcaModelo] = useState('')
  const [kmInicialForm, setKmInicialForm] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  
  // Variables de Taller para corrección manual
  const [editTaller, setEditTaller] = useState('')
  const [editFactura, setEditFactura] = useState('')
  const [editCosto, setEditCosto] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')

  // Formulario Registrar Nuevo Mantenimiento Logístico
  const [maintPlaca, setMaintPlaca] = useState('')
  const [maintKm, setMaintKm] = useState('')
  const [maintTaller, setMaintTaller] = useState('')
  const [maintFactura, setMaintFactura] = useState('')
  const [maintCosto, setMaintCosto] = useState('')
  const [maintFecha, setMaintFecha] = useState('')
  const [maintDescripcion, setMaintDescripcion] = useState('')

  const vendedorSeleccionado = vendedorId ? vendedores.find(v => v.id.toString() === vendedorId) : null

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

  // 🚀 MOTOR DE RENDERIZADO DINÁMICO (MODO RESUMEN VS MODO KARDEX HISTÓRICO)
  useEffect(() => {
    // 1. Filtrar el Kardex global bajo los parámetros de búsqueda activos
    const filtrados = listaKardex.filter((k) => {
      const vendedorObj = vendedores.find(v => v.id.toString() === filtroVendedor)
      const nombreVendedorFiltro = vendedorObj ? vendedorObj.nombre.toUpperCase() : ''
      
      const cumpleVendedor = filtroVendedor === '' || 
        k.choferEnEseMomento?.toUpperCase().includes(nombreVendedorFiltro) ||
        k.vehiculo?.asignaciones?.[0]?.userId?.toString() === filtroVendedor

      const cumplePlaca = filtroPlaca === '' || k.vehiculo?.placa === filtroPlaca
      
      let cumpleFecha = true
      if (k.fechaTransaccion) {
        const fechaKardex = new Date(k.fechaTransaccion)
        if (fechaDesde) {
          const desde = new Date(`${fechaDesde}T00:00:00`)
          if (fechaKardex < desde) cumpleFecha = false
        }
        if (fechaHasta) {
          const hasta = new Date(`${fechaHasta}T23:59:59`)
          if (fechaKardex > hasta) cumpleFecha = false
        }
      }
      
      return cumpleVendedor && cumplePlaca && cumpleFecha
    })

    // 2. Evaluar si los filtros de búsqueda están limpios o activos
    const estanFiltrosLimpios = filtroPlaca === '' && filtroVendedor === '' && fechaDesde === '' && fechaHasta === ''

    if (estanFiltrosLimpios) {
      // 🚀 MODO RESUMEN: Mostrar solo el último hito vigente por cada número de placa
      const mapeoUltimoHito: { [key: string]: any } = {}
      
      // Como listaKardex viene ordenada con los id más recientes primero, el primer registro que encontramos por placa es el actual vigente
      listaKardex.forEach((registro) => {
        const nPlaca = registro.vehiculo?.placa
        if (nPlaca && !mapeoUltimoHito[nPlaca]) {
          mapeoUltimoHito[nPlaca] = registro
        }
      })

      setTablaRenderizada(Object.values(mapeoUltimoHito))
    } else {
      // 🚀 MODO KARDEX: Mostrar todas las filas del historial detallado que cumplan con la búsqueda
      setTablaRenderizada(filtrados)
    }
  }, [listaKardex, filtroVendedor, filtroPlaca, fechaDesde, fechaHasta, vendedores])

  const handleLimpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setFiltroPlaca('')
    setFiltroVendedor('')
  }

  const handleDescargaExcel = async () => {
    setExportando(true)
    const res = await exportarVehiculosExcel({ 
      placa: filtroPlaca, 
      vendedorId: filtroVendedor,
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta })
    } as any)
    
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const nombreVendedor = (res as any).nombreVendedorFiltrado
      if (nombreVendedor) {
        a.download = `DITCASH_FlotaKardex_${nombreVendedor}_${new Date().toISOString().split('T')[0]}.xlsx`
      } else if (filtroPlaca) {
        a.download = `DITCASH_FlotaKardex_Placa_${filtroPlaca}_${new Date().toISOString().split('T')[0]}.xlsx`
      } else {
        a.download = `DITCASH_FlotaKardex_General_${new Date().toISOString().split('T')[0]}.xlsx`
      }
      a.click()
    }
    setExportando(false)
  }

  const abrirModalKardexEspecifico = (vehiculoMaestro: any) => {
    if (!vehiculoMaestro) return
    const movimientosCarro = listaKardex.filter(k => k.vehiculoId === vehiculoMaestro.id)
    setVehiculoKardexSeleccionado({ ...vehiculoMaestro, historialKardex: movimientosCarro })
    setIsKardexModalOpen(true)
  }

  const abrirModalEditarRegistro = (registroKardex: any) => {
    const v = registroKardex.vehiculo
    if (!v) return

    setEsModoTraspaso(false) 
    setVehiculoIdEditar(v.id)
    setPlaca(v.placa)
    setMarcaModelo(v.marcaModelo)
    setKmInicialForm(registroKardex.kmMantenimiento ? registroKardex.kmMantenimiento.toString() : v.kmUltimoAceite.toString())
    setVendedorId(v.asignaciones?.[0]?.userId?.toString() || '')
    
    setEditTaller(registroKardex.taller || v.tallerMantenimiento || '')
    setEditFactura(registroKardex.factura || v.numFacturaMantenimiento || '')
    setEditCosto(registroKardex.costoTransaccion ? registroKardex.costoTransaccion.toString() : '')
    setEditDescripcion(registroKardex.observaciones || '')
    
    setIsModalNuevoOpen(true)
  }

  const handleSeleccionarCarroExistente = (placaSeleccionada: string) => {
    if (!placaSeleccionada) return
    const carro = vehiculos.find(v => v.placa === placaSeleccionada)
    if (carro) {
      setPlaca(carro.placa)
      setMarcaModelo(carro.marcaModelo)
      setKmInicialForm(carro.kmActual.toString())
    }
  }

  const abrirModalNuevoRegistro = () => {
    setVehiculoIdEditar(null)
    setEsModoTraspaso(false)
    setPlaca('')
    setMarcaModelo('')
    setKmInicialForm('')
    setVendedorId('')
    setEditTaller('')
    setEditFactura('')
    setEditCosto('')
    setEditDescripcion('')
    setIsModalNuevoOpen(true)
  }

  const handleNuevoVehiculoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      placa: placa.toUpperCase().trim(),
      marcaModelo: marcaModelo.toUpperCase().trim(),
      kmActual: parseFloat(kmInicialForm || '0'),
      userId: vendedorId ? parseInt(vendedorId) : undefined,
      esTraspasoCambio: esModoTraspaso,
      tallerMantenimiento: editTaller.toUpperCase().trim(),
      numFacturaMantenimiento: editFactura.toUpperCase().trim(),
      costoUltimoMantenimiento: parseFloat(editCosto || '0'),
      descripcionMantenimiento: editDescripcion.toUpperCase().trim()
    }

    const res = vehiculoIdEditar
      ? await fetch(`/api/combustible/vehiculos/${vehiculoIdEditar}`, { method: 'PUT', body: JSON.stringify(payload) }).then(r => r.json())
      : await crearVehiculoAction(payload)

    if (res.success || res.id) {
      Swal.fire('Éxito', vehiculoIdEditar ? 'Auditoría de registro actualizada con éxito.' : esModoTraspaso ? 'Cambio de vendedor registrado.' : 'Vehículo ingresado.', 'success').then(() => window.location.reload())
    } else {
      Swal.fire('Error', res.error || 'No se pudo procesar la solicitud.', 'error')
    }
    setLoading(false)
  }

  const handleMantenimientoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await registrarMantenimientoAction({
      placa: maintPlaca,
      kmMantenimiento: parseFloat(maintKm || '0'),
      taller: maintTaller,
      factura: maintFactura,
      costo: parseFloat(maintCosto || '0'),
      fechaFactura: maintFecha ? new Date(maintFecha) : new Date(),
      descripcion: maintDescripcion
    })
    if (res.success) {
      Swal.fire('Éxito', 'Mantenimiento registrado en el Kardex.', 'success').then(() => window.location.reload())
    } else {
      Swal.fire('Error', (res as any).error, 'error')
    }
    setLoading(false)
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ title: '¿Eliminar?', text: 'Removerá la unidad de la lista.', icon: 'warning', showCancelButton: true })
    if (result.isConfirmed) {
      const res = await eliminarVehiculoAction(id)
      if (res.success) {
        Swal.fire('Eliminado', 'Vehículo removido con éxito.', 'success').then(() => window.location.reload())
      }
    }
  }

  return (
    <div className="p-3 md:p-6 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-1.5">
            <Wrench className="text-[#FFB800]" size={20} strokeWidth={2.5} /> Control Operativo de Flotas
          </h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.15em]">Administración de kilometraje y mantenimiento de flotas DITEC</p>
        </div>
        
        <div className="flex items-center gap-2 flex-nowrap w-full sm:w-auto mt-1 sm:mt-0 justify-end">
          <button type="button" onClick={() => setCalculadoraAbierta(true)} className="bg-[#001F3F] text-[#FFB800] font-black text-[9px] uppercase tracking-widest px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-black transition-colors whitespace-nowrap"><Calculator size={11} strokeWidth={3} /><span>Simulador Galonaje</span></button>
          <button type="button" onClick={abrirModalNuevoRegistro} className="bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2.5 rounded-xl flex items-center gap-1 shadow-lg hover:bg-blue-800 transition-colors whitespace-nowrap"><Plus size={11} strokeWidth={3} /> Nuevo Registro / Traspaso</button>
          <button type="button" onClick={() => { setMaintFecha(new Date().toISOString().split('T')[0]); setMaintDescripcion(''); setIsModalMantenimientoOpen(true); }} className="bg-[#001F3F] text-[#FFB800] font-black text-[9px] uppercase tracking-widest px-3 py-2.5 rounded-xl flex items-center gap-1 shadow-lg hover:bg-black transition-colors whitespace-nowrap"><Wrench size={11} strokeWidth={3} /> Registrar Mantenimiento</button>
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 mb-4 flex flex-col md:flex-row items-end gap-2 shadow-inner w-full">
        <div className="flex flex-col gap-0.5 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-[#001F3F] focus:outline-none bg-white h-[34px] shadow-sm cursor-pointer" />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-[#001F3F] focus:outline-none bg-white h-[34px] shadow-sm cursor-pointer" />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 w-full relative" ref={placaDropdownRef}>
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Seleccionar Placa</label>
          <button type="button" onClick={() => setIsPlacaDropdownOpen(!isPlacaDropdownOpen)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-[#001F3F] flex items-center justify-between uppercase text-left h-[34px] shadow-sm"><span>{filtroPlaca ? filtroPlaca : 'TODAS LAS PLACAS'}</span><ChevronDown size={12} /></button>
          {isPlacaDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[140px] overflow-y-auto font-mono">
              <button type="button" onClick={() => { setFiltroPlaca(''); setIsPlacaDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-xs font-black text-amber-600 hover:bg-slate-50">-- TODAS --</button>
              {vehiculos.map(v => (
                <button type="button" key={v.id} onClick={() => { setFiltroPlaca(v.placa); setIsPlacaDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-xs text-[#001F3F] hover:bg-slate-50 border-b border-slate-50">{v.placa}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1">Vendedor</label>
          <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-[#001F3F] focus:outline-none bg-white uppercase h-[34px] shadow-sm cursor-pointer"><option value="">TODOS LOS VENDEDORES</option>{vendedores.map(v => (<option key={v.id} value={v.id}>{v.nombre.toUpperCase()}</option>))}</select>
        </div>
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <button type="button" onClick={handleLimpiarFiltros} className="bg-slate-200 text-slate-700 hover:bg-slate-300 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center justify-center gap-1 h-[34px] transition-colors whitespace-nowrap w-full md:w-auto"><RotateCcw size={11} strokeWidth={3} /> Limpiar</button>
          <button type="button" onClick={handleDescargaExcel} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center justify-center gap-1 shadow h-[34px] transition-colors whitespace-nowrap w-full md:w-auto">
            {exportando ? <Loader2 size={11} className="animate-spin" /> : <FileSpreadsheet size={11} />}
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE REGISTROS */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-3 pl-5 w-[10%] bg-slate-800 text-slate-200">Fecha</th>
                <th className="p-3 w-[14%]">Conductor Asignado</th>
                <th className="p-3 w-[10%]">Placa Vehicular</th>
                <th className="p-3 w-[12%]">Descripción / Modelo</th>
                <th className="p-3 w-[10%] text-center bg-slate-50/50 text-[#FFB800]">KM Inicial</th>
                <th className="p-3 w-[10%] text-center font-black text-indigo-400">KM Recorridos</th>
                <th className="p-3 w-[10%] text-center font-black text-teal-600">KM Entrada</th>
                <th className="p-3 w-[12%]">Taller / Comprobante</th>
                <th className="p-3 w-[10%] text-center text-emerald-400">Valor Mantenimiento</th>
                <th className="p-3 text-right pr-5 w-[8%]">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
              {tablaRenderizada.map((k: any) => {
                const fechaMovimiento = k.fechaTransaccion ? new Date(k.fechaTransaccion).toISOString().split('T')[0] : 'S/F'
                
                const kmInicialTramo = k.kmMantenimiento || 0
                const kmActualTramo = k.kmEnEseMomento || 0
                const kmRecorridosTramo = kmActualTramo >= kmInicialTramo ? kmActualTramo - kmInicialTramo : 0

                return (
                  <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 pl-5 font-mono text-[11px] text-slate-500 bg-slate-50/10">{fechaMovimiento}</td>
                    <td className="p-3 text-slate-800 uppercase font-black">{k.choferEnEseMomento || 'SIN ASIGNAR'}</td>
                    <td className="p-3 font-mono font-black text-[#001F3F] uppercase">{k.vehiculo?.placa || 'S/P'}</td>
                    <td className="p-3 uppercase text-slate-700 truncate max-w-[120px]">{k.vehiculo?.marcaModelo || 'S/M'}</td>
                    
                    <td className="p-3 text-center font-mono font-black text-slate-400 bg-slate-50/30">{kmInicialTramo.toLocaleString()} KM</td>
                    <td className="p-3 text-center font-mono font-black text-indigo-600">+{kmRecorridosTramo.toLocaleString()} KM</td>
                    <td className="p-3 text-center font-mono font-black text-teal-600">{kmActualTramo.toLocaleString()} KM</td>
                    
                    <td className="p-3 text-left uppercase text-[10px] text-slate-500 truncate max-w-[120px]">
                      <span className="block text-[8px] font-black text-indigo-500 tracking-wider">{k.tipoMovimiento}</span>
                      {k.taller || 'S/N'} {k.factura ? `| F: ${k.factura}` : ''}
                    </td>

                    <td className="p-3 text-center font-mono font-black text-emerald-600">
                      {k.costoTransaccion > 0 ? `$${Number(k.costoTransaccion).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    <td className="p-3 text-right pr-5">
                      <div className="inline-flex items-center gap-2 justify-end w-full">
                        <button type="button" onClick={() => abrirModalKardexEspecifico(k.vehiculo)} className="text-indigo-600 hover:text-indigo-800" title="Ver Historial Kardex Completo"><History size={13} strokeWidth={2.5} /></button>
                        <button type="button" onClick={() => abrirModalEditarRegistro(k)} className="text-slate-400 hover:text-[#FFB800]" title="Editar Registro Completo"><Edit2 size={12} strokeWidth={2.5} /></button>
                        <button type="button" onClick={() => handleEliminar(k.id)} className="text-rose-500 hover:text-rose-700" title="Eliminar"><Trash2 size={12} strokeWidth={2.5} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {tablaRenderizada.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center font-bold text-slate-400 uppercase tracking-wider">No se encontraron registros para los criterios aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLADO DE KARDEX POR VEHÍCULO CON PRECIO INCORPORADO */}
      {isKardexModalOpen && vehiculoKardexSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[660px] rounded-[2rem] p-6 shadow-2xl relative max-h-[85vh] flex flex-col text-[#001F3F]">
            <button type="button" onClick={() => setIsKardexModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={16} strokeWidth={2.5} /></button>
            <header className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black"><History size={16} /></div>
              <div>
                <h3 className="text-sm font-black uppercase font-mono">Historial Logístico: {vehiculoKardexSeleccionado.placa}</h3>
                <p className="text-slate-400 font-bold text-[8px] uppercase">Rastro completo de movimientos y valores de taller de la unidad</p>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              {vehiculoKardexSeleccionado.historialKardex?.map((k: any) => {
                const kmInit = k.kmMantenimiento || 0
                const kmEnd = k.kmEnEseMomento || 0
                const kmDiff = kmEnd >= kmInit ? kmEnd - kmInit : 0

                return (
                  <div key={k.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between gap-3 text-[11px] font-bold text-slate-600">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${k.tipoMovimiento === 'MANTENIMIENTO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>{k.tipoMovimiento}</span>
                        <span className="text-slate-400 font-mono text-[9px]">{k.fechaTransaccion ? new Date(k.fechaTransaccion).toISOString().split('T')[0] : 'S/F'}</span>
                      </div>
                      <p className="text-[#001F3F] font-extrabold uppercase text-[11px] leading-tight">{k.observaciones}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">TALLER: {k.taller || 'S/N'} | FACTURA: {k.factura || 'S/F'} | VALOR: ${Number(k.costoTransaccion || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="grid grid-cols-3 md:flex md:flex-row items-center gap-4 text-center font-mono text-[11px] min-w-[240px] border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                      <div>
                        <p className="text-[7px] text-slate-400 font-sans uppercase font-black">KM Inicial</p>
                        <span className="text-slate-500 font-black">{kmInit.toLocaleString()}</span>
                      </div>
                      <div>
                        <p className="text-[7px] text-indigo-500 font-sans uppercase font-black">KM Recorridos</p>
                        <span className="text-indigo-600 font-black">+{kmDiff.toLocaleString()}</span>
                      </div>
                      <div>
                        <p className="text-[7px] text-teal-600 font-sans uppercase font-black">KM Entrada</p>
                        <span className="text-teal-600 font-black">{kmEnd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end pt-4 mt-2 border-t border-slate-100 flex-shrink-0">
              <button type="button" onClick={() => setIsKardexModalOpen(false)} className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest px-5 py-2 rounded-lg">Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN Y ALTA INTEGRADA */}
      {isModalNuevoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-[420px] rounded-2xl p-5 shadow-2xl relative my-8">
            <button type="button" onClick={() => setIsModalNuevoOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={16} /></button>
            
            <header className="mb-3 text-center flex flex-col items-center justify-center">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center mb-1"><Car size={16} className="text-[#FFB800]" /></div>
              <h2 className="text-base font-black text-[#001F3F] uppercase">
                {vehiculoIdEditar ? 'Modificar Registro Vehículo' : 'Panel de Control Operativo'}
              </h2>
              <p className="text-[#FFB800] text-[8px] font-black uppercase tracking-[0.3em] mb-3">Flotas DITEC</p>

              {!vehiculoIdEditar && (
                <div className="flex bg-slate-100 p-1 rounded-xl w-full border border-slate-200">
                  <button type="button" onClick={() => { setEsModoTraspaso(false); setPlaca(''); setMarcaModelo(''); setKmInicialForm(''); }} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${!esModoTraspaso ? 'bg-[#001F3F] text-[#FFB800] shadow-sm' : 'text-slate-400 hover:text-[#001F3F]'}`}><Plus size={10} />Nuevo Vehículo</button>
                  <button type="button" onClick={() => { setEsModoTraspaso(true); setPlaca(''); setMarcaModelo(''); setKmInicialForm(''); }} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${esModoTraspaso ? 'bg-[#001F3F] text-[#FFB800] shadow-sm' : 'text-slate-400 hover:text-[#001F3F]'}`}><RefreshCw size={10} />Cambio Vendedor</button>
                </div>
              )}
            </header>
            
            <form onSubmit={handleNuevoVehiculoSubmit} className="space-y-3 text-[#001F3F]">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Número de Placa</label>
                {esModoTraspaso ? (
                  <select value={placa} onChange={(e) => handleSeleccionarCarroExistente(e.target.value)} required className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] focus:outline-none uppercase font-mono tracking-widest cursor-pointer h-[34px]">
                    <option value="">-- SELECCIONE UN VEHÍCULO --</option>
                    {vehiculos.map(v => (<option key={v.id} value={v.placa}>{v.placa} - {v.marcaModelo}</option>))}
                  </select>
                ) : (
                  <input type="text" required disabled={!!vehiculoIdEditar} placeholder="EJ: PBA-1234" value={placa} onChange={(e) => setPlaca(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono tracking-widest uppercase h-[34px] disabled:opacity-60" />
                )}
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Marca y Modelo</label>
                <input type="text" required disabled={esModoTraspaso} placeholder="EJ: CHEVROLET D-MAX" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs uppercase h-[34px] disabled:opacity-60" />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {esModoTraspaso ? 'Kilometraje de Entrega (Traspaso)' : 'Kilometraje de Ingreso (KM Inicial)'}
                </label>
                <input type="number" required placeholder="EJ: 105400" value={kmInicialForm} onChange={(e) => setKmInicialForm(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono h-[34px]" />
              </div>

              <div className="flex flex-col gap-0.5 relative" ref={dropdownRef}>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={10} /> Conductor Asignado</label>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] flex items-center justify-between uppercase text-left h-[34px]"><span>{vendedorSeleccionado ? (vendedorSeleccionado as any).nombre : '-- SELECCIONE CHOFER --'}</span><ChevronDown size={14} /></button>
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[120px] overflow-y-auto">
                    {vendedores.map((v) => (<button key={v.id} type="button" onClick={() => { setVendedorId(v.id.toString()); setIsDropdownOpen(false) }} className="w-full px-3 py-2 text-left font-black text-[10px] border-b border-slate-50 text-[#001F3F] hover:bg-slate-50 uppercase">{v.nombre}</button>))}
                  </div>
                )}
              </div>

              {/* EDICIÓN DE MANTENIMIENTO */}
              {vehiculoIdEditar && editTaller && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 space-y-2 mt-2">
                  <p className="text-[8px] font-black uppercase text-amber-700 flex items-center gap-1"><Wrench size={10} /> Corregir Auditoría de Taller / Factura</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[7px] font-black text-slate-400 uppercase block">Nombre Taller</label>
                      <input type="text" value={editTaller} onChange={(e) => setEditTaller(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs uppercase h-[30px]" />
                    </div>
                    <div>
                      <label className="text-[7px] font-black text-slate-400 uppercase block">Nº Factura</label>
                      <input type="text" value={editFactura} onChange={(e) => setEditFactura(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono h-[30px]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-slate-400 uppercase block">Detalle de Reparaciones</label>
                    <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs uppercase h-[40px] font-sans resize-none focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-emerald-600 uppercase block">Costo Liquidado Total ($)</label>
                    <input type="number" step="0.01" value={editCosto} onChange={(e) => setEditCosto(e.target.value)} className="w-full px-2 py-1 bg-white border border-emerald-100 rounded-lg text-xs font-mono h-[30px] font-bold text-emerald-700" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalNuevoOpen(false)} className="text-[8px] font-black text-slate-400 uppercase">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1">{loading ? <Loader2 size={11} className="animate-spin" /> : <span>Guardar Cambios</span>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE MANTENIMIENTO */}
      {isModalMantenimientoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-[400px] rounded-2xl p-5 shadow-2xl relative">
            <button type="button" onClick={() => setIsModalMantenimientoOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={16} /></button>
            <h2 className="text-base font-black text-[#001F3F] uppercase mb-3 flex items-center gap-1.5"><Wrench className="text-[#FFB800]" size={16} /> Cargar Nuevo Mantenimiento</h2>
            <form onSubmit={handleMantenimientoSubmit} className="space-y-2 text-[#001F3F]">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Seleccionar Placa Vehicular</label>
                <select value={maintPlaca} onChange={(e) => setMaintPlaca(e.target.value)} required className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs uppercase h-[34px]">
                  <option value="">-- SELECCIONE --</option>
                  {vehiculos.map(v => (<option key={v.id} value={v.placa}>{v.placa} - {v.marcaModelo}</option>))}
                </select>
              </div>
              <div><label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Kilómetros en Tablero (Marcación de Entrada)</label><input type="number" required placeholder="EJ: 25000" value={maintKm} onChange={(e) => setMaintKm(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono h-[34px]" /></div>
              
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[8px] font-black uppercase text-[#001F3F] flex items-center gap-1"><ShieldCheck size={11} className="text-[#FFB800]" /> Comprobante de Taller</p>
                <div><label className="text-[8px] font-black text-slate-400 uppercase block">Nombre del Taller</label><input type="text" required placeholder="EJ: PROAUTO S.A." value={maintTaller} onChange={(e) => setMaintTaller(e.target.value)} className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs uppercase h-[30px]" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[8px] font-black text-slate-400 uppercase block flex items-center gap-0.5"><FileText size={9} /> Nº Factura</label><input type="text" required placeholder="001-002-1234" value={maintFactura} onChange={(e) => setMaintFactura(e.target.value)} className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono h-[30px]" /></div>
                  <div><label className="text-[8px] font-black text-slate-400 uppercase block flex items-center gap-0.5"><Calendar size={9} /> Fecha</label><input type="date" required value={maintFecha} onChange={(e) => setMaintFecha(e.target.value)} className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs h-[30px]" /></div>
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Descripción del Mantenimiento</label>
                <textarea required placeholder="EJ: CAMBIO DE ACEITE DE MOTOR 10W40, FILTRO DE AIRE Y AJUSTE DE FRENOS DE TAMBOR." value={maintDescripcion} onChange={(e) => setMaintDescripcion(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs uppercase h-[54px] font-sans resize-none focus:outline-none" />
              </div>

              <div><label className="text-[8px] font-black text-emerald-600 uppercase block mb-0.5 flex items-center gap-0.5"><DollarSign size={10} /> Costo Total Liquidado</label><input type="number" step="0.01" required placeholder="EJ: 45.50" value={maintCosto} onChange={(e) => setMaintCosto(e.target.value)} className="w-full px-3 py-1.5 bg-emerald-50/10 border border-emerald-100 rounded-lg font-black text-xs font-mono h-[34px]" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsModalMantenimientoOpen(false)} className="text-[8px] font-black text-slate-400 uppercase">Cancelar</button><button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1">{loading ? <Loader2 size={11} className="animate-spin" /> : <span>Procesar Mantenimiento ➔</span>}</button></div>
            </form>
          </div>
        </div>
      )}

      <CalculadoraCombustibleModal isOpen={calculadoraAbierta} onClose={() => setCalculadoraAbierta(false)} />
    </div>
  )
}