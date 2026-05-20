'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

interface BotonImprimirProps {
  clienteNombre: string;
  clienteCedula: string;
  movimientos: Movimiento[];
  fichaCliente: any;   // Viene de /api/v1/clients/{id}
  empresaCliente: any; // Viene de /api/v1/companies/me
}

export default function BotonImprimir({ clienteNombre, clienteCedula, movimientos, fichaCliente, empresaCliente }: BotonImprimirProps) {
  
  const generarPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 🏢 EXTRACCIÓN DINÁMICA REAL DE LA EMPRESA (Didargal)
    const empresaNombre = empresaCliente?.name || "DITEC";
    const empresaRuc = empresaCliente?.ruc ? `R.U.C: ${empresaCliente.ruc}` : "";
    const empresaDireccion = empresaCliente?.address || "";
    const empresaTelefono = empresaCliente?.phone || "";
    const empresaEmail = empresaCliente?.email && empresaCliente.email !== "user@example.com" ? empresaCliente.email : "";

    // 1. MEMBRETADO SUPERIOR DE LA EMPRESA (Alineación Derecha e Izquierda exacta)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    if (empresaDireccion) doc.text(empresaDireccion, 200, 10, { align: 'right' });
    if (empresaTelefono) doc.text(empresaTelefono, 200, 13.5, { align: 'right' });
    if (empresaEmail) doc.text(empresaEmail, 200, 17, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 60, 120); 
    doc.text(empresaNombre.toUpperCase(), 12, 14);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    if (empresaRuc) doc.text(empresaRuc, 12, 22);

    doc.setFontSize(13);
    doc.text('ESTADO DE CUENTA', 105, 31, { align: 'center' });

    // 2. CUADRO DE DATOS DEL CLIENTE (Sincronizado con arreglos de la API de Clientes)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, 36, 186, 32, 3, 3, 'S');

    // Desglosar arreglos primarios del JSON del cliente
    const direccionReal = fichaCliente?.primary_address || (fichaCliente?.addresses && fichaCliente.addresses[0]) || "N/A";
    const telefonoReal = (fichaCliente?.phones && fichaCliente.phones[0]) || fichaCliente?.tax_phone || "N/A";
    const correoReal = (fichaCliente?.emails && fichaCliente.emails[0]) || fichaCliente?.tax_email || "N/A";
    const provinciaReal = fichaCliente?.province || "N/A";
    const ciudadReal = fichaCliente?.canton || "N/A"; // canton actúa como Ciudad en Ecuador SRI
    const observacionesReal = fichaCliente?.notes && fichaCliente.notes !== "string" ? fichaCliente.notes : "";

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold'); doc.text('Cliente :', 16, 42);
    doc.setFont('helvetica', 'normal'); doc.text(clienteNombre.toUpperCase(), 35, 42);
    doc.setFont('helvetica', 'bold'); doc.text('Identificación :', 125, 42);
    doc.setFont('helvetica', 'normal'); doc.text(clienteCedula, 150, 42);

    doc.setFont('helvetica', 'bold'); doc.text('Dirección :', 16, 47);
    doc.setFont('helvetica', 'normal'); doc.text(String(direccionReal).toUpperCase(), 35, 47);
    doc.setFont('helvetica', 'bold'); doc.text('Móvil :', 125, 47);
    doc.setFont('helvetica', 'normal'); doc.text(String(telefonoReal), 150, 47);

    doc.setFont('helvetica', 'bold'); doc.text('Provincia :', 16, 52);
    doc.setFont('helvetica', 'normal'); doc.text(String(provinciaReal).toUpperCase(), 35, 52);
    doc.setFont('helvetica', 'bold'); doc.text('Ciudad :', 65, 52);
    doc.setFont('helvetica', 'normal'); doc.text(String(ciudadReal).toUpperCase(), 80, 52);

    doc.setFont('helvetica', 'bold'); doc.text('Correo :', 16, 57);
    doc.setFont('helvetica', 'normal'); doc.text(String(correoReal).toLowerCase(), 35, 57);

    doc.setFont('helvetica', 'bold'); doc.text('Obs. :', 16, 62);
    doc.setFont('helvetica', 'normal'); doc.text(observacionesReal, 35, 62);

    // 3. SECCIONES DE DOCUMENTOS EN BUCLE
    let currentY = 74;
    let acumuladoTotal = 0;
    let acumuladoSaldo = 0;
    let acumuladoCredito = 0;

    movimientos.forEach((item, index) => {
      let numComprobante = "";
      if (item.sales_note?.sales_note_number) {
        numComprobante = `NV-${item.sales_note.sales_note_number}`;
      } else if (item.invoice?.invoice_number) {
        numComprobante = `FAC-${item.invoice.invoice_number}`;
      } else {
        numComprobante = `NV-001-001-${String(index + 13).padStart(9, '0')}`;
      }

      const nombreVendedor = item.sales_note?.seller_name || item.invoice?.seller_name || `VENTAS ${empresaNombre.toUpperCase()}`;
      const fEmision = item.date_issue || "N/A";
      const fVencimiento = item.date_due || "N/A";
      
      const valTotal = Number(item.total_amount || 0);
      const valSaldo = Number(item.total_balance || 0);
      const valCredito = Number(item.paid_amount || 0);

      acumuladoTotal += valTotal;
      acumuladoSaldo += valSaldo;
      acumuladoCredito += valCredito;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 100, 220);
      doc.text('CATEGORÍA: N/A', 12, currentY);
      doc.text(`# Documento : ${numComprobante}`, 12, currentY + 4.5);
      doc.text(`Fecha Emisión : ${fEmision}`, 90, currentY + 4.5);
      doc.text(`Vendedor : ${nombreVendedor.toUpperCase()}`, 145, currentY + 4.5);

      const encabezadoTabla = [['Referencia', 'Cuota', 'Fch. Vence', 'Concepto', 'Debito', 'Credito', 'Saldo']];
      const filasTabla = [[
        numComprobante, 
        `${item.pending_installments || 1}/${item.total_installments || 1}`,
        fVencimiento,
        'CUOTA ÚNICA',
        valTotal.toFixed(2),
        valCredito.toFixed(2),
        valSaldo.toFixed(2)
      ]];

      autoTable(doc, {
        startY: currentY + 7,
        head: encabezadoTabla,
        body: filasTabla,
        theme: 'plain',
        headStyles: { textColor: [0, 0, 0], fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0], fontSize: 8.5, cellPadding: { top: 3, bottom: 3 } },
        columnStyles: {
          0: { cellWidth: 45 }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 25, halign: 'center' }, 
          3: { cellWidth: 30 }, 4: { cellWidth: 23, halign: 'right' }, 5: { cellWidth: 23, halign: 'right' }, 
          6: { cellWidth: 25, halign: 'right' }  
        },
        margin: { left: 12, right: 12 },
        didDrawCell: (data) => {
          if (data.section === 'head') {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.4);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    // 4. LÍNEA INFERIOR DE TOTALES FINALES
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(12, currentY, 198, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.text('SUBTOTAL :', 110, currentY + 6);
    doc.text(acumuladoTotal.toFixed(2), 150, currentY + 6, { align: 'right' });
    doc.text(acumuladoCredito.toFixed(2), 173, currentY + 6, { align: 'right' });
    doc.setTextColor(220, 38, 38); doc.text(acumuladoSaldo.toFixed(2), 198, currentY + 6, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.text('TOTALES :', 110, currentY + 11);
    doc.text(acumuladoTotal.toFixed(2), 150, currentY + 11, { align: 'right' });
    doc.text(acumuladoCredito.toFixed(2), 173, currentY + 11, { align: 'right' });
    doc.setTextColor(220, 38, 38); doc.text(acumuladoSaldo.toFixed(2), 198, currentY + 11, { align: 'right' });

    // Pie de Página
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
    const ahora = new Date().toLocaleString('es-EC', { hour12: true });
    doc.text(`Generado automáticamente en tiempo real el ${ahora}`, 12, currentY + 20);

    doc.save(`estado_cuenta_${clienteCedula}.pdf`);
  };

  return (
    <button 
      onClick={generarPDF} 
      className="bg-white border border-slate-200 text-[#001F3F] text-[10px] font-black px-4 py-1.5 rounded-full uppercase shadow-sm hover:bg-[#001F3F] hover:text-white hover:border-[#001F3F] transition-all duration-300 flex items-center gap-2"
    >
      Descargar PDF
    </button>
  );
}