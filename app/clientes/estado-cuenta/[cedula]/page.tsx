import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { consultarClienteExterno } from '@/lib/grupoAraujos';
import BotonImprimir from '../../../components/BotonImprimir'; 
// 🎯 Importamos nuestro nuevo desglosador dinámico por demanda
import DetalleCuotas from '@/app/components/DetalleCuotas';

export const dynamic = 'force-dynamic'; 

interface PageProps {
  params: Promise<{
    cedula: string;
  }>;
}

async function obtenerDatosContablescompletos(clienteIdContable: string) {
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
    
    if (!tokenResponse.ok) return null;
    const tokenData = await tokenResponse.json();
    const token = tokenData.data?.access_token || tokenData.access_token;

    const urlMovs = `${API_BASE}/receivables/client-account-statement?client_id=${clienteIdContable}`;
    const resMovs = await fetch(urlMovs, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    const urlCliente = `${API_BASE}/clients/${clienteIdContable}`;
    const resCliente = await fetch(urlCliente, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    const urlEmpresa = `${API_BASE}/companies/me`;
    const resEmpresa = await fetch(urlEmpresa, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    const datosMovs = resMovs.ok ? await resMovs.json() : null;
    const datosFicha = resCliente.ok ? await resCliente.json() : null;
    const datosEmpresa = resEmpresa.ok ? await resEmpresa.json() : null;

    return {
      token: token, // 🎯 Pasamos el token hacia el componente para reusarlo abajo
      movimientos: datosMovs?.data || datosMovs?.items || (Array.isArray(datosMovs) ? datosMovs : []),
      fichaCliente: datosFicha?.data || datosFicha || null,
      datosEmpresa: datosEmpresa?.data || datosEmpresa || null
    };
  } catch (error) {
    console.error("Error al obtener datos contables completos:", error);
    return null;
  }
}

export default async function EstadoCuentaPage({ params }: PageProps) {
  const { cedula } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) redirect('/');

  const infoCliente = await consultarClienteExterno(cedula).catch(() => null);
  const nombreAMostrar = infoCliente?.nombre || "CLIENTE REGISTRADO";

  let listaMovimientos: any[] = [];
  let fichaClienteReal: any = null;
  let datosEmpresaReal: any = null;
  let tokenSeguridad = "";

  if (infoCliente?.idInterno) {
    const todoElPaquete = await obtenerDatosContablescompletos(infoCliente.idInterno.toString());
    if (todoElPaquete) {
      tokenSeguridad = todoElPaquete.token;
      listaMovimientos = todoElPaquete.movimientos;
      fichaClienteReal = todoElPaquete.fichaCliente;
      datosEmpresaReal = todoElPaquete.datosEmpresa;
    }
  }

  const totalFacturadoGeneral = listaMovimientos.reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
  const totalSaldoGeneral = listaMovimientos.reduce((acc, item) => acc + Number(item.total_balance || 0), 0);

  const tieneDeudasVencidas = listaMovimientos.some(
    (item) => (item.days_overdue || 0) > 0 || (item.overdue_installments || 0) > 0
  );

  const totalAbonadoReal = listaMovimientos.reduce((acc, item) => acc + Number(item.paid_amount || 0), 0);
  const saldoPuntosVisual = tieneDeudasVencidas ? 0 : Math.floor(totalAbonadoReal / 10) + 50;

  return (
    <div className="max-w-6xl w-full mx-auto p-4 md:p-10 pt-28 md:pt-32 space-y-8 flex-grow">
      
      {/* CABECERA */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800] opacity-5 rounded-full -mr-10 -mt-10" />
        <h1 className="text-3xl font-black uppercase italic leading-none">
          Estado de <span className="text-[#FFB800]">Cuenta</span>
        </h1>
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
            <p className="text-sm font-bold">{nombreAMostrar}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación</p>
            <p className="text-sm font-bold">{cedula}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN VISUAL DE PREMIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#001F3F] to-[#002B55] p-6 rounded-[2.5rem] shadow-[0_15px_30px_rgba(0,31,63,0.06)] text-white border border-white/10 relative overflow-hidden flex flex-col justify-between min-h-[145px]">
          <div className="absolute -right-4 -bottom-6 text-8xl opacity-10 font-black select-none">🏆</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]">Puntos Club DITEC</p>
            <p className="text-4xl font-black mt-1.5 text-[#FFB800]">
              {saldoPuntosVisual} <span className="text-xs text-white/70 font-bold uppercase tracking-wider">Pts</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
            {tieneDeudasVencidas 
              ? "Saldar valores pendientes reactiva la acumulación de puntos." 
              : "¡Buen trabajo! Siga pagando a tiempo para acumular más beneficios."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[145px]">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comportamiento de Pago</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`w-2.5 h-2.5 rounded-full ${tieneDeudasVencidas ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
              <p className={`text-base font-black uppercase tracking-tight ${tieneDeudasVencidas ? 'text-red-600' : 'text-[#001F3F]'}`}>
                {tieneDeudasVencidas ? 'Registra Valores en Mora' : 'Cliente Excelente'}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {tieneDeudasVencidas 
              ? "El estado de cuenta cuenta con recargos temporales de días." 
              : "Estatus óptimo. Habilitado para solicitar mayor financiamiento en productos."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[145px]">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Obsequio Elegible</p>
            <p className="text-sm font-black text-slate-700 mt-2.5 flex items-center gap-2">
              <span>🎁</span> {saldoPuntosVisual >= 200 ? "Kit Tecnológico VIP" : "Auriculares Inalámbricos"}
            </p>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${tieneDeudasVencidas ? 'bg-slate-300' : 'bg-[#FFB800]'}`} 
                style={{ width: `${Math.min((saldoPuntosVisual / 200) * 100, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
              <span>Progreso de Canje</span>
              <span>Meta: 200 Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA PRINCIPAL */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,31,63,0.04)] border border-white overflow-hidden">
        
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h2 className="font-black uppercase text-sm tracking-tighter">Valores Pendientes</h2>
          <div className="flex items-center gap-3">
            <BotonImprimir 
              clienteNombre={nombreAMostrar} 
              clienteCedula={cedula} 
              movimientos={listaMovimientos}
              fichaCliente={fichaClienteReal}
              empresaCliente={datosEmpresaReal}
            />
            <span className="bg-[#001F3F] text-[#FFB800] text-[9px] font-black px-3 py-1 rounded-full uppercase">Sincronizado</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="w-full min-w-[750px]">
            <div className="bg-slate-50/50 flex items-center px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <div className="w-[35%]">Comprobante</div>
              <div className="w-[12%] text-center">Cuotas Pend.</div>
              <div className="w-[16%] text-center">Fecha Emisión</div>
              <div className="w-[16%] text-center">Fecha Vencimiento</div>
              <div className="w-[13%] text-right">Monto Total</div>
              <div className="w-[13%] text-right">Saldo</div>
              <div className="w-[5%] text-center"></div>
            </div>

            <div className="divide-y divide-slate-100">
              {listaMovimientos.length > 0 ? (
                listaMovimientos.map((item: any, index: number) => {
                  let numeroComprobante = "";
                  
                  if (item.sales_note?.sales_note_number) {
                    numeroComprobante = item.sales_note.sales_note_number;
                  } else if (item.invoice?.invoice_number) {
                    numeroComprobante = item.invoice.invoice_number;
                  } else {
                    numeroComprobante = `001-001-${String(index + 13).padStart(9, '0')}`;
                  }
                  
                  const montoTotal = Number(item.total_amount || 0);
                  const saldoPendiente = Number(item.total_balance || 0);
                  const cuotasVisual = `${item.pending_installments || 0}/${item.total_installments || 1}`;
                  const itemKey = item.sales_note_id || item.invoice_id || index;

                  const fechaEmision = item.date_issue || "N/A";
                  const fechaVencimiento = item.date_due || "N/A";

                  return (
                    <details key={itemKey} className="group open:bg-slate-50/40 transition-all duration-300">
                      <summary className="flex items-center px-10 py-5 list-none cursor-pointer hover:bg-slate-50/80 transition-colors">
                        <div className="w-[35%] text-sm font-black text-[#001F3F] group-open:text-[#FFB800] transition-colors">
                          {numeroComprobante}
                        </div>
                        <div className="w-[12%] text-sm font-bold text-center text-slate-500">
                          {cuotasVisual}
                        </div>
                        <div className="w-[16%] text-sm font-bold text-center text-slate-500">{fechaEmision}</div>
                        <div className="w-[16%] text-sm font-bold text-center text-slate-500">{fechaVencimiento}</div>
                        <div className="w-[13%] text-sm font-bold text-slate-600 text-right">
                          ${montoTotal.toFixed(2)}
                        </div>
                        <div className="w-[13%] text-sm font-black text-right text-red-600">
                          <span className="bg-red-50 px-3 py-1 rounded-lg border border-red-100/50">
                            ${saldoPendiente.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-[5%] text-center font-black text-slate-300 group-open:text-[#001F3F] group-open:rotate-180 transition-transform duration-300">
                          ▼
                        </div>
                      </summary>

                      {/* 🎯 REEMPLAZO LOGRADO: Ahora llamamos al cargador dinámico con los IDs correspondientes */}
                      <DetalleCuotas 
                        invoiceId={item.invoice_id || item.invoice?.id}
                        salesNoteId={item.sales_note_id || item.sales_note?.id}
                        token={tokenSeguridad}
                        montoTotalDoc={montoTotal}
                      />
                    </details>
                  );
                })
              ) : (
                <div className="p-20 text-center">
                  <span className="text-3xl text-slate-200 block mb-2">📂</span>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
                    No se registran transacciones pendientes de pago.
                  </p>
                </div>
              )}
            </div>

            {/* TOTALES */}
            <div className="bg-slate-50/30 p-6 border-t border-slate-100 flex flex-col items-end space-y-1 pr-24">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Total Facturado:</span>
                <span className="font-black text-[#001F3F] text-base">${totalFacturadoGeneral.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Saldo Pendiente:</span>
                <span className="font-black text-red-600 text-lg">${totalSaldoGeneral.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-6">DITEC - Gestión de Clientes</p>
    </div>
  );
}