'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calcularControlAceite, type MovimientoTaller } from '@/lib/control-aceite'
import { actualizarIntervaloAceiteAction } from '@/app/actions/combustible'
import { exportarReporteTallerExcel } from '@/app/actions/reportes'

type Registro = MovimientoTaller & {
  costoTransaccion: number
  taller?: string | null
  factura?: string | null
  observaciones?: string | null
  choferEnEseMomento?: string | null
  vehiculo?: { placa: string; intervaloAlerta: number; asignaciones?: { userId: number }[] }
}

type Props = {
  registros: Registro[]
  tipo: 'aceite' | 'general'
  filtros: { placa: string; vendedorId: string; fechaDesde: string; fechaHasta: string }
  vendedores: { id: number; nombre?: string | null }[]
  vehiculos: { id: number; placa: string; intervaloAlerta: number }[]
  puedeEditar: boolean
}

const estados: Record<string, string> = {
  INICIO_BASE: 'Inicio base', A_TIEMPO: 'A tiempo', EXCEDIDO: 'Excedido', REVISAR_KILOMETRAJE: 'Revisar KM'
}

export default function ReporteTaller({ registros, tipo, filtros, vendedores, vehiculos, puedeEditar }: Props) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [intervalo, setIntervalo] = useState('5000')
  const filas = useMemo(() => {
    const nombre = vendedores.find(v => String(v.id) === filtros.vendedorId)?.nombre?.toUpperCase()
    return calcularControlAceite(registros).filter(k => {
      const fecha = new Date(k.fechaTransaccion).toISOString().slice(0, 10)
      return k.tipoMovimiento === 'MANTENIMIENTO' && (tipo !== 'aceite' || k.esCambioAceite === true) &&
        (!filtros.placa || k.vehiculo?.placa === filtros.placa) &&
        (!filtros.vendedorId || (nombre && k.choferEnEseMomento?.toUpperCase().includes(nombre)) || k.vehiculo?.asignaciones?.some(a => String(a.userId) === filtros.vendedorId)) &&
        (!filtros.fechaDesde || fecha >= filtros.fechaDesde) && (!filtros.fechaHasta || fecha <= filtros.fechaHasta)
    })
  }, [registros, tipo, filtros, vendedores])
  const total = filas.reduce((sum, k) => sum + Number(k.costoTransaccion), 0)

  async function descargar() {
    setOcupado(true); setError('')
    try {
      const resultado = await exportarReporteTallerExcel({ ...filtros, tipo })
      if (!resultado.success || !resultado.data) throw new Error(resultado.error || 'No se pudo exportar.')
      const url = URL.createObjectURL(new Blob([new Uint8Array(resultado.data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const enlace = document.createElement('a')
      enlace.href = url; enlace.download = `DITCASH_${tipo === 'aceite' ? 'Aceites' : 'Taller'}.xlsx`; enlace.click()
      URL.revokeObjectURL(url)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo exportar.') }
    finally { setOcupado(false) }
  }

  async function guardarIntervalo(event: React.FormEvent) {
    event.preventDefault(); setOcupado(true); setError('')
    try {
      const resultado = await actualizarIntervaloAceiteAction(Number(vehiculoId), Number(intervalo))
      if (!resultado.success) throw new Error(resultado.error)
      router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar.') }
    finally { setOcupado(false) }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div><h2 className="text-sm font-black uppercase">{tipo === 'aceite' ? 'Rendimiento de aceites' : 'Gastos generales de taller'}</h2>
        <p className="text-xs text-slate-500">{filas.length} registros · Total: ${total.toFixed(2)}</p>
        {tipo === 'aceite' && <p className="mt-1 text-xs text-slate-500">Solo cambios confirmados. El primer cambio establece la base; los mantenimientos antiguos no clasificados quedan en gastos generales.</p>}
      </div>
      <button type="button" disabled={ocupado} onClick={() => void descargar()} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Exportar Excel</button>
    </div>
    {tipo === 'aceite' && puedeEditar && <form onSubmit={guardarIntervalo} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-xs font-bold">Vehículo<select required value={vehiculoId} onChange={e => { setVehiculoId(e.target.value); setIntervalo(String(vehiculos.find(v => String(v.id) === e.target.value)?.intervaloAlerta ?? 5000)) }} className="mt-1 block rounded-lg border border-slate-200 p-2"><option value="">Seleccionar placa</option>{vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}</select></label>
      <label className="text-xs font-bold">Intervalo de aceite (km)<input required min="1" step="1" type="number" value={intervalo} onChange={e => setIntervalo(e.target.value)} className="mt-1 block w-40 rounded-lg border border-slate-200 p-2" /></label>
      <button disabled={ocupado} className="rounded-lg bg-[#001F3F] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Guardar intervalo</button>
    </form>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full whitespace-nowrap text-left text-xs">
        <thead className="bg-[#001F3F] text-white"><tr>{['Fecha', 'Conductor', 'Placa', 'Taller / Factura', 'Servicio', 'KM registrado', ...(tipo === 'aceite' ? ['KM anterior', 'Entre cambios', 'Intervalo', 'Estado'] : ['Tipo']), 'Costo'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead>
        <tbody>{filas.map(k => <tr key={k.id} className="border-b border-slate-100">
          <td className="p-3">{new Date(k.fechaTransaccion).toISOString().slice(0, 10)}</td><td className="p-3">{k.choferEnEseMomento || 'SIN ASIGNAR'}</td><td className="p-3 font-bold">{k.vehiculo?.placa}</td>
          <td className="p-3">{k.taller}<span className="block text-slate-500">{k.factura}</span></td><td className="max-w-64 whitespace-normal p-3">{k.observaciones}</td><td className="p-3">{k.kilometrajeServicio?.toLocaleString() ?? '—'}</td>
          {tipo === 'aceite' ? <><td className="p-3">{k.kmAceiteAnterior?.toLocaleString() ?? '—'}</td><td className="p-3">{k.recorridoAceite?.toLocaleString() ?? '—'}</td><td className="p-3">{k.intervaloAceite.toLocaleString()} km</td><td className={`p-3 font-bold ${k.estadoAceite === 'EXCEDIDO' ? 'text-red-600' : 'text-slate-600'}`}>{estados[k.estadoAceite]}{k.excesoAceite > 0 && ` (+${k.excesoAceite.toLocaleString()} km)`}</td></> : <td className="p-3">{k.esCambioAceite === true ? 'Cambio de aceite' : k.esCambioAceite === false ? 'Servicio general' : 'Histórico sin clasificar'}</td>}
          <td className="p-3 font-bold text-emerald-700">${Number(k.costoTransaccion).toFixed(2)}</td>
        </tr>)}{filas.length === 0 && <tr><td colSpan={tipo === 'aceite' ? 11 : 8} className="p-8 text-center text-slate-500">No hay registros para los filtros seleccionados.</td></tr>}</tbody>
      </table>
    </div>
  </section>
}
