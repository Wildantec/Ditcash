'use client'

import { useState } from 'react'
import { registrarCierreRutaDiario, registrarInicioJornada } from '@/app/actions/combustible'
import { Navigation, Gauge, AlertTriangle, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface VistaMovilProps {
  userId: number
  vehiculos: any[]
  rutaAbiertaInicial: any
  placaSugerida: string
  kmSugerido: number
}

export default function VistaMovilRutaClient({ userId, vehiculos, rutaAbiertaInicial, placaSugerida, kmSugerido }: VistaMovilProps) {
  const [rutaAbierta, setRutaAbierta] = useState(rutaAbiertaInicial)
  const [loading, setLoading] = useState(false)
  const [placa, setPlaca] = useState(rutaAbiertaInicial ? rutaAbiertaInicial.placaCarro : placaSugerida)
  const [kmTablero, setKmTablero] = useState(rutaAbiertaInicial ? '' : kmSugerido.toString())

  function rutaAbiertaAnterior() {
    return !!rutaAbierta
  }

  const handleManejoJornada = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. ABRIR JORNADA (Matutina - Registro Manual)
    if (!rutaAbiertaAnterior()) {
      const res = await registrarInicioJornada({
        userId,
        placaCarro: placa,
        kmInicial: parseFloat(kmTablero)
      })

      if (res.success) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡RUTA INICIALIZADA!</span>',
          text: 'Buen viaje. Registra tu kilometraje final al retornar a la empresa.',
          icon: 'success',
          confirmButtonColor: '#001F3F'
        }).then(() => { window.location.reload() })
      } else {
        Swal.fire('Error', res.error, 'error')
        setLoading(false)
      }
    } 
    // 2. CERRAR JORNADA (Vespertina - Registro Manual)
    else {
      const carroSeleccionado = vehiculos.find(v => v.placa === rutaAbierta.placaCarro)
      const kmInicialDeLaManana = carroSeleccionado?.kmActual || 0
      const kmFinalDigitado = parseFloat(kmTablero)

      if (kmFinalDigitado <= kmInicialDeLaManana) {
        Swal.fire({
          title: '<span style="font-size:14px; font-weight:bold; color:#001F3F;">VERIFICAR TABLERO</span>',
          text: `El kilometraje de cierre no puede ser menor o igual al de la mañana (${kmInicialDeLaManana.toLocaleString()} KM).`,
          icon: 'warning',
          confirmButtonColor: '#001F3F'
        })
        setLoading(false)
        return
      }

      // Calculamos la diferencia neta de kilómetros recorridos en el día
      const kmRecorridosNetos = kmFinalDigitado - kmInicialDeLaManana

      const res = await registrarCierreRutaDiario({
        userId,
        placaCarro: rutaAbierta.placaCarro,
        kmRecorridos: kmRecorridosNetos
      })

      if (res.success) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡JORNADA COMPLETADA!</span>',
          text: `Kilómetros del día guardados: ${kmRecorridosNetos.toLocaleString()} KM.`,
          icon: 'success',
          confirmButtonColor: '#001F3F'
        }).then(() => { window.location.reload() })
      } else {
        Swal.fire('Error', res.error, 'error')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-[#001F3F]">
      <div className="bg-white w-full max-w-[450px] rounded-[3rem] p-8 shadow-xl border border-slate-100">
        <header className="mb-8 text-center flex flex-col items-center justify-center gap-1">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#001F3F] shadow-inner mb-2">
            <Navigation size={20} strokeWidth={2.5} className={rutaAbiertaAnterior() ? "text-rose-500 animate-pulse" : "text-[#FFB800]"} />
          </div>
          <h2 className="text-2xl font-black text-[#001F3F] tracking-tighter italic uppercase leading-none">
            {rutaAbiertaAnterior() ? 'Cierre de Ruta' : 'Inicio de Ruta'}
          </h2>
          <p className="text-[#FFB800] text-[9px] font-black uppercase tracking-[0.3em] mt-1">
            {rutaAbiertaAnterior() ? 'DITCASH - TERMINAR TRABAJO' : 'DITCASH - TAXÍMETRO VENDEDOR'}
          </p>
        </header>

        {rutaAbiertaAnterior() && (
          <div className="mb-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-left">
            <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-[11px] font-black uppercase text-rose-700 tracking-wide">Jornada Activa en Curso</p>
              <p className="text-[10px] text-rose-600 font-bold mt-0.5">Estás manejando la unidad de placa <span className="font-mono font-black underline">{rutaAbierta.placaCarro}</span>. Ingresa los kilómetros actuales del tablero para liberar el carro.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleManejoJornada} className="space-y-5">
          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Unidad Asignada</label>
            <div className="relative">
              <select
                disabled={rutaAbiertaAnterior()}
                value={placa}
                onChange={(e) => {
                  setPlaca(e.target.value)
                  const carro = vehiculos.find(v => v.placa === e.target.value)
                  if (carro) setKmTablero(carro.kmActual.toString())
                }}
                className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.6rem] font-black text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] tracking-widest cursor-pointer shadow-inner disabled:opacity-70 disabled:bg-slate-100"
              >
                <option value="">-- SELECCIONE SU PLACA --</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.placa}>
                    {v.placa} - {v.marcaModelo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
              {rutaAbiertaAnterior() ? 'Kilometraje Final del Tablero *' : 'Confirmar Kilometraje Inicial *'}
            </label>
            <div className="relative">
              <input 
                type="number"
                required
                placeholder="Ej: 105420"
                value={kmTablero}
                onChange={(e) => setKmTablero(e.target.value)}
                className={`w-full px-6 py-3.5 border rounded-[1.6rem] font-black text-xs text-[#001F3F] focus:outline-none transition-all shadow-inner font-mono tracking-widest ${
                  rutaAbiertaAnterior() ? 'bg-rose-50/20 border-rose-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-[#001F3F]'
                }`}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold ml-4 mt-0.5">
              * Digita exactamente el número entero que marca el tablero del vehículo.
            </p>
          </div>

          <div className="pt-4">
            <button
              disabled={loading || !placa}
              className={`w-full text-white px-8 py-4 rounded-[1.6rem] font-black text-[11px] uppercase tracking-widest shadow-md transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 ${
                rutaAbiertaAnterior() 
                  ? 'bg-rose-600 hover:bg-rose-700 border border-rose-600' 
                  : 'bg-[#001F3F] text-[#FFB800] border border-[#001F3F] hover:bg-black'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" strokeWidth={2.5} />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <span>{rutaAbiertaAnterior() ? 'Finalizar Ruta Diaria ➔' : 'Abrir Ruta Matutina ➔'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}