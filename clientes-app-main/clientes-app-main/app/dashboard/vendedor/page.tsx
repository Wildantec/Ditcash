import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function VendedorDashboard() {
  const cookieStore = await cookies()
  const userIdRaw = cookieStore.get('user_id')?.value

  if (!userIdRaw) redirect('/login')

  const userId = parseInt(userIdRaw)

  // 1. Datos del Vendedor y Saldo
  const vendedor = await prisma.vendedor.findUnique({
    where: { usuarioId: userId }
  })

  if (!vendedor) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400">Perfil no detectado</div>

  const totalAprobadas = await prisma.evidencia.count({
    where: { vendedorId: vendedor.id, estado: 'aprobado' }
  })
  const saldo = totalAprobadas * 2

  // 2. Obtener el catálogo para calcular la meta próxima
  const premios = await prisma.premio.findMany({
    where: { activo: true },
    orderBy: { puntos: 'asc' }
  })

  const proximoPremio = premios.find(p => Number(p.puntos) > saldo) || premios[premios.length - 1];
  const metaPremio = proximoPremio ? Number(proximoPremio.puntos) : 100;
  const progresoPremio = Math.min((saldo / metaPremio) * 100, 100);

  // 3. Ranking Top 3
  const topVendedores = await prisma.vendedor.findMany({
    select: { id: true, nombre: true, puntosAcumulados: true },
    orderBy: { puntosAcumulados: 'desc' },
    take: 3
  })
  
  // 4. Campañas Vigentes
  const campanasActivas = await prisma.campana.findMany({
    where: { activa: true },
    orderBy: { fechaInicio: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[#F4F7FA] p-6 md:p-12 text-[#001F3F] font-sans">
      
      {/* SECCIÓN SUPERIOR: SALDO Y ACCESO A PREMIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Card de Saldo Principal */}
        <div className="lg:col-span-5 bg-[#001F3F] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-b-8 border-[#FFB800]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#FFB800] mb-4">Saldo Disponible DitCash</p>
          <h2 className="text-6xl font-black italic tracking-tighter flex items-start">
            <span className="text-[#FFB800] text-3xl mt-2 mr-1">$</span>
            {saldo.toFixed(2)}
          </h2>
          <p className="text-xs font-bold uppercase mt-4 opacity-60 italic">{totalAprobadas} Validaciones verificadas</p>
        </div>

        {/* Banner de Acceso al Catálogo (Direcciona a la nueva pantalla) */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu siguiente meta</p>
              <h3 className="text-2xl font-black uppercase italic text-[#001F3F] group-hover:text-[#FFB800] transition-colors">
                {proximoPremio?.nombre || 'Catálogo de Premios'}
              </h3>
            </div>
            <Link href="/dashboard/vendedor/premios">
              <button className="bg-slate-50 text-[#001F3F] p-4 rounded-2xl font-black text-xs uppercase hover:bg-[#001F3F] hover:text-white transition-all shadow-sm">
                Ver Catálogo ➔
              </button>
            </Link>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between mb-3">
              <span className="text-xs font-black uppercase opacity-40 italic">Progreso del canje</span>
              <span className="text-xs font-black text-[#001F3F]">${saldo.toFixed(0)} / ${metaPremio}</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1">
              <div 
                className="h-full bg-[#001F3F] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,31,63,0.2)]" 
                style={{ width: `${progresoPremio}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUMNA DE ACCIÓN: CAMPAÑAS */}
        <div className="lg:col-span-8 space-y-10">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-[#FFB800] rounded-full" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Campañas Activas</h3>
            </div>
            
            <div className="grid gap-6">
              {campanasActivas.length > 0 ? (
                campanasActivas.map((c) => (
                  <div key={c.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between hover:shadow-2xl transition-all border-l-[12px] border-[#001F3F]">
                    <div className="flex items-center gap-8 text-center md:text-left">
                      <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner">🚀</div>
                      <div>
                        <h4 className="text-xl font-black uppercase text-[#001F3F] tracking-tighter">{c.nombre}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-80">{c.descripcion || 'Sube tus fotos de evidencias'}</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/vendedor/campanas/${c.id}`}>
                      <button className="mt-6 md:mt-0 bg-[#001F3F] text-[#FFB800] px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all">
                        SUBIR EVIDENCIA
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-300 italic">No hay campañas disponibles para este sector.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DE RANKING TOP */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 sticky top-10">
            <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-10 pb-4 border-b border-slate-100 italic">Top DitCash</h3>
            <div className="space-y-6">
              {topVendedores.map((v, index) => (
                <div key={v.id} className={`flex justify-between items-center p-6 rounded-[1.5rem] transition-all ${v.id === vendedor.id ? 'bg-[#001F3F] text-white shadow-xl scale-105' : 'bg-slate-50 text-[#001F3F]'}`}>
                  <div className="flex items-center gap-5">
                    <span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl ${index === 0 ? 'bg-[#FFB800] text-[#001F3F]' : 'bg-white/20'}`}>
                      {index + 1}
                    </span>
                    <p className="text-sm font-black uppercase tracking-tight">
                      {v.id === vendedor.id ? 'TÚ' : v.nombre.split(' ')[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}