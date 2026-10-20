import { prisma } from '@/lib/prisma'
import { Wrench, Car, AlertTriangle, Calendar, ClipboardList, ShieldAlert } from 'lucide-react'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'

export default async function DashboardServicioTecnico() {
  const usuario = await getCurrentUser()
  const puedeVerServicioTecnico = userHasPermission(usuario, 'vehiculos', 'ver')

  if (!puedeVerServicioTecnico) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 flex flex-col items-center justify-center text-[#001F3F]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Acceso Denegado</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
            Tu rol actual no dispone de permisos para acceder al panel de soporte y activos.
          </p>
        </div>
      </div>
    )
  }

  const [
    totalVehiculos,
    alertasFlotaCount,
    mantenimientosRecientes,
    alertasCriticas
  ] = await Promise.all([
    prisma.vehiculo.count().catch(() => 0),
    prisma.vehiculo.count({ where: { alertaMantenimiento: true } }).catch(() => 0),
    prisma.kardexVehiculo.findMany({
      take: 5,
      orderBy: { fechaTransaccion: 'desc' },
      include: { vehiculo: true }
    }).catch(() => []),
    prisma.vehiculo.findMany({
      where: { alertaMantenimiento: true },
      take: 5
    }).catch(() => [])
  ])
  const vehiculosActivos = Math.max(0, totalVehiculos - alertasFlotaCount)

  const kpis = [
    { title: 'Vehículos Activos', value: vehiculosActivos.toString(), icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'En Mantenimiento', value: alertasFlotaCount.toString(), icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Alertas de Flota', value: alertasFlotaCount.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Próximas Revisiones', value: alertasFlotaCount.toString(), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
  ]

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      {/* HEADER DE BIENVENIDA */}
      <header className="mb-10 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Panel de Soporte y Activos</h1>
        </div>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
          Gestión de infraestructura logística de Ditec 2026
        </p>
      </header>

      {/* CUADRÍCULA DE REPORTE RÁPIDO (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                <p className="text-2xl font-black text-[#001F3F]">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                <Icon size={20} className={kpi.color} strokeWidth={2.5} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ÁREA DE TRABAJO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MANTENIMIENTOS RECIENTES */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <ClipboardList size={14} className="text-[#FFB800]" /> Mantenimientos Recientes
          </h3>

          {mantenimientosRecientes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Vehículo</th>
                    <th className="pb-3">Conductor</th>
                    <th className="pb-3">Taller / Servicio</th>
                    <th className="pb-3 text-right">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                  {mantenimientosRecientes.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-mono text-[#001F3F]">
                        {m.fechaTransaccion ? new Date(m.fechaTransaccion).toISOString().split('T')[0] : 'S/F'}
                      </td>
                      <td className="py-3.5 font-mono text-slate-600">{m.vehiculo?.placa || 'S/P'}</td>
                      <td className="py-3.5 text-slate-600">{m.choferEnEseMomento || 'SIN ASIGNAR'}</td>
                      <td className="py-3.5 text-slate-500">{m.taller || m.tipoMovimiento || 'GENERAL'}</td>
                      <td className="py-3.5 text-right font-black text-[#001F3F]">
                        ${Number(m.costoTransaccion || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
                No se registran órdenes abiertas el día de hoy.
              </p>
            </div>
          )}
        </div>

        {/* ALERTAS CRÍTICAS */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            🚨 Alertas Críticas
          </h3>
          <div className="space-y-3">
            {alertasCriticas.length > 0 ? (
              alertasCriticas.map((veh: any) => (
                <div key={veh.id} className="p-4 bg-red-50/60 border border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-[#001F3F] uppercase">
                      {veh.marcaModelo ? `${veh.marcaModelo} - Placa ${veh.placa}` : `Placa ${veh.placa}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Requiere revisión técnica / kilometraje de mantenimiento alcanzado.
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
                <p className="text-xs font-black text-emerald-700 uppercase">Sin Alertas Críticas</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Toda la flota operativa al día.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}