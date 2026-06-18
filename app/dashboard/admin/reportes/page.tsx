'use client'
import { useState } from 'react'
import Swal from 'sweetalert2'
import { BarChart3, Download, TrendingUp } from 'lucide-react'

interface CampanaReporte {
  id: number;
  nombre: string;
  fechaCierre: string;
  estado: 'Finalizada' | 'Activa';
  vendedores: { nombre: string; totalDinero: number }[];
}

export default function ReportesAdmin() {
  const [campanas] = useState<CampanaReporte[]>([
    {
      id: 1,
      nombre: "Lanzamiento Next.js",
      fechaCierre: "2024-04-01",
      estado: 'Activa',
      vendedores: [
        { nombre: "Ana Martínez", totalDinero: 460 },
        { nombre: "Carlos Pérez", totalDinero: 300 },
        { nombre: "Lucía Fernández", totalDinero: 420 },
      ]
    },
    {
      id: 2,
      nombre: "Navidad 2023",
      fechaCierre: "2023-12-31",
      estado: 'Finalizada',
      vendedores: [
        { nombre: "Roberto Gómez", totalDinero: 360 },
        { nombre: "Ana Martínez", totalDinero: 500 },
      ]
    }
  ]);

  const descargarReporteSimulado = (campana: CampanaReporte) => {
    const ranking = [...campana.vendedores].sort((a, b) => b.totalDinero - a.totalDinero);
    
    const tablaHTML = `
      <div style="overflow-x:auto; margin-top: 15px;">
        <table style="width:100%; border-collapse:collapse; font-family:sans-serif; text-align:left; font-size:13px;">
          <thead>
            <tr style="border-b: 2px solid #001F3F; color:#001F3F; font-weight:900; text-transform:uppercase;">
              <th style="padding:8px 4px;">Puesto</th>
              <th style="padding:8px 4px;">Vendedor</th>
              <th style="padding:8px 4px; text-align:right;">Total Ganado</th>
            </tr>
          </thead>
          <tbody style="color:#475569; font-weight:600;">
            ${ranking.map((v, i) => `
              <tr style="border-b: 1px solid #f1f5f9;">
                <td style="padding:10px 4px; font-weight:900; color:#FFB800;">#${i + 1}</td>
                <td style="padding:10px 4px; text-transform:uppercase;">${v.nombre}</td>
                <td style="padding:10px 4px; text-align:right; font-weight:900; color:#001F3F;">$${v.totalDinero}.00</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    Swal.fire({
      title: `<span style="font-size:15px; font-weight:900; text-transform:uppercase; color:#001F3F; letter-spacing:0.05em;">REPORTE: ${campana.nombre.toUpperCase()}</span>`,
      html: tablaHTML,
      icon: 'info',
      confirmButtonColor: '#001F3F',
      confirmButtonText: 'CERRAR AUDITORÍA'
    });
  };

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <BarChart3 className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Reportes Ejecutivos
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Ranking de ingresos y efectividad de cobros por campaña</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campanas.map((camp) => (
          <div 
            key={camp.id} 
            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all group border-b-4 border-b-[#FFB800]"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-[#FFB800] group-hover:text-[#001F3F] transition-all">
                  <TrendingUp size={16} strokeWidth={2.5} />
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  camp.estado === 'Activa' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {camp.estado}
                </span>
              </div>
              
              <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight mb-1">{camp.nombre}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 font-mono">
                Cierre: {camp.fechaCierre}
              </p>

              <div className="space-y-3.5 mb-8 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Ganadores en Vivo</p>
                
                {[...camp.vendedores].sort((a,b) => b.totalDinero - a.totalDinero).slice(0, 2).map((v, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{i+1}. {v.nombre}</span>
                    <span className="text-xs font-black text-[#001F3F] font-mono">${v.totalDinero}.00</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => descargarReporteSimulado(camp)}
              className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Ver Auditoría</span>
            </button>
          </div>
        ))}
      </div>
      <div className="p-6 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center shadow-inner">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
          Los reportes corporativos se consolidan de forma automatizada basándose en el cruce relacional de deudas liquidadas en MySQL.
        </p>
      </div>
    </div>
  )
}