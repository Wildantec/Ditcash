'use client'

import { useState, useRef, useEffect } from 'react'
import { registrarFacturaCombustible } from '@/app/actions/combustible'
import { exportarFacturasExcel } from '@/app/actions/reportes'
import { Receipt, Plus, X, Loader2, Fuel, Search, FileSpreadsheet, ChevronDown, User, IdCard, Calendar } from 'lucide-react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroEstacion, setFiltroEstacion] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [placaCarro, setPlacaCarro] = useState('')
  const [gasolineraId, setGasolineraId] = useState('')
  const [numFactura, setNumFactura] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [galones, setGalones] = useState('')
  const [fechaFactura, setFechaFactura] = useState('')
  const [metodoPago, setMetodoPago] = useState('CONVENIO')
  const [vendedorId, setVendedorId] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConsultar = () => {
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

  const handleDescargaExcel = async () => {
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
      a.download = `DITCASH_Facturas_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const abrirModal = () => {
    setPlacaCarro('')
    setGasolineraId('')
    setNumFactura('')
    setPrecioTotal('')
    setGalones('')
    setFechaFactura('')
    setMetodoPago('CONVENIO')
    setVendedorId('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!vendedorId) {
      Swal.fire('Inconveniente', 'Debe seleccionar un vendedor responsable de la lista.', 'warning')
      setLoading(false)
      return
    }

    const res = await registrarFacturaCombustible({
      userId: parseInt(vendedorId),
      placaCarro,
      gasolineraId: parseInt(gasolineraId),
      numFactura: numFactura.trim(),
      precioTotal: parseFloat(precioTotal),
      galones: parseFloat(galones),
      fechaFactura: new Date(fechaFactura),
      metodoPago
    })

    if (res.success) {
      Swal.fire({ title: '¡FACTURA ASENTADA!', icon: 'success', confirmButtonColor: '#001F3F' }).then(() => window.location.reload())
    } else {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; color:#ef4444;">COMPROBANTE DUPLICADO</span>',
        text: res.error || 'El número de factura ingresado ya existe en DITCASH.',
        icon: 'error',
        confirmButtonColor: '#001F3F'
      })
      setLoading(false)
    }
  }

  const vendedorSeleccionado = vendedores.find(v => v.id.toString() === vendedorId)

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F] relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Receipt className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Auditoría Contable
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Ingreso de comprobantes y cruce de rendimientos con el GPS de rutas
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleDescargaExcel} disabled={exportando} className="bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-md">
            {exportando ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
            <span>Exportar Facturas</span>
          </button>
          <button onClick={abrirModal} className="bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg">
            <Plus size={13} strokeWidth={3} /> Ingresar Factura
          </button>
        </div>
      </header>
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-end gap-4 shadow-inner">
        <div className="flex flex-col gap-1 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Desde</label><input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 font-mono text-[#001F3F] bg-white" /></div>
        <div className="flex flex-col gap-1 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Hasta</label><input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 font-mono text-[#001F3F] bg-white" /></div>
        <div className="flex flex-col gap-1 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Chofer / Vendedor</label>
          <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] bg-white">
            <option value="">-- TODOS --</option>
            {vendedores.map((v: any) => (<option key={v.id} value={v.id}>{v.nombre.toUpperCase()}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Estación de Servicio</label>
          <select value={filtroEstacion} onChange={(e) => setFiltroEstacion(e.target.value)} className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] bg-white">
            <option value="">-- TODAS --</option>
            {gasolineras.map(g => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
          </select>
        </div>
        <button onClick={handleConsultar} className="w-full md:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow transition-all hover:bg-black active:scale-95 whitespace-nowrap"><Search size={12} strokeWidth={3} /><span>Consultar ➔</span></button>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1050px]">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-5 pl-8 w-[12%]">Fecha</th>
                <th className="p-5 w-[16%]">No. Factura</th>
                <th className="p-5 w-[12%]">Placa</th>
                <th className="p-5 w-[22%]">Estación de Servicio</th>
                <th className="p-5 text-center w-[13%]">Método Pago</th>
                <th className="p-5 text-center w-[13%]">Chofer Asignado</th>
                <th className="p-5 text-right pr-8 w-[12%]">Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold text-slate-600">
              {facturasFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No se encontraron facturas con los filtros consultados.</td></tr>
              ) : (
                facturasFiltradas.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 pl-8 font-mono">{new Date(f.fechaFactura).toISOString().split('T')[0]}</td>
                    <td className="p-5 font-mono font-black text-[#001F3F]">{f.numFactura}</td>
                    <td className="p-5 uppercase font-mono tracking-wider">{f.vehiculo?.placa}</td>
                    <td className="p-5 uppercase truncate">{f.gasolinera?.nombre}</td>
                    <td className="p-5 text-center"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wide">{f.metodoPago || 'CONVENIO'}</span></td>
                    <td className="p-5 text-center uppercase text-[11px] truncate">{f.user?.nombre}</td>
                    <td className="p-5 text-right pr-8 font-mono font-black text-slate-900">${f.precioTotal.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[850px] rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={20} strokeWidth={2.5} /></button>
            
            <header className="mb-6 text-center flex flex-col items-center justify-center gap-1">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-1"><Fuel size={20} className="text-[#FFB800]" /></div>
              <h2 className="text-xl font-black text-[#001F3F] italic uppercase">Asentar Comprobante</h2>
              <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.4em]">DITCASH - Auditoría de Combustible</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Receipt size={11} /> No. Factura *</label>
                    <input type="text" required placeholder="001-002-000045123" value={numFactura} onChange={(e) => setNumFactura(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner font-mono focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><Calendar size={11} /> Fecha Emisión *</label>
                    <input type="date" required value={fechaFactura} onChange={(e) => setFechaFactura(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner font-mono focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Total ($) *</label>
                      <input type="number" step="0.01" required placeholder="0.00" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner font-mono focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Galones *</label>
                      <input type="number" step="0.001" required placeholder="0.000" value={galones} onChange={(e) => setGalones(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Método de Pago *</label>
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner focus:outline-none cursor-pointer"><option value="CONVENIO">CONVENIO CORPORATIVO</option><option value="EFECTIVO">EFECTIVO / CAJA CHICA</option><option value="TRANSFERENCIA">TRANSFERENCIA</option></select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad Vehicular *</label>
                    <select required value={placaCarro} onChange={(e) => setPlacaCarro(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner uppercase focus:outline-none cursor-pointer"><option value="">-- SELECCIONE --</option>{vehiculos.map(v => (<option key={v.id} value={v.placa}>{v.placa}</option>))}</select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Gasolineras Estación *</label>
                    <select required value={gasolineraId} onChange={(e) => setGasolineraId(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] shadow-inner uppercase focus:outline-none cursor-pointer"><option value="">-- SELECCIONE --</option>{gasolineras.map(g => (<option key={g.id} value={g.id}>{g.nombre}</option>))}</select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 relative pt-2" ref={dropdownRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><User size={11} /> Chofer / Vendedor Responsable *</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] flex items-center justify-between shadow-inner hover:bg-slate-100/50"
                >
                  <span>{vendedorSeleccionado ? vendedorSeleccionado.nombre.toUpperCase() : '-- ASIGNAR CONDUCTOR OPERATIVO ARAUJO --'}</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[160px] overflow-y-auto animate-fadeIn">
                    {vendedores.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVendedorId(v.id.toString())
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full px-5 py-3 text-left font-black text-xs border-b border-slate-50 transition-colors uppercase ${
                          vendedorId === v.id.toString() ? 'bg-[#001F3F] text-[#FFB800]' : 'text-[#001F3F] hover:bg-slate-50'
                        }`}
                      >
                        {v.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-5 pt-4 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2">{loading ? <Loader2 size={12} className="animate-spin" /> : <span>Asentar Factura ➔</span>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}