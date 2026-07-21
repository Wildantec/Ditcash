'use server'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

interface FiltrosExcel {
  vendedor?: string
  fechaDesde?: string
  fechaHasta?: string
}

export async function exportarFacturasCombustibleExcel(filtros: FiltrosExcel) {
  try {
    const whereClause: any = {}
    
    if (filtros.fechaDesde || filtros.fechaHasta) {
      whereClause.fechaFactura = {}
      if (filtros.fechaDesde) whereClause.fechaFactura.gte = new Date(filtros.fechaDesde)
      if (filtros.fechaHasta) whereClause.fechaFactura.lte = new Date(filtros.fechaHasta)
    }

    if (filtros.vendedor && filtros.vendedor.trim() !== '') {
      whereClause.user = {
        nombre: filtros.vendedor.trim().toUpperCase()
      }
    }

    const facturas = await prisma.registroCombustible.findMany({
      where: whereClause,
      include: { gasolinera: true, user: true, vehiculo: true },
      orderBy: { fechaFactura: 'desc' }
    })

    const listaVendedoresDb = await prisma.user.findMany({
      include: {
        asignacionesVehiculo: {
          include: { vehiculo: true }
        }
      }
    }).catch(() => []) as any[]

    const extraerDatosRegistro = (r: any) => {
      const maestroVendedor = listaVendedoresDb.find(v => Number(v.id) === Number(r.userId));
      const nombreChofer = maestroVendedor?.nombre || r.user?.nombre || r.chofer || 'SIN VENDEDOR';
      
      const placa = maestroVendedor?.asignacionesVehiculo?.[0]?.vehiculo?.placa || 
                    r.vehiculo?.placa || 
                    r.placaCarro || 
                    r.placa || 
                    'S/P';
                    
      return { nombreChofer, placa };
    }

    const workbook = new ExcelJS.Workbook()

    const construirHojaData = (worksheet: ExcelJS.Worksheet, tituloPestaña: string, registros: any[]) => {
      worksheet.views = [{ showGridLines: true }]

      worksheet.getCell('A1').value = `DITCASH - OPERACIONES DE COMBUSTIBLE`
      worksheet.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF001F3F' }, italic: true }
      worksheet.getCell('A2').value = `REPORTE: ${tituloPestaña.toUpperCase()}`
      worksheet.getCell('A2').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFB800' } }

      const headers = ['FECHA FACTURA', 'MODALIDAD PAGO', 'ESTACIÓN', 'VENDEDOR / CHOFER', 'PLACA', 'Nº FACTURA', 'TOTAL PAGADO']
      worksheet.getRow(4).values = headers
      worksheet.getRow(4).height = 24

      worksheet.getRow(4).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } }
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      let filaActual = 5
      let sumConvenio = 0
      let sumNoConvenio = 0

      registros.forEach((r: any) => {
        const total = Number(r.precioTotal || 0)
        const tipoPago = (r.metodoPago || (r.fueraDeConvenio ? 'NO CONVENIO' : 'CONVENIO')).toUpperCase()
        const estacion = r.metodoPago === 'NO CONVENIO' || r.fueraDeConvenio ? (r.nombreEstacionManual || 'ESTACIÓN EXTERNA') : (r.gasolinera?.nombre || 'S/E')
        const { nombreChofer, placa } = extraerDatosRegistro(r)

        if (tipoPago === 'NO CONVENIO') sumNoConvenio += total
        else sumConvenio += total

        worksheet.getRow(filaActual).values = [
          r.fechaFactura ? new Date(r.fechaFactura).toISOString().split('T')[0] : 'S/F',
          tipoPago,
          estacion.toUpperCase(),
          nombreChofer.toUpperCase(),
          placa.toUpperCase(),
          r.numFactura || 'SECUENCIAL',
          total
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
          if ([1, 2, 5, 6].includes(colNum)) cell.alignment = { horizontal: 'center', vertical: 'middle' }
          if (colNum === 7) {
            cell.numFmt = '$#,##0.00'
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
          }
        })
      }
      filaActual += 1
      worksheet.getCell(`E${filaActual}`).value = 'TOTAL CONVENIOS:'
      worksheet.getCell(`E${filaActual}`).font = { name: 'Arial', size: 9, bold: true }
      worksheet.getCell(`G${filaActual}`).value = sumConvenio
      worksheet.getCell(`G${filaActual}`).numFmt = '$#,##0.00'
      worksheet.getCell(`G${filaActual}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1D4ED8' } }

      filaActual++
      worksheet.getCell(`E${filaActual}`).value = 'TOTAL FUERA CONVENIO:'
      worksheet.getCell(`E${filaActual}`).font = { name: 'Arial', size: 9, bold: true }
      worksheet.getCell(`G${filaActual}`).value = sumNoConvenio
      worksheet.getCell(`G${filaActual}`).numFmt = '$#,##0.00'
      worksheet.getCell(`G${filaActual}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB45309' } }

      filaActual++
      worksheet.getCell(`E${filaActual}`).value = 'TOTAL GENERAL:'
      worksheet.getCell(`E${filaActual}`).font = { name: 'Arial', size: 10, bold: true }
      worksheet.getCell(`G${filaActual}`).value = { formula: `=G${filaActual-2}+G${filaActual-1}` }
      worksheet.getCell(`G${filaActual}`).numFmt = '$#,##0.00'
      worksheet.getCell(`G${filaActual}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF15803D' } }

      worksheet.columns.forEach((col: any) => {
        let maxLen = 12
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell.value ? cell.value.toString() : ''
          if (val.length > maxLen) maxLen = val.length
        })
        col.width = maxLen + 4
      })
    }

    if (filtros.vendedor && filtros.vendedor.trim() !== '') {

      const vNombre = filtros.vendedor.trim().toUpperCase()
      const ws = workbook.addWorksheet(vNombre.substring(0, 30))
      construirHojaData(ws, `Historial - ${vNombre}`, facturas)
    } else {
      const wsGeneral = workbook.addWorksheet('GENERAL')
      construirHojaData(wsGeneral, 'Historial General Consolidado', facturas)
      const choferesUnicos = Array.from(new Set(facturas.map((f: any) => f.user?.nombre || f.chofer).filter(Boolean)))

      choferesUnicos.forEach((vendedor: any) => {
        const facturasDelVendedor = facturas.filter((f: any) => (f.user?.nombre || f.chofer) === vendedor)
        const nombrePestañaLimpio = String(vendedor).toUpperCase().substring(0, 30).replace(/[*?:/\\[\]]/g, '')
        
        const wsIndividual = workbook.addWorksheet(nombrePestañaLimpio)
        construirHojaData(wsIndividual, `Historial - ${vendedor}`, facturasDelVendedor)
      })
    }
    const buffer = await workbook.xlsx.writeBuffer()
    
    const filename = filtros.vendedor && filtros.vendedor.trim() !== ''
      ? `Reporte_Combustible_${filtros.vendedor.trim().toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Reporte_General_Combustible_Todos_${new Date().toISOString().split('T')[0]}.xlsx`

    return { 
      success: true, 
      data: Array.from(new Uint8Array(buffer)), 
      filename 
    }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}