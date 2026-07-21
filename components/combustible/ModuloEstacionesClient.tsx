'use client'

import { useState, useEffect } from 'react'
import { crearGasolineraAction, editarGasolineraAction, eliminarGasolineraAction } from '@/app/actions/combustible'
import { Fuel, Plus, X, Loader2, DollarSign, Wallet, ArrowUpRight, Calendar, Edit2, Trash2, Download } from 'lucide-react'
import Swal from 'sweetalert2'
import { exportarKardexEstacionesExcel } from '@/app/actions/reportes-estaciones'

interface ModuloEstacionesProps {
  movimientosIniciales: any[]
  nombresEstaciones: string[]
  estacionesSoloConvenio?: string[] 
}

export default function ModuloEstacionesClient({ 
  movimientosIniciales = [], 
  nombresEstaciones = [],
  estacionesSoloConvenio = [] 
}: ModuloEstacionesProps) {
  const [listaMovimientos, setListaMovimientos] = useState<any[]>([])
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<any[]>([])
  
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroEstacion, setFiltroEstacion] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEdicion, setIsEdicion] = useState(false)
  const [esNuevaEstacion, setEsNuevaEstacion] = useState(false)
  const [movimientoSeleccionadoId, setMovimientoSeleccionadoId] = useState<number | null>(null)
  
  const [nombre, setNombre] = useState('')
  const [numFactura, setNumFactura] = useState('')
  const [montoRecarga, setMontoRecarga] = useState('')
  const [fechaAcreditacion, setFechaAcreditacion] = useState('') 

  const [totalRecargado, setTotalRecargado] = useState(0)
  const [totalConsumido, setTotalConsumido] = useState(0)

  const procesarSaldosPorEstacion = (movimientos: any[]) => {
    const ordenadosParaCalculo = [...movimientos].sort((a, b) => {
      const tiempoA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.fecha).getTime();
      const tiempoB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.fecha).getTime();
      
      if (tiempoA !== tiempoB) return tiempoA - tiempoB;
      
      const esAcredA = a.id && String(a.id).startsWith('ACRED-') ? 1 : 0;
      const esAcredB = b.id && String(b.id).startsWith('ACRED-') ? 1 : 0;
      return esAcredB - esAcredA;
    });
    
    const acumuladores: Record<string, number> = {};

    const conSaldosCalculados = ordenadosParaCalculo.map((m) => {
      const estacion = String(m.nombreEstacion).toUpperCase().trim();
      if (!(estacion in acumuladores)) acumuladores[estacion] = 0;

      const saldoInicialDeEstacion = acumuladores[estacion];
      const acred = Number(m.acreditacion || 0);
      const cons = Number(m.consumo || 0);
      const esAcreditacion = m.id && String(m.id).startsWith('ACRED-');

      acumuladores[estacion] += (acred - cons);

      return {
        ...m,
        acreditacion: esAcreditacion ? acred : saldoInicialDeEstacion,
        saldo: acumuladores[estacion]
      };
    });

    return conSaldosCalculados.reverse();
  };

  useEffect(() => {
    const movimientosListos = procesarSaldosPorEstacion(movimientosIniciales);
    setListaMovimientos(movimientosListos);
  }, [movimientosIniciales]);

  useEffect(() => {
    let aux = [...listaMovimientos];

    if (filtroEstacion !== '') {
      aux = aux.filter(m => String(m.nombreEstacion).toUpperCase() === filtroEstacion.toUpperCase());
    }
    if (fechaDesde !== '') aux = aux.filter(m => (m.fecha || '') >= fechaDesde);
    if (fechaHasta !== '') aux = aux.filter(m => (m.fecha || '') <= fechaHasta);

    setMovimientosFiltrados(aux);

    const ingresos = aux.reduce((sum, m) => {
      const esRealAcreditacion = m.id && String(m.id).startsWith('ACRED-');
      return sum + (esRealAcreditacion ? Number(m.acreditacion || 0) : 0);
    }, 0);
    const egresos = aux.reduce((sum, m) => sum + Number(m.consumo || 0), 0);

    setTotalRecargado(ingresos);
    setTotalConsumido(egresos);
  }, [listaMovimientos, filtroEstacion, fechaDesde, fechaHasta]);

  const handleLimpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setFiltroEstacion('')
  }

  const descargarKardexExcel = async () => {
    try {
      Swal.fire({
        title: 'Generando Reporte Contable',
        text: 'Procesando el Kardex por estaciones...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      });

      const res = await exportarKardexEstacionesExcel({
        gasolineraNombre: filtroEstacion, 
        fechaDesde,
        fechaHasta
      });

      Swal.close();

      if (res.success && res.data && res.filename) {
        const blob = new Blob([new Uint8Array(res.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Swal.fire('Error', res.error || 'No se pudo generar el Kardex.', 'error');
      }
    } catch (err) {
      Swal.close();
      Swal.fire('Error', 'Fallo al exportar el archivo Excel.', 'error');
    }
  };

  const abrirModalNuevo = () => {
    setIsEdicion(false)
    setEsNuevaEstacion(false)
    setMovimientoSeleccionadoId(null)
    setNombre('')
    setNumFactura('')
    setMontoRecarga('')
    setFechaAcreditacion(new Date().toISOString().split('T')[0])
    setIsModalOpen(true)
  }

  const abrirModalEditar = (m: any) => {
    setIsEdicion(true)
    setEsNuevaEstacion(true)
    setMovimientoSeleccionadoId(Number(m.id.replace('ACRED-', '')))
    setNombre(m.nombreEstacion || '')
    setNumFactura(m.numFactura && !m.numFactura.startsWith('SEC-') ? m.numFactura : '')
    setMontoRecarga(String(m.acreditacion || ''))
    setFechaAcreditacion(m.fecha || '')
    setIsModalOpen(true)
  }

  const handleEliminar = async (idString: string) => {
    const idNumerico = Number(idString.replace('ACRED-', ''))
    const result = await Swal.fire({ 
      title: '¿ELIMINAR REGISTRO CONTABLE?', 
      text: 'Esta acción removerá esta acreditación específica del Kardex.', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#001F3F', 
      confirmButtonText: 'SÍ, ELIMINAR' 
    })
    if (result.isConfirmed) {
      const res = await eliminarGasolineraAction(idNumerico)
      if (res.success) window.location.reload()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const parseMonto = parseFloat(montoRecarga)
    
    let comprobanteIngresado = numFactura.trim().toUpperCase()
    if (!comprobanteIngresado) {
      const cadenaFecha = fechaAcreditacion.replace(/-/g, '')
      const idSufijo = Math.floor(100 + Math.random() * 900)
      comprobanteIngresado = `SEC-${cadenaFecha}${idSufijo}`
    }

    if (!nombre || isNaN(parseMonto) || parseMonto <= 0) {
      Swal.fire('Campos inválidos', 'Por favor ingrese una estación y un monto válido.', 'warning')
      setLoading(false)
      return
    }

    if (!isEdicion && !comprobanteIngresado.startsWith('SEC-')) {
      const historialEstacion = listaMovimientos.filter(m => m.nombreEstacion.toUpperCase() === nombre.toUpperCase())
      const facturaDuplicada = historialEstacion.some(m => m.numFactura.toUpperCase() === comprobanteIngresado && m.id.startsWith('ACRED-'))

      if (facturaDuplicada) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; color:#ef4444;">COMPROBANTE REPETIDO</span>',
          text: `La factura No. "${comprobanteIngresado}" ya se encuentra registrada como una acreditación activa en la estación "${nombre.toUpperCase()}". Por favor, verifique el comprobante.`,
          icon: 'error',
          confirmButtonColor: '#001F3F'
        })
        setLoading(false)
        return
      }
    }

    const payload = { 
      nombre: nombre.trim().toUpperCase(), 
      numFactura: comprobanteIngresado, 
      tieneConvenio: true, 
      montoRecarga: parseMonto,
      createdAt: new Date(fechaAcreditacion) 
    }
    
    const res = isEdicion && movimientoSeleccionadoId
      ? await editarGasolineraAction(movimientoSeleccionadoId, payload)
      : await crearGasolineraAction(payload)

    if (res.success) {
      setIsModalOpen(false)
      Swal.fire('¡Confirmado!', isEdicion ? 'Acreditación modificada.' : 'Acreditación asentada.', 'success').then(() => window.location.reload())
    } else {
      Swal.fire('Error', res.error || 'No se pudo guardar.', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 text-[#001F3F]">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Fuel className="text-[#FFB800]" size={24} /> Control de Estaciones (Kardex)
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest mt-0.5">Estado de cuenta resumido por movimientos de combustible</p>
        </div>
        <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
          <Plus size={14} strokeWidth={3} /> Nueva Acreditación
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Acreditado {filtroEstacion ? `(${filtroEstacion})` : '(General)'}</p>
            <p className="text-xl font-mono font-black text-emerald-600">${totalRecargado.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Consumido {filtroEstacion ? `(${filtroEstacion})` : '(General)'}</p>
            <p className="text-xl font-mono font-black text-rose-600">${totalConsumido.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><ArrowUpRight size={20} /></div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Real Total {filtroEstacion ? `(${filtroEstacion})` : '(General)'}</p>
            <p className={`text-xl font-mono font-black ${(totalRecargado - totalConsumido) <= 0 ? 'text-red-500' : 'text-[#001F3F]'}`}>${(totalRecargado - totalConsumido).toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><Fuel size={20} /></div>
        </div>
      </div>

      {/* COMPONENTE DE FILTRADO AUTOMÁTICO EN TIEMPO REAL */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-end gap-3 shadow-inner w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] bg-white h-[38px] font-mono cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] bg-white h-[38px] font-mono cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1">Estación</label>
            <select value={filtroEstacion} onChange={(e) => setFiltroEstacion(e.target.value)} className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-[#001F3F] bg-white h-[38px] uppercase cursor-pointer font-black">
              <option value="">-- TODAS LAS ESTACIONES --</option>
              {nombresEstaciones.map((name, idx) => ( <option key={idx} value={name}>{name}</option> ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button onClick={handleLimpiarFiltros} className="w-full md:w-28 bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest h-[38px] rounded-xl transition-all hover:bg-slate-300">Limpiar</button>
          <button onClick={descargarKardexExcel} className="w-full md:w-32 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest h-[38px] rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:bg-emerald-700 transition-all">
            <Download size={13} strokeWidth={3} /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-4 pl-6 w-[12%]">Fecha</th>
                <th className="p-4 w-[11%] text-center">Tipo</th>
                <th className="p-4 w-[23%]">Estación de Servicio</th>
                <th className="p-4 w-[16%] font-mono">No. Factura / Doc</th>
                <th className="p-4 w-[11%] text-right pr-2">Acreditación</th>
                <th className="p-4 w-[11%] text-right pr-2">Consumo</th>
                <th className="p-4 w-[10%] text-right pr-4">Saldo</th>
                <th className="p-4 text-center pr-6 w-[7%]">Gestión</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No existen registros contables.</td>
                </tr>
              ) : (
                movimientosFiltrados.map((m: any) => {
                  const valAcreditacion = Number(m.acreditacion || 0);
                  const valConsumo = Number(m.consumo || 0);
                  const valSaldo = Number(m.saldo || 0);
                  const esAcreditacion = m.id && String(m.id).startsWith('ACRED-');

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-slate-500 whitespace-nowrap">{m.fecha || 'S/F'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded-md uppercase ${esAcreditacion ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                          {esAcreditacion ? 'ACREDITAC.' : 'CONSUMO'}
                        </span>
                      </td>
                      <td className="p-4 uppercase font-black text-[#001F3F] truncate">{m.nombreEstacion || 'S/E'}</td>
                      <td className="p-4 font-mono text-slate-500 truncate">{m.numFactura || 'S/N'}</td>
                      <td className={`p-4 text-right font-mono font-black text-[13px] pr-2 ${esAcreditacion ? 'text-emerald-600' : 'text-slate-400 font-medium'}`}>
                        {valAcreditacion > 0 ? `${esAcreditacion ? '+' : ''}$${valAcreditacion.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-rose-500 text-[13px] pr-2">
                        {valConsumo > 0 ? `$${valConsumo.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-[#001F3F] text-[13px] pr-4 bg-slate-50/50">${valSaldo.toFixed(2)}</td>
                      <td className="p-4 text-center pr-6">
                        {esAcreditacion ? (
                          <div className="flex items-center justify-center gap-1.5 w-full">
                            <button type="button" onClick={() => abrirModalEditar(m)} title="Modificar Acreditación" className="text-slate-400 hover:text-blue-500 p-1 rounded-lg hover:bg-slate-100 transition-all"><Edit2 size={12} /></button>
                            <button type="button" onClick={() => handleEliminar(m.id)} title="Eliminar del Historial" className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 transition-all"><Trash2 size={12} /></button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic uppercase font-black">Consumo</span>
                        )}
                      </td>
                    </tr>
                  )
                })
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
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-2 mx-auto"><Fuel size={20} className="text-[#FFB800]" /></div>
              <h2 className="text-base font-black text-[#001F3F] italic uppercase">{isEdicion ? 'Modificar Acreditación' : 'Asentar Acreditación'}</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Inyección de presupuesto a convenio</p>
            </header>

            {!isEdicion && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 mb-3">
                <input type="checkbox" id="chkNueva" checked={esNuevaEstacion} onChange={(e) => { setEsNuevaEstacion(e.target.checked); setNombre(''); }} className="w-4 h-4 text-[#001F3F] bg-white border-slate-300 rounded focus:ring-0 cursor-pointer" />
                <label htmlFor="chkNueva" className="text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none">¿Es una estación completamente nueva?</label>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {esNuevaEstacion ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial de la Estación *</label>
                  <input type="text" required placeholder="EJ: PRIMAX QUITO" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-[#001F3F] focus:outline-none" />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccione Estación a Acreditar *</label>
                  <select required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] focus:outline-none uppercase cursor-pointer">
                    <option value="">-- SELECCIONE ESTACIÓN MATRIZ --</option>
                    {estacionesSoloConvenio.map((name, idx) => ( <option key={idx} value={name}>{name}</option> ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Factura Acreditación (Opcional)</label>
                <input type="text" placeholder="DEJAR VACÍO PARA GENERAR SECUENCIAL" value={numFactura} onChange={(e) => setNumFactura(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase font-mono text-[#001F3F] focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Registro *</label>
                <input type="date" required value={fechaAcreditacion} onChange={(e) => setFechaAcreditacion(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs font-mono text-[#001F3F] focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={11} /> Monto a Cargar *</label>
                <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={montoRecarga} onChange={(e) => setMontoRecarga(e.target.value)} className="w-full px-4 py-2.5 bg-amber-50/20 border border-amber-200 rounded-xl font-mono font-black text-sm text-[#001F3F] focus:outline-none focus:border-[#FFB800]" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-black">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Confirmar Asiento</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}