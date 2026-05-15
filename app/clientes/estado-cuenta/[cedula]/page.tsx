'use server' // Asegúrate de tener esto si usas Next.js 14+ o 15

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { consultarClienteExterno } from '@/lib/grupoAraujos';

interface PageProps {
  params: {
    cedula: string;
  };
}

async function obtenerMovimientosContables(cedula: string) {
  try {
    // 1. Obtener Token (Usando las variables de entorno de tu servidor en Quito)
    const tokenResponse = await fetch(`${process.env.API_CONTABLE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL,
        password: process.env.API_CONTABLE_PASSWORD,
      }),
    });
    
    if (!tokenResponse.ok) return null;
    const tokenData = await tokenResponse.json();
    const token = tokenData.data?.access_token || tokenData.access_token;

    // 2. Consultar Receivables
    // IMPORTANTE: Cambiamos ?cedula= por ?client_id= que es el estándar de la API para filtrar
    const url = `${process.env.API_CONTABLE_URL}/api/v1/receivables/client-account-statement?client_id=${cedula}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1", // ID de la empresa actual
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.log(">>> [DEBUG API] Error al traer deudas:", res.status);
      return null;
    }

    const data = await res.json();
    
    // La API de Araujos suele devolver las facturas en un campo llamado 'items' o 'data'
    // Dentro del endpoint 'client-account-statement'
    return data; 
  } catch (error) {
    console.error("Error al obtener movimientos contables:", error);
    return null;
  }
}

export default async function EstadoCuentaPage({ params }: PageProps) {
  // En Next.js 15, params debe ser "awaited"
  const { cedula } = await params;
  
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    redirect('/');
  }

  // Ejecución segura
  const [infoCliente, movimientos] = await Promise.all([
    consultarClienteExterno(cedula).catch(() => null),
    obtenerMovimientosContables(cedula).catch(() => null)
  ]);

  // Si infoCliente es null, evitamos que la página rompa
  const nombreAMostrar = infoCliente?.nombre || "CLIENTE REGISTRADO";

  let listaMovimientos: any[] = [];
if (movimientos) {
  // Si usas el endpoint 'client-account-statement', las facturas suelen venir en .items
  listaMovimientos = movimientos.items || movimientos.data || (Array.isArray(movimientos) ? movimientos : []);
}

  return (
    <div className="min-h-screen bg-[#F4F7FA] p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800] opacity-5 rounded-full -mr-10 -mt-10" />
          <h1 className="text-3xl font-black text-[#001F3F] uppercase italic leading-none">
            Estado de <span className="text-[#FFB800]">Cuenta</span>
          </h1>
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
              {/* Aquí usamos el nombre validado */}
              <p className="text-sm font-bold text-[#001F3F]">{nombreAMostrar}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación</p>
              <p className="text-sm font-bold text-[#001F3F]">{cedula}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,31,63,0.04)] border border-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h2 className="font-black text-[#001F3F] uppercase text-sm tracking-tighter">Valores Pendientes</h2>
            <span className="bg-[#001F3F] text-[#FFB800] text-[9px] font-black px-3 py-1 rounded-full uppercase">Sincronizado</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listaMovimientos.length > 0 ? (
                  listaMovimientos.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.date || item.fecha_emision || "N/A"}</td>
                      <td>{item.document_number || item.numero || "S/N"}</td>
                      <td className="text-right">${Number(item.total || 0).toFixed(2)}</td>
                      <td className="text-right">${Number(item.balance || item.saldo || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest italic">
                      No se registran facturas pendientes de pago.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          DITEC - Gestión de Clientes
        </p>
      </div>
    </div>
  );
}