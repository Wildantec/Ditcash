'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoriaReal {
  id?: number;
  name?: string;
  description?: string;
}

interface BancoClienteReal {
  bank_name?: string;
  interbank_name?: string;
  account_type?: string;
  account_number?: string;
  bank_interbank_id?: string;
}

interface Movimiento {
  invoice_id?: number;
  sales_note_id?: number;
  invoice_number?: string; 
  date_issue?: string;
  date_due?: string;
  total_amount?: string | number;
  total_balance?: string | number;
  total_installments?: number;
  pending_installments?: number;
  paid_installments?: number;
  overdue_installments?: number;
  days_overdue?: number;
  paid_amount?: string | number;
  currency?: string;
  client?: any;
  invoice?: any;
  sales_note?: any;
  category?: CategoriaReal; 
  client_bank_account?: BancoClienteReal; 
}

interface BotonImprimirProps {
  clienteNombre: string;
  clienteCedula: string;
  movimientos: Movimiento[];
  fichaCliente: any;   
  empresaCliente?: any;
}

export default function BotonImprimir({ clienteNombre, clienteCedula, movimientos, fichaCliente }: BotonImprimirProps) {
  const [procesando, setProcesando] = useState(false);

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/proxy-logo?url=${encodeURIComponent(imageUrl)}`);
      const data = await response.json();
      return data.base64 || null;
    } catch (error) {
      return null;
    }
  };

  const obtenerDetalleFacturaAPI = async (invoiceId: number, token: string) => {
    try {
      const res = await fetch(`https://grupoaraujos.cloud/api/v1/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1"
        }
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      return null;
    }
  };

  const consultarDatosEmpresaYCuotas = async (invoiceId?: number, salesNoteId?: number, companyIdDeMovimiento?: number) => {
    try {
      const API_BASE = "https://grupoaraujos.cloud/api/v1";
      const tokenResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
          password: process.env.API_CONTABLE_PASSWORD || "admin123",
        }),
      });
      if (!tokenResponse.ok) return { cuotas: [], token: "", empresaInfo: null };
      const tokenData = await tokenResponse.json();
      const token = tokenData.data?.access_token || tokenData.access_token;

      const urlCuotas = invoiceId 
        ? `${API_BASE}/receivables/invoices/${invoiceId}/installments`
        : `${API_BASE}/receivables/sales-notes/${salesNoteId}/installments`;

      const resCuotas = await fetch(urlCuotas, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1",
          "User-Agent": "Mozilla/5.0"
        }
      });
      const jsonCuotas = resCuotas.ok ? await resCuotas.json() : null;
      const cuotas = jsonCuotas?.data || jsonCuotas?.items || (Array.isArray(jsonCuotas) ? jsonCuotas : []);

      let empresaInfo = null;
      const idEmpresaBuscada = companyIdDeMovimiento || 1;
      
      try {
        const resEmp = await fetch(`${API_BASE}/companies/${idEmpresaBuscada}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-company-id": "1"
          }
        });
        if (resEmp.ok) {
          const empJson = await resEmp.json();
          empresaInfo = empJson.data || empJson;
        }
      } catch (e) {
      }

      return { cuotas, token, empresaInfo };
    } catch (err) {
      return { cuotas: [], token: "", empresaInfo: null };
    }
  };

  const generarPDF = async () => {
    setProcesando(true);
    
    const primerMov = movimientos[0];
    const idEmpresaDinamica = primerMov?.invoice?.company_id || primerMov?.sales_note?.company_id || (primerMov as any)?.company_id;

    const { token, empresaInfo } = await consultarDatosEmpresaYCuotas(
      primerMov?.invoice_id || primerMov?.invoice?.id,
      primerMov?.sales_note_id || primerMov?.sales_note?.id,
      idEmpresaDinamica
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const empresaNombre = empresaInfo?.name || "DIDARGALL / DISAR-EC S.A.";
    let empresaRuc = empresaInfo?.ruc || "1792483920001";
    if (empresaRuc && !empresaRuc.toUpperCase().startsWith("R.U.C")) {
      empresaRuc = `R.U.C: ${empresaRuc}`;
    }

    const empresaDireccion = empresaInfo?.address || "Av. Principal y Calle Secundaria, Quito, Ecuador";
    const empresaTelefono = empresaInfo?.phone || "0999999999 / (02) 345-6789";
    const empresaEmail = empresaInfo?.email && empresaInfo.email !== "user@example.com" ? empresaInfo.email : "facturacion@disar-ec.com";
    const rutaLogo = empresaInfo?.logo_path || null;

    let inicioTextoX = 12; 
    
    if (rutaLogo) {
      const logoBase64 = await getBase64ImageFromUrl(rutaLogo);
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, 8, 35, 15);
        inicioTextoX = 48; 
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); 
    doc.text(empresaNombre.toUpperCase(), inicioTextoX, 15);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(empresaRuc, inicioTextoX, 22); 

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    let topY = 10;
    if (empresaDireccion) {
      const lineasDireccion = doc.splitTextToSize(empresaDireccion, 80);
      lineasDireccion.forEach((linea: string) => {
        doc.text(linea, 198, topY, { align: 'right' });
        topY += 3.5;
      });
    }
    if (empresaTelefono) { doc.text(empresaTelefono, 198, topY, { align: 'right' }); topY += 3.5; }
    if (empresaEmail) { doc.text(empresaEmail, 198, topY, { align: 'right' }); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESTADO DE CUENTA', 105, 48, { align: 'center' });


    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, 54, 186, 36, 2, 2, 'S');

    const direccionReal = fichaCliente?.primary_address || fichaCliente?.data?.primary_address || "";
    const telefonoReal = (fichaCliente?.phones && fichaCliente.phones[0]) || fichaCliente?.data?.phones?.[0] || fichaCliente?.tax_phone || "";
    const correoReal = (fichaCliente?.emails && fichaCliente.emails[0]) || fichaCliente?.data?.emails?.[0] || fichaCliente?.tax_email || "";
    const provinciaReal = fichaCliente?.province || fichaCliente?.data?.province || "";
    const ciudadReal = fichaCliente?.canton || fichaCliente?.data?.canton || ""; 
    const observacionesReal = fichaCliente?.notes || fichaCliente?.data?.notes || "";
    const distritoReal = fichaCliente?.district_address || fichaCliente?.data?.district_address || "";

    doc.setFontSize(8.5);

    doc.setFont('helvetica', 'bold'); doc.text('Cliente :', 15, 59);
    doc.setFont('helvetica', 'normal'); doc.text((clienteNombre || "").toUpperCase(), 35, 59);
    doc.setFont('helvetica', 'bold'); doc.text('Identificación :', 128, 59);
    doc.setFont('helvetica', 'normal'); doc.text(clienteCedula || "", 155, 59);

    doc.setFont('helvetica', 'bold'); doc.text('Dirección :', 15, 64);
    doc.setFont('helvetica', 'normal'); 
    const dirCortada = doc.splitTextToSize(String(direccionReal).toUpperCase(), 90);
    doc.text(dirCortada[0] || "", 35, 64);
    doc.setFont('helvetica', 'bold'); doc.text('Móvil :', 128, 64);
    doc.setFont('helvetica', 'normal'); doc.text(String(telefonoReal), 155, 64);

    doc.setFont('helvetica', 'bold'); doc.text('Distrito :', 15, 69);
    doc.setFont('helvetica', 'normal');
    const distCortado = doc.splitTextToSize(String(distritoReal).toUpperCase(), 160);
    doc.text(distCortado[0] || "", 35, 69);

    doc.setFont('helvetica', 'bold'); doc.text('Provincia :', 15, 74);
    doc.setFont('helvetica', 'normal'); doc.text(String(provinciaReal).toUpperCase(), 35, 74);
    doc.setFont('helvetica', 'bold'); doc.text('Ciudad :', 75, 74);
    doc.setFont('helvetica', 'normal'); doc.text(String(ciudadReal).toUpperCase(), 92, 74);

    doc.setFont('helvetica', 'bold'); doc.text('Correo :', 15, 79);
    doc.setFont('helvetica', 'normal'); doc.text(String(correoReal).toLowerCase(), 35, 79);

    doc.setFont('helvetica', 'bold'); doc.text('Obs. :', 15, 84);
    doc.setFont('helvetica', 'normal'); doc.text(String(observacionesReal).toUpperCase(), 35, 84);

    let currentY = 98;
    let acumuladoTotal = 0;
    let acumuladoSaldo = 0;
    let acumuladoCredito = 0;

    for (const [index, item] of movimientos.entries()) {
      
      if (currentY > 235) {
        doc.addPage();
        currentY = 15;
      }

      let numComprobante = "";
      if (item.sales_note?.sales_note_number) {
        numComprobante = item.sales_note.sales_note_number;
      } else if (item.invoice?.invoice_number) {
        numComprobante = item.invoice.invoice_number;
      } else if (item.invoice_number) {
        numComprobante = item.invoice_number;
      } else {
        numComprobante = String(index + 13).padStart(9, '0');
      }

      numComprobante = numComprobante.replace(/^FAC-|^NV-/i, '');

      const idDocInvoice = item.invoice_id || item.invoice?.id;
      const idDocSalesNote = item.sales_note_id || item.sales_note?.id;
      
      const urlEspecífica = idDocInvoice 
        ? `https://grupoaraujos.cloud/api/v1/receivables/invoices/${idDocInvoice}/installments`
        : `https://grupoaraujos.cloud/api/v1/receivables/sales-notes/${idDocSalesNote}/installments`;

      let listaCuotasReales: any[] = [];
      try {
        const resCuotasIndividual = await fetch(urlEspecífica, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-company-id": "1"
          }
        });
        if (resCuotasIndividual.ok) {
          const bodyInt = await resCuotasIndividual.json();
          listaCuotasReales = bodyInt.data || bodyInt.items || (Array.isArray(bodyInt) ? bodyInt : []);
        }
      } catch (err) {
      }

      let detalleFacturaReal: any = null;
      if (idDocInvoice && token) {
        detalleFacturaReal = await obtenerDetalleFacturaAPI(idDocInvoice, token);
      }

      const catRealItem = 
        detalleFacturaReal?.client?.group?.name || 
        detalleFacturaReal?.category?.name;
      
      const bancoRealObj = detalleFacturaReal?.client_bank_account || item.client_bank_account;
      let textoBanco = "";

      if (bancoRealObj) {
        const nombreBanco = bancoRealObj.bank_name || bancoRealObj.interbank_name || "BANCO PACÍFICO";
        const tipoCuenta = bancoRealObj.account_type || "INTERBANCARIO";
        const numCuenta = bancoRealObj.account_number || "270101017729";
        textoBanco = `BANCO: ${nombreBanco} - ${tipoCuenta} - ${numCuenta}`;
      } else {
        textoBanco = "BANCO: BANCO PACÍFICO - INTERBANCARIO - 270101017729";
      }

      const nombreVendedor = detalleFacturaReal?.seller_name || item.sales_note?.seller_name || item.invoice?.seller_name || "";
      const fEmision = detalleFacturaReal?.issue_date || item.date_issue || "";
      const valTotal = Number(detalleFacturaReal?.total_amount || item.total_amount || 0);
      const valSaldo = Number(item.total_balance || 0);
      const valCredito = Number(item.paid_amount || 0);

      acumuladoTotal += valTotal;
      acumuladoSaldo += valSaldo;
      acumuladoCredito += valCredito;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 90, 240); 
      doc.text(`CATEGORÍA: ${catRealItem.toUpperCase()}`, 12, currentY);
      
      const anchoCategoria = doc.getTextWidth(`CATEGORÍA: ${catRealItem.toUpperCase()}`);
      const coordenadaBancoX = 12 + anchoCategoria + 8; 
      
      if (textoBanco) {
        doc.text(textoBanco.toUpperCase(), coordenadaBancoX, currentY); 
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`# Documento : ${numComprobante}`, 12, currentY + 5);
      doc.text(`Fecha Emisión : ${fEmision}`, 95, currentY + 5);
      if (nombreVendedor) doc.text(`Vendedor : ${nombreVendedor.toUpperCase()}`, 145, currentY + 5);

      const encabezadoTabla = [['Referencia', 'Cuota', 'Fch. Vence', 'Concepto', 'Debito', 'Credito', 'Saldo']];
      let filasTabla: any[] = [];

      if (listaCuotasReales.length > 0) {
        listaCuotasReales.forEach((cuota: any, cIdx: number) => {
          const nCuota = cuota.installment_number || cuota.number || (cIdx + 1);
          const fVenceCuota = cuota.date_due || cuota.due_date || "";
          
          const mTotalCuota = Number(cuota.total_amount || cuota.amount || 0);
          const sSaldoCuota = Number(cuota.balance || cuota.total_balance || 0);
          const cAbonoCuota = mTotalCuota - sSaldoCuota;
          
          const fPagoCuota = cuota.updated_at ? cuota.updated_at.split('T')[0] : (cuota.payment_date || fVenceCuota);
          const nombreLimpioBanco = (bancoRealObj?.bank_name || "PACIFICO").replace("BANCO", "").trim();
          const fraccionCuotas = `${nCuota}/${listaCuotasReales.length}`;
          filasTabla.push([
            `${numComprobante} ${fraccionCuotas}`,
            nCuota.toString(),
            fVenceCuota,
            `CUOTA ${fraccionCuotas}`,
            mTotalCuota.toFixed(2),
            "", 
            mTotalCuota.toFixed(2)
          ]);
          if (cAbonoCuota > 0) {
            filasTabla.push([
              "", 
              "",
              fPagoCuota,
              `COBROS INTERBANCARIO ${nombreLimpioBanco.toUpperCase()} ${fPagoCuota}`, 
              "", 
              `-${cAbonoCuota.toFixed(2)}`, 
              sSaldoCuota.toFixed(2)
            ]);
          }
        });
      } else {
        filasTabla.push([
          numComprobante,
          `${item.pending_installments || 1}/${item.total_installments || 1}`,
          item.date_due || "", 
          'CUOTA ÚNICA',
          valTotal.toFixed(2),
          valCredito > 0 ? `-${valCredito.toFixed(2)}` : "",
          valSaldo.toFixed(2)
        ]);
      }

      autoTable(doc, {
        startY: currentY + 7,
        head: encabezadoTabla,
        body: filasTabla,
        theme: 'plain',
        headStyles: { textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { textColor: [60, 60, 60], fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5 } },
        columnStyles: {
          0: { cellWidth: 42 }, 1: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 24, halign: 'center' }, 
          3: { cellWidth: 54 }, 4: { cellWidth: 18, halign: 'right' }, 5: { cellWidth: 18, halign: 'right' }, 
          6: { cellWidth: 22, halign: 'right' }  
        },
        margin: { left: 12, right: 12 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const esFilaDeCobro = data.row.cells[5].text[0]?.includes('-');
            if (esFilaDeCobro) {
              data.cell.styles.textColor = [0, 90, 240]; 
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'head') {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (currentY > 255) { doc.addPage(); currentY = 15; }
  
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(12, currentY, 198, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text('SUBTOTAL :', 110, currentY + 5.5);
    doc.text(acumuladoTotal.toFixed(2), 146, currentY + 5.5, { align: 'right' });
    doc.text(acumuladoCredito.toFixed(2), 170, currentY + 5.5, { align: 'right' });
    doc.setTextColor(220, 38, 38); doc.text(acumuladoSaldo.toFixed(2), 196, currentY + 5.5, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.text('TOTALES :', 110, currentY + 10.5);
    doc.text(acumuladoTotal.toFixed(2), 146, currentY + 10.5, { align: 'right' });
    doc.text(acumuladoCredito.toFixed(2), 170, currentY + 10.5, { align: 'right' });
    doc.setTextColor(220, 38, 38); doc.text(acumuladoSaldo.toFixed(2), 196, currentY + 10.5, { align: 'right' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
    const ahora = new Date().toLocaleString('es-EC', { hour12: true });
    doc.text(`Generado automáticamente en tiempo real el ${ahora} por DITCASH`, 12, currentY + 19);

    doc.save(`estado_cuenta_${clienteCedula || 'cliente'}.pdf`);
    setProcesando(false);
  };

  return (
    <button 
      onClick={generarPDF} 
      disabled={procesando}
      className="bg-white border border-slate-200 text-[#001F3F] text-[10px] font-black px-4 py-1.5 rounded-full uppercase shadow-sm hover:bg-[#001F3F] hover:text-white hover:border-[#001F3F] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
    >
      {procesando ? 'Procesando Datos de Empresa...' : 'Descargar PDF'}
    </button>
  );
}