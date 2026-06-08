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
  account_type?: string;
  account_number?: string;
  bank_interbank_id?: string;
}

interface EmpresaReal {
  id?: number;
  name?: string;
  slug?: string;
  ruc?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_path?: string;
}

interface Movimiento {
  sales_note_id?: number;
  invoice_id?: number;
  date_issue?: string;
  date_due?: string;
  total_amount?: string | number;
  total_balance?: string | number;
  pending_installments?: number;
  total_installments?: number;
  paid_amount?: string | number;
  currency?: string;
  sales_note?: any;
  invoice?: any;
  category_id?: number;
  category?: CategoriaReal; 
  client_bank_account?: BancoClienteReal; 
}

interface BotonImprimirProps {
  clienteNombre: string;
  clienteCedula: string;
  movimientos: Movimiento[];
  fichaCliente: any;   
  empresaCliente: { data?: EmpresaReal } & EmpresaReal | any; 
}

export default function BotonImprimir({ clienteNombre, clienteCedula, movimientos, fichaCliente, empresaCliente }: BotonImprimirProps) {
  const [procesando, setProcesando] = useState(false);

  const obtenerLogoBase64 = (pathOrUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!pathOrUrl || pathOrUrl === 'string') return resolve('');
      
      let urlCompleta = pathOrUrl;
      if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
        urlCompleta = `https://grupoaraujos.cloud${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous'; 
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        console.warn("No se pudo cargar el logo corporativo desde:", urlCompleta);
        resolve(''); 
      };
      img.src = urlCompleta;
    });
  };

  const consultarCuotasAPI = async (invoiceId?: number, salesNoteId?: number) => {
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
      if (!tokenResponse.ok) return [];
      const tokenData = await tokenResponse.json();
      const token = tokenData.data?.access_token || tokenData.access_token;

      const url = invoiceId 
        ? `${API_BASE}/receivables/invoices/${invoiceId}/installments`
        : `${API_BASE}/receivables/sales-notes/${salesNoteId}/installments`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1",
          "User-Agent": "Mozilla/5.0"
        }
      });

      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json.items || (Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Error trayendo cuotas para PDF:", err);
      return [];
    }
  };

  const generarPDF = async () => {
    setProcesando(true);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. DATOS DE LA EMPRESA REAL (DESENVOLVIENDO LA RAÍZ O .DATA)
    const empData = empresaCliente?.data ? empresaCliente.data : empresaCliente;

    const empresaNombre = empData?.name && empData.name !== 'string' ? empData.name : "";
    
    // Tratamiento dinámico del RUC para no duplicar etiquetas si ya viene formateado
    let empresaRuc = empData?.ruc && empData.ruc !== 'string' ? empData.ruc : "";
    if (empresaRuc && !empresaRuc.toUpperCase().startsWith("R.U.C")) {
      empresaRuc = `R.U.C: ${empresaRuc}`;
    }

    const empresaDireccion = empData?.address && empData.address !== 'string' ? empData.address : "";
    const empresaTelefono = empData?.phone && empData.phone !== 'string' ? empData.phone : "";
    const empresaEmail = empData?.email && empData.email !== "user@example.com" ? empData.email : "";
    const rutaLogo = empData?.logo_path && empData.logo_path !== 'string' ? empData.logo_path : null;

    let inicioTextoX = 12; 
    if (rutaLogo) {
      const logo64 = await obtenerLogoBase64(rutaLogo);
      if (logo64) {
        doc.addImage(logo64, 'PNG', 12, 10, 30, 15); 
        inicioTextoX = 45; 
      }
    }

    // Dibujado del nombre corporativo y RUC de la API
    if (empresaNombre) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0); 
      doc.text(empresaNombre.toUpperCase(), inicioTextoX, 15);
    }
    
    if (empresaRuc) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(empresaRuc, 12, 29); 
    }

    // Datos de contacto de la Empresa (Superior Derecha)
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

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESTADO DE CUENTA', 105, 43, { align: 'center' });

    //  2. RECUADRO DEL CLIENTE DINÁMICO (Sin datos estáticos)
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, 49, 186, 36, 2, 2, 'S');

    const direccionReal = fichaCliente?.primary_address || fichaCliente?.data?.primary_address || "";
    const telefonoReal = (fichaCliente?.phones && fichaCliente.phones[0]) || fichaCliente?.data?.phones?.[0] || fichaCliente?.tax_phone || "";
    const correoReal = (fichaCliente?.emails && fichaCliente.emails[0]) || fichaCliente?.data?.emails?.[0] || fichaCliente?.tax_email || "";
    const provinciaReal = fichaCliente?.province || fichaCliente?.data?.province || "";
    const ciudadReal = fichaCliente?.canton || fichaCliente?.data?.canton || ""; 
    const observacionesReal = fichaCliente?.notes || fichaCliente?.data?.notes || "";
    const distritoReal = fichaCliente?.district_address || fichaCliente?.data?.district_address || "";

    doc.setFontSize(8.5);

    // Fila 1: Cliente e Identificación
    doc.setFont('helvetica', 'bold'); doc.text('Cliente :', 15, 54);
    doc.setFont('helvetica', 'normal'); doc.text((clienteNombre || "").toUpperCase(), 35, 54);
    doc.setFont('helvetica', 'bold'); doc.text('Identificación :', 128, 54);
    doc.setFont('helvetica', 'normal'); doc.text(clienteCedula || "", 155, 54);

    // Fila 2: Dirección y Móvil
    doc.setFont('helvetica', 'bold'); doc.text('Dirección :', 15, 59);
    doc.setFont('helvetica', 'normal'); 
    const dirCortada = doc.splitTextToSize(String(direccionReal).toUpperCase(), 90);
    doc.text(dirCortada[0] || "", 35, 59);
    doc.setFont('helvetica', 'bold'); doc.text('Móvil :', 128, 59);
    doc.setFont('helvetica', 'normal'); doc.text(String(telefonoReal), 155, 59);

    // Fila 3: Distrito
    doc.setFont('helvetica', 'bold'); doc.text('Distrito :', 15, 64);
    doc.setFont('helvetica', 'normal');
    const distCortado = doc.splitTextToSize(String(distritoReal).toUpperCase(), 160);
    doc.text(distCortado[0] || "", 35, 64);

    // Fila 4: Provincia y Ciudad
    doc.setFont('helvetica', 'bold'); doc.text('Provincia :', 15, 69);
    doc.setFont('helvetica', 'normal'); doc.text(String(provinciaReal).toUpperCase(), 35, 69);
    doc.setFont('helvetica', 'bold'); doc.text('Ciudad :', 75, 69);
    doc.setFont('helvetica', 'normal'); doc.text(String(ciudadReal).toUpperCase(), 92, 69);

    // Fila 5: Correo
    doc.setFont('helvetica', 'bold'); doc.text('Correo :', 15, 74);
    doc.setFont('helvetica', 'normal'); doc.text(String(correoReal).toLowerCase(), 35, 74);

    // Fila 6: Observaciones
    doc.setFont('helvetica', 'bold'); doc.text('Obs. :', 15, 79);
    doc.setFont('helvetica', 'normal'); doc.text(String(observacionesReal).toUpperCase(), 35, 79);


    //  3. SECCIÓN DE DOCUMENTOS REALES
    let currentY = 93;
    let acumuladoTotal = 0;
    let acumuladoSaldo = 0;
    let acumuladoCredito = 0;

    for (const [index, item] of movimientos.entries()) {
      
      if (currentY > 235) {
        doc.addPage();
        currentY = 15;
      }

      // Recomponer prefijo del documento dinámicamente si no viene en el string original
      let numComprobante = "";
      let prefijo = "FAC-";
      if (item.sales_note?.sales_note_number) {
        numComprobante = item.sales_note.sales_note_number;
        prefijo = "NV-";
      } else if (item.invoice?.invoice_number) {
        numComprobante = item.invoice.invoice_number;
        prefijo = "FAC-";
      } else {
        numComprobante = String(index + 13).padStart(9, '0');
      }

      if (!numComprobante.startsWith("FAC-") && !numComprobante.startsWith("NV-")) {
        numComprobante = `${prefijo}${numComprobante}`;
      }

      // Nombre del vendedor real de la API
      const nombreVendedor = item.sales_note?.seller_name || item.invoice?.seller_name || `VENTAS ${empresaNombre.toUpperCase()}`;
      
      // Categoría Dinámica Real
      const catRealItem = item.category?.name || item.invoice?.category?.name || item.sales_note?.category?.name || fichaCliente?.category?.name || "GENERAL";
      
      // Banco Dinámico Real (Asociado a la cuenta bancaria del cliente)
      const bancoData = item.client_bank_account || item.invoice?.client_bank_account || item.sales_note?.client_bank_account;
      let textoBanco = "";
      if (bancoData?.bank_name) {
        textoBanco = `BANCO: ${bancoData.bank_name} - ${bancoData.account_type || ''} - ${bancoData.account_number || ''}`;
      }

      const fEmision = item.date_issue || "";
      const valTotal = Number(item.total_amount || 0);
      const valSaldo = Number(item.total_balance || 0);
      const valCredito = Number(item.paid_amount || 0);

      acumuladoTotal += valTotal;
      acumuladoSaldo += valSaldo;
      acumuladoCredito += valCredito;

      // Imprimir Categoría y Banco reales lado a lado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 90, 180);
      doc.text(`CATEGORÍA: ${catRealItem.toUpperCase()}`, 12, currentY);
      
      if (textoBanco) {
        doc.setFont('helvetica', 'normal');
        doc.text(textoBanco.toUpperCase(), 60, currentY); // Desplazado al lado de Categoría
      }
      
      // Metadatos de Factura
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`# Documento : ${numComprobante}`, 12, currentY + 5);
      doc.text(`Fecha Emisión : ${fEmision}`, 95, currentY + 5);
      doc.text(`Vendedor : ${nombreVendedor.toUpperCase()}`, 145, currentY + 5);

      const encabezadoTabla = [['Referencia', 'Cuota', 'Fch. Vence', 'Concepto', 'Debito', 'Credito', 'Saldo']];
      
      const idDocInvoice = item.invoice_id || item.invoice?.id;
      const idDocSalesNote = item.sales_note_id || item.sales_note?.id;
      
      const listaCuotasReales = await consultarCuotasAPI(idDocInvoice, idDocSalesNote);
      let filasTabla: any[] = [];

      if (listaCuotasReales.length > 0) {
        listaCuotasReales.forEach((cuota: any, cIdx: number) => {
          const nCuota = cuota.installment_number || cuota.number || (cIdx + 1);
          const fVenceCuota = cuota.date_due || cuota.due_date || "";
          const mTotalCuota = Number(cuota.total_amount || cuota.amount || 0);
          const sSaldoCuota = Number(cuota.balance || cuota.total_balance || 0);
          const cAbonoCuota = mTotalCuota - sSaldoCuota;

          filasTabla.push([
            numComprobante,
            nCuota.toString(),
            fVenceCuota,
            `CUOTA ${nCuota}/${listaCuotasReales.length}`,
            mTotalCuota.toFixed(2),
            cAbonoCuota.toFixed(2),
            sSaldoCuota.toFixed(2)
          ]);
        });
      } else {
        filasTabla.push([
          numComprobante,
          `${item.pending_installments || 1}/${item.total_installments || 1}`,
          item.date_due || "", 
          'CUOTA ÚNICA',
          valTotal.toFixed(2),
          valCredito.toFixed(2),
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
          3: { cellWidth: 32 }, 4: { cellWidth: 24, halign: 'right' }, 5: { cellWidth: 24, halign: 'right' }, 
          6: { cellWidth: 26, halign: 'right' }  
        },
        margin: { left: 12, right: 12 },
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

    // 4. SECCIÓN DE TOTALES CALCULADA
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
      {procesando ? 'Procesando Cuotas...' : 'Descargar PDF'}
    </button>
  );
}