'use client'

import { useState, useEffect } from 'react'
import { registrarFacturaCombustible, eliminarFacturaCombustibleAction } from '@/app/actions/combustible'
import { FileText, Plus, Trash2, Loader2, DollarSign, X, Edit2, Download } from 'lucide-react'
import Swal from 'sweetalert2'
import { exportarFacturasCombustibleExcel } from '@/app/actions/reportes-oficina'

interface ModuloFacturasClientProps {
  facturasIniciales: any[]
  gasolineras: any[]
  vehiculos: any[]
  vendedores: any[]
}

export default function ModuloFacturasClient({ 
  facturasIniciales = [], 
  gasolineras = [], 
  vendedores = [] 
}: ModuloFacturasClientProps) {
  const [listaRegistros, setListaRegistros] = useState<any[]>(facturasIniciales)
  const [registrosFiltrados, setRegistrosFiltrados] = useState<any[]>(facturasIniciales)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroEstacion, setFiltroEstacion] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')

  const [metodoPago, setMetodoPago] = useState('CONVENIO')
  const [gasolineraId, setGasolineraId] = useState('')
  const [nombreEstacionManual, setNombreEstacionManual] = useState('')
  const [chofer, setChofer] = useState('') 
  const [numFactura, setNumFactura] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [fechaFactura, setFechaFactura] = useState('')

  const [saldoSeleccionado, setSaldoSeleccionado] = useState<number | null>(null)

  useEffect(() => {
    setListaRegistros(facturasIniciales)
  }, [facturasIniciales])

  // 🚀 BÚSQUEDA AUTOMÁTICA EN TIEMPO REAL (SIN BOTÓN DE FILTRAR)
  useEffect(() => {
    let aux = [...listaRegistros]
    if (fechaDesde !== '') aux = aux.filter(r => r?.fechaFactura?.split('T')[0] >= fechaDesde)
    if (fechaHasta !== '') aux = aux.filter(r => r?.fechaFactura?.split('T')[0] <= fechaHasta)
    if (filtroEstacion !== '') aux = aux.filter(r => Number(r?.gasolineraId) === Number(filtroEstacion))
    if (filtroVendedor !== '') aux = aux.filter(r => r?.chofer?.toUpperCase() === filtroVendedor.toUpperCase())
    setRegistrosFiltrados(aux)
  }, [listaRegistros, fechaDesde, fechaHasta, filtroEstacion, filtroVendedor])

  useEffect(() => {
    if (metodoPago === 'CONVENIO' && gasolineraId) {
      const estacion = gasolineras.find(g => Number(g.id) === Number(gasolineraId))
      setSaldoSeleccionado(estacion ? estacion.montoActual : 0)
    } else {
      setSaldoSeleccionado(null)
    }
  }, [gasolineraId, metodoPago, gasolineras])

  const handleLimpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setFiltroEstacion('')
    setFiltroVendedor('')
  }

  const abrirModalNuevo = () => {
    setEditingId(null)
    setMetodoPago('CONVENIO')
    setGasolineraId('')
    setNombreEstacionManual('')
    setChofer('')
    setNumFactura('')
    setPrecioTotal('')
    setFechaFactura(new Date().toISOString().split('T')[0])
    setIsModalOpen(true)
  }

  const abrirModalEditar = (r: any) => {
    setEditingId(r.id)
    setMetodoPago(r.metodoPago || 'CONVENIO')
    setGasolineraId(r.gasolineraId ? String(r.gasolineraId) : '')
    setNombreEstacionManual(r.nombreEstacionManual || r.gasolinera?.nombre || '')
    setChofer(r.chofer || '')
    setNumFactura(r.numFactura && !r.numFactura.includes('-SEC-') ? r.numFactura : '')
    setPrecioTotal(String(r.precioTotal || ''))
    setFechaFactura(r.fechaFactura ? r.fechaFactura.split('T')[0] : '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const precio = parseFloat(precioTotal)
    
    if (isNaN(precio) || precio <= 0 || !chofer || !fechaFactura) {
      Swal.fire('Campos inválidos', 'Por favor complete todos los campos obligatorios.', 'error')
      setLoading(false)
      return
    }

    const vSel = vendedores.find(v => v.nombre === chofer)
    const placaAsignada = vSel?.asignacionesVehiculo?.[0]?.vehiculo?.placa || 'DIT-000'

    const payload = {
      id: editingId || undefined,
      userId: vSel ? Number(vSel.id) : 1, 
      metodoPago,
      gasolineraId: metodoPago === 'CONVENIO' ? Number(gasolineraId) : 0,
      nombreEstacionManual: metodoPago === 'NO CONVENIO' ? nombreEstacionManual.trim().toUpperCase() : undefined,
      chofer: chofer.toUpperCase(),
      placaCarro: placaAsignada.toUpperCase(), 
      numFactura: numFactura.trim().toUpperCase(),
      precioTotal: precio,
      galones: 0,
      fechaFactura: new Date(fechaFactura)
    }

    const res = await registrarFacturaCombustible(payload)
    if (res.success) {
      setIsModalOpen(false)
      Swal.fire('Confirmado', editingId ? 'Factura actualizada con éxito.' : 'Factura registrada con éxito.', 'success')
        .then(() => window.location.reload())
    } else {
      Swal.fire('Error de Validación', res.error || 'No se pudo guardar la transacción.', 'error')
      setLoading(false)
    }
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar factura de combustible?',
      text: 'Esto revertirá los movimientos contables de forma inmediata.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'SÍ, BORRAR'
    })
    if (result.isConfirmed) {
      const res = await eliminarFacturaCombustibleAction(id)
      if (res.success) window.location.reload()
    }
  }

  const descargarExcel = async () => {
    try {
      Swal.fire({
        title: 'Generando Excel',
        text: 'Por favor espere mientras procesamos las hojas de cálculo...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      });
      const res = await exportarFacturasCombustibleExcel({
        vendedor: filtroVendedor,
        fechaDesde,
        fechaHasta
      });

      Swal.close();

      if (res.success && res.data && res.filename) {
        const blob = new Blob([new Uint8Array(res.data)], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Swal.fire('Error', res.error || 'No se pudo generar el archivo de Excel.', 'error');
      }
    } catch (err: any) {
      Swal.close();
      Swal.fire('Error', 'Ocurrió un fallo en la exportación.', 'error');
    }
  };

  const listaUnicaVendedores = Array.from(new Set(listaRegistros.map(r => r.chofer).filter(Boolean)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 text-[#001F3F]">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <FileText className="text-[#FFB800]" size={24} /> Facturas Combustible
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest mt-0.5">
            Ingreso y Control de Comprobantes de Combustible
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={descargarExcel} className="w-full sm:w-auto bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition-all">
            <Download size={14} strokeWidth={3} /> Generar Excel
          </button>
          <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
            <Plus size={14} strokeWidth={3} /> Ingresar nueva factura
          </button>
        </div>
      </header>

      {/* FILTROS CON BÚSQUEDA AUTOMÁTICA (SIN BOTÓN DE FILTRAR) */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-inner flex flex-col lg:flex-row items-end gap-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1 w-full">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white h-[38px] cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white h-[38px] cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Estación</label>
            <select value={filtroEstacion} onChange={(e) => setFiltroEstacion(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white h-[38px] uppercase cursor-pointer font-black">
              <option value="">TODAS LAS ESTACIONES</option>
              {gasolineras.map((g: any) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Vendedor</label>
            <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white h-[38px] uppercase cursor-pointer font-black">
              <option value="">TODOS LOS VENDEDORES</option>
              {listaUnicaVendedores.map((v: any, idx) => (
                <option key={idx} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto shrink-0">
          <button onClick={handleLimpiarFiltros} className="w-full lg:w-28 bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest h-[38px] rounded-xl transition-all hover:bg-slate-300">Limpiar</button>
        </div>
      </div>

      {/* TABLA DE FACTURAS RECONSTRUIDA Y ALINEADA */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-4 pl-6 w-[12%]">Fecha Fact.</th>
                <th className="p-4 w-[12%] text-center">Tipo Pago</th>
                <th className="p-4 w-[20%]">Estación</th>
                <th className="p-4 w-[20%]">Vendedor / Chofer</th> 
                <th className="p-4 w-[18%] font-mono">No. Factura</th>
                <th className="p-4 w-[11%] text-right pr-4">Total Pagado</th>
                <th className="p-4 text-center pr-6 w-[7%]">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">
                    No hay facturas registradas.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 pl-6 font-mono text-slate-500 whitespace-nowrap">
                      {r.fechaFactura ? r.fechaFactura.split('T')[0] : 'S/F'}
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded-md uppercase border ${
                        r.metodoPago === 'NO CONVENIO' 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {r.metodoPago || 'CONVENIO'}
                      </span>
                    </td>

                    <td className="p-4 uppercase font-black text-[#001F3F] truncate">
                      {r.metodoPago === 'NO CONVENIO' ? (r.nombreEstacionManual || 'ESTACIÓN EXTERNA') : r.gasolinera?.nombre}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col justify-center gap-0.5">
                        <span className="uppercase font-black text-[#001F3F] truncate text-[11px]">
                          {r.chofer || 'SIN VENDEDOR'}
                        </span>
                        <span className="inline-flex w-fit px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-mono text-[9px] font-bold border border-slate-200">
                          {vendedores.find(v => String(v.nombre).trim().toUpperCase() === String(r.chofer).trim().toUpperCase())
                            ?.asignacionesVehiculo?.[0]?.vehiculo?.placa || r.placaCarro || r.placa || 'S/P'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-700 truncate select-all">
                      {r.numFactura || 'S/N'}
                    </td>

                    <td className="p-4 text-right font-mono font-black text-rose-600 text-[13px] pr-4">
                      ${Number(r.precioTotal || 0).toFixed(2)}
                    </td>

                    <td className="p-4 text-center pr-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => abrirModalEditar(r)} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 transition-all" title="Editar">
                          <Edit2 size={13} />
                        </button>
                        <button type="button" onClick={() => handleEliminar(r.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 transition-all" title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-[440px] rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500"><X size={18} strokeWidth={2.5} /></button>
            
            <header className="mb-4 text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-2 mx-auto"><FileText size={20} className="text-[#FFB800]" /></div>
              <h2 className="text-base font-black text-[#001F3F] italic uppercase">{editingId ? 'Editar Factura' : 'Ingresar nueva factura'}</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Liquidación de despacho de combustible</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Estación *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setMetodoPago('CONVENIO'); setNombreEstacionManual(''); }} className={`py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${metodoPago === 'CONVENIO' ? 'bg-[#001F3F] text-[#FFB800] border-[#001F3F]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    Con Convenio
                  </button>
                  <button type="button" onClick={() => { setMetodoPago('NO CONVENIO'); setGasolineraId(''); }} className={`py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${metodoPago === 'NO CONVENIO' ? 'bg-[#001F3F] text-[#FFB800] border-[#001F3F]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    Fuera de Convenio
                  </button>
                </div>
              </div>

              {metodoPago === 'CONVENIO' ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estación Afiliada *</label>
                  <select required={metodoPago === 'CONVENIO'} value={gasolineraId} onChange={(e) => setGasolineraId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] focus:outline-none uppercase cursor-pointer">
                    <option value="">-- SELECCIONE ESTACIÓN --</option>
                    {gasolineras.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre} (SALDO: ${Number(g.montoActual ?? 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {saldoSeleccionado !== null && (
                    <div className="text-right px-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${saldoSeleccionado <= 0 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                        Saldo Disponible: ${saldoSeleccionado.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Estación de Combustible *</label>
                  <input type="text" required={metodoPago === 'NO CONVENIO'} placeholder="EJ: GASOLINERA SANTIAGO" value={nombreEstacionManual} onChange={(e) => setNombreEstacionManual(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-[#001F3F] focus:outline-none" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendedor Responsable *</label>
                <select required value={chofer} onChange={(e) => setChofer(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] focus:outline-none uppercase cursor-pointer">
                  <option value="">-- SELECCIONE UN VENDEDOR --</option>
                  {vendedores.map((v: any) => {
                    const placaVehiculo = v.asignacionesVehiculo?.[0]?.vehiculo?.placa || 'SIN AUTO';
                    return (
                      <option key={v.id} value={v.nombre}>
                        {v.nombre} ({placaVehiculo})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Factura (Opcional)</label>
                  <input type="text" placeholder="001-002-0004321" value={numFactura} onChange={(e) => setNumFactura(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs font-mono text-[#001F3F] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Emisión *</label>
                  <input type="date" required value={fechaFactura} onChange={(e) => setFechaFactura(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs font-mono text-[#001F3F] focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={11} /> Monto Total de la Factura *</label>
                <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} className="w-full px-4 py-2.5 bg-rose-50/20 border border-rose-200 rounded-xl font-mono font-black text-sm text-[#001F3F] focus:outline-none focus:border-rose-500" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                <button disabled={loading || (metodoPago === 'CONVENIO' && saldoSeleccionado !== null && saldoSeleccionado <= 0)} className="bg-[#001F3F] text-[#FFB800] disabled:bg-slate-200 disabled:text-slate-400 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-black transition-all">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Confirmar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}