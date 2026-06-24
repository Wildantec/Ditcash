'use server'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

// 📊 ACCIÓN EXCLUSIVA: Genera el Kardex unificado de la Oficina (image_e78511.jpg) con Saldo Flotante
export async function exportarKardexEstacionExcel(filtros: { gasolineraId: number; fechaDesde?: string; fechaHasta?: string }) {
  try {
    // 1. Obtener los datos base de la gasolinera seleccionada usando type cast 'as any' 
    // Esto blindará las propiedades dinámicas de saldo/cupo (montoRecarga, cupo, etc.)
    const gasolinera = await prisma.gasolinera.findUnique({
      where: { id: filtros.gasolineraId }
    }) as any

    if (!gasolinera) throw new Error('Estación de servicio no encontrada.')

    // 2. Traer todos los consumos históricos vinculados a este proveedor en orden cronológico (asc)
    const whereClause: any = { gasolineraId: filtros.gasolineraId }
    if (filtros.fechaDesde || filtros.fechaHasta) {
      whereClause.fechaFactura = {}
      if (filtros.fechaDesde) whereClause.fechaFactura.gte = new Date(filtros.fechaDesde)
      if (filtros.fechaHasta) whereClause.fechaFactura.lte = new Date(filtros.fechaHasta)
    }

    const facturas = await prisma.registroCombustible.findMany({
      where: whereClause,
      orderBy: { fechaFactura: 'asc' }, 
      include: { user: true, vehiculo: true } // Incluimos las relaciones para chofer y placa
    })

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Kardex Convenio', { views: [{ showGridLines: true }] })

    // Título Superior Estilizado DITEC
    ws.getCell('A1').value = `DITCASH - ESTADO DE CUENTA DE COMBUSTIBLE`
    ws.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
    ws.getCell('A2').value = `CONVENIO CORPORATIVO: ${gasolinera.nombre.toUpperCase()}`
    ws.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

    // Cabeceras idénticas a tu imagen Excel (image_e78511.jpg)
    const headers = ['FECHA', 'TIPO DE ACCIÓN', 'Nº FACTURA', 'CHOFER / REF', 'MONTO ($)', 'SALDO MATRIZ']
    ws.getRow(4).values = headers
    ws.getRow(4).height = 24

    ws.getRow(4).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } } 
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    let filaActual = 5
    let saldoFlotante = 0
    let totalAcreditado = 0
    let totalConsumido = 0

    // Evaluamos dinámicamente si tiene monto o cupo asignado en tu modelo Prisma (as any)
    const cupoInicial = gasolinera.montoRecarga || gasolinera.montoCredito || gasolinera.cupo || 0

    if (cupoInicial > 0) {
      saldoFlotante += cupoInicial
      totalAcreditado += cupoInicial

      ws.getRow(filaActual).values = [
        gasolinera.createdAt ? gasolinera.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        'DEPÓSITO / TRANSFERENCIA',
        `${gasolinera.id}12`,
        'Acreditación Inicial de Fondos Matriz',
        cupoInicial,
        saldoFlotante
      ]
      
      // Estilo Fila de Crédito (Verde)
      ws.getRow(filaActual).getCell(5).font = { color: { argb: 'FF27AE60' }, bold: true }
      filaActual++
    }

    // 🟢 CORRECCIÓN: Filas de Consumos (Forzamos tipado 'any' en el bucle f:any para evitar errores de Prisma)
    facturas.forEach((f: any) => {
      saldoFlotante -= f.precioTotal
      totalConsumido += f.precioTotal

      // Acceso seguro a las propiedades relacionales anidadas por Prisma
      const choferNombre = f.user?.nombre || 'VENDEDOR'
      const placaCarro = f.vehiculo?.placa || 'S/P'
      const metodoPagoFactura = f.metodoPago || 'CONVENIO'

      ws.getRow(filaActual).values = [
        f.fechaFactura.toISOString().split('T')[0],
        metodoPagoFactura === 'EFECTIVO' ? 'CONSUMO CAJA CHICA' : 'CONSUMO CONVENIO',
        f.numFactura,
        `${choferNombre.toUpperCase()} (${placaCarro})`,
        -f.precioTotal, // Monto Negativo para indicar salida en el Kardex
        saldoFlotante
      ]

      // Estilo Fila de Débito (Rojo para consumos)
      ws.getRow(filaActual).getCell(5).font = { color: { argb: 'FFC0392B' }, bold: true }
      filaActual++
    })

    // Aplicar estilos generales a todo el cuerpo de datos generado
    for (let i = 5; i < filaActual; i++) {
      const row = ws.getRow(i)
      row.eachCell((cell, colNum) => {
        cell.font = cell.font || { name: 'Arial', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
        if (colNum === 1 || colNum === 3) cell.alignment = { horizontal: 'center' }
        if (colNum === 5 || colNum === 6) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
      })
    }

    // Filas de Cierre y Totales (Sección Baja de tu Excel - image_e78511.jpg)
    filaActual += 1
    ws.getCell(`D${filaActual}`).value = 'Total Acreditado:'
    ws.getCell(`D${filaActual}`).font = { name: 'Arial', size: 10, bold: true }
    ws.getCell(`E${filaActual}`).value = totalAcreditado
    ws.getCell(`E${filaActual}`).numFmt = '$#,##0.00'
    ws.getCell(`E${filaActual}`).font = { name: 'Arial', size: 10, bold: true }

    filaActual++
    ws.getCell(`D${filaActual}`).value = 'Total Consumido:'
    ws.getCell(`D${filaActual}`).font = { name: 'Arial', size: 10, bold: true }
    ws.getCell(`E${filaActual}`).value = totalConsumido
    ws.getCell(`E${filaActual}`).numFmt = '$#,##0.00'
    ws.getCell(`E${filaActual}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC0392B' } }

    filaActual++
    ws.getCell(`D${filaActual}`).value = 'SALDO FINAL MATRIZ:'
    ws.getCell(`D${filaActual}`).font = { name: 'Arial', size: 11, bold: true }
    ws.getCell(`E${filaActual}`).value = { formula: `=E${filaActual-2}-E${filaActual-1}` }
    ws.getCell(`E${filaActual}`).numFmt = '$#,##0.00'
    ws.getCell(`E${filaActual}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF2980B9' } }

    // Autoajustar anchos de columnas
    ws.columns.forEach((col: any) => {
      let maxLen = 14
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : ''
        if (val.length > maxLen) maxLen = val.length
      })
      col.width = maxLen + 4
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return { success: true, data: Array.from(new Uint8Array(buffer)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}