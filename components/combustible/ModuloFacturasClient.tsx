'use client'

import { useState, useRef, useEffect } from 'react'
import { registrarFacturaCombustible, editarFacturaCombustibleAction, eliminarFacturaCombustibleAction } from '@/app/actions/combustible'
import { exportarFacturasExcel } from '@/app/actions/reportes' 
import { exportarKardexEstacionExcel } from '@/app/actions/reportes-oficina' 
import { Receipt, Plus, X, Loader2, Fuel, Search, FileSpreadsheet, ChevronDown, User, Wallet, ArrowUpRight, TrendingUp, Edit2, Trash2, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface ModuloFacturasProps {
  vehiculos: any[]
  gasolineras: any[]
  facturasIniciales: any[]
  vendedores: any[]
}

export default function ModuloFacturasClient({ vehiculos, gasolineras, facturasIniciales, vendedores }: ModuloFacturasProps) {
  const [listaFacturas, setListaFacturas] = useState(facturasIniciales)
  const [facturasFiltradas, setFacturasFiltradas] = useState(facturasIniciales)
  
  // Control de Pestañas (Historial General vs Kardex Cuenta Mayor)
  const [pestanaActiva, setPestanaActiva] = useState<'facturas' | 'rendimiento'>('facturas')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false) 
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFiltroVendedorOpen, setIsFiltroVendedorOpen] = useState(false)
  const [isFiltroEstacionOpen, setIsFiltroEstacionOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filtroVendedorRef = useRef<HTMLDivElement>(null)
  const filtroEstacionRef = useRef<HTMLDivElement>(null)

  // Filtros Historial General
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroEstacion, setFiltroEstacion] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')

  // Filtros Exclusivos para Pestaña Kardex (Por Estación/Convenio)
  const [kardexEstacionId, setKardexEstacionId] = useState('')
  const [isKardexEstacionOpen, setIsKardexEstacionOpen] = useState(false)
  const kardexEstacionRef = useRef<HTMLDivElement>(null)

  // Estados Formulario
  const [facturaId, setFacturaId] = useState<number | null>(null)
  const [placaCarro, setPlacaCarro] = useState('')
  const [gasolineraId, setGasolineraId] = useState('')
  const [gasolineraManual, setGasolineraManual] = useState('') 
  const [esGasolineraManual, setEsGasolineraManual] = useState(false)
  const [numFactura, setNumFactura] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [galones, setGalones] = useState('')
  const [fechaFactura, setFechaFactura] = useState('')
  const [metodoPago, setMetodoPago] = useState('CONVENIO')
  const [vendedorId, setVendedorId] = useState('')

  // LISTADO KARDEX UNIFICADO
  const [movimientosKardex, setMovimientosKardex] = useState<any[]>([])
  const [totalesKardex, setTotalesKardex] = useState({ acreditado: 0, consumido: 0, saldoFinal: 0 })

  // KPIs Historial General
  const gastoGlobalTotal = facturasFiltradas.reduce((acc, curr) => acc + (curr.precioTotal || 0), 0)
  const consumidoConvenio = facturasFiltradas.filter((f: any) => (f.metodoPago || 'CONVENIO') === 'CONVENIO').reduce((acc, curr) => acc + (curr.precioTotal || 0), 0)
  const consumidoEfectivo = facturasFiltradas.filter((f: any) => (f.metodoPago || 'CONVENIO') === 'EFECTIVO').reduce((acc, curr) => acc + (curr.precioTotal || 0), 0)
  
  useEffect(() => {
    if (vendedorId && !facturaId && !isReadOnly) {
      const chofer = vendedores.find((v: any) => v.id.toString() === vendedorId)
      if (chofer) {
        const asignaciones = chofer.asignacionesVehiculo || chofer.vendedor?.asignacionesVehiculo || []
        const asignacionActiva = asignaciones.find((a: any) => !a.fechaFin || a.fechaFin === null)
        if (asignacionActiva && asignacionActiva.vehiculo) {
          setPlacaCarro(asignacionActiva.vehiculo.placa || '')
        }
      }
    }
  }, [vendedorId, vendedores, facturaId, isReadOnly])

  useEffect(() => {
    if (gasolineraId && gasolineraId !== 'MANUAL') {
      const estacion = gasolineras.find(g => g.id.toString() === gasolineraId)
      if (estacion) {
        setMetodoPago(estacion.tieneConvenio ? 'CONVENIO' : 'EFECTIVO')
      }
      setEsGasolineraManual(false)
    } else if (gasolineraId === 'MANUAL') {
      setEsGasolineraManual(true)
      setMetodoPago('EFECTIVO') 
    }
  }, [gasolineraId, gasolineras])

  useEffect(() => {
    if (pestanaActiva === 'rendimiento' && !kardexEstacionId) {
      const primeraEstacion = gasolineras.find(g => g.tieneConvenio) || gasolineras[0]
      if (primeraEstacion) setKardexEstacionId(primeraEstacion.id.toString())
    }
  }, [pestanaActiva, gasolineras, kardexEstacionId])

  useEffect(() => {
    if (!kardexEstacionId) return

    let listaMovimientos: any[] = []
    const estacionSeleccionada = gasolineras.find(g => g.id.toString() === kardexEstacionId) as any

    const cupoInicial = estacionSeleccionada ? (estacionSeleccionada.montoRecarga || estacionSeleccionada.montoCredito || estacionSeleccionada.cupo || 0) : 0

    if (cupoInicial > 0) {
      listaMovimientos.push({
        fecha: estacionSeleccionada.createdAt ? new Date(estacionSeleccionada.createdAt) : new Date(),
        tipoAccion: 'DEPÓSITO / TRANSFERENCIA',
        numFactura: `${estacionSeleccionada.id}12`,
        choferRef: 'Acreditación Inicial de Fondos',
        monto: cupoInicial,
        esCredito: true
      })
    }

    const consumosEstacion = listaFacturas.filter(f => f.gasolineraId?.toString() === kardexEstacionId)
    
    consumosEstacion.forEach((f: any) => {
      const fDate = new Date(f.fechaFactura).toISOString().split('T')[0]
      const cumpleDesde = filtroDesde === '' || fDate >= filtroDesde
      const cumpleHasta = filtroHasta === '' || fDate <= filtroHasta

      if (cumpleDesde && cumpleHasta) {
        listaMovimientos.push({
          fecha: new Date(f.fechaFactura),
          tipoAccion: (f.metodoPago || 'CONVENIO') === 'EFECTIVO' ? 'CONSUMO CAJA CHICA' : 'CONSUMO CONVENIO',
          numFactura: f.numFactura,
          choferRef: f.user?.nombre || 'VENDEDOR',
          placa: f.vehiculo?.placa || '',
          monto: f.precioTotal,
          esCredito: false
        })
      }
    })

    listaMovimientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

    let saldoFlotanteAcumulado = 0
    let sumaAcreditado = 0
    let sumaConsumido = 0

    const movimientosConSaldo = listaMovimientos.map((mov) => {
      if (mov.esCredito) {
        saldoFlotanteAcumulado += mov.monto
        sumaAcreditado += mov.monto
      } else {
        saldoFlotanteAcumulado -= mov.monto
        sumaConsumido += mov.monto
      }
      return {
        ...mov,
        saldoMatriz: saldoFlotanteAcumulado
      }
    })

    setMovimientosKardex(movimientosConSaldo)
    setTotalesKardex({
      acreditado: sumaAcreditado,
      consumido: sumaConsumido,
      saldoFinal: saldoFlotanteAcumulado
    })

  }, [kardexEstacionId, listaFacturas, gasolineras, filtroDesde, filtroHasta])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false)
      if (filtroVendedorRef.current && !filtroVendedorRef.current.contains(event.target as Node)) setIsFiltroVendedorOpen(false)
      if (filtroEstacionRef.current && !filtroEstacionRef.current.contains(event.target as Node)) setIsFiltroEstacionOpen(false)
      if (kardexEstacionRef.current && !kardexEstacionRef.current.contains(event.target as Node)) setIsKardexEstacionOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConsultarHistorial = () => {
    const filtrados = listaFacturas.filter((f) => {
      const fDate = new Date(f.fechaFactura).toISOString().split('T')[0]
      const cumpleDesde = filtroDesde === '' || fDate >= filtroDesde
      const cumpleHasta = filtroHasta === '' || fDate <= filtroHasta
      const cumpleEstacion = filtroEstacion === '' || f.gasolineraId?.toString() === filtroEstacion
      const cumpleVendedor = filtroVendedor === '' || f.userId?.toString() === filtroVendedor
      return cumpleDesde && cumpleHasta && cumpleEstacion && cumpleVendedor
    })
    setFacturasFiltradas(filtrados)
  }

  const handleDescargaExcelGeneral = async () => {
    setExportando(true)
    const res = await exportarFacturasExcel({ 
      fechaDesde: filtroDesde || undefined, 
      fechaHasta: filtroHasta || undefined, 
      gasolineraId: filtroEstacion || undefined
    })
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DITCASH_Historial_Facturas_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const handleDescargaKardexEstacion = async () => {
    if (!kardexEstacionId) return
    setExportando(true)
    
    const estacion = gasolineras.find(g => g.id.toString() === kardexEstacionId)
    
    const res = await exportarKardexEstacionExcel({
      gasolineraId: parseInt(kardexEstacionId),
      fechaDesde: filtroDesde || undefined,
      fechaHasta: filtroHasta || undefined
    })

    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KARDEX_MAYOR_${estacion?.nombre.replace(/ /g, '_') || 'ESTACION'}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const abrirModal = (factura?: any, readOnlyMode = false) => {
    setIsReadOnly(readOnlyMode)
    if (factura) {
      setFacturaId(Number(factura.id))
      setPlacaCarro(factura.vehiculo?.placa || '')
      setGasolineraId(factura.gasolineraId?.toString() || '')
      setNumFactura(factura.numFactura || '')
      setPrecioTotal(factura.precioTotal?.toString() || '')
      setGalones(factura.galones?.toString() || '')
      setFechaFactura(new Date(factura.fechaFactura).toISOString().split('T')[0])
      setMetodoPago(factura.metodoPago || 'CONVENIO')
      setVendedorId(factura.userId?.toString() || '')
      setEsGasolineraManual(factura.gasolineraId === null || factura.gasolineraId === 0)
      setGasolineraManual(factura.nombreEstacionManual || '')
    } else {
      setFacturaId(null)
      setPlacaCarro('')
      setGasolineraId('')
      setGasolineraManual('')
      setEsGasolineraManual(false)
      setNumFactura('')
      setPrecioTotal('')
      setGalones('')
      setFechaFactura('')
      setMetodoPago('CONVENIO')
      setVendedorId('')
    }
    setIsModalOpen(true)
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ title: '¿ELIMINAR FACTURA?', text: 'Esta acción revertirá el consumo cargado al convenio.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
    if (result.isConfirmed) {
      const res = await eliminarFacturaCombustibleAction(id)
      if (res.success) window.location.reload()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    setLoading(true)

    if (!vendedorId) {
      Swal.fire('Inconveniente', 'Debe seleccionar un vendedor responsable de la lista.', 'warning')
      setLoading(false)
      return
    }

    const payload = {
      userId: parseInt(vendedorId),
      placaCarro,
      gasolineraId: esGasolineraManual ? 0 : parseInt(gasolineraId), 
      numFactura: numFactura.trim(),
      precioTotal: parseFloat(precioTotal),
      galones: parseFloat(galones),
      fechaFactura: new Date(fechaFactura),
      metodoPago,
      nombreEstacionManual: esGasolineraManual ? gasolineraManual.toUpperCase().trim() : undefined
    }

    const res = facturaId 
      ? await editarFacturaCombustibleAction(facturaId, payload)
      : await registrarFacturaCombustible(payload)

    if (res.success) {
      Swal.fire({ title: '¡REGISTRO ACTUALIZADO!', icon: 'success', confirmButtonColor: '#001F3F' }).then(() => {
        window.location.reload()
      })
    } else {
      Swal.fire('Error', res.error || 'No se pudo guardar.', 'error')
      setLoading(false)
    }
  }

  const vendedorSeleccionado = vendedorId ? vendedores.find((v:any) => v.id.toString() === vendedorId) : null
  const filtroVendedorSel = filtroVendedor ? vendedores.find((v: any) => v.id.toString() === filtroVendedor) : null
  const filtroEstacionSel = filtroEstacion ? gasolineras.find(g => g.id.toString() === filtroEstacion) : null
  const kardexEstacionSel = kardexEstacionId ? gasolineras.find(g => g.id.toString() === kardexEstacionId) : null

  const getEstadoAlertaCredito = (saldo: number) => {
    if (saldo <= 20) {
      return {
        texto: '¡Alerta! Crédito Agotado o Crítico',
        claseBg: 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse',
        icono: <AlertTriangle className="text-rose-600" size={18} />
      }
    }
    if (saldo <= 100) {
      return {
        texto: 'Saldo Bajo - Prever Recarga',
        claseBg: 'bg-amber-50 border-amber-200 text-amber-700',
        icono: <AlertTriangle className="text-amber-500" size={18} />
      }
    }
    return {
      texto: 'Cupo Disponible Estable',
      claseBg: 'bg-teal-50 border-teal-200 text-teal-800',
      icono: <CheckCircle2 className="text-teal-600" size={18} />
    }
  }

  const alertaCredito = getEstadoAlertaCredito(totalesKardex.saldoFinal)

  return (
    /* 🟢 CORRECCIÓN DE DISEÑO PRINCIPAL: Agregamos contenedor centrado max-w-7xl con márgenes laterales */
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-5 text-[#001F3F]">
      
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 w-full">
        <div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-1.5">
            <Receipt className="text-[#FFB800]" size={22} strokeWidth={2.5} /> Auditoría Contable y Control de Fondos
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] mt-0.5">
            Ingreso de comprobantes y cruce de rendimientos con el GPS de rutas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {pestanaActiva === 'facturas' ? (
            <button onClick={handleDescargaExcelGeneral} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center">
              {exportando ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
              <span>Exportar Historial Completo</span>
            </button>
          ) : (
            <button onClick={handleDescargaKardexEstacion} disabled={exportando} className="bg-[#001F3F] text-[#FFB800] hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center">
              {exportando ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
              <span>Descargar Kardex Seleccionado</span>
            </button>
          )}
          <button onClick={() => abrirModal()} className="bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-lg w-full sm:w-auto justify-center hover:bg-slate-800 transition-all">
            <Plus size={12} strokeWidth={3} /> Ingresar Factura
          </button>
        </div>
      </header>

      {/* PESTAÑAS INDEPENDIENTES */}
      <div className="flex border-b border-slate-200 gap-1 w-full">
        <button onClick={() => setPestanaActiva('facturas')} className={`px-5 py-2.5 font-black text-[11px] uppercase tracking-wider rounded-t-xl transition-all border-t border-x ${pestanaActiva === 'facturas' ? 'bg-white border-slate-200 text-[#001F3F] border-b-2 border-b-white z-10' : 'bg-slate-50 border-transparent text-slate-400 hover:text-slate-600'}`}>📋 Historial de Facturas</button>
        <button onClick={() => setPestanaActiva('rendimiento')} className={`px-5 py-2.5 font-black text-[11px] uppercase tracking-wider rounded-t-xl transition-all border-t border-x ${pestanaActiva === 'rendimiento' ? 'bg-white border-slate-200 text-[#001F3F] border-b-2 border-b-white z-10' : 'bg-slate-50 border-transparent text-slate-400 hover:text-slate-600'}`}>📊 Libro Mayor / Kardex por Convenio</button>
      </div>

      {/* DINÁMICA DE FILTROS SEGÚN LA PESTAÑA SELECCIONADA */}
      {pestanaActiva === 'facturas' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gasto por Convenios</p><p className="text-xl font-mono font-black text-[#001F3F] mt-0.5">${consumidoConvenio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Wallet size={18} /></div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gasto Caja Chica</p><p className="text-xl font-mono font-black text-amber-600 mt-0.5">${consumidoEfectivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><ArrowUpRight size={18} /></div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Acumulado Facturas</p><p className="text-xl font-mono font-black text-emerald-600 mt-0.5">${gastoGlobalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp size={18} /></div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-end gap-3 shadow-inner w-full">
            <div className="flex flex-col gap-0.5 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Desde</label><input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 font-mono text-[#001F3F] bg-white h-[36px]" /></div>
            <div className="flex flex-col gap-0.5 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Hasta</label><input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 font-mono text-[#001F3F] bg-white h-[36px]" /></div>
            
            <div className="flex flex-col gap-0.5 flex-1 w-full relative" ref={filtroVendedorRef}>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Chofer</label>
              <button type="button" onClick={() => setIsFiltroVendedorOpen(!isFiltroVendedorOpen)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-[#001F3F] flex items-center justify-between h-[36px]"><span className="truncate">{filtroVendedorSel ? filtroVendedorSel.nombre : '-- TODOS --'}</span><ChevronDown size={14} /></button>
              {isFiltroVendedorOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[140px] overflow-y-auto uppercase">
                  <button onClick={() => { setFiltroVendedor(''); setIsFiltroVendedorOpen(false) }} className="w-full px-3 py-2 text-left text-xs font-black text-amber-600">-- TODOS --</button>
                  {vendedores.map((v: any) => <button key={v.id} onClick={() => { setFiltroVendedor(v.id.toString()); setIsFiltroVendedorOpen(false) }} className="w-full px-3 py-2 text-left text-xs text-[#001F3F] border-b border-slate-50">{v.nombre}</button>)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5 flex-1 w-full relative" ref={filtroEstacionRef}>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Estación</label>
              <button type="button" onClick={() => setIsFiltroEstacionOpen(!isFiltroEstacionOpen)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-[#001F3F] flex items-center justify-between h-[36px]"><span className="truncate">{filtroEstacionSel ? filtroEstacionSel.nombre : '-- TODAS --'}</span><ChevronDown size={14} /></button>
              {isFiltroEstacionOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[140px] overflow-y-auto uppercase">
                  <button onClick={() => { setFiltroEstacion(''); setIsFiltroEstacionOpen(false) }} className="w-full px-3 py-2 text-left text-xs font-black text-amber-600">-- TODAS --</button>
                  {gasolineras.map((g: any) => <button key={g.id} onClick={() => { setFiltroEstacion(g.id.toString()); setIsFiltroEstacionOpen(false) }} className="w-full px-3 py-2 text-left text-xs text-[#001F3F] border-b border-slate-50">{g.nombre}</button>)}
                </div>
              )}
            </div>

            <button onClick={handleConsultarHistorial} className="w-full md:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase px-5 py-2 rounded-lg flex items-center justify-center gap-1 h-[36px] hover:bg-slate-800 transition-colors"><Search size={12} strokeWidth={3} /><span>Buscar</span></button>
          </div>

          {/* 🟢 CORRECCIÓN DE BORDES: Envoltorio overflow-hidden con scroll interno para que la tabla no rompa los márgenes laterales */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-fixed min-w-[950px]">
                <thead>
                  <tr className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-700">
                    <th className="p-3.5 w-[12%] pl-5">Fecha</th>
                    <th className="p-3.5 w-[16%]">No. Factura</th>
                    <th className="p-3.5 w-[26%]">Chofer / Placa Asignada</th>
                    <th className="p-3.5 w-[24%]">Estación de Servicio</th>
                    <th className="p-3.5 text-center w-[12%]">Método Pago</th>
                    <th className="p-3.5 text-right w-[10%]">Total ($)</th>
                    <th className="p-3.5 text-right pr-5 w-[10%]">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                  {facturasFiltradas.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-400 font-black uppercase text-[10px]">No se encontraron facturas.</td></tr>
                  ) : (
                    facturasFiltradas.map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 pl-5 font-mono text-[11px] text-slate-500">{new Date(f.fechaFactura).toISOString().split('T')[0]}</td>
                        <td className="p-3 font-mono font-black text-[#001F3F] truncate">{f.numFactura}</td>
                        <td className="p-3 uppercase truncate text-slate-700 flex items-center gap-2">
                          <span className="font-black text-[#001F3F]">{f.user?.nombre || 'S/N'}</span>
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 font-black tracking-tighter">
                            {f.vehiculo?.placa || 'S/P'}
                          </span>
                        </td>
                        <td className="p-3 uppercase truncate text-slate-700">{f.gasolinera?.nombre || f.nombreEstacionManual || '-- MANUAL EN RUTA --'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide border ${
                            (f.metodoPago || 'CONVENIO') === 'EFECTIVO' ? 'bg-amber-50 text-amber-700 border-amber-100' : (f.metodoPago || 'CONVENIO') === 'TRANSFERENCIA' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>{f.metodoPago || 'CONVENIO'}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">${f.precioTotal.toFixed(2)}</td>
                        <td className="p-3 text-right pr-5">
                          <div className="inline-flex items-center gap-2.5 justify-end w-full">
                            <button onClick={() => abrirModal(f, true)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Ver Detalle Factura"><Eye size={13} /></button>
                            <button onClick={() => abrirModal(f, false)} className="text-slate-400 hover:text-[#FFB800] transition-colors" title="Editar Factura"><Edit2 size={13} /></button>
                            <button onClick={() => handleEliminar(f.id)} className="text-rose-500 hover:text-rose-700 transition-colors" title="Eliminar Comprobante"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* SEMÁFORO DINÁMICO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className={`border p-4 rounded-2xl shadow-sm flex items-center justify-between transition-all ${alertaCredito.claseBg}`}>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Estado del Convenio Corporativo</p>
                <div className="flex items-center gap-2">
                  {alertaCredito.icono}
                  <span className="text-xs font-black uppercase tracking-tight">{alertaCredito.texto}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase opacity-60">Saldo Disponible Matriz</p>
                <p className="text-xl font-mono font-black">${totalesKardex.saldoFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Historial de Recargas / Fondos Asignados</p>
                <p className="text-base font-mono font-black text-teal-600 mt-0.5">${totalesKardex.acreditado.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Consumido a la Fecha</p>
                <p className="text-base font-mono font-black text-rose-600 mt-0.5">${totalesKardex.consumido.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* FILTROS EXCLUSIVOS KARDEX */}
          <div className="bg-slate-800 text-white rounded-xl p-3 flex flex-col md:flex-row items-end gap-3 shadow-lg w-full">
            <div className="flex flex-col gap-0.5 flex-1 w-full relative" ref={kardexEstacionRef}>
              <label className="text-[9px] font-black uppercase text-slate-300 ml-1">1. Seleccionar Convenio / Estación a Auditar</label>
              <button type="button" onClick={() => setIsKardexEstacionOpen(!isKardexEstacionOpen)} className="w-full px-3 py-1.5 bg-white border border-slate-600 rounded-lg font-bold text-xs text-[#001F3F] flex items-center justify-between h-[36px]"><span className="truncate">{kardexEstacionSel ? kardexEstacionSel.nombre : '-- SELECCIONE UN CONVENIO --'}</span><ChevronDown size={14} /></button>
              {isKardexEstacionOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-[140px] overflow-y-auto uppercase">
                  {gasolineras.map((g: any) => (
                    <button key={g.id} onClick={() => { setKardexEstacionId(g.id.toString()); setIsKardexEstacionOpen(false) }} className={`w-full px-3 py-2 text-left text-xs border-b border-slate-50 flex justify-between items-center ${kardexEstacionId === g.id.toString() ? 'bg-slate-100 font-black text-[#001F3F]' : 'text-[#001F3F]'}`}>
                      <span>{g.nombre}</span>
                      {g.tieneConvenio && <span className="text-[7px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-black">CONVENIO</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-300 ml-1">Desde Fecha</label><input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-600 font-mono text-[#001F3F] bg-white h-[36px]" /></div>
            <div className="flex flex-col gap-0.5 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-300 ml-1">Hasta Fecha</label><input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-600 font-mono text-[#001F3F] bg-white h-[36px]" /></div>
          </div>

          {/* TABLA DEL KARDEX CON CONTROL DE MÁRGENES INTERNOS */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full space-y-4 p-4">
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs table-fixed min-w-[950px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-700">
                    <th className="p-3.5 w-[12%] pl-4">FECHA</th>
                    <th className="p-3.5 w-[22%]">TIPO DE ACCIÓN</th>
                    <th className="p-3.5 w-[16%]">Nº FACTURA</th>
                    <th className="p-3.5 w-[26%]">CHOFER / REF</th>
                    <th className="p-3.5 text-right w-[12%]">MONTO ($)</th>
                    <th className="p-3.5 text-right pr-4 w-[12%]">SALDO MATRIZ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-600 font-mono">
                  {movimientosKardex.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400 font-black uppercase text-[10px]">No hay transacciones registradas.</td></tr>
                  ) : (
                    movimientosKardex.map((mov, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pl-4 text-slate-500">{mov.fecha.toISOString().split('T')[0]}</td>
                        <td className={`p-3 text-[10px] font-black ${mov.esCredito ? 'text-teal-600' : 'text-slate-500'}`}>{mov.tipoAccion}</td>
                        <td className="p-3 font-black text-slate-900">{mov.numFactura}</td>
                        <td className="p-3 uppercase text-slate-700 truncate font-sans">
                          {mov.esCredito ? (
                            <span className="italic text-slate-400 font-bold">{mov.choferRef}</span>
                          ) : (
                            <span className="font-bold text-slate-900">
                              {mov.choferRef} <span className="text-[10px] text-slate-400 font-mono font-black">({mov.placa})</span>
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-black ${mov.esCredito ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {mov.esCredito ? `$${mov.monto.toFixed(2)}` : `-$${mov.monto.toFixed(2)}`}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 pr-4">${mov.saldoMatriz.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end pr-4 pt-2 text-xs border-t border-slate-200 space-y-1">
              <p className="font-bold text-slate-500">Total Acreditado: <span className="font-mono text-slate-900 font-black ml-4">${totalesKardex.acreditado.toFixed(2)}</span></p>
              <p className="font-bold text-slate-500">Total Consumido: <span className="font-mono text-rose-600 font-black ml-4">${totalesKardex.consumido.toFixed(2)}</span></p>
              <div className="text-sm font-black text-[#001F3F] pt-1 flex gap-6">
                <span>SALDO ACTUAL FONDOS:</span>
                <span className={`font-mono font-black ${totalesKardex.saldoFinal <= 20 ? 'text-rose-600' : totalesKardex.saldoFinal <= 100 ? 'text-amber-600' : 'text-blue-600'}`}>
                  ${totalesKardex.saldoFinal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FORMULARIO MODAL INTERACTIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[680px] rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsModalOpen(false)}><X size={18} strokeWidth={2.5} /></button>
            <header className="mb-4 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-1 mx-auto"><Fuel size={18} className="text-[#FFB800]" /></div>
              <h2 className="text-base font-black text-[#001F3F] italic uppercase">{isReadOnly ? 'Inspeccionar Comprobante' : facturaId ? 'Modificar Comprobante' : 'Asentar Comprobante'}</h2>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-0.5 relative" ref={dropdownRef}>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><User size={10} className="inline mr-1" /> 1. Chofer / Vendedor Responsable *</label>
                <button type="button" disabled={isReadOnly} onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] flex items-center justify-between shadow-inner hover:bg-slate-100/50 uppercase text-left disabled:opacity-75">
                  <span>{vendedorSeleccionado ? vendedorSeleccionado.nombre.toUpperCase() : '-- SELECCIONAR CONDUCTOR --'}</span>
                  {!isReadOnly && <ChevronDown size={14} />}
                </button>
                {isDropdownOpen && !isReadOnly && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[120px] overflow-y-auto uppercase">
                    {vendedores.map((v:any) => <button key={v.id} type="button" onClick={() => { setVendedorId(v.id.toString()); setIsDropdownOpen(false) }} className={`w-full px-4 py-2 text-left font-black text-xs border-b border-slate-50 ${vendedorId === v.id.toString() ? 'bg-[#001F3F] text-[#FFB800]' : 'text-[#001F3F] hover:bg-slate-50'}`}>{v.nombre}</button>)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Factura *</label><input type="text" required readOnly={isReadOnly} placeholder="001-002-000045123" value={numFactura} onChange={(e) => setNumFactura(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] font-mono shadow-inner focus:outline-none read-only:bg-slate-100" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Emisión *</label><input type="date" required readOnly={isReadOnly} value={fechaFactura} onChange={(e) => setFechaFactura(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] font-mono shadow-inner focus:outline-none read-only:bg-slate-100" /></div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total ($) *</label><input type="number" step="0.01" required readOnly={isReadOnly} placeholder="0.00" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono shadow-inner focus:outline-none read-only:bg-slate-100" /></div>
                    <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Galones *</label><input type="number" step="0.001" required readOnly={isReadOnly} placeholder="0.000" value={galones} onChange={(e) => setGalones(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs font-mono shadow-inner focus:outline-none read-only:bg-slate-100" /></div>
                  </div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago *</label><select disabled={isReadOnly} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full px-3 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg font-black text-xs shadow-inner focus:outline-none h-[38px] disabled:bg-slate-100"><option value="CONVENIO">CONVENIO CORPORATIVO</option><option value="EFECTIVO">EFECTIVO / CAJA CHICA</option><option value="TRANSFERENCIA">TRANSFERENCIA</option></select></div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa Vehículo *</label><select disabled={isReadOnly} required value={placaCarro} onChange={(e) => setPlacaCarro(e.target.value)} className="w-full px-3 py-2 bg-white border border-emerald-200 text-emerald-800 rounded-lg font-black text-xs shadow-inner uppercase h-[38px] disabled:bg-slate-100"><option value="">-- SELECCIONE --</option>{vehiculos.map(v => <option key={v.id} value={v.placa}>{v.placa}</option>)}</select></div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1">Estación de Servicio *</label>
                    {!esGasolineraManual ? (
                      <select disabled={isReadOnly} required value={gasolineraId} onChange={(e) => setGasolineraId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-[#001F3F] shadow-inner uppercase h-[38px] disabled:bg-slate-100"><option value="">-- SELECCIONE --</option>{gasolineras.map(g => g.tieneConvenio && <option key={g.id} value={g.id}>{g.nombre}</option>)}<option value="MANUAL" className="text-amber-600 font-bold">⚠️ OTRA (DIGITAR MANUALMENTE)</option></select>
                    ) : (
                      <div className="flex gap-1">
                        <input type="text" required readOnly={isReadOnly} placeholder="EJ: PRIMAX PUYO" value={gasolineraManual} onChange={(e) => setGasolineraManual(e.target.value)} className="w-full px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg font-black text-[11px] uppercase shadow-inner focus:outline-none h-[38px] read-only:bg-slate-100" />
                        {!isReadOnly && <button type="button" onClick={() => { setGasolineraId(''); setEsGasolineraManual(false) }} className="bg-slate-200 text-slate-700 px-2.5 rounded-lg text-xs font-black hover:bg-slate-300 transition-colors">X</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">{isReadOnly ? 'Cerrar Vista' : 'Cancelar'}</button>
                {!isReadOnly && <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1 hover:bg-slate-800 transition-colors">{loading ? <Loader2 size={12} className="animate-spin" /> : <span>Confirmar Factura ➔</span>}</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}