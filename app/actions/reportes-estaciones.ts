'use server'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

interface FiltrosEstaciones {
  gasolineraNombre?: string
  fechaDesde?: string
  fechaHasta?: string
}

export async function exportarKardexEstacionesExcel(filtros: FiltrosEstaciones) {
  try {
    const listaVendedoresDb = await prisma.user.findMany({
      include: {
        asignacionesVehiculo: {
          include: { vehiculo: true }
        }
      }
    }).catch(() => []) as any[]

    const gasolinerasDb = await prisma.gasolinera.findMany({
      where: {
        tieneConvenio: true
      },
      include: {
        registrosCombustible: {
          include: { user: true, vehiculo: true },
          orderBy: { fechaFactura: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    }) as any[]

    let poolMovimientos: any[] = []

    gasolinerasDb.forEach((g: any) => {
      // 1. MAPEAMOS LAS ACREDITACIONES CON SU MARCA DE TIEMPO COMPLETA
      if (Number(g.montoRecarga || 0) > 0) {
        poolMovimientos.push({
          id: `ACRED-${g.id}`,
          nombreEstacion: String(g.nombre).toUpperCase(),
          fecha: g.createdAt ? g.createdAt.toISOString().split('T')[0] : '',
          createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
          numFactura: g.numFactura || 'S/N',
          chofer: 'INYECCIÓN MATRIZ DE FONDOS',
          placa: 'INSTITUTIONAL',
          acreditacion: Number(g.montoRecarga || 0),
          consumo: 0,
          esConvenio: true
        })
      }

      // 2. MAPEAMOS LOS CONSUMOS CON SU MARCA DE TIEMPO COMPLETA
      const consumos = g.registrosCombustible || []
      consumos.forEach((c: any) => {
        const maestroVendedor = listaVendedoresDb.find(v => Number(v.id) === Number(c.userId))
        const nombreChoferReal = maestroVendedor?.nombre || c.user?.nombre || c.chofer || 'VENDEDOR'
        const placaReal = maestroVendedor?.asignacionesVehiculo?.[0]?.vehiculo?.placa || c.vehiculo?.placa || c.placaCarro || 'S/P'

        poolMovimientos.push({
          id: `CONSU-${c.id}`,
          nombreEstacion: String(g.nombre).toUpperCase(),
          fecha: c.fechaFactura ? c.fechaFactura.toISOString().split('T')[0] : '',
          createdAt: c.createdAt ? new Date(c.createdAt) : (c.fechaFactura ? new Date(c.fechaFactura) : new Date()),
          numFactura: c.numFactura || 'SECUENCIAL',
          chofer: nombreChoferReal,
          placa: placaReal,
          acreditacion: 0,
          consumo: Number(c.precioTotal || 0),
          esConvenio: !c.fueraDeConvenio
        })
      })
    })

    // 3. ORDEN CONTABLE ASCENDENTE PARA CALCULAR (Del más antiguo al más nuevo)
    poolMovimientos.sort((a, b) => {
      const tiempoA = new Date(a.createdAt).getTime()
      const tiempoB = new Date(b.createdAt).getTime()
      
      if (tiempoA !== tiempoB) {
        return tiempoA - tiempoB
      }
      
      // Desempate de mismo milisegundo: Acreditaciones van primero
      const esAcredA = a.id.startsWith('ACRED-') ? 1 : 0
      const esAcredB = b.id.startsWith('ACRED-') ? 1 : 0
      return esAcredB - esAcredA
    })

    // 4. CALCULO LINEAL DEL SALDO SEGREGANDO POR ESTACIÓN DE SERVICIO (Igual a la web)
    const acumuladores: Record<string, number> = {}
    let movimientosCalculados = poolMovimientos.map((m) => {
      const estacion = String(m.nombreEstacion).toUpperCase().trim()
      
      if (!(estacion in acumuladores)) {
        acumuladores[estacion] = 0
      }

      const saldoInicialDeEstacion = acumuladores[estacion]
      const acred = Number(m.acreditacion || 0)
      const cons = Number(m.consumo || 0)
      const esAcreditacion = m.id.startsWith('ACRED-')

      acumuladores[estacion] += (acred - cons)

      return {
        ...m,
        // Si es consumo, ponemos el saldo inicial en la columna de acreditación (informativo)
        acreditacion: esAcreditacion ? acred : saldoInicialDeEstacion,
        saldo: acumuladores[estacion]
      }
    })

    // 5. APLICACIÓN DE FILTROS SEGUROS
    if (filtros.fechaDesde) {
      movimientosCalculados = movimientosCalculados.filter(m => m.fecha >= filtros.fechaDesde!)
    }
    if (filtros.fechaHasta) {
      movimientosCalculados = movimientosCalculados.filter(m => m.fecha <= filtros.fechaHasta!)
    }
    if (filtros.gasolineraNombre && filtros.gasolineraNombre.trim() !== '') {
      movimientosCalculados = movimientosCalculados.filter(
        m => m.nombreEstacion.toUpperCase() === filtros.gasolineraNombre!.trim().toUpperCase()
      )
    }

    const workbook = new ExcelJS.Workbook()

    const construirPestañaKardex = (worksheet: ExcelJS.Worksheet, tituloHoja: string, datos: any[]) => {
      worksheet.views = [{ showGridLines: true }]

      worksheet.getCell('A1').value = `DITCASH - KARDEX DE ESTACIONES DE SERVICIO`
      worksheet.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
      worksheet.getCell('A2').value = `REPORTE VISTA: ${tituloHoja.toUpperCase()}`
      worksheet.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

      const headers = ['FECHA', 'TIPO MOVIMIENTO', 'ESTACIÓN DE SERVICIO', 'Nº FACTURA / DOC', 'CHOFER / DETALLE', 'ACREDITACIÓN (+)', 'CONSUMO (-)', 'SALDO DISPONIBLE']
      worksheet.getRow(4).values = headers
      worksheet.getRow(4).height = 24

      worksheet.getRow(4).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } }
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      let filaActual = 5
      let totalAcreditado = 0
      let totalConsumido = 0

      datos.forEach((m: any) => {
        const esAcred = m.id.startsWith('ACRED-')
        const tipoMov = esAcred ? 'ACREDITACIÓN' : (m.esConvenio ? 'CONSUMO CONVENIO' : 'CONSUMO EXTERNO')
        
        // Sumamos los totales reales para el resumen del Excel (excluyendo el saldo inicial de los consumos)
        if (esAcred) {
          totalAcreditado += m.acreditacion
        }
        totalConsumido += m.consumo

        worksheet.getRow(filaActual).values = [
          m.fecha || 'S/F',
          tipoMov,
          m.nombreEstacion.toUpperCase(),
          m.numFactura || 'S/N',
          esAcred ? m.chofer : `${String(m.chofer).toUpperCase()} (${String(m.placa).toUpperCase()})`,
          m.acreditacion,
          m.consumo,
          m.saldo
        ]
        filaActual++
      })

      for (let i = 5; i < filaActual; i++) {
        const row = worksheet.getRow(i)
        row.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 10 }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          }
          if ([1, 2, 4].includes(colNum)) cell.alignment = { horizontal: 'center', vertical: 'middle' }
          if ([6, 7, 8].includes(colNum)) {
            cell.numFmt = '$#,##0.00'
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
          }
        })
      }

      filaActual += 1
      worksheet.getCell(`F${filaActual}`).value = 'TOTAL ACREDITADO:'
      worksheet.getCell('F' + filaActual).font = { name: 'Arial', size: 9, bold: true }
      worksheet.getCell(`H${filaActual}`).value = totalAcreditado
      worksheet.getCell('H' + filaActual).numFmt = '$#,##0.00'
      worksheet.getCell('H' + filaActual).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF27AE60' } }

      filaActual++
      worksheet.getCell(`F${filaActual}`).value = 'TOTAL CONSUMIDO:'
      worksheet.getCell('F' + filaActual).font = { name: 'Arial', size: 9, bold: true }
      worksheet.getCell(`H${filaActual}`).value = totalConsumido
      worksheet.getCell('H' + filaActual).numFmt = '$#,##0.00'
      worksheet.getCell('H' + filaActual).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC0392B' } }

      filaActual++
      worksheet.getCell(`F${filaActual}`).value = 'BALANCE DE SALDO FINAL:'
      worksheet.getCell('F' + filaActual).font = { name: 'Arial', size: 10, bold: true }
      worksheet.getCell(`H${filaActual}`).value = { formula: `=H${filaActual-2}-H${filaActual-1}` }
      worksheet.getCell('H' + filaActual).numFmt = '$#,##0.00'
      worksheet.getCell('H' + filaActual).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF001F3F' } }

      worksheet.columns.forEach((col: any) => {
        let maxLen = 12
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell.value ? cell.value.toString() : ''
          if (val.length > maxLen) maxLen = val.length
        })
        col.width = maxLen + 4
      })
    }

    if (filtros.gasolineraNombre && filtros.gasolineraNombre.trim() !== '') {
      const estNombre = filtros.gasolineraNombre.trim().toUpperCase()
      const ws = workbook.addWorksheet(estNombre.substring(0, 30))
      construirPestañaKardex(ws, estNombre, movimientosCalculados)
    } else {
      const wsGeneral = workbook.addWorksheet('GENERAL')
      construirPestañaKardex(wsGeneral, 'Consolidado General de Estaciones', movimientosCalculados)

      const estacionesUnicas = Array.from(new Set(movimientosCalculados.map(m => m.nombreEstacion)))
      
      estacionesUnicas.forEach((est: any) => {
        const movimientosDeEstaEstacion = movimientosCalculados.filter(m => m.nombreEstacion === est)
        const nombreHojaLimpio = String(est).toUpperCase().substring(0, 30).replace(/[*?:/\\[\]]/g, '')
        
        const wsIndividual = workbook.addWorksheet(nombreHojaLimpio)
        construirPestañaKardex(wsIndividual, `Kardex - ${est}`, movimientosDeEstaEstacion)
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const nombreArchivo = filtros.gasolineraNombre && filtros.gasolineraNombre.trim() !== ''
      ? `Kardex_Estacion_${filtros.gasolineraNombre.trim().toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Kardex_General_Todas_Las_Estaciones_${new Date().toISOString().split('T')[0]}.xlsx`

    return { success: true, data: Array.from(new Uint8Array(buffer)), filename: nombreArchivo }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}