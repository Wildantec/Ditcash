'use client'
import { useParams, useRouter } from 'next/navigation'

export default function EstadoCuenta() {
  const { cedula } = useParams()
  const router = useRouter()

  // Simulación de datos (Dato quemado para la prueba)
  const contratos = [
    { id: "CON-9982", producto: "Crédito Directo", saldo: 450.00, cuotasVencidas: 2 },
    { id: "CON-4410", producto: "Financiamiento Equipos", saldo: 120.50, cuotasVencidas: 0 },
  ];

  const totalAPagar = contratos.reduce((acc, c) => acc + c.saldo, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* NAVBAR PROFESIONAL CON BOTÓN DE SALIDA */}
      <nav className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#001F3F] rounded-lg flex items-center justify-center text-white font-bold text-xs">
            D
          </div>
          <span className="font-bold text-[#001F3F] tracking-tighter text-xl">CLIENTESAPP</span>
        </div>
        
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold text-sm transition-all group"
        >
          <span className="bg-slate-50 group-hover:bg-red-50 p-2 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          Salir de la consulta
        </button>
      </nav>

      <main className="flex-grow p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* HEADER DE BIENVENIDA */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <p className="text-[#D4AF37] font-bold text-xs uppercase tracking-[0.2em] mb-2">Estado de Cuenta Individual</p>
              <h1 className="text-2xl font-bold text-[#001F3F]">Resumen de Pagos</h1>
              <p className="text-slate-500 font-medium">Cédula: <span className="text-[#001F3F] font-bold">{cedula}</span></p>
            </div>
            
            {/* CARD DE TOTAL */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-[#D4AF37] text-right min-w-[220px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pendiente</p>
              <p className="text-3xl font-bold text-[#001F3F]">${totalAPagar.toFixed(2)}</p>
            </div>
          </div>

          {/* TABLA CON ESTILO ANTERIOR (Encabezado Azul) */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#001F3F] text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6">N° Contrato</th>
                  <th className="px-8 py-6">Producto / Servicio</th>
                  <th className="px-8 py-6">Cuotas Vencidas</th>
                  <th className="px-8 py-6 text-right">Saldo a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contratos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-[#001F3F]">{c.id}</td>
                    <td className="px-8 py-6 text-slate-500 font-medium">{c.producto}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase ${c.cuotasVencidas > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {c.cuotasVencidas > 0 ? `${c.cuotasVencidas} Mora` : 'Al Día'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-[#001F3F] text-lg">
                      ${c.saldo.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER INFORMATIVO */}
          <div className="p-6 bg-[#001F3F] rounded-3xl text-center">
            <p className="text-white text-sm font-medium">
              Realiza tus pagos mediante transferencia bancaria o en nuestras agencias autorizadas.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center border-t border-slate-100">
        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">DITCASH 2026</p>
      </footer>
    </div>
  )
}