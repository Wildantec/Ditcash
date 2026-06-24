'use client'

import { useState } from 'react'
import { crearGasolineraAction, editarGasolineraAction, eliminarGasolineraAction } from '@/app/actions/combustible'
import { exportarEstacionesExcel } from '@/app/actions/reportes'
import { Fuel, MapPin, Plus, ShieldCheck, Edit2, Trash2, X, Loader2, FileSpreadsheet, Search, DollarSign, Wallet, ArrowUpRight, TrendingUp, ArrowLeft } from 'lucide-react'
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
  const [montoRecarga, setMontoRecarga] = useState('')

  // Cálculos de Auditoría
  const totalRecargado = listaGasolineras.reduce((acc, curr) => acc + (curr.montoRecarga || 0), 0)
  const totalConsumido = listaGasolineras.reduce((acc, curr) => {
    const facturasConvenio = curr.registrosCombustible?.filter((f: any) => !f.metodoPago || f.metodoPago === 'CONVENIO') || []
    return acc + facturasConvenio.reduce((sum: number, d: any) => sum + (d.precioTotal || 0), 0)
  }, 0)
  const saldoDisponible = totalRecargado - totalConsumido

  const handleConsultar = () => {
    const filtrados = listaGasolineras.filter((g) => g.ciudad.toUpperCase().includes(filtroCiudad.toUpperCase().trim()))
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
      a.download = `DITCASH_Convenios_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    }
    setExportando(false)
  }

  const abrirModal = (estacion?: any) => {
    if (estacion) {
      setEstacionId(Number(estacion.id)); setNombre(estacion.nombre || ''); setCiudad(estacion.ciudad || '');
      setTieneConvenio(!!estacion.tieneConvenio); setMontoRecarga(estacion.montoRecarga?.toString() || '')
    } else {
      setEstacionId(null); setNombre(''); setCiudad(''); setTieneConvenio(false); setMontoRecarga('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const parseMonto = montoRecarga.trim() === '' ? 0 : parseFloat(montoRecarga)
    const payload = { 
        nombre: nombre.trim().toUpperCase(), ciudad: ciudad.trim().toUpperCase(), 
        tieneConvenio, montoRecarga: tieneConvenio ? (isNaN(parseMonto) ? 0 : parseMonto) : 0 
    }
    const res = estacionId ? await editarGasolineraAction(estacionId, payload) : await crearGasolineraAction(payload)

    if (res.success) {
      setIsModalOpen(false)
      Swal.fire({ title: '¡SISTEMA ACTUALIZADO!', text: 'Los cambios se impactaron en Ditcash.', icon: 'success', confirmButtonColor: '#001F3F' })
      .then(() => window.location.reload())
    } else {
      Swal.fire('Error', res.error || 'No se pudo guardar.', 'error')
      setLoading(false)
    }
  }

  const handleEliminar = async (id: number) => {
    const result = await Swal.fire({ title: '¿ELIMINAR PUNTO?', text: 'Esta acción es irreversible.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#001F3F', confirmButtonText: 'SÍ, ELIMINAR' })
    if (result.isConfirmed) {
      const res = await eliminarGasolineraAction(id)
      if (res.success) window.location.reload()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 text-[#001F3F]">
      
      {/* HEADER DINÁMICO */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-200">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 justify-center sm:justify-start">
            <Fuel className="text-[#FFB800]" size={24} strokeWidth={2.5} /> Puntos de Despacho
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.15em] mt-0.5">
            Auditoría de convenios corporativos y presupuestos DITEC
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={handleDescargaExcel} disabled={exportando} title="Descargar reporte de auditoría en Excel" className="flex-1 sm:flex-none bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
            {exportando ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            <span>Exportar</span>
          </button>
          <button onClick={() => abrirModal()} title="Registrar nueva gasolinera en el sistema" className="flex-1 sm:flex-none bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
            <Plus size={14} strokeWidth={3} /> Nuevo Punto
          </button>
        </div>
      </header>

      {/* CARDS DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-[#FFB800] transition-colors">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Presupuestado</p>
            <p className="text-xl font-mono font-black text-[#001F3F]">${totalRecargado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-rose-300 transition-colors">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Consumido</p>
            <p className="text-xl font-mono font-black text-rose-600">${totalConsumido.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><ArrowUpRight size={20} /></div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo en Bóveda</p>
            <p className="text-xl font-mono font-black text-emerald-600">${saldoDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-end gap-3 max-w-2xl shadow-inner">
        <div className="flex flex-col gap-1 flex-1 w-full">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Filtro por Ubicación</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input type="text" placeholder="EJ: SANTO DOMINGO" value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl border border-slate-200 uppercase text-[#001F3F] focus:outline-none focus:border-[#001F3F] bg-white transition-all" />
          </div>
        </div>
        <button onClick={handleConsultar} className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-black transition-all">
          <Search size={14} strokeWidth={3} />
          <span>Consultar</span>
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-4 pl-6 w-[25%]">Estación de Servicio</th>
                <th className="p-4 w-[18%]">Ubicación / Ciudad</th>
                <th className="p-4 w-[18%] text-center">Estado Convenio</th>
                <th className="p-4 w-[15%] text-center">Asignado</th>
                <th className="p-4 w-[14%] text-center">Consumido</th>
                <th className="p-4 text-right pr-6 w-[10%]">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
              {estacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em] italic">No existen estaciones indexadas.</td>
                </tr>
              ) : (
                estacionesFiltradas.map((g: any) => {
                  const consumido = g.registrosCombustible?.reduce((sum: number, d: any) => sum + (d.precioTotal || 0), 0) || 0
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 rounded-lg"><Fuel size={14} className="text-[#001F3F]" /></div>
                            <span className="font-black text-[#001F3F] uppercase tracking-tight">{g.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-500 uppercase text-[10px]">
                            <MapPin size={12} className="text-slate-300" />
                            <span>{g.ciudad}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          g.tieneConvenio ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                            <ShieldCheck size={10} /> {g.tieneConvenio ? 'Autorizado' : 'Sin Convenio'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-black text-slate-900 text-[13px]">
                        {g.tieneConvenio ? `$${(g.montoRecarga || 0).toFixed(2)}` : '--'}
                      </td>
                      <td className="p-4 text-center font-mono font-black text-rose-500 text-[13px]">
                        {g.tieneConvenio ? `$${consumido.toFixed(2)}` : '--'}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="inline-flex items-center gap-3 justify-end w-full">
                          <button onClick={() => abrirModal(g)} title="Editar parámetros y presupuesto del punto" className="text-slate-400 hover:text-[#FFB800] transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => handleEliminar(g.id)} title="Eliminar estación permanentemente de Ditcash" className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={15} /></button>
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

      {/* MODAL DE REGISTRO / EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-[450px] rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition-colors"><X size={18} strokeWidth={2.5} /></button>
            
            <header className="mb-6 text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-2 mx-auto shadow-sm">
                <Fuel size={20} className="text-[#FFB800]" />
              </div>
              <h2 className="text-base font-black text-[#001F3F] italic uppercase">{estacionId ? 'Modificar Punto' : 'Alta de Estación'}</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Configuración de Despacho Corporativo</p>
            </header>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial de la Estación</label>
                <input type="text" required placeholder="EJ: PRIMAX AV. QUITO" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-[#001F3F] focus:outline-none focus:border-[#001F3F] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación / Ciudad Operativa</label>
                <input type="text" required placeholder="EJ: SANTO DOMINGO" value={ciudad} onChange={(e) => setCiudad(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-[#001F3F] focus:outline-none focus:border-[#001F3F] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Convenio</label>
                <select value={tieneConvenio ? 'true' : 'false'} onChange={(e) => setTieneConvenio(e.target.value === 'true')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] cursor-pointer focus:outline-none focus:border-[#001F3F]">
                    <option value="false">PAGO EN EFECTIVO / OTROS</option>
                    <option value="true">CUPO DE CRÉDITO CORPORATIVO</option>
                </select>
              </div>

              {tieneConvenio && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest ml-1 flex items-center gap-1">
                    <DollarSign size={11} strokeWidth={3} /> Cupo Máximo Recargado
                  </label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={montoRecarga} onChange={(e) => setMontoRecarga(e.target.value)} className="w-full px-4 py-2.5 bg-amber-50/20 border border-amber-200 rounded-xl font-mono font-black text-sm text-[#001F3F] focus:outline-none focus:border-[#FFB800] transition-all" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button disabled={loading} className="bg-[#001F3F] text-[#FFB800] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-black transition-all">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Confirmar Asiento ➔</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}