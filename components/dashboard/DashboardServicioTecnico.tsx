'use client'

import { Wrench, Car, AlertTriangle, Calendar, ClipboardList } from 'lucide-react'

export default function DashboardServicioTecnico() {
  // Datos simulados iniciales para pintar la interfaz en bloque
  const kpis = [
    { title: 'Vehículos Activos', value: '12', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'En Mantenimiento', value: '2', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Alertas de Flota', value: '1', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Próximas Revisiones', value: '4', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
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

      {/* CUADRICULA DE REPORTE RÁPIDO (KPIS) */}
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
        {/* COLUMNA 1 & 2: ÓRDENES O VEHÍCULOS ACTIVOS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <ClipboardList size={14} className="text-[#FFB800]" /> Mantenimientos Recientes
          </h3>
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
              No se registran órdenes abiertas el día de hoy.
            </p>
          </div>
        </div>

        {/* COLUMNA 3: RECORDATORIOS DE INFRAESTRUCTURA */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            🚨 Alertas Críticas
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-50/60 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-[#001F3F] uppercase">Camioneta Placa PXX-0000</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cambio de aceite vencido por 350 Km.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}