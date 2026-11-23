import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calcularControlAceite, validarServicio, type MovimientoTaller } from '../lib/control-aceite'
import { calificacionFacturacion, semanaFinalizada, validarPendiente, validarTotalesRegularizados } from '../lib/facturacion-pendientes'

const movimiento = (id: number, vehiculoId: number, fecha: string, km: number, esCambioAceite: boolean | null = true): MovimientoTaller => ({
  id, vehiculoId, fechaTransaccion: fecha, tipoMovimiento: 'MANTENIMIENTO', kilometrajeServicio: km, esCambioAceite, vehiculo: { intervaloAlerta: 5000 }
})

test('aceite: calcula por vehículo, ignora reparaciones e históricos y conserva la base fuera del filtro', () => {
  const resultado = calcularControlAceite([
    movimiento(5, 1, '2026-11-15', 20001),
    movimiento(3, 1, '2026-11-04', 14000, false),
    movimiento(2, 2, '2026-10-02', 60000),
    movimiento(1, 1, '2026-10-01', 10000),
    movimiento(4, 1, '2026-11-05', 15000),
    movimiento(0, 1, '2026-09-01', 5000, null)
  ])
  assert.equal(resultado.find(r => r.id === 1)?.estadoAceite, 'INICIO_BASE')
  assert.equal(resultado.find(r => r.id === 2)?.estadoAceite, 'INICIO_BASE')
  assert.equal(resultado.find(r => r.id === 4)?.estadoAceite, 'A_TIEMPO')
  assert.equal(resultado.find(r => r.id === 4)?.recorridoAceite, 5000)
  assert.equal(resultado[0].recorridoAceite, 5001)
  assert.equal(resultado[0].excesoAceite, 1)
  assert.equal(resultado[0].estadoAceite, 'EXCEDIDO')
  assert.equal(resultado.filter(r => new Date(r.fechaTransaccion) >= new Date('2026-11-01')).find(r => r.id === 4)?.kmAceiteAnterior, 10000)
})

test('aceite: un kilometraje descendente no se convierte en la nueva base', () => {
  const resultado = calcularControlAceite([movimiento(1, 1, '2026-10-01', 10000), movimiento(2, 1, '2026-10-02', 9000), movimiento(3, 1, '2026-10-03', 15000)])
  assert.equal(resultado[1].estadoAceite, 'REVISAR_KILOMETRAJE')
  assert.equal(resultado[0].recorridoAceite, 5000)
})

test('taller: admite servicio general sin km y exige km válido para aceite', () => {
  const datos = { kmMantenimiento: null, costo: 25, taller: 'Taller', descripcion: 'Frenos', fechaFactura: new Date(), esCambioAceite: false }
  assert.doesNotThrow(() => validarServicio(datos))
  assert.throws(() => validarServicio({ ...datos, esCambioAceite: true }), /kilometraje/)
  assert.throws(() => validarServicio({ ...datos, kmMantenimiento: Number.NaN }), /kilometraje/)
  assert.throws(() => validarServicio({ ...datos, costo: -1 }), /costo/)
})

test('pendientes: cantidades y dinero positivos sin redondear silenciosamente valores inválidos', () => {
  const datos = { evaluacionId: 1, cantidad: 2, valor: '150.25', motivo: ' Falta cédula ', referencia: ' Cliente ' }
  assert.deepEqual(validarPendiente(datos), { evaluacionId: 1, cantidad: 2, valor: 150.25, motivo: 'Falta cédula', referencia: 'Cliente' })
  for (const cambio of [{ cantidad: 1.5 }, { valor: 0 }, { valor: '1.001' }, { cantidad: 0 }, { motivo: '' }, { valor: Infinity }]) {
    assert.throws(() => validarPendiente({ ...datos, ...cambio }))
  }
})

test('pendientes: no permite borrar de los totales lo ya regularizado, ignora lo aún pendiente', () => {
  const pendientes = [{ cantidad: 2, valor: '150.25', regularizadoEn: new Date() }, { cantidad: 10, valor: 999, regularizadoEn: null }]
  assert.doesNotThrow(() => validarTotalesRegularizados(2, 150.25, pendientes))
  assert.throws(() => validarTotalesRegularizados(1, 150.25, pendientes))
  assert.throws(() => validarTotalesRegularizados(2, 150.24, pendientes))
})

test('calificación: pendientes afectan semanas abiertas y regularizar conserva la calificación de cierre', () => {
  const evaluacion = { numContratos: 2, contratosFisicos: true, infoCompleta: true, requisitos: true, entregaMercaderia: true, superEstrella: false }
  assert.equal(calificacionFacturacion(evaluacion), 'ESTRELLA')
  assert.equal(calificacionFacturacion({ ...evaluacion, pendientes: [{ regularizadoEn: null }] }), 'TRISTE')
  assert.equal(calificacionFacturacion({ ...evaluacion, pendientes: [{ regularizadoEn: new Date() }] }), 'ESTRELLA')
  assert.equal(calificacionFacturacion({ ...evaluacion, calificacionCierre: 'TRISTE' }), 'TRISTE')
  assert.equal(semanaFinalizada('2026-11-15', new Date('2026-11-16T04:59:59.999Z')), false)
  assert.equal(semanaFinalizada('2026-11-15', new Date('2026-11-16T05:00:00Z')), true)
})
