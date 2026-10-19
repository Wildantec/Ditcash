"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Frown,
  LayoutGrid,
  Loader2,
  Plus,
  Save,
  Star,
  Target,
  Users
} from 'lucide-react'

type Mensaje = { texto: string; tipo: 'success' | 'error' | 'info' | null }
type ApiResponse<T> = { success: boolean; data?: T; error?: string }

interface Vendedor {
  id: number
  nombre: string
  apellido: string | null
}

interface Semana {
  id: number
  nombre: string
  mes: string | null
  fechaInicio: string
  fechaFin: string
}

interface Evaluacion {
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
}

interface EvaluacionDraft {
  numContratos: string
  totalVentas: string
  contratosFisicos: boolean
  infoCompleta: boolean
  requisitos: boolean
  entregaMercaderia: boolean
  superEstrella: boolean
  observacion: string
}

interface ColumnaReporte {
  id: string
  nombre: string
  subtitulo: string
  semanasIds: number[]
}

interface Resumen {
  contratos: number
  ventas: number
  estrellas: number
  supers: number
  fallos: number
}

const MESES = [
  '01-ENERO',
  '02-FEBRERO',
  '03-MARZO',
  '04-ABRIL',
  '05-MAYO',
  '06-JUNIO',
  '07-JULIO',
  '08-AGOSTO',
  '09-SEPTIEMBRE',
  '10-OCTUBRE',
  '11-NOVIEMBRE',
  '12-DICIEMBRE'
]

