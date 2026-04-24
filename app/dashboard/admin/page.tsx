import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  // 1. CONSULTA DE DATOS OPTIMIZADA
  const [totalVendedores, totalCampanas, totalPremios, pendientesTotal, rankingRaw] = await Promise.all([
    prisma.vendedor.count().catch(() => 0),
    prisma.campana.count().catch(() => 0),
    prisma.premio.count({ where: { activo: true } }).catch(() => 0),
    prisma.evidencia.count({ where: { estado: 'pendiente' } }).catch(() => 0),
    prisma.vendedor.findMany({
      select: {
        nombre: true,
        evidencias: {
          where: { estado: 'aprobado' },
          select: { valorPagado: true }
        }
      },
    }).catch(() => []),
  ]);

  // 2. LÓGICA DE RENDIMIENTO MEJORADA
  const rankingVendedores = rankingRaw
    .map((v: any) => {
      // Sumamos el valor real pagado o asignamos puntos por cantidad
      const totalVentas = v.evidencias.reduce((acc: number, curr: any) => acc + (Number(curr.valorPagado) || 0), 0);
      return {
        nombre: v.nombre,
        puntosAcumulados: totalVentas || v.evidencias.length * 10 // Si no hay valor, usamos conteo * 10
      };
    })
    .sort((a:any, b:any) => b.puntosAcumulados - a.puntosAcumulados)
    .slice(0, 6);

  // Buscamos el máximo para que la barra sea relativa al mejor vendedor
  const maxPuntos = Math.max(...rankingVendedores.map((v:any) => v.puntosAcumulados), 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 text-[#001F3F]">
      
      {/* HEADER RESPONSIVE */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none">Panel Administrativo</h1>
          <p className="text-slate-400 font-medium text-sm italic mt-2">DITCASH</p>
        </div>
        
        <div className="flex items-center gap-4">
          {pendientesTotal > 0 && (
            <Link href="/dashboard/admin/vendedores" className="relative group">
              <div className="bg-orange-500 text-white p-3 rounded-xl shadow-lg shadow-orange-200 animate-bounce group-hover:scale-110 transition-all">
                <span className="text-xl">🔔</span>
                <span className="absolute -top-2 -right-2 bg-[#001F3F] text-[#FFB800] text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {pendientesTotal}
                </span>
              </div>
            </Link>
          )}

          <div className="bg-white px-4 md:px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Admin Principal</p>
              <p className="text-xs font-bold text-[#001F3F] uppercase tracking-tighter">DITEC</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
          </div>
        </div>
      </header>

      {/* TARJETAS KPIs RESPONSIVE (Grid de 1 a 3 columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12">
        <Link href="/dashboard/admin/usuarios" className="block group">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-50 flex items-center justify-between group-hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">👥</div>
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Vendedores</p>
                <h3 className="text-3xl md:text-5xl font-black text-[#001F3F] leading-none tracking-tighter">{totalVendedores}</h3>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] group-hover:text-white transition-all font-bold">➔</div>
          </div>
        </Link>

        <Link href="/dashboard/admin/campanas" className="block group">
          <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border transition-all duration-500 flex items-center justify-between ${pendientesTotal > 0 ? 'bg-orange-50 border-orange-200 shadow-orange-100' : 'bg-white border-slate-50'}`}>
            <div className="flex items-center gap-4 md:gap-6">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl ${pendientesTotal > 0 ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-50'}`}>
                {pendientesTotal > 0 ? '❗' : '🚀'}
              </div>
              <div>
                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${pendientesTotal > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                  {pendientesTotal > 0 ? 'Auditoría' : 'Campañas'}
                </p>
                <h3 className="text-3xl md:text-5xl font-black text-[#001F3F] leading-none tracking-tighter">
                  {pendientesTotal > 0 ? pendientesTotal : totalCampanas}
                </h3>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold ${pendientesTotal > 0 ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-300'}`}>➔</div>
          </div>
        </Link>

        <Link href="/dashboard/admin/premios" className="block group sm:col-span-2 lg:col-span-1">
          <div className="bg-[#001F3F] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-lg border-b-8 border-[#FF8C00] flex items-center justify-between group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🎁</div>
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-[#FF8C00] uppercase tracking-[0.2em] mb-1">Premios</p>
                <h3 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter">{totalPremios}</h3>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#FF8C00] group-hover:bg-[#FF8C00] group-hover:text-[#001F3F] transition-all font-bold">➔</div>
          </div>
        </Link>
      </div>

      {/* SECCIÓN RENDIMIENTO RESPONSIVE */}
      <div className="grid grid-cols-1">
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 md:w-2.5 md:h-10 bg-[#FF8C00] rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-[#001F3F] tracking-tighter uppercase italic">Rendimiento</h2>
            </div>
            <Link href="/dashboard/admin/vendedores" className="text-[10px] md:text-[11px] font-black text-[#FF8C00] uppercase tracking-[0.3em] hover:translate-x-2 transition-transform">
              Gestionar ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8">
            {rankingVendedores.length > 0 ? (
              rankingVendedores.map((v: any) => (
                <div key={v.nombre} className="group/item">
                  <div className="flex justify-between items-end mb-3">
                    <p className="font-black text-[#001F3F] text-xs md:text-sm uppercase tracking-tight italic group-hover/item:text-[#FF8C00] transition-colors">{v.nombre}</p>
                    <p className="text-[10px] md:text-[11px] font-black text-[#FF8C00] uppercase tracking-widest">
                      ${v.puntosAcumulados.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-full h-3 md:h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-gradient-to-r from-[#001F3F] to-[#FF8C00] rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(v.puntosAcumulados / maxPuntos) * 100}%` }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm">No hay datos de rendimiento aprobados aún.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}