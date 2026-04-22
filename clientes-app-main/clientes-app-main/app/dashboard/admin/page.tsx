import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  // 1. CONSULTA DE DATOS (Agregamos el conteo de pendientes)
  const [totalVendedores, totalCampanas, totalPremios, pendientesTotal, rankingRaw] = await Promise.all([
    prisma.vendedor.count().catch(() => 0),
    prisma.campana.count().catch(() => 0),
    prisma.premio.count({ where: { activo: true } }).catch(() => 0),
    // CONTADOR GLOBAL DE FOTOS PENDIENTES
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

  const rankingVendedores = rankingRaw
    .map((v: any) => ({
      nombre: v.nombre,
      puntosAcumulados: v.evidencias.length * 2
    }))
    .sort((a, b) => b.puntosAcumulados - a.puntosAcumulados)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-12 text-[#001F3F]">
      
      {/* HEADER CON NOTIFICACIÓN DE AUDITORÍA */}
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Panel Administrativo</h1>
          <p className="text-slate-400 font-medium text-sm italic mt-2">DITCASH</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* CAMPANA DE NOTIFICACIÓN REAL */}
          {pendientesTotal > 0 && (
            <Link href="/dashboard/admin/vendedores" className="relative group">
              <div className="bg-orange-500 text-white p-3 rounded-xl shadow-lg shadow-orange-200 animate-bounce group-hover:scale-110 transition-all">
                <span className="text-xl">🔔</span>
                <span className="absolute -top-2 -right-2 bg-[#001F3F] text-[#FFB800] text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {pendientesTotal}
                </span>
              </div>
              {/* Tooltip pequeño */}
              <div className="absolute top-14 right-0 bg-[#001F3F] text-white text-[8px] font-black px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none">
                Fotos por auditar
              </div>
            </Link>
          )}

          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Admin Principal</p>
              <p className="text-xs font-bold text-[#001F3F] uppercase tracking-tighter">DITEC</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
          </div>
        </div>
      </header>

      {/* TARJETAS KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Link href="/dashboard/admin/usuarios" className="block group">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 flex items-center justify-between group-hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl">👥</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Vendedores</p>
                <h3 className="text-5xl font-black text-[#001F3F] leading-none tracking-tighter">{totalVendedores}</h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] group-hover:text-white transition-all font-bold">➔</div>
          </div>
        </Link>

        {/* SI HAY PENDIENTES, ESTA CARD TAMBIÉN AVISA */}
        <Link href="/dashboard/admin/vendedores" className="block group">
          <div className={`p-10 rounded-[3rem] shadow-sm border transition-all duration-500 flex items-center justify-between ${pendientesTotal > 0 ? 'bg-orange-50 border-orange-200 shadow-orange-100' : 'bg-white border-slate-50'}`}>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${pendientesTotal > 0 ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-50'}`}>
                {pendientesTotal > 0 ? '❗' : '🚀'}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${pendientesTotal > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                  {pendientesTotal > 0 ? 'Pendientes de Auditoría' : 'Campañas Activas'}
                </p>
                <h3 className="text-5xl font-black text-[#001F3F] leading-none tracking-tighter">
                  {pendientesTotal > 0 ? pendientesTotal : totalCampanas}
                </h3>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all font-bold ${pendientesTotal > 0 ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-300'}`}>➔</div>
          </div>
        </Link>

        <Link href="/dashboard/admin/premios" className="block group">
          <div className="bg-[#001F3F] p-10 rounded-[3rem] shadow-lg border-b-8 border-[#FF8C00] flex items-center justify-between group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🎁</div>
              <div>
                <p className="text-[10px] font-black text-[#FF8C00] uppercase tracking-[0.2em] mb-1">Premios</p>
                <h3 className="text-5xl font-black text-white leading-none tracking-tighter">{totalPremios}</h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#FF8C00] group-hover:bg-[#FF8C00] group-hover:text-[#001F3F] transition-all font-bold">➔</div>
          </div>
        </Link>
      </div>

      {/* SECCIÓN RENDIMIENTO */}
      <div className="grid grid-cols-1">
        <Link href="/dashboard/admin/vendedores" className="block group">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-50 group-hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-10 bg-[#FF8C00] rounded-full" />
                <h2 className="text-3xl font-black text-[#001F3F] tracking-tighter uppercase italic">Rendimiento</h2>
              </div>
              <span className="text-[11px] font-black text-[#FF8C00] uppercase tracking-[0.3em] group-hover:translate-x-3 transition-transform">Gestionar ➔</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {rankingVendedores.map((v: any) => (
                <div key={v.nombre}>
                  <div className="flex justify-between items-end mb-4">
                    <p className="font-black text-[#001F3F] text-sm uppercase tracking-tight italic">{v.nombre}</p>
                    <p className="text-[11px] font-black text-[#FF8C00] uppercase tracking-widest">${v.puntosAcumulados.toFixed(2)}</p>
                  </div>
                  <div className="w-full h-3.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#001F3F] to-[#FF8C00] rounded-full transition-all duration-1000" style={{ width: `${Math.min((v.puntosAcumulados / 1000) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}