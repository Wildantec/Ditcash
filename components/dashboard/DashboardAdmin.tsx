import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { 
  ShieldCheck, Users, Rocket, Search, AlertCircle, Gift, 
  TrendingUp, ArrowRight, Receipt, Car, Fuel 
} from 'lucide-react'

export default async function DashboardAdmin() {
  const cookieStore = await cookies()
  const userIdRaw = cookieStore.get('user_id')?.value
  
  let nombreUsuario = "DITEC ADMIN"
  if (userIdRaw) {
    const usuarioBD = await prisma.user.findUnique({ where: { id: parseInt(userIdRaw) } })
    if (usuarioBD?.nombre) nombreUsuario = usuarioBD.nombre.toUpperCase()
  }

  const [
    totalVendedores, totalCampanas, totalPremios, pendientesTotal, rankingRaw,
    totalFacturas, totalVehiculos, totalEstaciones
  ] = await Promise.all([
    prisma.vendedor.count().catch(() => 0),
    prisma.campana.count().catch(() => 0),
    prisma.premio.count({ where: { activo: true } }).catch(() => 0),
    prisma.evidencia.count({ where: { estado: 'pendiente' } }).catch(() => 0),
    // CORRECCIÓN: Traemos crudo el campo asignado por MySQL y el saldo gastado
    prisma.vendedor.findMany({
      select: {
        nombre: true,
        puntosAcumulados: true,
        saldoGastado: true
      },
    }).catch(() => []),
    prisma.registroCombustible.count().catch(() => 0),
    prisma.vehiculo.count().catch(() => 0),
    prisma.gasolinera.count().catch(() => 0),
  ]);

  const rankingVendedores = rankingRaw
    .map((v: any) => {
      // Calculamos usando directamente el saldo estático inyectado
      const saldoDisponibleReal = Number(v.puntosAcumulados || 0) - (Number(v.saldoGastado) || 0);
      return { nombre: v.nombre, puntosAcumulados: saldoDisponibleReal || 0 };
    })
    .sort((a: any, b: any) => b.puntosAcumulados - a.puntosAcumulados)
    .slice(0, 6);

  const maxPuntos = Math.max(...rankingVendedores.map((v: any) => v.puntosAcumulados), 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 text-[#001F3F]">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none">Panel Administrativo</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">DITCASH | CORE CENTRAL</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Control Maestro</p>
              <p className="text-xs font-black text-[#001F3F] uppercase tracking-tighter mt-1">{nombreUsuario}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#001F3F] shadow-inner">
              <ShieldCheck size={18} strokeWidth={2.5} className="text-[#FFB800]" />
            </div>
          </div>
        </div>
      </header>

      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 ml-2">Módulos de Incentivos y Personal</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <Link href="/dashboard/usuarios" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group-hover:shadow-2xl transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-[#FFB800] transition-all">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios</p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">{totalVendedores}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] group-hover:text-[#FFB800] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/campanas" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group-hover:shadow-2xl transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-[#FFB800] transition-all">
                <Rocket size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Campañas</p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">{totalCampanas}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] group-hover:text-[#FFB800] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/vendedores" className="block group">
          <div className={`p-6 rounded-[2rem] shadow-xl border transition-all duration-500 flex items-center justify-between h-full ${
            pendientesTotal > 0 ? 'bg-orange-50/60 border-orange-200 shadow-orange-100/50' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all ${
                pendientesTotal > 0 ? 'bg-orange-500 text-white animate-pulse shadow-md shadow-orange-200' : 'bg-slate-100 text-[#001F3F]'
              }`}>
                {pendientesTotal > 0 ? <AlertCircle size={18} strokeWidth={2.5} /> : <Search size={18} strokeWidth={2.5} />}
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${pendientesTotal > 0 ? 'text-orange-600' : 'text-slate-400'}`}>Auditoría</p>
                <h3 className="text-3xl font-black text-[#001F3F] leading-none tracking-tighter">{pendientesTotal}</h3>
              </div>
            </div>
            {pendientesTotal > 0 && <span className="text-[8px] bg-orange-500 text-white px-2 py-1 rounded-md font-black animate-bounce">NUEVO</span>}
          </div>
        </Link>

        <Link href="/dashboard/premios" className="block group">
          <div className="bg-[#001F3F] p-6 rounded-[2rem] shadow-xl border-b-4 border-[#FFB800] flex items-center justify-between group-hover:bg-black transition-all duration-500 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FFB800] shadow-inner">
                <Gift size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest mb-1">Catálogo</p>
                <h3 className="text-3xl font-black text-white leading-none tracking-tighter">{totalPremios}</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#FFB800] group-hover:bg-[#FFB800] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>
      </div>

      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 ml-2">Módulos de Contabilidad y Flota</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12">
        <Link href="/dashboard/combustible/facturas" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Receipt size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Comprobantes Galonaje</p>
                <h3 className="text-2xl font-black text-[#001F3F] leading-none tracking-tighter">{totalFacturas} Facturas</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/combustible/vehiculos" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Car size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidades Móviles</p>
                <h3 className="text-2xl font-black text-[#001F3F] leading-none tracking-tighter">{totalVehiculos} Vehículos</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/combustible/estaciones" className="block group">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Fuel size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntos de Convenio</p>
                <h3 className="text-2xl font-black text-[#001F3F] leading-none tracking-tighter">{totalEstaciones} Gasolineras</h3>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#001F3F] transition-all">
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-[#FFB800] rounded-full" />
            <h2 className="text-xl md:text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic flex items-center gap-3">
              <TrendingUp size={22} strokeWidth={2.5} /> Rendimientos
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8">
          {rankingVendedores.map((v:any) => (
            <div key={v.nombre} className="group/item">
              <div className="flex justify-between items-end mb-3">
                <p className="font-black text-[#001F3F] text-xs md:text-sm uppercase tracking-tight italic">{v.nombre}</p>
                <p className="text-[10px] md:text-[11px] font-black text-[#001F3F] font-mono">${v.puntosAcumulados.toFixed(2)}</p>
              </div>
              <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.max(0, (v.puntosAcumulados / maxPuntos) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}