'use server'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

// 🚙 REPORTE DINÁMICO MULTI-PESTAÑA ORIENTADO AL KARDEX LOGÍSTICO COMPLETO
export async function exportarVehiculosExcel(filtros?: { placa?: string; vendedorId?: string; fechaDesde?: string; fechaHasta?: string }) {
  try {
    const filtroPlaca = filtros?.placa || ''
    const filtroVendedor = filtros?.vendedorId || ''
    const fechaDesde = filtros?.fechaDesde || ''
    const fechaHasta = filtros?.fechaHasta || ''

    const workbook = new ExcelJS.Workbook()

    // Estilos Corporativos Estándar de DITEC
    const estiloHeader = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      }
    }

    const estiloCelda = {
      font: { name: 'Arial', size: 10 },
      border: {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }
    }

    const estiloTotal = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF001F3F' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
      border: { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'double', color: { argb: 'FF000000' } } }
    }

    // Cabeceras globales del Kardex
    const headersKardex = [
      'FECHA REGISTRO', 
      'CONDUCTOR', 
      'PLACA VEHÍCULO', 
      'MARCA / MODELO', 
      'KM INICIAL', 
      'KM RECORRIDOS', 
      'KM ENTRADA / ACTUAL', 
      'TALLER / MOVIMIENTO',
      'N° COMPROBANTE',
      'DETALLE TRABAJOS REALIZADOS', 
      'VALOR MANTENIMIENTO'
    ]

    // 1. OBTENCIÓN Y FILTRADO BASE DE LOS DATOS DEL KARDEX
    const todoElKardex = await prisma.kardexVehiculo.findMany({
      include: {
        vehiculo: {
          include: {
            asignaciones: { where: { fechaFin: null }, include: { user: true } }
          }
        }
      },
      orderBy: { fechaTransaccion: 'desc' }
    })

    const vendedores = await prisma.user.findMany({ where: { rol: 'VENDEDOR' } })

    // Filtrado reactivo de la data que va a la hoja General
    const kardexGeneralFiltrado = todoElKardex.filter((k) => {
      const vendedorObj = vendedores.find(v => v.id.toString() === filtroVendedor)
      const nombreVendedorFiltro = vendedorObj?.nombre ? vendedorObj.nombre.toUpperCase() : ''
      
      const cumpleVendedor = filtroVendedor === '' || 
        k.choferEnEseMomento?.toUpperCase().includes(nombreVendedorFiltro) ||
        k.vehiculo?.asignaciones?.[0]?.userId?.toString() === filtroVendedor

      const cumplePlaca = filtroPlaca === '' || k.vehiculo?.placa === filtroPlaca
      
      let cumpleFecha = true
      if (k.fechaTransaccion) {
        const fechaK = new Date(k.fechaTransaccion)
        if (fechaDesde) {
          const desde = new Date(`${fechaDesde}T00:00:00`)
          if (fechaK < desde) cumpleFecha = false
        }
        if (fechaHasta) {
          const hasta = new Date(`${fechaHasta}T23:59:59`)
          if (fechaK > hasta) cumpleFecha = false
        }
      }
      return cumpleVendedor && cumplePlaca && cumpleFecha
    })

    // ==========================================
    // 🚀 HOJA 1: PESTAÑA GENERAL (SIEMPRE VA)
    // ==========================================
    const wsGeneral = workbook.addWorksheet('General', { views: [{ showGridLines: true }] })
    wsGeneral.getCell('A1').value = 'DITCASH - HISTORIAL LOGÍSTICO Y CONTABLE GENERAL'
    wsGeneral.getCell('A1').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF001F3F' } }
    
    wsGeneral.getRow(3).values = headersKardex
    wsGeneral.getRow(3).height = 24
    wsGeneral.getRow(3).eachCell((cell) => { cell.style = estiloHeader as any })

    let totalCostoGeneral = 0
    kardexGeneralFiltrado.forEach((k, idx) => {
      const rowNum = 4 + idx
      const row = wsGeneral.getRow(rowNum)
      const kmIn = k.kmMantenimiento || 0
      const kmOut = k.kmEnEseMomento || 0
      const kmNeto = kmOut >= kmIn ? kmOut - kmIn : 0
      const costo = Number(k.costoTransaccion || 0)
      totalCostoGeneral += costo

      row.values = [
        k.fechaTransaccion ? k.fechaTransaccion.toISOString().split('T')[0] : 'S/F',
        k.choferEnEseMomento || 'SIN ASIGNAR',
        k.vehiculo?.placa || 'S/P',
        k.vehiculo?.marcaModelo?.toUpperCase() || 'S/M',
        kmIn,
        kmNeto,
        kmOut,
        k.taller || k.tipoMovimiento || 'S/N',
        k.factura || 'S/F',
        k.observaciones || 'SIN ESPECIFICACIONES',
        costo
      ]

      row.eachCell((cell, colNum) => {
        cell.style = estiloCelda as any
        if ([1, 3, 8, 9].includes(colNum)) cell.alignment = { horizontal: 'center', vertical: 'middle' }
        if ([5, 6, 7].includes(colNum)) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' } }
        if (colNum === 11) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
      })
    })

    const totalGIndex = 4 + kardexGeneralFiltrado.length
    const rowTotalG = wsGeneral.getRow(totalGIndex)
    rowTotalG.values = ['TOTAL ACUMULADO LIQUIDADO', '', '', '', '', '', '', '', '', '', totalCostoGeneral]
    rowTotalG.eachCell((cell, colNum) => {
      cell.style = estiloTotal as any
      if (colNum === 11) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
    })
    autoAjustarColumnas(wsGeneral)

    // ==========================================
    // 🚀 LÓGICA DE PESTAÑAS SECUNDARIAS DINÁMICAS
    // ==========================================

    // ESCENARIO A: FILTROS COMPLETAMENTE VACÍOS -> Hojas separadas por Carro (Placa + Vendedor)
    if (!filtroPlaca && !filtroVendedor) {
      const placasUnicas = Array.from(new Set(kardexGeneralFiltrado.map(k => k.vehiculo?.placa).filter(Boolean)))
      
      placasUnicas.forEach((nPlaca) => {
        const registrosDePlaca = kardexGeneralFiltrado.filter(k => k.vehiculo?.placa === nPlaca)
        const ultimoChofer = registrosDePlaca[0]?.choferEnEseMomento || 'SIN ASIGNAR'
        const nombreHoja = `${nPlaca} - ${ultimoChofer}`.toUpperCase().substring(0, 31).replace(/[:\\?*\[\]]/g, '')

        crearHojaKardexEspecifica(workbook, nombreHoja, registrosDePlaca, headersKardex, estiloHeader, estiloCelda, estiloTotal)
      })
    }
    
    // ESCENARIO B: SE FILTRÓ POR PLACA -> Hojas separadas por los nombres de los VENDEDORES que usaron ese carro
    else if (filtroPlaca && !filtroVendedor) {
      const vendedoresDeEstaPlaca = Array.from(new Set(kardexGeneralFiltrado.map(k => k.choferEnEseMomento).filter(Boolean)))

      vendedoresDeEstaPlaca.forEach((nombreChofer) => {
        const registrosDelChofer = kardexGeneralFiltrado.filter(k => k.choferEnEseMomento === nombreChofer)
        const nombreHoja = `${nombreChofer}`.toUpperCase().substring(0, 31).replace(/[:\\?*\[\]]/g, '')

        crearHojaKardexEspecifica(workbook, nombreHoja, registrosDelChofer, headersKardex, estiloHeader, estiloCelda, estiloTotal)
      })
    }

    // ESCENARIO C: SE FILTRÓ POR VENDEDOR -> Hojas separadas por las PLACAS de los carros que manejó ese vendedor
    else if (filtroVendedor && !filtroPlaca) {
      const placasDelVendedor = Array.from(new Set(kardexGeneralFiltrado.map(k => k.vehiculo?.placa).filter(Boolean)))

      placasDelVendedor.forEach((nPlaca) => {
        const registrosDeEstaPlaca = kardexGeneralFiltrado.filter(k => k.vehiculo?.placa === nPlaca)
        const nombreHoja = `PLACA ${nPlaca}`.toUpperCase().substring(0, 31).replace(/[:\\?*\[\]]/g, '')

        crearHojaKardexEspecifica(workbook, nombreHoja, registrosDeEstaPlaca, headersKardex, estiloHeader, estiloCelda, estiloTotal)
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return { success: true, data: Array.from(new Uint8Array(buffer)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 🛠️ FUNCIÓN AUXILIAR PARA GENERAR CADA HOJA DE MANERA TRANSPARENTE E INMUTABLE
function crearHojaKardexEspecifica(workbook: ExcelJS.Workbook, nombreHoja: string, registros: any[], headers: string[], eHeader: any, eCelda: any, eTotal: any) {
  const ws = workbook.addWorksheet(nombreHoja, { views: [{ showGridLines: true }] })
  
  ws.getCell('A1').value = `DETALLE OPERATIVO DE FILA: ${nombreHoja}`
  ws.getCell('A1').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF001F3F' } }
  
  ws.getRow(3).values = headers
  ws.getRow(3).height = 24
  ws.getRow(3).eachCell((cell) => { cell.style = eHeader })

  let subtotalCosto = 0
  registros.forEach((k, idx) => {
    const rowNum = 4 + idx
    const row = ws.getRow(rowNum)
    const kmIn = k.kmMantenimiento || 0
    const kmOut = k.kmEnEseMomento || 0
    const kmNeto = kmOut >= kmIn ? kmOut - kmIn : 0
    const costo = Number(k.costoTransaccion || 0)
    subtotalCosto += costo

    row.values = [
      k.fechaTransaccion ? k.fechaTransaccion.toISOString().split('T')[0] : 'S/F',
      k.choferEnEseMomento || 'SIN ASIGNAR',
      k.vehiculo?.placa || 'S/P',
      k.vehiculo?.marcaModelo?.toUpperCase() || 'S/M',
      kmIn,
      kmNeto,
      kmOut,
      k.taller || k.tipoMovimiento || 'S/N',
      k.factura || 'S/F',
      k.observaciones || 'SIN ESPECIFICACIONES',
      costo
    ]

    row.eachCell((cell, colNum) => {
      cell.style = eCelda
      if ([1, 3, 8, 9].includes(colNum)) cell.alignment = { horizontal: 'center', vertical: 'middle' }
      if ([5, 6, 7].includes(colNum)) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' } }
      if (colNum === 11) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
    })
  })

  const totalIndex = 4 + registros.length
  const rowTotal = ws.getRow(totalIndex)
  rowTotal.values = ['TOTAL ACUMULADO HOJA', '', '', '', '', '', '', '', '', '', subtotalCosto]
  rowTotal.eachCell((cell, colNum) => {
    cell.style = eTotal
    if (colNum === 11) { cell.numFmt = '$#,##0.00'; cell.alignment = { horizontal: 'right' } }
  })

  autoAjustarColumnas(ws)
}

function autoAjustarColumnas(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col: any) => {
    let maxLen = 14
    col.eachCell({ includeEmpty: true }, (cell: any) => {
      const val = cell.value ? cell.value.toString() : ''
      if (val.length > maxLen) maxLen = val.length
    })
    col.width = maxLen + 4
  })
}