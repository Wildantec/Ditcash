'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Briefcase, Loader2, User, IdCard, Key } from 'lucide-react'

interface CrearVendedorProps {
  onSuccess?: () => void
}

export default function CrearVendedor({ onSuccess }: CrearVendedorProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    password: '',
    estado: 'Activo'
  })
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const guardarVendedor = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🛡️ VALIDACIÓN DE CÉDULA DE 10 DÍGITOS
    const cedulaLimpia = formData.cedula.trim()
    if (!/^\d{10}$/.test(cedulaLimpia)) {
      Swal.fire({
        title: '<span style="font-size:15px; font-weight:bold; color:#ef4444;">CÉDULA INVÁLIDA</span>',
        text: 'No se puede registrar el vendedor: El número de cédula debe contener exactamente 10 dígitos numéricos.',
        icon: 'warning',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'REVISAR CÉDULA'
      })
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/admin/vendedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cedula: cedulaLimpia,
          nombre: formData.nombre.trim().toUpperCase()
        })
      })

      if (res.ok) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡REGISTRO EXITOSO!</span>',
          text: `El vendedor ${formData.nombre.toUpperCase()} ha sido creado correctamente en el sistema.`,
          icon: 'success',
          confirmButtonColor: '#001F3F',
          confirmButtonText: 'CONTINUAR'
        })

        setFormData({ nombre: '', cedula: '', password: '', estado: 'Activo' })
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({}))
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
          text: errorData.message || errorData.error || 'No se pudo completar el registro del vendedor.',
          icon: 'warning',
          confirmButtonColor: '#001F3F',
          confirmButtonText: 'REVISAR DATOS'
        })
      }
    } catch (error) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR CRÍTICO</span>',
        text: 'Error al validar los datos con el servidor contable.',
        icon: 'error',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'ENTENDIDO'
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-6 text-[#001F3F]">
      <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-[#001F3F] shadow-inner">
          <Briefcase size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-base font-black uppercase italic tracking-tight text-[#001F3F]">
            Registrar Nuevo <span className="text-[#FFB800]">Vendedor</span>
          </h2>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mt-0.5">
            Alta de credenciales operativas para el personal de ventas
          </p>
        </div>
      </div>

      <form onSubmit={guardarVendedor} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Nombre Completo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <User size={11} className="text-slate-400" /> Nombre Completo
          </label>
          <input 
            type="text"
            placeholder="EJ: JUAN PÉREZ"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-xs font-black rounded-xl uppercase focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner text-slate-700"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>

        {/* Cédula */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <IdCard size={11} className="text-slate-400" /> Cédula (10 Dígitos)
          </label>
          <input 
            type="text"
            maxLength={10}
            placeholder="1720000000"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-xs font-black rounded-xl focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner font-mono tracking-widest text-slate-700"
            value={formData.cedula}
            onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
            required
          />
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <Key size={11} className="text-slate-400" /> Contraseña
          </label>
          <input 
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner text-slate-700"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        {/* Botón Submit */}
        <button 
          disabled={cargando}
          className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] font-black text-[10px] uppercase py-3.5 rounded-xl shadow-md hover:bg-black hover:text-[#FFB800] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 h-[42px]"
        >
          {cargando ? (
            <>
              <Loader2 size={13} className="animate-spin" strokeWidth={2.5} />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Crear Vendedor</span>
          )}
        </button>
      </form>
    </div>
  )
}