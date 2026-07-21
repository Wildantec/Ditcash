'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Calculator, Milestone, DollarSign, Fuel } from 'lucide-react'

interface CalculadoraProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalculadoraCombustibleModal({ isOpen, onClose }: CalculadoraProps) {

  const [precioGalon, setPrecioGalon] = useState<string>('2.96')
  const AUTONOMIA_FIJA = 51.14
  const [costoPorKm, setCostoPorKm] = useState<number>(0)


  const [tabActiva, setTabActiva] = useState<'distancia' | 'presupuesto'>('distancia')


  const [inputKm, setInputKm] = useState<string>('380')
  const [resultadoDolares, setResultadoDolares] = useState<number>(0)

  const [inputDinero, setInputDinero] = useState<string>('50.00')
  const [resultadoKm, setResultadoKm] = useState<number>(0)

  const [posicion, setPosicion] = useState({ x: 0, y: 0 })
  const [estaArrastrando, setEstaArrastrando] = useState(false)
  const [relativaPos, setRelativaPos] = useState({ x: 0, y: 0 })
  
  const modalRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (isOpen) {
      const xCentrado = window.innerWidth / 2 - 210
      const yCentrado = window.innerHeight / 2 - 240
      setPosicion({ x: xCentrado, y: yCentrado })
    }
  }, [isOpen])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!estaArrastrando) return
      
      let nuevaX = e.clientX - relativaPos.x
      let nuevaY = e.clientY - relativaPos.y

      if (nuevaX < 0) nuevaX = 0
      if (nuevaY < 0) nuevaY = 0
      if (nuevaX > window.innerWidth - 420) nuevaX = window.innerWidth - 420
      if (nuevaY > window.innerHeight - 450) nuevaY = window.innerHeight - 450

      setPosicion({ x: nuevaX, y: nuevaY })
    }

    const handleMouseUp = () => {
      setEstaArrastrando(false)
    }

    if (estaArrastrando) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [estaArrastrando, relativaPos])


  useEffect(() => {
    const precio = parseFloat(precioGalon) || 0
    if (precio > 0) {
      const ckm = precio / AUTONOMIA_FIJA
      setCostoPorKm(ckm)

      const kms = parseFloat(inputKm) || 0
      setResultadoDolares(kms * ckm)

      const dinero = parseFloat(inputDinero) || 0
      setResultadoKm(ckm > 0 ? dinero / ckm : 0)
    } else {
      setCostoPorKm(0)
      setResultadoDolares(0)
      setResultadoKm(0)
    }
  }, [precioGalon, inputKm, inputDinero])

  if (!isOpen) return null

  const iniciarArrastre = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.boton-cerrar-simulador')) return
    setEstaArrastrando(true)
    setRelativaPos({
      x: e.clientX - posicion.x,
      y: e.clientY - posicion.y
    })
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        ref={modalRef}
        style={{ left: `${posicion.x}px`, top: `${posicion.y}px` }}
        className="absolute w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 pointer-events-auto flex flex-col text-[#001F3F] font-sans select-none"
      >

        <header 
          onMouseDown={iniciarArrastre}
          className={`bg-[#001F3F] p-4 text-white relative rounded-t-3xl cursor-move transition-colors ${estaArrastrando ? 'bg-black' : ''}`}
        >
          <button 
            onClick={onClose} 
            className="boton-cerrar-simulador absolute top-4 right-4 text-slate-400 hover:text-[#FFB800] transition-colors"
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

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-2">Variables del Sistema (Excel Base)</p>
          <div className="grid grid-cols-2 gap-3">
            
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

            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Autonomía Fija</span>
                <span className="font-mono font-black text-xs text-slate-500">{AUTONOMIA_FIJA} KM/GAL</span>
              </div>
            </div>

          </div>

          <div className="mt-3 bg-[#001F3F]/5 border border-[#001F3F]/10 rounded-xl p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Fuel size={11} className="text-[#001F3F]" /> Costo x KM Proporcional:
            </span>
            <span className="font-mono font-black text-xs text-[#001F3F] bg-[#FFB800] px-2 py-0.5 rounded-md">
              $ {costoPorKm.toFixed(4)}
            </span>
          </div>
        </div>

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

        <div className="p-4 pt-1 space-y-4">
          
          {tabActiva === 'distancia' ? (

            <div className="space-y-3">
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

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 text-center shadow-inner mt-4">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Consumo proyectado estimado</p>
                <p className="font-mono text-xl font-black text-emerald-600 tracking-tight">
                  $ {resultadoDolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Gasto monetario esperado en ruta</p>
              </div>
            </div>
          ) : (

            <div className="space-y-3">
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

        <footer className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Arrastra desde la cabecera azul</p>
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