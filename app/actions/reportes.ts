'use server'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

export async function exportarVehiculosExcel() {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      orderBy: { placa: 'asc' },
      include: { asignaciones: { where: { fechaFin: null }, include: { user: true } } }
    })

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Control de Flota', { views: [{ showGridLines: true }] })
    
    ws.getCell('A1').value = 'DITCASH - ESTADO GLOBAL DE UNIDADES'
    ws.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
    ws.getCell('A2').value = 'CONTROL DE KILOMETRAJES E INTERVALOS DE MANTENIMIENTO'
    ws.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

    const headers = ['PLACA', 'MARCA / MODELO', 'CONDUCTOR ASIGNADO', 'KILOMETRAJE ACTUAL', 'ÚLTIMO CAMBIO ACEITE', 'KM TRANSCURRIDOS', 'ESTADO MECÁNICO']
    ws.getRow(4).values = headers
    ws.getRow(4).height = 24
    
    ws.getRow(4).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } }
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    vehiculos.forEach((v, idx) => {
      const rowNum = 5 + idx
      const row = ws.getRow(rowNum)
      const esCritico = v.alertaMantenimiento
      const chofer = v.asignaciones?.[0]?.user?.nombre || 'SIN ASIGNAR'

      row.values = [
        v.placa,
        v.marcaModelo,
        chofer.toUpperCase(),
        v.kmActual,
        v.kmUltimoAceite,
        { formula: `=C${rowNum}-D${rowNum}` },
        esCritico ? 'MANTENIMIENTO CRÍTICO' : 'ÓPTIMO'
      ]

      row.eachCell((cell, colNum: number) => {
        cell.font = { name: 'Arial', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        }
        if (colNum === 1) { cell.font = { name: 'Arial', size: 10, bold: true }; cell.alignment = { horizontal: 'center' } }
        if (colNum >= 3 && colNum <= 6) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' } }
        if (colNum === 7) {
          cell.alignment = { horizontal: 'center' }
          if (esCritico) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } }
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFCC0000' } }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAFAF1' } }
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF27AE60' } }
          }
        }
      })
    })

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
export async function exportarEstacionesExcel() {
  try {
    const gasolineras = await prisma.gasolinera.findMany({ orderBy: { nombre: 'asc' } })

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Puntos Autorizados', { views: [{ showGridLines: true }] })
    
    ws.getCell('A1').value = 'DITCASH - CATÁLOGO DE PROVEEDORES'
    ws.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
    ws.getCell('A2').value = 'ESTACIONES DE SERVICIO Y CONVENIOS CORPORATIVOS'
    ws.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

    const headers = ['ESTACIÓN DE SERVICIO', 'UBICACIÓN / CIUDAD', 'CONVENIO DE CRÉDITO']
    ws.getRow(4).values = headers
    ws.getRow(4).height = 24
    
    ws.getRow(4).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } }
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    gasolineras.forEach((g, idx) => {
      const rowNum = 5 + idx
      const row = ws.getRow(rowNum)

      row.values = [
        g.nombre.toUpperCase(),
        g.ciudad.toUpperCase(),
        g.tieneConvenio ? 'AUTORIZADO / LÍNEA ABIERTA' : 'SIN CONVENIO / EXTERNO'
      ]

      row.eachCell((cell, colNum: number) => {
        cell.font = { name: 'Arial', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        }
        if (rowNum % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        if (colNum === 3) {
          cell.alignment = { horizontal: 'center' }
          if (g.tieneConvenio) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAFAF1' } }
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF27AE60' } }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF94A3B8' } }
          }
        }
      })
    })

    ws.columns.forEach((col: any) => {
      let maxLen = 16
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
export async function exportarFacturasExcel(filtros?: { fechaDesde?: string; fechaHasta?: string; placa?: string; gasolineraId?: string }) {
  try {
    const whereClause: any = {}
    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      whereClause.fechaFactura = {}
      if (filtros.fechaDesde) whereClause.fechaFactura.gte = new Date(filtros.fechaDesde)
      if (filtros.fechaHasta) whereClause.fechaFactura.lte = new Date(filtros.fechaHasta)
    }
    if (filtros?.placa) {
      whereClause.vehiculo = { placa: filtros.placa }
    }
    if (filtros?.gasolineraId) {
      whereClause.gasolineraId = parseInt(filtros.gasolineraId)
    }

    const facturas = await prisma.registroCombustible.findMany({
      where: whereClause,
      orderBy: { fechaFactura: 'desc' },
      include: { vehiculo: true, gasolinera: true, user: true }
    })

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Auditoría Comprobantes', { views: [{ showGridLines: true }] })
    
    ws.getCell('A1').value = 'DITCASH - HISTORIAL DE FACTURAS'
    ws.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
    ws.getCell('A2').value = 'FISCALIZACIÓN OPERATIVA DE QUEMA Y RENDIMIENTOS'
    ws.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

    const headers = ['FECHA', 'NÚMERO FACTURA', 'PLACA VEHÍCULO', 'ESTACIÓN', 'CHOFER', 'KM AUDITADOS', 'GALONES', 'MÉTODO PAGO', 'TOTAL ($)', 'CONVENIO']
    ws.getRow(4).values = headers
    ws.getRow(4).height = 24
    
    ws.getRow(4).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } }
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    facturas.forEach((f, idx) => {
      const rowNum = 5 + idx
      const row = ws.getRow(rowNum)

      row.values = [
        f.fechaFactura.toISOString().split('T')[0],
        f.numFactura,
        f.vehiculo?.placa || '',
        f.gasolinera?.nombre || '',
        f.user?.nombre || 'S/N',
        f.kmRecorridos,
        f.galones,
        'CONVENIO',
        f.precioTotal,
        f.fueraDeConvenio ? 'FUERA CONVENIO' : 'CONVENIO OK'
      ]

      row.eachCell((cell, colNum: number) => {
        cell.font = { name: 'Arial', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        }
        if (rowNum % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 8) cell.alignment = { horizontal: 'center' }
        if (colNum === 6 || colNum === 7) { cell.numFmt = '#,##0.00'; cell.alignment = { horizontal: 'right' } }
        if (colNum === 9) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
        if (colNum === 10) {
          cell.alignment = { horizontal: 'center' }
          if (f.fueraDeConvenio) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } }
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFCC0000' } }
          }
        }
      })
    })

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