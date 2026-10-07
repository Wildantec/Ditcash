import { prisma } from '@/lib/prisma'
import { Fuel, FileSpreadsheet, Calculator, TrendingUp, AlertCircle, Clock } from 'lucide-react'

export default async function DashboardContabilidad() {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const [
    gastoMesAggregate,
    facturasPorValidarCount,
    creditoGasolinerasAggregate,
    alertasVehiculosCount,
    ultimasFacturas
  ] = await Promise.all([
    prisma.registroCombustible.aggregate({
      where: {
        createdAt: { gte: inicioMes }
      },
      _sum: { precioTotal: true }
    }),
    prisma.registroCombustible.count({
      where: { fueraDeConvenio: true }
    }),
    prisma.gasolinera.aggregate({
      _sum: { montoActual: true }
    }),
    prisma.vehiculo.count({
      where: { alertaMantenimiento: true }
    }),
    prisma.registroCombustible.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        vehiculo: true,
        gasolinera: true
      }
    })
  ])

  // 3. Formatear valores
  const totalGastoMes = gastoMesAggregate._sum.precioTotal || 0
  const totalCreditoEstaciones = creditoGasolinerasAggregate._sum.montoActual || 0

  const kpisFinancieros = [
    { 
      title: 'Gasto Combustible Mes', 
      value: `$ ${totalGastoMes.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: Fuel, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      title: 'Facturas Fuera Convenio', 
      value: facturasPorValidarCount.toString(), 
      icon: Clock, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      title: 'Crédito Estaciones', 
      value: `$ ${totalCreditoEstaciones.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: FileSpreadsheet, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      title: 'Alertas de Flota', 
      value: alertasVehiculosCount.toString(), 
      icon: AlertCircle, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    }
  ]

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="mb-10 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Panel de Control Contable</h1>
        </div>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
          Auditoría de egresos, conciliación fiscal y gestión de combustible Ditec
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {kpisFinancieros.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                <p className="text-xl font-black text-[#001F3F] font-mono">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                <Icon size={20} className={kpi.color} strokeWidth={2.5} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Calculator size={14} className="text-[#FFB800]" /> Últimas Facturas Ingresadas
          </h3>

          {ultimasFacturas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Factura #</th>
                    <th className="pb-3">Conductor</th>
                    <th className="pb-3">Gasolinera</th>
                    <th className="pb-3">Placa</th>
                    <th className="pb-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                  {ultimasFacturas.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-mono text-[#001F3F]">{reg.numFactura}</td>
                      <td className="py-3.5 text-slate-600">{reg.user?.nombre || 'S/D'}</td>
                      <td className="py-3.5 text-slate-600">{reg.gasolinera?.nombre || 'S/D'}</td>
                      <td className="py-3.5 text-slate-500 font-mono">{reg.vehiculo?.placa || 'S/D'}</td>
                      <td className="py-3.5 text-right font-black text-[#001F3F]">
                        ${Number(reg.precioTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
                No hay nuevos comprobantes registrados en la base de datos.
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#FFB800]" /> Resumen de Conciliación
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-slate-400">Estado de Registros</p>
              <p className="text-xs font-black text-emerald-600 uppercase mt-1">
                Base de datos sincronizada
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-slate-400">Comprobantes Fuera de Convenio</p>
              <p className="text-xs font-black text-amber-600 uppercase mt-1">
                {facturasPorValidarCount} por auditar
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}