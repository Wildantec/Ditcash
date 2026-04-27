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

  // 2. LÓGICA DE RENDIMIENTO
  const rankingVendedores = rankingRaw
    .map((v: any) => {
      const totalVentas = v.evidencias.reduce((acc: number, curr: any) => acc + (Number(curr.valorPagado) || 0), 0);
      return {
        nombre: v.nombre,
        puntosAcumulados: totalVentas || 0
      };
    })
    .sort((a:any, b:any) => b.puntosAcumulados - a.puntosAcumulados)
    .slice(0, 6);

  const maxPuntos = Math.max(...rankingVendedores.map((v:any) => v.puntosAcumulados), 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 text-[#001F3F]">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none">Panel Administrativo</h1>
          <p className="text-slate-400 font-medium text-sm italic mt-2">DITCASH | DITEC</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 md:px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Admin Principal</p>
              <p className="text-xs font-bold text-[#001F3F] uppercase tracking-tighter">DITEC</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
          </div>
        </div>
      </header>

      {/* TARJETAS KPIs (Ahora 4 tarjetas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        
        {/* VENDEDORES */}
        <Link href="/dashboard/admin/usuarios" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between group-hover:shadow-xl transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">👥</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios</p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">{totalVendedores}</h3>
              </div>
            </div>
          </div>
        </Link>

        {/* GESTIÓN DE CAMPAÑAS (Nueva) */}
        <Link href="/dashboard/admin/campanas" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between group-hover:shadow-xl transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">📢</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Campañas</p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">{totalCampanas}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] group-hover:text-white transition-all">➔</div>
          </div>
        </Link>

        {/* AUDITORÍA / EVIDENCIAS (Antes confundía) */}
        <Link href="/dashboard/admin/vendedores" className="block group">
          <div className={`p-6 rounded-[2rem] shadow-sm border transition-all duration-500 flex items-center justify-between h-full ${pendientesTotal > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${pendientesTotal > 0 ? 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-200' : 'bg-orange-50'}`}>
                {pendientesTotal > 0 ? '❗' : '🔎'}
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${pendientesTotal > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                   Auditoría
                </p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">
                  {pendientesTotal}
                </h3>
              </div>
            </div>
            {pendientesTotal > 0 && <span className="text-[10px] bg-orange-500 text-white px-2 py-1 rounded-lg font-black animate-bounce">NUEVO</span>}
          </div>
        </Link>

        {/* PREMIOS */}
        <Link href="/dashboard/admin/premios" className="block group">
          <div className="bg-[#001F3F] p-6 rounded-[2rem] shadow-lg border-b-4 border-[#FFB800] flex items-center justify-between group-hover:shadow-2xl transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
              <div>
                <p className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest mb-1">Catálogo</p>
                <h3 className="text-3xl font-black text-white leading-none tracking-tighter">{totalPremios}</h3>
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* SECCIÓN RENDIMIENTO */}
      <div className="grid grid-cols-1">
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 md:w-2.5 md:h-10 bg-[#FFB800] rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-[#001F3F] tracking-tighter uppercase italic">Rendimiento de Ventas</h2>
            </div>
            <Link href="/dashboard/admin/vendedores" className="text-[10px] md:text-[11px] font-black text-[#001F3F] border-b-2 border-[#FFB800] uppercase tracking-widest">
              Ver detalle ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8">
            {rankingVendedores.length > 0 ? (
              rankingVendedores.map((v: any) => (
                <div key={v.nombre} className="group/item">
                  <div className="flex justify-between items-end mb-3">
                    <p className="font-black text-[#001F3F] text-xs md:text-sm uppercase tracking-tight italic group-hover/item:text-[#FFB800] transition-colors">{v.nombre}</p>
                    <p className="text-[10px] md:text-[11px] font-black text-[#001F3F] uppercase tracking-widest">
                      ${v.puntosAcumulados.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-gradient-to-r from-[#001F3F] to-[#FFB800] rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(v.puntosAcumulados / maxPuntos) * 100}%` }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm">No hay registros de ventas aprobados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}