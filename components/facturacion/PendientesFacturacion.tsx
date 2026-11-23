'use client'

import { useEffect, useRef, useState } from 'react'
import type { Evaluacion } from './FacturacionClient'
import { semanaFinalizada } from '@/lib/facturacion-pendientes'

export type Pendiente = {
  id: number
  cantidad: number
  valor: string | number
  motivo: string
  referencia: string | null
  creadoEn: string
  creadoPor: string
  regularizadoEn: string | null
  regularizadoPor: string | null
}

export function ListadoPendientesFacturacion({ puedeEditar, actualizar }: { puedeEditar: boolean; actualizar: (evaluacion: Evaluacion) => void }) {
  const [filas, setFilas] = useState<Evaluacion[]>([])
  const [seleccionada, setSeleccionada] = useState<Evaluacion | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const abort = new AbortController()
    async function cargar() {
      try {
        const response = await fetch('/api/facturacion/evaluaciones', { cache: 'no-store', signal: abort.signal })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error || 'No se pudieron cargar los pendientes.')
        setFilas(result.data)
      } catch (caught) { if (!abort.signal.aborted) setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los pendientes.') }
      finally { if (!abort.signal.aborted) setLoading(false) }
    }
    void cargar()
    return () => abort.abort()
  }, [])
  const pendientes = filas.flatMap(evaluacion => (evaluacion.pendientes || []).filter(p => !p.regularizadoEn).map(pendiente => ({ evaluacion, pendiente })))
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="text-sm font-black uppercase">Contratos pendientes de sumar · Todas las semanas</h2>
    <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{pendientes.reduce((s, p) => s + p.pendiente.cantidad, 0)} contratos · ${pendientes.reduce((s, p) => s + Number(p.pendiente.valor), 0).toFixed(2)} por sumar</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {loading ? <p className="text-sm text-slate-500">Cargando pendientes...</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{['Vendedor', 'Semana', 'Motivo / referencia', 'Cantidad', 'Valor', 'Gestión'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{pendientes.map(({ evaluacion, pendiente: p }) => <tr key={p.id} className="border-t border-slate-100"><td className="p-3 font-bold">{evaluacion.vendedor.nombre} {evaluacion.vendedor.apellido}</td><td className="p-3">{evaluacion.semana.nombre}</td><td className="p-3">{p.motivo}<span className="block text-slate-500">{p.referencia}</span></td><td className="p-3">{p.cantidad}</td><td className="p-3">${Number(p.valor).toFixed(2)}</td><td className="p-3"><button type="button" onClick={() => setSeleccionada(evaluacion)} className="rounded-lg bg-[#001F3F] px-3 py-2 font-bold text-white">Ver pendientes</button></td></tr>)}{pendientes.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-slate-500">No hay contratos pendientes de sumar.</td></tr>}</tbody></table></div>}
    {seleccionada && <PendientesFacturacion key={seleccionada.id} evaluacion={seleccionada} puedeEditar={puedeEditar} cerrar={() => setSeleccionada(null)} actualizar={evaluacion => { setSeleccionada(evaluacion); setFilas(actuales => actuales.map(e => e.id === evaluacion.id ? evaluacion : e)); actualizar(evaluacion) }} />}
  </section>
}

export default function PendientesFacturacion({ evaluacion, puedeEditar, cerrar, actualizar }: {
  evaluacion: Evaluacion
  puedeEditar: boolean
  cerrar: () => void
  actualizar: (evaluacion: Evaluacion) => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [fila, setFila] = useState(evaluacion)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [confirmarId, setConfirmarId] = useState<number | null>(null)
  const [form, setForm] = useState({ cantidad: '', valor: '', motivo: '', referencia: '' })
  useEffect(() => { dialogo.current?.showModal() }, [])

  async function ejecutar(method: 'POST' | 'PATCH', body: object) {
    if (ocupado) return
    setOcupado(true); setError('')
    try {
      const response = await fetch('/api/facturacion/pendientes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo guardar.')
      const recarga = await fetch(`/api/facturacion/evaluaciones?semanaId=${fila.semanaId}`, { cache: 'no-store' })
      const datos = await recarga.json()
      if (!recarga.ok || !datos.success) throw new Error('El cambio se guardó. Cierra y recarga la semana para ver los totales actualizados.')
      const nueva = (datos.data as Evaluacion[]).find(e => e.id === fila.id)
      if (!nueva) throw new Error('No se encontró la evaluación actualizada.')
      setFila(nueva); actualizar(nueva); setConfirmarId(null)
      if (method === 'POST') setForm({ cantidad: '', valor: '', motivo: '', referencia: '' })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar.') }
    finally { setOcupado(false) }
  }
  const abiertos = (fila.pendientes || []).filter(p => !p.regularizadoEn)
  const historial = (fila.pendientes || []).filter(p => p.regularizadoEn)
  return <dialog ref={dialogo} aria-labelledby="titulo-pendientes" onCancel={event => { event.preventDefault(); if (!ocupado) cerrar() }} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-2xl bg-white p-6 text-[#001F3F] shadow-2xl backdrop:bg-black/60">
    <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black" id="titulo-pendientes">Contratos pendientes de sumar</h2><p className="text-sm text-slate-500">{fila.vendedor.nombre} {fila.vendedor.apellido} · {fila.semana.nombre}</p></div><button type="button" autoFocus disabled={ocupado} onClick={cerrar} aria-label="Cerrar pendientes" className="rounded-lg border p-2 text-xs">Cerrar</button></div>
    <p className="my-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">Por sumar: {abiertos.reduce((s, p) => s + p.cantidad, 0)} contratos · ${abiertos.reduce((s, p) => s + Number(p.valor), 0).toFixed(2)}</p>
    <p className="mb-4 text-xs text-slate-500">Registra únicamente contratos y valores que todavía no están incluidos en los totales. Al regularizarlos se suman a esta misma semana.</p>
    {semanaFinalizada(fila.semana.fechaFin) && <p className="mb-4 text-xs text-slate-600">Semana finalizada: la regularización actualiza contratos y ventas y conserva la calificación de cierre.</p>}
    {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
    {puedeEditar && <form onSubmit={event => { event.preventDefault(); void ejecutar('POST', { ...form, evaluacionId: fila.id }) }} className="mb-4 grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
      <label className="text-xs font-bold">Cantidad<input required disabled={ocupado} type="number" min="1" max="2147483647" step="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /></label>
      <label className="text-xs font-bold">Valor por sumar ($)<input required disabled={ocupado} type="number" min="0.01" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /></label>
      <label className="text-xs font-bold">Motivo<input required disabled={ocupado} maxLength={200} list="motivos-pendiente" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} className="mt-1 block w-full rounded-lg border p-2" /><datalist id="motivos-pendiente"><option>Falta cédula</option><option>Mediación</option><option>Mercadería por entregar</option><option>Documentación incompleta</option></datalist></label>
      <label className="text-xs font-bold">Referencia (opcional)<input disabled={ocupado} maxLength={500} value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="Cliente o número de contrato" className="mt-1 block w-full rounded-lg border p-2" /></label>
      <button disabled={ocupado} className="rounded-lg bg-[#001F3F] p-2 text-xs font-bold text-white disabled:opacity-50 sm:col-span-2">Agregar pendiente</button>
    </form>}
    <div className="space-y-3">{abiertos.length === 0 && <p className="text-sm text-slate-500">Sin pendientes por sumar.</p>}{abiertos.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 p-3 text-sm">
      <div><strong>{p.motivo}</strong><p>{p.cantidad} contratos · ${Number(p.valor).toFixed(2)}</p>{p.referencia && <p className="text-xs text-slate-500">{p.referencia}</p>}</div>
      {puedeEditar && (confirmarId === p.id ? <div className="space-y-2"><p className="text-xs font-bold">¿Sumar estos valores a {fila.semana.nombre}?</p><div className="flex gap-2"><button disabled={ocupado} type="button" onClick={() => void ejecutar('PATCH', { id: p.id })} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirmar y sumar</button><button disabled={ocupado} type="button" onClick={() => setConfirmarId(null)} className="rounded-lg border px-3 py-2 text-xs">Cancelar</button></div></div> : <button disabled={ocupado} type="button" onClick={() => setConfirmarId(p.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Regularizar y sumar</button>)}
    </div>)}</div>
    <details className="mt-5"><summary className="cursor-pointer text-sm font-bold">Historial de regularizados ({historial.length})</summary>{historial.map(p => <div key={p.id} className="border-b border-slate-100 py-3 text-sm"><strong>{p.motivo}</strong> · {p.cantidad} contratos · ${Number(p.valor).toFixed(2)}{p.referencia && <p className="text-xs text-slate-500">{p.referencia}</p>}<p className="text-xs text-slate-500">Sumado el {new Date(p.regularizadoEn!).toLocaleString('es-EC')} por {p.regularizadoPor}</p></div>)}</details>
  </dialog>
}
