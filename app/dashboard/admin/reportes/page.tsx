'use client'
import { useState } from 'react'

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
    // 1. Ordenamos de mayor a menor dinero
    const ranking = [...campana.vendedores].sort((a, b) => b.totalDinero - a.totalDinero);
    
    // 2. Formateamos el mensaje para el Admin
    const listaTexto = ranking.map((v, i) => `${i + 1}. ${v.nombre}: $${v.totalDinero}`).join('\n');
    
    alert(`REPORTE - ${campana.nombre.toUpperCase()}\n\n${listaTexto}`);
    
    // Aquí podrías generar un CSV simple con solo: Vendedor, Total
    console.log("Datos del Reporte:", ranking);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#001F3F]">Reportes Ejecutivos</h1>
          <p className="text-slate-500 font-medium">Ranking de ingresos por campaña</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campanas.map((camp) => (
          <div 
            key={camp.id} 
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all group border-b-4 border-b-[#D4AF37]"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-[#001F3F] rounded-xl flex items-center justify-center text-xl shadow-lg">
                  <span className="text-[#D4AF37]">💵</span>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${camp.estado === 'Activa' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {camp.estado}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-[#001F3F] mb-1">{camp.nombre}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                Cierre: {camp.fechaCierre}
              </p>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen de Top Ganadores</p>
                {/* Mini vista previa del top 2 */}
                {[...camp.vendedores].sort((a,b) => b.totalDinero - a.totalDinero).slice(0, 2).map((v, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#001F3F]">{i+1}. {v.nombre}</span>
                    <span className="text-sm font-bold text-[#D4AF37]">${v.totalDinero}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => descargarReporteSimulado(camp)}
              className="w-full bg-[#001F3F] text-[#D4AF37] py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              📥 Descargar Lista
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
        <p className="text-slate-400 text-xs font-medium">
          Los reportes se generan automáticamente basándose en las fotos validadas de cada vendedor.
        </p>
      </div>
    </div>
  )
}