export type MovimientoTaller = {
  id: number
  vehiculoId: number
  fechaTransaccion: Date | string
  tipoMovimiento: string
  esCambioAceite?: boolean | null
  kilometrajeServicio?: number | null
  vehiculo?: { intervaloAlerta?: number }
}

// Calcula sobre todo el historial antes de aplicar filtros de fecha o conductor.
// Los mantenimientos antiguos sin clasificación no se presumen cambios de aceite.
export function calcularControlAceite<T extends MovimientoTaller>(movimientos: T[]) {
  const anteriores = new Map<number, number>()
  return [...movimientos]
    .sort((a, b) => new Date(a.fechaTransaccion).getTime() - new Date(b.fechaTransaccion).getTime() || a.id - b.id)
    .map(movimiento => {
      const anterior = anteriores.get(movimiento.vehiculoId)
      const km = movimiento.kilometrajeServicio
      const intervalo = movimiento.vehiculo?.intervaloAlerta ?? 5000
      let estadoAceite = 'NO_APLICA'
      let recorridoAceite: number | null = null
      if (movimiento.esCambioAceite === true && km != null) {
        if (anterior === undefined) estadoAceite = 'INICIO_BASE'
        else if (km < anterior) estadoAceite = 'REVISAR_KILOMETRAJE'
        else {
          recorridoAceite = km - anterior
          estadoAceite = recorridoAceite > intervalo ? 'EXCEDIDO' : 'A_TIEMPO'
        }
        if (anterior === undefined || km >= anterior) anteriores.set(movimiento.vehiculoId, km)
      }
      return { ...movimiento, kmAceiteAnterior: anterior ?? null, recorridoAceite, intervaloAceite: intervalo, excesoAceite: Math.max(0, (recorridoAceite ?? 0) - intervalo), estadoAceite }
    }).reverse()
}

export function validarServicio(data: { kmMantenimiento: number | null; costo: number; taller: string; descripcion: string; fechaFactura: Date; esCambioAceite: boolean }) {
  if (typeof data.esCambioAceite !== 'boolean') throw new Error('Indica si se realizó cambio de aceite.')
  if (!data.taller.trim() || !data.descripcion.trim()) throw new Error('Completa el taller y la descripción.')
  if (!Number.isFinite(data.costo) || data.costo < 0) throw new Error('El costo debe ser un valor válido mayor o igual a cero.')
  if ((data.esCambioAceite && data.kmMantenimiento === null) || (data.kmMantenimiento !== null && (!Number.isFinite(data.kmMantenimiento) || data.kmMantenimiento < 0))) {
    throw new Error('Ingresa un kilometraje válido; es obligatorio para cambios de aceite.')
  }
  if (Number.isNaN(new Date(data.fechaFactura).getTime())) throw new Error('La fecha de ingreso no es válida.')
}
