'use client'

import { useState, useEffect } from 'react'
import { X, Calculator, Milestone, DollarSign, Fuel } from 'lucide-react'

interface CalculadoraProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalculadoraCombustibleModal({ isOpen, onClose }: CalculadoraProps) {
  // Estados Base
  const [precioGalon, setPrecioGalon] = useState<string>('2.96')
  const AUTONOMIA_FIJA = 51.14 // Km por galón estático según Excel
  const [costoPorKm, setCostoPorKm] = useState<number>(0)

  // Pestaña activa: 'distancia' o 'presupuesto'
  const [tabActiva, setTabActiva] = useState<'distancia' | 'presupuesto'>('distancia')

  // Estados de cálculo
  const [inputKm, setInputKm] = useState<string>('380')
  const [resultadoDolares, setResultadoDolares] = useState<number>(0)

  const [inputDinero, setInputDinero] = useState<string>('50.00')
  const [resultadoKm, setResultadoKm] = useState<number>(0)

  // Recalcular el costo por KM y los sub-módulos cada vez que cambien las entradas
  useEffect(() => {
    const precio = parseFloat(precioGalon) || 0
    if (precio > 0) {
      const ckm = precio / AUTONOMIA_FIJA
      setCostoPorKm(ckm)

      // Calcular pestaña distancia
      const kms = parseFloat(inputKm) || 0
      setResultadoDolares(kms * ckm)

      // Calcular pestaña presupuesto
      const dinero = parseFloat(inputDinero) || 0
      setResultadoKm(ckm > 0 ? dinero / ckm : 0)
    } else {
      setCostoPorKm(0)
      setResultadoDolares(0)
      setResultadoKm(0)
    }
  }, [precioGalon, inputKm, inputDinero])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-[420px] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-[#001F3F] font-sans">
        
        {/* Encabezado */}
        <header className="bg-[#001F3F] p-4 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-[#FFB800] transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-[#FFB800]">
              <Calculator size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Simulador de Galonaje</h3>
              <p className="text-[#FFB800] text-[8px] font-bold uppercase tracking-widest">Modelo de Rendimiento DITEC</p>
            </div>
          </div>
        </header>

        {/* Parámetros Generales / Configuración Base */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-2">Variables del Sistema (Excel Base)</p>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Input: Precio de Galón */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Precio del Galón</label>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-slate-400 text-xs font-bold">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={precioGalon} 
                  onChange={(e) => setPrecioGalon(e.target.value)}
                  className="w-full pl-5 pr-1 py-0.5 bg-transparent font-black font-mono text-xs text-[#001F3F] focus:outline-none"
                />
              </div>
            </div>

            {/* Fijo: Autonomía Estática */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Autonomía Fija</span>
                <span className="font-mono font-black text-xs text-slate-500">{AUTONOMIA_FIJA} KM/GAL</span>
              </div>
            </div>

          </div>

          {/* Ficha Técnica: Costo Proporcional por Kilómetro */}
          <div className="mt-3 bg-[#001F3F]/5 border border-[#001F3F]/10 rounded-xl p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Fuel size={11} className="text-[#001F3F]" /> Costo x KM Proporcional:
            </span>
            <span className="font-mono font-black text-xs text-[#001F3F] bg-[#FFB800] px-2 py-0.5 rounded-md">
              $ {costoPorKm.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Tabs de Operación */}
        <div className="flex border-b border-slate-100 bg-slate-100/50 p-1 m-3 rounded-xl">
          <button 
            onClick={() => setTabActiva('distancia')}
            className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
              tabActiva === 'distancia' 
                ? 'bg-white text-[#001F3F] shadow-xs border border-slate-200/40' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Milestone size={11} />
            Por Distancia (KM)
          </button>
          <button 
            onClick={() => setTabActiva('presupuesto')}
            className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
              tabActiva === 'presupuesto' 
                ? 'bg-white text-[#001F3F] shadow-xs border border-slate-200/40' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <DollarSign size={11} />
            Por Presupuesto ($)
          </button>
        </div>

        {/* Contenido Dinámico de las Pestañas */}
        <div className="p-4 pt-1 space-y-4">
          
          {tabActiva === 'distancia' ? (
            /* CASO A: POR DISTANCIA */
            <div className="space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider ml-1">Distancia total a recorrer</label>
                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <input 
                    type="number"
                    placeholder="Ej: 380"
                    value={inputKm}
                    onChange={(e) => setInputKm(e.target.value)}
                    className="w-full bg-transparent font-black font-mono text-xs text-[#001F3F] focus:outline-none"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">KM</span>
                </div>
              </div>

              {/* Bloque Resultado */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 text-center shadow-inner mt-4">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Consumo proyectado estimado</p>
                <p className="font-mono text-xl font-black text-emerald-600 tracking-tight">
                  $ {resultadoDolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Gasto monetario esperado en ruta</p>
              </div>
            </div>
          ) : (
            /* CASO B: POR PRESUPUESTO */
            <div className="space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider ml-1">Valor asignado / Consumido</label>
                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-slate-400 font-bold text-xs mr-1">$</span>
                  <input 
                    type="number"
                    placeholder="Ej: 50.00"
                    value={inputDinero}
                    onChange={(e) => setInputDinero(e.target.value)}
                    className="w-full bg-transparent font-black font-mono text-xs text-[#001F3F] focus:outline-none"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">USD</span>
                </div>
              </div>

              {/* Bloque Resultado */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 text-center shadow-inner mt-4">
                <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1">Recorrido teórico obligatorio</p>
                <p className="font-mono text-xl font-black text-blue-600 tracking-tight">
                  {Math.round(resultadoKm).toLocaleString()} <span className="text-xs">KM</span>
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Distancia que debió cubrir la unidad</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#001F3F] text-white font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all hover:bg-black"
          >
            Cerrar
          </button>
        </footer>

      </div>
    </div>
  )
}