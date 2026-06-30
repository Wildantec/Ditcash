'use client'

import { Fuel, FileText, FileSpreadsheet, Calculator, TrendingUp, AlertCircle, Clock } from 'lucide-react'

export default function DashboardContabilidad() {
  const kpisFinancieros = [
    { title: 'Gasto Combustible Mes', value: '$ 1,240.50', icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Facturas por Validar', value: '8', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Crédito Estaciones', value: '$ 3,500.00', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Alertas de Desviación', value: '2', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
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
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
              No hay nuevos comprobantes en cola de revisión para el día de hoy.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#FFB800]" /> Resumen de Conciliación
          </h3>
          <div className="space-y-3.5">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-slate-400">Estado de Cierre Semanal</p>
              <p className="text-xs font-black text-emerald-600 uppercase mt-1">● Balance Cuadrado exitosamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}