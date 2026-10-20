'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, CalendarDays, Check, CircleDollarSign, ClipboardCheck, LayoutGrid, LoaderCircle,
  Plus, Save, Star, X
} from 'lucide-react'

type Semana = {
  id: number
  nombre: string
  mes: string | null
  fechaInicio: string
  fechaFin: string
  creadaEn: string
}

type Vendedor = { id: number; nombre: string; apellido: string | null }

type Evaluacion = {
  id: number
  semanaId: number
  vendedorId: number
  numContratos: number
  totalVentas: number
  contratosFisicos: boolean
  infoCompleta: boolean
  requisitos: boolean
  entregaMercaderia: boolean
  superEstrella: boolean
  observacion: string | null
  vendedor: Vendedor
  semana: Semana
}

type Borrador = Omit<Evaluacion, 'id' | 'semanaId' | 'vendedorId' | 'vendedor' | 'semana'>
type Resumen = { contratos: number; ventas: number; estrellas: number; superEstrellas: number; fallos: number }
type ColumnaReporte = { id: string; nombre: string; subtitulo: string; semanasIds: number[] }

type Props = {
  semanas: Semana[]
  vendedores: Vendedor[]
  puedeCrear: boolean
  puedeEditar: boolean
}

const BORRADOR_VACIO: Borrador = {
  numContratos: 0,
  totalVentas: 0,
  contratosFisicos: false,
  infoCompleta: false,
  requisitos: false,
  entregaMercaderia: false,
  superEstrella: false,
  observacion: ''
}

const CRITERIOS: Array<{ key: keyof Pick<Borrador, 'contratosFisicos' | 'infoCompleta' | 'requisitos' | 'entregaMercaderia'>; label: string }> = [
  { key: 'contratosFisicos', label: 'Contratos físicos' },
  { key: 'infoCompleta', label: 'Información completa' },
  { key: 'requisitos', label: 'Requisitos' },
  { key: 'entregaMercaderia', label: 'Entrega de mercadería' }
]

function mostrarFecha(value: string) {
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC'
  })
}

function nombreVendedor(vendedor: Vendedor) {
  return `${vendedor.nombre} ${vendedor.apellido || ''}`.trim()
}

function fechaLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatoFecha(fecha: string) {
  const [year, month, day] = fecha.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export default function FacturacionClient({ semanas: semanasIniciales, vendedores, puedeCrear, puedeEditar }: Props) {
  const hoy = new Date()
  const [activeTab, setActiveTab] = useState<'evaluacion' | 'reportes'>('evaluacion')
  const [semanas, setSemanas] = useState(semanasIniciales)
  const [semanaId, setSemanaId] = useState<number | ''>(semanasIniciales[0]?.id ?? '')
  const [evaluaciones, setEvaluaciones] = useState<Record<number, Evaluacion>>({})
  const [borradores, setBorradores] = useState<Record<number, Borrador>>({})
  const [loading, setLoading] = useState(false)
  const [guardandoId, setGuardandoId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modalSemana, setModalSemana] = useState(false)
  const [guardandoSemana, setGuardandoSemana] = useState(false)
  const [nombreSemana, setNombreSemana] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroReporte, setFiltroReporte] = useState({
    fechaInicio: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fechaFin: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
  })
  const [filtroReporteVendedor, setFiltroReporteVendedor] = useState('TODOS')
  const [vistaReporte, setVistaReporte] = useState<'semanas' | 'meses'>('semanas')
  const [metricaReporte, setMetricaReporte] = useState<'ventas' | 'calidad'>('ventas')
  const [semanasReporte, setSemanasReporte] = useState<Semana[]>([])
  const [datosReporte, setDatosReporte] = useState<Evaluacion[]>([])
  const [generandoReporte, setGenerandoReporte] = useState(false)

  useEffect(() => {
    let cancelado = false
    if (!semanaId) {
      return
    }

    async function cargarEvaluaciones() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/facturacion/evaluaciones?semanaId=${semanaId}`, { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error || 'No se pudieron cargar las evaluaciones.')

        const porVendedor: Record<number, Evaluacion> = {}
        const ediciones: Record<number, Borrador> = {}
        for (const evaluacion of result.data as Evaluacion[]) {
          porVendedor[evaluacion.vendedorId] = evaluacion
          ediciones[evaluacion.vendedorId] = { ...evaluacion, observacion: evaluacion.observacion || '' }
        }
        for (const vendedor of vendedores) {
          if (!ediciones[vendedor.id]) ediciones[vendedor.id] = { ...BORRADOR_VACIO }
        }
        if (!cancelado) {
          setEvaluaciones(porVendedor)
          setBorradores(ediciones)
        }
      } catch (caught) {
        if (!cancelado) setError(caught instanceof Error ? caught.message : 'Error al cargar las evaluaciones.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarEvaluaciones()
    return () => { cancelado = true }
  }, [semanaId, vendedores])

  const semanaSeleccionada = useMemo(
    () => semanas.find(semana => semana.id === Number(semanaId)),
    [semanas, semanaId]
  )

  const columnasReporte = useMemo<ColumnaReporte[]>(() => {
    const semanasOrdenadas = [...semanasReporte].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    if (vistaReporte === 'semanas') {
      return semanasOrdenadas.map(semana => ({
        id: String(semana.id),
        nombre: semana.nombre,
        subtitulo: `${formatoFecha(semana.fechaInicio)} - ${formatoFecha(semana.fechaFin)}`,
        semanasIds: [semana.id]
      }))
    }

    const grupos = new Map<string, Semana[]>()
    for (const semana of semanasOrdenadas) {
      const clave = semana.fechaInicio.slice(0, 7)
      grupos.set(clave, [...(grupos.get(clave) || []), semana])
    }
    return [...grupos.entries()].map(([clave, semanasDelMes]) => {
      const fecha = new Date(`${clave}-01T12:00:00.000Z`)
      return {
        id: clave,
        nombre: fecha.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        subtitulo: `${formatoFecha(semanasDelMes[0].fechaInicio)} - ${formatoFecha(semanasDelMes[semanasDelMes.length - 1].fechaFin)}`,
        semanasIds: semanasDelMes.map(semana => semana.id)
      }
    })
  }, [semanasReporte, vistaReporte])

  const evaluacionesReporte = useMemo(() => {
    const semanaIds = new Set(semanasReporte.map(semana => semana.id))
    return datosReporte.filter(evaluacion => semanaIds.has(evaluacion.semanaId))
  }, [datosReporte, semanasReporte])

  const vendedoresReporte = vendedores.filter(vendedor =>
    filtroReporteVendedor === 'TODOS' || vendedor.id === Number(filtroReporteVendedor)
  )

  function resumir(vendedorId: number, semanaIds: number[]): Resumen {
    return evaluacionesReporte
      .filter(evaluacion => evaluacion.vendedorId === vendedorId && semanaIds.includes(evaluacion.semanaId))
      .reduce<Resumen>((resumen, evaluacion) => {
        resumen.contratos += evaluacion.numContratos
        resumen.ventas += evaluacion.totalVentas
        if (evaluacion.numContratos > 0) {
          if (evaluacion.superEstrella) resumen.superEstrellas += 1
          else if (CRITERIOS.every(criterio => evaluacion[criterio.key])) resumen.estrellas += 1
          else resumen.fallos += 1
        }
        return resumen
      }, { contratos: 0, ventas: 0, estrellas: 0, superEstrellas: 0, fallos: 0 })
  }

  const resumenGlobal = useMemo(() => evaluacionesReporte.reduce<Resumen>((resumen, evaluacion) => {
    resumen.contratos += evaluacion.numContratos
    resumen.ventas += evaluacion.totalVentas
    if (evaluacion.numContratos > 0) {
      if (evaluacion.superEstrella) resumen.superEstrellas += 1
      else if (CRITERIOS.every(criterio => evaluacion[criterio.key])) resumen.estrellas += 1
      else resumen.fallos += 1
    }
    return resumen
  }, { contratos: 0, ventas: 0, estrellas: 0, superEstrellas: 0, fallos: 0 }), [evaluacionesReporte])

  function actualizarBorrador(vendedorId: number, campo: keyof Borrador, valor: string | number | boolean) {
    setBorradores(actuales => ({
      ...actuales,
      [vendedorId]: { ...actuales[vendedorId], [campo]: valor }
    }))
  }

  async function generarReporte() {
    if (!filtroReporte.fechaInicio || !filtroReporte.fechaFin || filtroReporte.fechaInicio > filtroReporte.fechaFin) {
      setError('Selecciona un rango de fechas válido.')
      return
    }
    setGenerandoReporte(true)
    setError('')
    setMensaje('')
    try {
      const semanasDelRango = semanas.filter(semana =>
        semana.fechaFin.slice(0, 10) >= filtroReporte.fechaInicio &&
        semana.fechaInicio.slice(0, 10) <= filtroReporte.fechaFin
      )
      setSemanasReporte(semanasDelRango)
      if (semanasDelRango.length === 0) {
        setDatosReporte([])
        setMensaje('No hay semanas comerciales dentro del rango seleccionado.')
        return
      }

      const response = await fetch('/api/facturacion/evaluaciones', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo generar el reporte.')
      setDatosReporte(result.data as Evaluacion[])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al generar el reporte.')
    } finally {
      setGenerandoReporte(false)
    }
  }

  async function guardarEvaluacion(vendedorId: number) {
    const borrador = borradores[vendedorId]
    if (!borrador || !semanaId) return
    setGuardandoId(vendedorId)
    setError('')
    setMensaje('')
    try {
      const response = await fetch('/api/facturacion/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...borrador, semanaId: Number(semanaId), vendedorId })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo guardar la evaluación.')
      setEvaluaciones(actuales => ({ ...actuales, [vendedorId]: result.data as Evaluacion }))
      const vendedor = vendedores.find(item => item.id === vendedorId)
      setMensaje(vendedor ? `Evaluación de ${nombreVendedor(vendedor)} guardada.` : 'Evaluación guardada.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al guardar la evaluación.')
    } finally {
      setGuardandoId(null)
    }
  }

  async function crearSemana(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuardandoSemana(true)
    setError('')
    setMensaje('')
    try {
      const mes = fechaInicio
        ? new Date(`${fechaInicio}T12:00:00.000Z`).toLocaleDateString('es-EC', { month: 'long', timeZone: 'UTC' })
        : ''
      const response = await fetch('/api/facturacion/semanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreSemana, mes, fechaInicio, fechaFin })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo crear la semana.')
      const semana: Semana = {
        ...result.data,
        fechaInicio: new Date(result.data.fechaInicio).toISOString(),
        fechaFin: new Date(result.data.fechaFin).toISOString(),
        creadaEn: new Date(result.data.creadaEn).toISOString()
      }
      setSemanas(actuales => [semana, ...actuales].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)))
      setSemanaId(semana.id)
      setModalSemana(false)
      setNombreSemana('')
      setFechaInicio('')
      setFechaFin('')
      setMensaje('Semana comercial creada.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al crear la semana.')
    } finally {
      setGuardandoSemana(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 pt-20 text-[#001F3F] sm:p-6 lg:p-8 lg:pt-8">
      <div className="mx-auto space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#001F3F] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB800]">
              <CircleDollarSign size={14} /> Finanzas comerciales
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tight sm:text-3xl">Facturación</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Evaluación semanal de contratos, ventas y calidad por vendedor.</p>
          </div>
          {puedeCrear && (
            <button
              type="button"
              onClick={() => setModalSemana(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFB800] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#001F3F] shadow-lg transition hover:bg-amber-300"
            >
              <Plus size={17} /> Crear semana
            </button>
          )}
        </header>

        <nav className="flex w-fit flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-2" aria-label="Secciones de facturación">
          <button
            type="button"
            onClick={() => setActiveTab('evaluacion')}
            aria-pressed={activeTab === 'evaluacion'}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition ${activeTab === 'evaluacion' ? 'bg-[#001F3F] text-[#FFB800] shadow-lg' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}
          >
            <LayoutGrid size={15} /> Evaluación semanal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            aria-pressed={activeTab === 'reportes'}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition ${activeTab === 'reportes' ? 'bg-[#001F3F] text-[#FFB800] shadow-lg' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}
          >
            <BarChart3 size={15} /> Reportes
          </button>
        </nav>

        {(error || mensaje) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || mensaje}
          </div>
        )}

        {activeTab === 'evaluacion' && (
          <>
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-lg">
            <label htmlFor="semana-comercial" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Semana comercial</label>
            <select
              id="semana-comercial"
              value={semanaId}
              onChange={event => { setSemanaId(event.target.value ? Number(event.target.value) : ''); setMensaje('') }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#001F3F] outline-none transition focus:border-[#FFB800]"
            >
              <option value="">Selecciona una semana</option>
              {semanas.map(semana => (
                <option key={semana.id} value={semana.id}>
                  {semana.nombre} · {mostrarFecha(semana.fechaInicio)} - {mostrarFecha(semana.fechaFin)}
                </option>
              ))}
            </select>
          </div>
          {semanaSeleccionada && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <CalendarDays size={16} className="text-[#D99A00]" />
              {semanaSeleccionada.mes || 'Periodo comercial'}
            </div>
          )}
        </section>
            </>
          )}

          {activeTab === 'reportes' && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-black uppercase italic tracking-tight text-[#001F3F]">
                  <BarChart3 size={21} className="text-[#D99A00]" /> Reporte comercial
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="block">
                    <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-500">Vendedor</span>
                    <select value={filtroReporteVendedor} onChange={event => setFiltroReporteVendedor(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#001F3F] outline-none focus:border-[#FFB800]">
                      <option value="TODOS">Todos los vendedores</option>
                      {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{nombreVendedor(vendedor)}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-500">Desde</span>
                    <input type="date" value={filtroReporte.fechaInicio} onChange={event => setFiltroReporte(actual => ({ ...actual, fechaInicio: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#001F3F] outline-none focus:border-[#FFB800]" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-500">Hasta</span>
                    <input type="date" value={filtroReporte.fechaFin} onChange={event => setFiltroReporte(actual => ({ ...actual, fechaFin: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#001F3F] outline-none focus:border-[#FFB800]" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-500">Agrupar por</span>
                    <select value={vistaReporte} onChange={event => setVistaReporte(event.target.value as 'semanas' | 'meses')} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#001F3F] outline-none focus:border-[#FFB800]">
                      <option value="semanas">Semanas</option>
                      <option value="meses">Meses</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => void generarReporte()} disabled={generandoReporte} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#001F3F] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#FFB800] shadow-lg transition hover:bg-[#003263] disabled:opacity-50">
                    {generandoReporte ? <LoaderCircle size={15} className="animate-spin" /> : <BarChart3 size={15} />}
                    Generar reporte
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setMetricaReporte('ventas')} className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-wider ${metricaReporte === 'ventas' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>Ventas y contratos</button>
                  <button type="button" onClick={() => setMetricaReporte('calidad')} className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-wider ${metricaReporte === 'calidad' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>Calidad y estrellas</button>
                </div>
              </div>

              {semanasReporte.length > 0 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: 'Contratos', value: resumenGlobal.contratos.toLocaleString('es-EC'), color: 'text-[#001F3F]' },
                      { label: 'Ventas', value: `$${resumenGlobal.ventas.toFixed(2)}`, color: 'text-emerald-700' },
                      { label: 'Estrellas', value: resumenGlobal.estrellas.toLocaleString('es-EC'), color: 'text-amber-700' },
                      { label: 'Super estrellas', value: resumenGlobal.superEstrellas.toLocaleString('es-EC'), color: 'text-orange-600' },
                      { label: 'Calidad fallida', value: resumenGlobal.fallos.toLocaleString('es-EC'), color: 'text-red-600' }
                    ].map(card => (
                      <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{card.label}</div>
                        <div className={`mt-2 text-xl font-black ${card.color}`}>{card.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[950px] border-collapse text-left">
                        <thead>
                          <tr className="bg-[#001F3F] text-[9px] font-black uppercase tracking-widest text-white">
                            <th className="sticky left-0 bg-[#001F3F] px-4 py-3">Vendedor</th>
                            {columnasReporte.map(columna => (
                              <th key={columna.id} className="px-3 py-3 text-center">
                                {columna.nombre}
                                <span className="mt-1 block text-[8px] font-bold normal-case tracking-normal text-slate-300">{columna.subtitulo}</span>
                              </th>
                            ))}
                            <th className="border-l-2 border-[#FFB800] px-3 py-3 text-center text-[#FFB800]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vendedoresReporte.map(vendedor => {
                            const total = resumir(vendedor.id, semanasReporte.map(semana => semana.id))
                            return (
                              <tr key={vendedor.id} className="text-xs hover:bg-amber-50/30">
                                <td className="sticky left-0 bg-white px-4 py-3 font-black uppercase text-[#001F3F]">{nombreVendedor(vendedor)}</td>
                                {columnasReporte.map(columna => {
                                  const resumen = resumir(vendedor.id, columna.semanasIds)
                                  return (
                                    <td key={columna.id} className="px-3 py-3 text-center">
                                      {metricaReporte === 'ventas' ? (
                                        <span className="font-mono font-bold text-[#001F3F]">{resumen.contratos} <span className="text-emerald-700">${resumen.ventas.toFixed(2)}</span></span>
                                      ) : (
                                        <span className="font-mono font-bold">
                                          <span className="text-amber-700">{resumen.estrellas}</span>/<span className="text-orange-600">{resumen.superEstrellas}</span>/<span className="text-red-600">{resumen.fallos}</span>
                                        </span>
                                      )}
                                    </td>
                                  )
                                })}
                                <td className="border-l-2 border-[#FFB800]/50 bg-amber-50/30 px-3 py-3 text-center font-black">
                                  {metricaReporte === 'ventas' ? <span>{total.contratos} <span className="text-emerald-700">${total.ventas.toFixed(2)}</span></span> : <span><span className="text-amber-700">{total.estrellas}</span>/<span className="text-orange-600">{total.superEstrellas}</span>/<span className="text-red-600">{total.fallos}</span></span>}
                                </td>
                              </tr>
                            )
                          })}
                          {filtroReporteVendedor === 'TODOS' && (
                            <tr className="bg-[#001F3F] text-xs font-black text-white">
                              <td className="sticky left-0 bg-[#001F3F] px-4 py-3 uppercase text-[#FFB800]">Total global</td>
                              {columnasReporte.map(columna => {
                                const resumen = evaluacionesReporte
                                  .filter(evaluacion => columna.semanasIds.includes(evaluacion.semanaId))
                                  .reduce<Resumen>((total, evaluacion) => {
                                    total.contratos += evaluacion.numContratos
                                    total.ventas += evaluacion.totalVentas
                                    if (evaluacion.numContratos > 0) {
                                      if (evaluacion.superEstrella) total.superEstrellas += 1
                                      else if (CRITERIOS.every(criterio => evaluacion[criterio.key])) total.estrellas += 1
                                      else total.fallos += 1
                                    }
                                    return total
                                  }, { contratos: 0, ventas: 0, estrellas: 0, superEstrellas: 0, fallos: 0 })
                                return (
                                  <td key={columna.id} className="px-3 py-3 text-center">
                                    {metricaReporte === 'ventas' ? <span>{resumen.contratos} <span className="text-emerald-300">${resumen.ventas.toFixed(2)}</span></span> : <span>{resumen.estrellas}/{resumen.superEstrellas}/{resumen.fallos}</span>}
                                  </td>
                                )
                              })}
                              <td className="border-l-2 border-[#FFB800] px-3 py-3 text-center text-[#FFB800]">
                                {metricaReporte === 'ventas' ? <span>{resumenGlobal.contratos} <span className="text-emerald-300">${resumenGlobal.ventas.toFixed(2)}</span></span> : <span>{resumenGlobal.estrellas}/{resumenGlobal.superEstrellas}/{resumenGlobal.fallos}</span>}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {metricaReporte === 'calidad' && <p className="border-t border-slate-100 px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Columnas: estrellas / super estrellas / calidad fallida.</p>}
                  </div>
                </>
              )}
            </section>
          )}

        {activeTab === 'evaluacion' && (
          <>
        {!semanaId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <CalendarDays size={32} className="mx-auto mb-3 text-slate-300" />
            <h2 className="font-black uppercase text-[#001F3F]">No hay semanas comerciales</h2>
            <p className="mt-2 text-sm text-slate-500">Crea una semana para empezar a registrar las evaluaciones.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-sm font-bold text-slate-500 shadow-sm">
            <LoaderCircle size={20} className="animate-spin text-[#D99A00]" /> Cargando evaluaciones...
          </div>
        ) : vendedores.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center text-sm font-bold text-slate-500 shadow-sm">No hay vendedores activos para evaluar.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#001F3F]">
                <ClipboardCheck size={17} className="text-[#D99A00]" /> Evaluaciones por vendedor
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{vendedores.length} vendedores</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-3 py-3">Contratos</th>
                    <th className="px-3 py-3">Ventas ($)</th>
                    {CRITERIOS.map(criterio => <th key={criterio.key} className="px-2 py-3 text-center">{criterio.label}</th>)}
                    <th className="px-3 py-3">Estrella</th>
                    <th className="px-3 py-3">Observación</th>
                    <th className="px-3 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendedores.map(vendedor => {
                    const draft = borradores[vendedor.id] || BORRADOR_VACIO
                    const existente = evaluaciones[vendedor.id]
                    const puedeGuardar = existente ? puedeEditar : puedeCrear
                    const cumplioCalidad = CRITERIOS.every(criterio => draft[criterio.key])
                    const necesitaObservacion = draft.numContratos > 0 && !cumplioCalidad

                    return (
                      <tr key={vendedor.id} className="align-top transition hover:bg-amber-50/30">
                        <td className="px-4 py-4">
                          <div className="min-w-36 font-black text-xs uppercase text-[#001F3F]">{nombreVendedor(vendedor)}</div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{existente ? 'Evaluado' : 'Pendiente'}</div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            aria-label={`Contratos de ${nombreVendedor(vendedor)}`}
                            type="number" min="0" step="1" value={draft.numContratos}
                            disabled={!puedeGuardar}
                            onChange={event => {
                              const value = Math.max(0, Number(event.target.value) || 0)
                              actualizarBorrador(vendedor.id, 'numContratos', Math.floor(value))
                              if (value === 0) {
                                setBorradores(actuales => ({
                                  ...actuales,
                                  [vendedor.id]: { ...actuales[vendedor.id], ...BORRADOR_VACIO }
                                }))
                              }
                            }}
                            className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-bold outline-none focus:border-[#FFB800] disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            aria-label={`Ventas de ${nombreVendedor(vendedor)}`}
                            type="number" min="0" step="0.01" value={draft.totalVentas}
                            disabled={!puedeGuardar || draft.numContratos === 0}
                            onChange={event => actualizarBorrador(vendedor.id, 'totalVentas', Math.max(0, Number(event.target.value) || 0))}
                            className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-right text-xs font-bold outline-none focus:border-[#FFB800] disabled:bg-slate-100"
                          />
                        </td>
                        {CRITERIOS.map(criterio => (
                          <td key={criterio.key} className="px-2 py-4 text-center">
                            <input
                              aria-label={`${criterio.label}: ${nombreVendedor(vendedor)}`}
                              type="checkbox"
                              checked={draft[criterio.key]}
                              disabled={!puedeGuardar || draft.numContratos === 0}
                              onChange={() => actualizarBorrador(vendedor.id, criterio.key, !draft[criterio.key])}
                              className="h-4 w-4 accent-[#001F3F] disabled:opacity-90"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          <label className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black uppercase ${cumplioCalidad && draft.numContratos > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                            <Star size={13} className={draft.superEstrella ? 'fill-current' : ''} />
                            <input
                              type="checkbox"
                              checked={draft.superEstrella}
                              disabled={!puedeGuardar || draft.numContratos === 0}
                              onChange={() => actualizarBorrador(vendedor.id, 'superEstrella', !draft.superEstrella)}
                              className="accent-amber-500 disabled:opacity-40"
                            />
                          </label>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            aria-label={`Observación de ${nombreVendedor(vendedor)}`}
                            type="text" maxLength={2000} value={draft.observacion || ''}
                            disabled={!puedeGuardar || draft.numContratos === 0}
                            placeholder={necesitaObservacion ? 'Obligatoria si falla calidad' : 'Opcional'}
                            onChange={event => actualizarBorrador(vendedor.id, 'observacion', event.target.value)}
                            className={`w-48 rounded-lg border px-2 py-2 text-xs outline-none focus:border-[#FFB800] disabled:bg-slate-100 ${necesitaObservacion && !draft.observacion?.trim() ? 'border-amber-300' : 'border-slate-200'}`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          {puedeGuardar ? (
                            <button
                              type="button"
                              onClick={() => void guardarEvaluacion(vendedor.id)}
                              disabled={guardandoId === vendedor.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#001F3F] px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white transition hover:bg-[#003263] disabled:opacity-50"
                            >
                              {guardandoId === vendedor.id ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />}
                              Guardar
                            </button>
                          ) : existente ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700"><Check size={13} /> Guardado</span>
                          ) : <span className="text-[9px] font-bold text-slate-400">Sin permiso</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {modalSemana && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#001F3F]/70 p-4 backdrop-blur-sm">
          <form onSubmit={event => void crearSemana(event)} className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex rounded-lg bg-amber-50 p-2 text-[#B77900]"><CalendarDays size={19} /></div>
                <h2 className="text-lg font-black uppercase italic text-[#001F3F]">Nueva semana comercial</h2>
                <p className="mt-1 text-xs text-slate-500">Define el periodo para registrar las evaluaciones.</p>
              </div>
              <button type="button" onClick={() => setModalSemana(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#001F3F]" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre de la semana</span>
              <input required maxLength={120} value={nombreSemana} onChange={event => setNombreSemana(event.target.value)} placeholder="Ej.: Semana 1 de octubre" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FFB800]" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha de inicio</span>
                <input required type="date" value={fechaInicio} onChange={event => setFechaInicio(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#FFB800]" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha de fin</span>
                <input required type="date" value={fechaFin} onChange={event => setFechaFin(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#FFB800]" />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setModalSemana(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={guardandoSemana} className="inline-flex items-center gap-2 rounded-xl bg-[#001F3F] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#003263] disabled:opacity-50">
                {guardandoSemana ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} Crear semana
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