function fechaLocal(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function hoyLocal() {
  return fechaLocal(new Date())
}

function nombreVendedor(vendedor: Vendedor) {
  return [vendedor.nombre, vendedor.apellido].filter(Boolean).join(' ')
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function obtenerBorrador(evaluacion?: Evaluacion): EvaluacionDraft {
  return {
    numContratos: evaluacion ? String(evaluacion.numContratos) : '',
    totalVentas: evaluacion ? String(evaluacion.totalVentas) : '',
    contratosFisicos: evaluacion?.contratosFisicos ?? false,
    infoCompleta: evaluacion?.infoCompleta ?? false,
    requisitos: evaluacion?.requisitos ?? false,
    entregaMercaderia: evaluacion?.entregaMercaderia ?? false,
    superEstrella: evaluacion?.superEstrella ?? false,
    observacion: evaluacion?.observacion ?? ''
  }
}

async function leerRespuesta<T>(respuesta: Response): Promise<T> {
  const resultado = await respuesta.json() as ApiResponse<T>
  if (!respuesta.ok || !resultado.success || resultado.data === undefined) {
    throw new Error(resultado.error || 'No se pudo completar la solicitud')
  }
  return resultado.data
}

function consolidarEvaluaciones(evaluaciones: Evaluacion[]): Resumen {
  return evaluaciones.reduce<Resumen>((resumen, evaluacion) => {
    resumen.contratos += evaluacion.numContratos
    resumen.ventas += evaluacion.totalVentas
    if (evaluacion.numContratos > 0) {
      if (evaluacion.superEstrella) resumen.supers += 1
      else if (
        evaluacion.contratosFisicos &&
        evaluacion.infoCompleta &&
        evaluacion.requisitos &&
        evaluacion.entregaMercaderia
      ) resumen.estrellas += 1
      else resumen.fallos += 1
    }
    return resumen
  }, { contratos: 0, ventas: 0, estrellas: 0, supers: 0, fallos: 0 })
}

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState<'evaluacion' | 'reportes'>('evaluacion')
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [mensaje, setMensaje] = useState<Mensaje>({ texto: '', tipo: null })
  const [semanaActivaId, setSemanaActivaId] = useState('')
  const [matriz, setMatriz] = useState<Record<number, EvaluacionDraft>>({})
  const [matrizSemanaId, setMatrizSemanaId] = useState('')
  const [falloCargaSemanaId, setFalloCargaSemanaId] = useState('')
  const [recargaEvaluaciones, setRecargaEvaluaciones] = useState(0)
  const [savingRowId, setSavingRowId] = useState<number | null>(null)
  const [successRowId, setSuccessRowId] = useState<number | null>(null)
  const [mostrarModalSemana, setMostrarModalSemana] = useState(false)
  const [formSemana, setFormSemana] = useState({
    nombre: '',
    mes: `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().toLocaleString('es-EC', { month: 'long' }).toUpperCase()}`,
    fechaInicio: hoyLocal(),
    fechaFin: hoyLocal()
  })
  const [filtroReporte, setFiltroReporte] = useState(() => {
    const hoy = new Date()
    return {
      fechaInicio: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      fechaFin: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
    }
  })
  const [filtroReporteVendedor, setFiltroReporteVendedor] = useState('TODOS')
  const [vistaReporte, setVistaReporte] = useState<'semanas' | 'meses'>('semanas')
  const [metricaReporte, setMetricaReporte] = useState<'ventas' | 'calidad'>('ventas')
  const [datosReporte, setDatosReporte] = useState<Evaluacion[]>([])
  const [semanasReporte, setSemanasReporte] = useState<Semana[]>([])
  const [generandoReporte, setGenerandoReporte] = useState(false)

  const mostrarMensaje = useCallback((texto: string, tipo: NonNullable<Mensaje['tipo']>) => {
    setMensaje({ texto, tipo })
    window.setTimeout(() => setMensaje({ texto: '', tipo: null }), 5000)
  }, [])

  useEffect(() => {
    let cancelado = false
    Promise.all([
      fetch('/api/facturacion/vendedores').then(leerRespuesta<Vendedor[]>),
      fetch('/api/facturacion/semanas').then(leerRespuesta<Semana[]>)
    ])
      .then(([vendedoresCargados, semanasCargadas]) => {
        if (cancelado) return
        setVendedores(vendedoresCargados)
        setSemanas(semanasCargadas)
        setSemanaActivaId(actual => actual || String(semanasCargadas[0]?.id || ''))
      })
      .catch(error => {
        if (!cancelado) mostrarMensaje(error instanceof Error ? error.message : 'Error al cargar los datos del sistema', 'error')
      })

    return () => {
      cancelado = true
    }
  }, [mostrarMensaje])

  useEffect(() => {
    if (!semanaActivaId || activeTab !== 'evaluacion') {
      return
    }

    let cancelado = false
    fetch(`/api/facturacion/evaluaciones?semanaId=${encodeURIComponent(semanaActivaId)}`)
      .then(leerRespuesta<Evaluacion[]>)
      .then(evaluaciones => {
        if (cancelado) return
        const nuevaMatriz: Record<number, EvaluacionDraft> = {}
        evaluaciones.forEach(evaluacion => {
          nuevaMatriz[evaluacion.vendedorId] = obtenerBorrador(evaluacion)
        })
        setMatriz(nuevaMatriz)
        setMatrizSemanaId(semanaActivaId)
        setFalloCargaSemanaId('')
        setSuccessRowId(null)
      })
      .catch(error => {
        if (!cancelado) {
          setFalloCargaSemanaId(semanaActivaId)
          mostrarMensaje(error instanceof Error ? error.message : 'Error al cargar las evaluaciones', 'error')
        }
      })

    return () => {
      cancelado = true
    }
  }, [semanaActivaId, activeTab, recargaEvaluaciones, mostrarMensaje])

  const actualizarNumero = (vendedorId: number, campo: 'numContratos' | 'totalVentas', valor: string) => {
    if (valor && Number(valor) < 0) return
    setMatriz(actual => ({
      ...actual,
      [vendedorId]: { ...obtenerBorrador(), ...actual[vendedorId], [campo]: valor }
    }))
  }

  const actualizarCriterio = (
    vendedorId: number,
    campo: 'contratosFisicos' | 'infoCompleta' | 'requisitos' | 'entregaMercaderia' | 'superEstrella',
    valor: boolean
  ) => {
    setMatriz(actual => ({
      ...actual,
      [vendedorId]: { ...obtenerBorrador(), ...actual[vendedorId], [campo]: valor }
    }))
  }

  const actualizarObservacion = (vendedorId: number, valor: string) => {
    setMatriz(actual => ({
      ...actual,
      [vendedorId]: { ...obtenerBorrador(), ...actual[vendedorId], observacion: valor }
    }))
  }

  const guardarEvaluacionFila = async (vendedorId: number) => {
    const fila = matriz[vendedorId] || obtenerBorrador()
    setSavingRowId(vendedorId)
    try {
      const evaluacion = await fetch('/api/facturacion/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semanaId: semanaActivaId,
          vendedorId,
          numContratos: Number(fila.numContratos || 0),
          totalVentas: Number(fila.totalVentas || 0),
          contratosFisicos: fila.contratosFisicos,
          infoCompleta: fila.infoCompleta,
          requisitos: fila.requisitos,
          entregaMercaderia: fila.entregaMercaderia,
          superEstrella: fila.superEstrella,
          observacion: fila.observacion
        })
      }).then(leerRespuesta<Evaluacion>)

      setMatriz(actual => ({ ...actual, [vendedorId]: obtenerBorrador(evaluacion) }))
      setSuccessRowId(vendedorId)
      window.setTimeout(() => setSuccessRowId(actual => actual === vendedorId ? null : actual), 1500)
    } catch (error) {
      mostrarMensaje(error instanceof Error ? error.message : 'Error de red al guardar', 'error')
    } finally {
      setSavingRowId(null)
    }
  }

  const generarReporte = async () => {
    if (!filtroReporte.fechaInicio || !filtroReporte.fechaFin || filtroReporte.fechaInicio > filtroReporte.fechaFin) {
      mostrarMensaje('Selecciona un rango de fechas válido', 'error')
      return
    }

    setGenerandoReporte(true)
    try {
      const semanasDelRango = semanas.filter(semana =>
        semana.fechaFin.slice(0, 10) >= filtroReporte.fechaInicio &&
        semana.fechaInicio.slice(0, 10) <= filtroReporte.fechaFin
      )
      if (semanasDelRango.length === 0) {
        setSemanasReporte([])
        setDatosReporte([])
        mostrarMensaje('No hay semanas comerciales en este rango.', 'info')
        return
      }

      const evaluaciones = await fetch('/api/facturacion/evaluaciones')
        .then(leerRespuesta<Evaluacion[]>)
      setSemanasReporte(semanasDelRango)
      setDatosReporte(evaluaciones)
    } catch (error) {
      mostrarMensaje(error instanceof Error ? error.message : 'Error al generar el reporte', 'error')
    } finally {
      setGenerandoReporte(false)
    }
  }

  const columnasTabla = useMemo<ColumnaReporte[]>(() => {
    if (vistaReporte === 'semanas') {
      return [...semanasReporte]
        .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
        .map(semana => ({
          id: String(semana.id),
          nombre: semana.nombre,
          subtitulo: `${formatoFecha(semana.fechaInicio)} al ${formatoFecha(semana.fechaFin)}`,
          semanasIds: [semana.id]
        }))
    }

    const grupos = new Map<string, { nombre: string; semanas: Semana[] }>()
    semanasReporte.forEach(semana => {
      const fechaInicio = new Date(semana.fechaInicio)
      const mesNombre = semana.mes?.split('-').slice(1).join('-') ||
        fechaInicio.toLocaleString('es-EC', { month: 'long' }).toUpperCase()
      const anio = fechaInicio.getUTCFullYear()
      const key = `${anio}-${semana.mes || String(fechaInicio.getUTCMonth() + 1).padStart(2, '0')}`
      const grupo = grupos.get(key) || { nombre: `${mesNombre} ${anio}`, semanas: [] }
      grupo.semanas.push(semana)
      grupos.set(key, grupo)
    })

    return [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, grupo]) => {
        const semanasOrdenadas = [...grupo.semanas].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
        return {
          id,
          nombre: grupo.nombre,
          subtitulo: `${formatoFecha(semanasOrdenadas[0].fechaInicio)} al ${formatoFecha(semanasOrdenadas[semanasOrdenadas.length - 1].fechaFin)}`,
          semanasIds: semanasOrdenadas.map(semana => semana.id)
        }
      })
  }, [semanasReporte, vistaReporte])

  const vendedoresFiltrados = vendedores.filter(vendedor =>
    filtroReporteVendedor === 'TODOS' || vendedor.id === Number(filtroReporteVendedor)
  )
  const semanasReporteIds = new Set(semanasReporte.map(semana => semana.id))
  const evaluacionesReporte = datosReporte.filter(evaluacion => semanasReporteIds.has(evaluacion.semanaId))
  const totalesGlobales = consolidarEvaluaciones(evaluacionesReporte)

  const guardarSemana = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    try {
      const nuevaSemana = await fetch('/api/facturacion/semanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSemana)
      }).then(leerRespuesta<Semana>)
      mostrarMensaje('Semana creada exitosamente', 'success')
      setMostrarModalSemana(false)
      setFormSemana(actual => ({ ...actual, nombre: '' }))
      setSemanas(actual => [nuevaSemana, ...actual].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)))
      setSemanaActivaId(String(nuevaSemana.id))
      setActiveTab('evaluacion')
    } catch (error) {
      mostrarMensaje(error instanceof Error ? error.message : 'Error de conexión', 'error')
    }
  }

  return (
    <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 text-[#001F3F]">
      {mensaje.texto && (
        <div className={`fixed right-4 top-4 z-[99999] min-w-[300px] rounded-xl border-l-4 p-4 text-sm font-bold shadow-2xl ${
          mensaje.tipo === 'success'
            ? 'border-green-800 bg-green-600 text-white'
            : mensaje.tipo === 'error'
              ? 'border-red-950 bg-red-600 text-white'
              : 'border-blue-800 bg-blue-600 text-white'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-[#001F3F]">
          <CheckCircle2 className="text-[#FFB800]" size={28} />
          Calidad y Gamificación (Facturación)
        </h1>
        <div className="flex w-fit flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-2">
          <button
            onClick={() => setActiveTab('evaluacion')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all ${
              activeTab === 'evaluacion' ? 'bg-[#001F3F] text-[#FFB800] shadow-lg' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'
            }`}
          >
            <ClipboardList size={18} /> Evaluación Semanal
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all ${
              activeTab === 'reportes' ? 'bg-[#001F3F] text-[#FFB800] shadow-lg' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'
            }`}
          >
            <BarChart3 size={18} /> Reporte Consolidado
          </button>
        </div>
      </header>

      {activeTab === 'evaluacion' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-all hover:shadow-2xl md:flex-row">
            <div className="flex w-full items-center gap-4 md:w-auto">
              <Calendar className="text-[#FFB800]" size={24} />
              <div className="flex-1">
                <label htmlFor="semana-activa" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Periodo a Evaluar
                </label>
                <select
                  id="semana-activa"
                  value={semanaActivaId}
                  onChange={evento => setSemanaActivaId(evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white md:w-72"
                >
                  {semanas.map(semana => (
                    <option key={semana.id} value={semana.id}>
                      {semana.nombre} ({formatoFecha(semana.fechaInicio)} al {formatoFecha(semana.fechaFin)})
                    </option>
                  ))}
                  {semanas.length === 0 && <option value="">Sin semanas registradas</option>}
                </select>
              </div>
            </div>
            <button
              onClick={() => setMostrarModalSemana(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#001F3F] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#FFB800] shadow-lg transition-all hover:bg-black md:w-auto"
            >
              <Plus size={16} /> Nueva Semana
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
            <div className="overflow-x-auto">
              {!semanaActivaId ? (
                <div className="p-10 text-center font-bold text-slate-400">Crea una semana comercial para comenzar las evaluaciones.</div>
              ) : matrizSemanaId !== semanaActivaId && falloCargaSemanaId === semanaActivaId ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center font-bold text-slate-500">
                  <span>No se pudieron cargar las evaluaciones de este periodo.</span>
                  <button
                    onClick={() => setRecargaEvaluaciones(actual => actual + 1)}
                    className="rounded-xl bg-[#001F3F] px-4 py-2 text-xs font-black uppercase text-[#FFB800] transition-all hover:bg-black"
                  >
                    Reintentar
                  </button>
                </div>
              ) : matrizSemanaId !== semanaActivaId ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 font-bold text-slate-500">
                  <Loader2 className="animate-spin text-[#FFB800]" size={32} /> Cargando matriz...
                </div>
              ) : vendedores.length === 0 ? (
                <div className="p-10 text-center font-bold text-slate-400">No hay vendedores activos para evaluar.</div>
              ) : (
                <table className="w-full whitespace-nowrap text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-[#001F3F] bg-[#001F3F] text-[10px] font-black uppercase tracking-widest text-white">
                    <tr>
                      <th className="border-r border-white/10 p-4">Vendedor</th>
                      <th className="bg-[#FFB800]/10 p-4 text-center text-[#FFB800]">Contratos</th>
                      <th className="border-r border-white/10 bg-[#FFB800]/10 p-4 text-center text-[#FFB800]">Ventas ($)</th>
                      <th className="p-4 text-center">Carpeta Fís.</th>
                      <th className="p-4 text-center">Info. Comp.</th>
                      <th className="p-4 text-center">Requisitos</th>
                      <th className="border-r border-white/10 p-4 text-center">Mercadería</th>
                      <th className="border-r border-white/10 bg-[#FFB800]/10 p-4 text-center text-[#FFB800]">Bonus</th>
                      <th className="p-4">Observación (si falla)</th>
                      <th className="p-4 text-center">Resultado</th>
                      <th className="p-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendedores.map(vendedor => {
                      const fila = matrizSemanaId === semanaActivaId
                        ? matriz[vendedor.id] || obtenerBorrador()
                        : obtenerBorrador()
                      const sinContratos = Number(fila.numContratos || 0) === 0
                      const cumplioCalidad = fila.contratosFisicos && fila.infoCompleta && fila.requisitos && fila.entregaMercaderia
                      const guardando = savingRowId === vendedor.id
                      const guardado = successRowId === vendedor.id

                      return (
                        <tr key={vendedor.id} className={`transition-colors hover:bg-slate-50 ${guardando ? 'pointer-events-none opacity-50' : ''}`}>
                          <td className="border-r border-slate-100 p-4 font-bold text-[#001F3F]">{nombreVendedor(vendedor)}</td>
                          <td className="bg-amber-50/60 p-4 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={fila.numContratos}
                              onChange={evento => actualizarNumero(vendedor.id, 'numContratos', evento.target.value)}
                              placeholder="0"
                              aria-label={`Contratos de ${nombreVendedor(vendedor)}`}
                              className="w-20 rounded-lg border border-slate-400 bg-slate-50 p-2 text-center font-mono text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white"
                            />
                          </td>
                          <td className="border-r border-slate-100 bg-amber-50/60 p-4 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={fila.totalVentas}
                              onChange={evento => actualizarNumero(vendedor.id, 'totalVentas', evento.target.value)}
                              placeholder="0.00"
                              aria-label={`Ventas de ${nombreVendedor(vendedor)}`}
                              className="w-28 rounded-lg border border-slate-400 bg-slate-50 p-2 text-right font-mono font-bold text-emerald-700 outline-none transition-all focus:border-[#001F3F] focus:bg-white"
                            />
                          </td>
                          {([
                            ['contratosFisicos', 'Contratos físicos'],
                            ['infoCompleta', 'Información completa'],
                            ['requisitos', 'Requisitos'],
                            ['entregaMercaderia', 'Entrega de mercadería'],
                            ['superEstrella', 'Superestrella']
                          ] as const).map(([campo, etiqueta], indice) => (
                            <td key={campo} className={`p-4 text-center ${indice === 3 || indice === 4 ? 'border-r border-slate-100' : ''} ${indice === 4 ? 'bg-amber-50/60' : ''}`}>
                              <input
                                type="checkbox"
                                disabled={sinContratos}
                                checked={fila[campo]}
                                onChange={evento => actualizarCriterio(vendedor.id, campo, evento.target.checked)}
                                aria-label={`${etiqueta}: ${nombreVendedor(vendedor)}`}
                                className={`h-5 w-5 cursor-pointer accent-[#001F3F] disabled:opacity-100 ${indice === 4 ? 'accent-[#FFB800]' : ''}`}
                              />
                            </td>
                          ))}
                          <td className="p-4">
                            <input
                              type="text"
                              disabled={sinContratos}
                              value={fila.observacion}
                              onChange={evento => actualizarObservacion(vendedor.id, evento.target.value)}
                              placeholder={!sinContratos && !cumplioCalidad ? 'Obligatorio: explica el fallo' : 'Opcional'}
                              aria-label={`Observación de ${nombreVendedor(vendedor)}`}
                              className={`w-52 rounded-lg border bg-slate-50 p-2 text-[10px] text-[#001F3F] outline-none transition-all disabled:opacity-30 ${
                                !sinContratos && !cumplioCalidad && !fila.observacion
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-slate-400 focus:border-[#001F3F] focus:bg-white'
                              }`}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border ${
                              sinContratos
                                ? 'border-slate-400 bg-slate-50 text-slate-400'
                                : fila.superEstrella
                                  ? 'border-[#FFB800] bg-amber-50'
                                  : cumplioCalidad
                                    ? 'border-green-500/30 bg-green-500/10'
                                    : 'border-red-500/50 bg-red-500/10'
                            }`}>
                              {sinContratos
                                ? <span className="text-[9px] font-bold uppercase">N/A</span>
                                : fila.superEstrella
                                  ? <Award className="text-yellow-400" size={22} />
                                  : cumplioCalidad
                                    ? <Star className="fill-yellow-500 text-yellow-500" size={22} />
                                    : <Frown className="text-red-500" size={22} />}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => void guardarEvaluacionFila(vendedor.id)}
                              disabled={guardando || !semanaActivaId || matrizSemanaId !== semanaActivaId}
                              aria-label={`Guardar evaluación de ${nombreVendedor(vendedor)}`}
                              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#001F3F] text-[#FFB800] shadow-lg transition-all hover:scale-105 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500"
                            >
                              {guardando
                                ? <Loader2 className="animate-spin" size={16} />
                                : guardado
                                  ? <CheckCircle2 size={16} />
                                  : <Save size={16} />}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reportes' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h2 className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tight text-[#001F3F]">
                <BarChart3 className="text-[#FFB800]" size={24} /> Motor de Reportes
              </h2>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button onClick={() => setVistaReporte('semanas')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-black uppercase transition-all ${vistaReporte === 'semanas' ? 'bg-[#001F3F] text-[#FFB800]' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}>
                    <LayoutGrid size={14} /> Semanas
                  </button>
                  <button onClick={() => setVistaReporte('meses')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-black uppercase transition-all ${vistaReporte === 'meses' ? 'bg-[#001F3F] text-[#FFB800]' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}>
                    <Calendar size={14} /> Meses
                  </button>
                </div>
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button onClick={() => setMetricaReporte('ventas')} className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase transition-all ${metricaReporte === 'ventas' ? 'bg-[#001F3F] text-[#FFB800]' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}>
                    Ventas
                  </button>
                  <button onClick={() => setMetricaReporte('calidad')} className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase transition-all ${metricaReporte === 'calidad' ? 'bg-[#001F3F] text-[#FFB800]' : 'text-slate-500 hover:bg-white hover:text-[#001F3F]'}`}>
                    Calidad
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <label htmlFor="filtro-vendedor" className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Users size={12} /> Vendedor
                </label>
                <select id="filtro-vendedor" value={filtroReporteVendedor} onChange={evento => setFiltroReporteVendedor(evento.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#001F3F] outline-none transition-all focus:border-[#001F3F]">
                  <option value="TODOS">Todos los vendedores</option>
                  {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{nombreVendedor(vendedor)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fecha-desde" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Desde</label>
                <input id="fecha-desde" type="date" value={filtroReporte.fechaInicio} onChange={evento => setFiltroReporte(actual => ({ ...actual, fechaInicio: evento.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-[#001F3F] outline-none transition-all focus:border-[#001F3F]" />
              </div>
              <div>
                <label htmlFor="fecha-hasta" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Hasta</label>
                <input id="fecha-hasta" type="date" value={filtroReporte.fechaFin} onChange={evento => setFiltroReporte(actual => ({ ...actual, fechaFin: evento.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-[#001F3F] outline-none transition-all focus:border-[#001F3F]" />
              </div>
              <div className="flex items-end">
                <button onClick={() => void generarReporte()} disabled={generandoReporte} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#001F3F] py-3 text-xs font-black uppercase tracking-widest text-[#FFB800] shadow-lg transition-all hover:bg-black disabled:opacity-50">
                  {generandoReporte ? <Loader2 className="animate-spin" size={16} /> : <><Target size={16} /> Consultar</>}
                </button>
              </div>
            </div>

            {columnasTabla.length > 0 && (
              <div className="max-h-[600px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full whitespace-nowrap text-left text-xs">
                  <thead className="sticky top-0 z-20 bg-[#001F3F] text-[10px] font-black uppercase tracking-widest text-white">
                    <tr className="border-b border-white/10">
                      <th rowSpan={2} className="sticky left-0 z-30 border-r border-white/10 bg-[#001F3F] p-3">Vendedor</th>
                      {columnasTabla.map(columna => (
                        <th key={columna.id} colSpan={metricaReporte === 'ventas' ? 2 : 3} className="border-r border-white/10 p-3 text-center text-[#FFB800]">
                          {columna.nombre}
                          <span className="mt-1 block font-mono text-[9px] text-slate-300">{columna.subtitulo}</span>
                        </th>
                      ))}
                      <th colSpan={metricaReporte === 'ventas' ? 2 : 3} className="border-l-2 border-[#FFB800] bg-white/5 p-3 text-center text-[#FFB800]">Total del reporte</th>
                    </tr>
                    <tr className="border-b border-white/10 bg-[#002D5C]">
                      {columnasTabla.map(columna => (
                        <FragmentoSubcolumnas key={columna.id} metrica={metricaReporte} />
                      ))}
                      <FragmentoSubcolumnas metrica={metricaReporte} total />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-[#001F3F]">
                    {vendedoresFiltrados.map(vendedor => {
                      const resumenes = columnasTabla.map(columna => consolidarEvaluaciones(
                        evaluacionesReporte.filter(evaluacion =>
                          evaluacion.vendedorId === vendedor.id && columna.semanasIds.includes(evaluacion.semanaId)
                        )
                      ))
                      const total = resumenes.reduce((actual, resumen) => ({
                        contratos: actual.contratos + resumen.contratos,
                        ventas: actual.ventas + resumen.ventas,
                        estrellas: actual.estrellas + resumen.estrellas,
                        supers: actual.supers + resumen.supers,
                        fallos: actual.fallos + resumen.fallos
                      }), { contratos: 0, ventas: 0, estrellas: 0, supers: 0, fallos: 0 })

                      return (
                        <tr key={vendedor.id} className="group transition-colors hover:bg-slate-50">
                          <td className="sticky left-0 z-10 border-r border-slate-100 bg-white p-3 font-bold text-[#001F3F] group-hover:bg-slate-50">{nombreVendedor(vendedor)}</td>
                          {resumenes.map((resumen, indice) => (
                            <CeldasResumen key={`${vendedor.id}-${columnasTabla[indice].id}`} resumen={resumen} metrica={metricaReporte} />
                          ))}
                          <CeldasResumen resumen={total} metrica={metricaReporte} total />
                        </tr>
                      )
                    })}
                  </tbody>
                  {filtroReporteVendedor === 'TODOS' && (
                    <tfoot className="sticky bottom-0 z-10 bg-slate-50">
                      <tr className="border-t-2 border-slate-200">
                        <td className="sticky left-0 border-r border-slate-200 bg-slate-50 p-4 text-right font-black uppercase text-[#001F3F]">Total global:</td>
                        {columnasTabla.map(columna => (
                          <CeldasResumen
                            key={`total-${columna.id}`}
                            resumen={consolidarEvaluaciones(evaluacionesReporte.filter(evaluacion => columna.semanasIds.includes(evaluacion.semanaId)))}
                            metrica={metricaReporte}
                            total
                          />
                        ))}
                        <CeldasResumen resumen={totalesGlobales} metrica={metricaReporte} total global />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {!generandoReporte && columnasTabla.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <BarChart3 className="text-slate-300" size={48} />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Selecciona un rango y consulta para generar el reporte.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarModalSemana && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#001F3F]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 text-[#001F3F] shadow-2xl">
            <h3 className="mb-6 text-xl font-black uppercase italic tracking-tight text-[#001F3F]">Aperturar Semana</h3>
            <form onSubmit={evento => void guardarSemana(evento)} className="space-y-4">
              <div>
                <label htmlFor="nombre-semana" className="mb-1 block text-[10px] font-black uppercase text-slate-500">Nombre Comercial</label>
                <input id="nombre-semana" required maxLength={120} value={formSemana.nombre} onChange={evento => setFormSemana(actual => ({ ...actual, nombre: evento.target.value }))} placeholder="Ej: 1ra Semana Octubre" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white" />
              </div>
              <div>
                <label htmlFor="mes-comercial" className="mb-1 block text-[10px] font-black uppercase text-slate-500">Mes Comercial (para reportes)</label>
                <select id="mes-comercial" required value={formSemana.mes} onChange={evento => setFormSemana(actual => ({ ...actual, mes: evento.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white">
                  {MESES.map(mes => <option key={mes} value={mes}>{mes.split('-')[1]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inicio-semana" className="mb-1 block text-[10px] font-black uppercase text-slate-500">Desde</label>
                  <input id="inicio-semana" required type="date" value={formSemana.fechaInicio} onChange={evento => setFormSemana(actual => ({ ...actual, fechaInicio: evento.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white" />
                </div>
                <div>
                  <label htmlFor="fin-semana" className="mb-1 block text-[10px] font-black uppercase text-slate-500">Hasta</label>
                  <input id="fin-semana" required type="date" value={formSemana.fechaFin} onChange={evento => setFormSemana(actual => ({ ...actual, fechaFin: evento.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-[#001F3F] outline-none transition-all focus:border-[#001F3F] focus:bg-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalSemana(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-[#001F3F]">Cancelar</button>
                <button type="submit" className="flex-1 rounded-xl bg-[#001F3F] py-3 font-black tracking-widest text-[#FFB800] transition-all hover:bg-black">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FragmentoSubcolumnas({ metrica, total = false }: { metrica: 'ventas' | 'calidad'; total?: boolean }) {
  if (metrica === 'ventas') {
    return (
      <>
        <th className={`p-2 text-center ${total ? 'border-l-2 border-[#FFB800] bg-amber-50 text-[#001F3F]' : 'text-slate-600'}`}>
          {total ? 'T. Contratos' : 'Contratos'}
        </th>
        <th className={`border-r border-slate-200 p-2 text-center ${total ? 'bg-amber-50 text-emerald-700' : 'text-emerald-700'}`}>
          {total ? 'Gran Total ($)' : 'Ventas ($)'}
        </th>
      </>
    )
  }
  return (
    <>
      <th className={`p-2 text-center ${total ? 'border-l-2 border-[#FFB800] bg-amber-50' : ''} text-amber-700`}>{total ? 'T. Aprob.' : 'Aprob.'}</th>
      <th className={`p-2 text-center ${total ? 'bg-amber-50' : ''} text-amber-600`}>{total ? 'T. Bonus' : 'Bonus'}</th>
      <th className={`border-r border-slate-200 p-2 text-center ${total ? 'bg-amber-50' : ''} text-red-600`}>{total ? 'T. Fallos' : 'Fallos'}</th>
    </>
  )
}

function CeldasResumen({ resumen, metrica, total = false, global = false }: {
  resumen: Resumen
  metrica: 'ventas' | 'calidad'
  total?: boolean
  global?: boolean
}) {
  const prefijoColor = global
    ? 'bg-[#001F3F] text-lg'
    : total
      ? 'bg-amber-50 font-black'
      : ''

  if (metrica === 'ventas') {
    return (
      <>
        <td className={`p-3 text-center font-mono ${global ? 'text-white' : 'text-[#001F3F]'} ${prefijoColor} ${total ? 'border-l-2 border-[#FFB800]' : ''}`}>{resumen.contratos}</td>
        <td className={`border-r border-slate-200 p-3 text-right font-mono ${global ? 'text-[#FFB800]' : 'text-emerald-700'} ${prefijoColor}`}>${resumen.ventas.toFixed(2)}</td>
      </>
    )
  }

  return (
    <>
      <td className={`p-3 text-center font-mono text-amber-700 ${prefijoColor} ${total ? 'border-l-2 border-[#FFB800]' : ''}`}>{resumen.estrellas}</td>
      <td className={`p-3 text-center font-mono text-amber-600 ${prefijoColor}`}>{resumen.supers}</td>
      <td className={`border-r border-slate-200 p-3 text-center font-mono text-red-600 ${prefijoColor}`}>{resumen.fallos}</td>
    </>
  )
}
