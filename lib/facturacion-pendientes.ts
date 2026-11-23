export type Calificable = {
  numContratos: number
  contratosFisicos: boolean
  infoCompleta: boolean
  requisitos: boolean
  entregaMercaderia: boolean
  superEstrella: boolean
  calificacionCierre?: string | null
  pendientes?: { regularizadoEn: Date | string | null }[]
}

export function calificacionFacturacion(e: Calificable): string {
  if (e.calificacionCierre) return e.calificacionCierre
  if (e.pendientes?.some(p => !p.regularizadoEn)) return 'TRISTE'
  if (!e.numContratos) return 'SIN_VENTAS'
  if (e.superEstrella) return 'SUPER'
  return e.contratosFisicos && e.infoCompleta && e.requisitos && e.entregaMercaderia ? 'ESTRELLA' : 'TRISTE'
}

export function semanaFinalizada(fechaFin: Date | string, ahora = new Date()) {
  return ahora.getTime() > new Date(`${new Date(fechaFin).toISOString().slice(0, 10)}T23:59:59.999-05:00`).getTime()
}

export function validarPendiente(body: Record<string, unknown>) {
  const evaluacionId = Number(body.evaluacionId)
  const cantidad = Number(body.cantidad)
  const valor = Number(body.valor)
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
  const referencia = typeof body.referencia === 'string' ? body.referencia.trim() : ''
  if (!Number.isSafeInteger(evaluacionId) || evaluacionId <= 0 ||
      !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 2147483647 ||
      !Number.isFinite(valor) || valor <= 0 || valor >= 1e12 || Math.abs(valor * 100 - Math.round(valor * 100)) > 0.001 ||
      !motivo || motivo.length > 200 || referencia.length > 500) {
    throw new Error('Indica una cantidad entera, un valor positivo con hasta dos decimales y un motivo de hasta 200 caracteres.')
  }
  return { evaluacionId, cantidad, valor, motivo, referencia: referencia || null }
}

export function validarTotalesRegularizados(contratos: number, ventas: number, pendientes: { cantidad: number; valor: unknown; regularizadoEn: unknown }[]) {
  const regularizados = pendientes.filter(p => p.regularizadoEn)
  if (contratos < regularizados.reduce((s, p) => s + p.cantidad, 0) || ventas + 0.001 < regularizados.reduce((s, p) => s + Number(p.valor), 0)) {
    throw new Error('Los totales no pueden ser menores a los contratos y valores ya regularizados.')
  }
}
