import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function VendedorDashboard() {
  const cookieStore = await cookies()
  const userIdRaw = cookieStore.get('user_id')?.value

  if (!userIdRaw) redirect('/login')

  const userId = parseInt(userIdRaw)

  // 1. Datos del Vendedor (Traemos el nuevo campo saldoGastado)
  const vendedor = await prisma.vendedor.findUnique({
    where: { usuarioId: userId }
  })

  if (!vendedor) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400">Perfil no detectado</div>

  // 2. Saldo Real (Calculamos: Suma de evidencias - Saldo Gastado)
  const stats = await prisma.evidencia.aggregate({
    where: { vendedorId: vendedor.id, estado: 'aprobado' },
    _sum: { valorPagado: true },
    _count: { id: true }
  })

  const ganadoTotal = Number(stats._sum.valorPagado || 0)
  const gastadoTotal = Number(vendedor.saldoGastado || 0) // <--- Valor del nuevo campo en Prisma
  const saldo = ganadoTotal - gastadoTotal // <--- Este es el valor que se mostrará
  const totalAprobadas = stats._count.id

  // 3. Catálogo y Meta Próxima
  const premios = await prisma.premio.findMany({
    where: { activo: true },
    orderBy: { puntos: 'asc' }
  })

  const proximoPremio = premios.find((p:any) => Number(p.puntos) > saldo) || premios[premios.length - 1];
  const metaPremio = proximoPremio ? Number(proximoPremio.puntos) : 100;
  const progresoPremio = Math.min((saldo / metaPremio) * 100, 100);

  // 4. RANKING DINÁMICO (Restamos el gasto de cada uno)
  const vendedoresRaw = await prisma.vendedor.findMany({
    include: {
      evidencias: {
        where: { estado: 'aprobado' },
        select: { valorPagado: true }
      }
    }
  })

  const topVendedores = vendedoresRaw
    .map((v: any) => ({
      id: v.id,
      nombre: v.nombre,
      puntosReales: v.evidencias.reduce((acc: any, curr: any) => acc + Number(curr.valorPagado || 0), 0) - Number(v.saldoGastado || 0)
    }))
    .sort((a: any, b: any) => b.puntosReales - a.puntosReales)
    .slice(0, 3)

  // 5. Campañas Vigentes
  const campanasActivas = await prisma.campana.findMany({
    where: { activa: true },
    orderBy: { fechaInicio: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[#F4F7FA] p-4 md:p-12 text-[#001F3F] font-sans">
      
      {/* SECCIÓN SUPERIOR: SALDO Y ACCESO A PREMIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-8 md:mb-12">
        
        {/* Card de Saldo Principal */}
        <div className="lg:col-span-5 bg-[#001F3F] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-b-8 border-[#FFB800]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#FFB800] mb-4">Saldo Disponible DitCash</p>
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter flex items-start">
            <span className="text-[#FFB800] text-2xl md:text-3xl mt-2 mr-1">$</span>
            {saldo.toFixed(2)}
          </h2>
          <p className="text-[10px] md:text-xs font-bold uppercase mt-4 opacity-60 italic">{totalAprobadas} Validaciones verificadas</p>
        </div>

        {/* Banner de Acceso al Catálogo */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl flex flex-col justify-between group">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Tu siguiente meta</p>
              <h3 className="text-xl md:text-2xl font-black uppercase italic text-[#001F3F] group-hover:text-[#FFB800] transition-colors leading-tight">
                {proximoPremio?.nombre || 'Catálogo de Premios'}
              </h3>
            </div>
            <Link href="/dashboard/vendedor/premios" className="w-full sm:w-auto">
              <button className="w-full bg-slate-50 text-[#001F3F] p-4 rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-[#001F3F] hover:text-white transition-all shadow-sm">
                Ver Catálogo ➔
              </button>
            </Link>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between mb-3">
              <span className="text-[10px] md:text-xs font-black uppercase opacity-40 italic tracking-widest">Progreso del canje</span>
              <span className="text-[10px] md:text-xs font-black text-[#001F3F]">
                ${saldo.toFixed(2)} / ${metaPremio.toFixed(2)}
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        
        {/* COLUMNA DE ACCIÓN: CAMPAÑAS */}
        <div className="lg:col-span-8 space-y-6 md:space-y-10">
          <section>
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className="w-2 h-8 bg-[#FFB800] rounded-full" />
              <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Campañas Activas</h3>
            </div>
            
            <div className="grid gap-4 md:gap-6">
              {campanasActivas.length > 0 ? (
                campanasActivas.map((c:any) => (
                  <div key={c.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between hover:shadow-2xl transition-all border-l-[12px] border-[#001F3F] gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl md:text-4xl shadow-inner shrink-0 relative">
                        📸
                        <div className="absolute -top-2 -right-2 bg-[#FFB800] text-[#001F3F] text-[10px] font-black px-2 py-1 rounded-lg shadow-md border border-white">
                          ${Number(c.valor || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg md:text-xl font-black uppercase text-[#001F3F] tracking-tighter">{c.nombre}</h4>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight mt-1 opacity-80 line-clamp-2">
                          {c.descripcion || 'Sube tus fotos de evidencias y gana recompensas.'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/vendedor/campanas/${c.id}`} className="w-full md:w-auto">
                      <button className="w-full bg-[#001F3F] text-[#FFB800] px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all">
                        SUBIR EVIDENCIA
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] p-16 md:p-20 text-center border-2 border-dashed border-slate-200">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300 italic">No hay campañas disponibles actualmente.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DE RANKING TOP */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-xl border border-slate-50 lg:sticky lg:top-10">
            <h3 className="text-lg md:text-xl font-black uppercase tracking-[0.2em] mb-8 md:mb-10 pb-4 border-b border-slate-100 italic text-center lg:text-left">Top DitCash</h3>
            <div className="space-y-4 md:space-y-6">
              {topVendedores.map((v:any, index:any) => (
                <div key={v.id} className={`flex justify-between items-center p-4 md:p-6 rounded-[1.5rem] transition-all ${v.id === vendedor.id ? 'bg-[#001F3F] text-white shadow-xl scale-105' : 'bg-slate-50 text-[#001F3F]'}`}>
                  <div className="flex items-center gap-4 md:gap-5">
                    <span className={`text-[10px] font-black w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-xl ${index === 0 ? 'bg-[#FFB800] text-[#001F3F]' : 'bg-white/20'}`}>
                      {index + 1}
                    </span>
                    <p className="text-xs md:text-sm font-black uppercase tracking-tight truncate max-w-[100px] md:max-w-[120px]">
                      {v.id === vendedor.id ? 'TÚ' : v.nombre.split(' ')[0]}
                    </p>
                  </div>
                  <p className={`text-xs md:text-sm font-black italic ${v.id === vendedor.id ? 'text-[#FFB800]' : 'text-slate-400'}`}>
                    ${v.puntosReales.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}