'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Briefcase, Loader2 } from 'lucide-react'

export default function CrearVendedor() {
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
    setCargando(true)

    try {
      const res = await fetch('/api/admin/vendedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
        router.refresh()
      } else {
        const errorData = await res.json()
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
          text: errorData.message || "No se pudo completar el registro del vendedor.",
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
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 text-[#001F3F]">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#001F3F] shadow-inner">
          <Briefcase size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase italic tracking-tight text-[#001F3F]">
            Registrar Nuevo <span className="text-[#FFB800]">Vendedor</span>
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mt-0.5">
            Alta de credenciales operativas para el personal de ventas
          </p>
        </div>
      </div>
      <form onSubmit={guardarVendedor} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
          <input 
            type="text"
            placeholder="EJ: JUAN PÉREZ"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-xs font-black rounded-xl uppercase focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner text-slate-700"
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cédula de Identidad</label>
          <input 
            type="text"
            maxLength={10}
            placeholder="0000000000"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-xs font-black rounded-xl focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner font-mono tracking-widest text-slate-700"
            value={formData.cedula}
            onChange={e => setFormData({...formData, cedula: e.target.value.replace(/\D/g, '')})}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asignar Contraseña</label>
          <input 
            type="password"
            placeholder="••••••••"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner text-slate-700"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button 
          disabled={cargando}
          className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] font-black text-[11px] uppercase py-4 rounded-xl shadow-md hover:bg-white hover:text-[#001F3F] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 h-[46px]"
        >
          {cargando ? (
            <>
              <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
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