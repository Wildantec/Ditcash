'use client'
import { useState } from 'react'
import Swal from 'sweetalert2'

// 1. Definimos la interfaz para que TypeScript no de error
interface CrearUsuarioProps {
  onSuccess?: () => void;
}

export default function CrearUsuario({ onSuccess }: CrearUsuarioProps) {
  const [formData, setFormData] = useState({ nombre: '', cedula: '', password: '', rol: 'VENDEDOR' })
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'USUARIO CREADO',
          text: 'El acceso se ha registrado correctamente en Ditec.',
          confirmButtonColor: '#001F3F'
        })
        
        setFormData({ nombre: '', cedula: '', password: '', rol: 'VENDEDOR' })
        
        // 2. Ejecutamos onSuccess para que la tabla de abajo se refresque solita
        if (onSuccess) onSuccess();
        
      } else {
        Swal.fire('Error', 'No se pudo crear el usuario', 'error')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
        <h2 className="text-[#001F3F] font-black text-lg uppercase italic tracking-tighter">Registrar Nuevo Acceso</h2>
      </div>

      <form onSubmit={enviar} className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
          <input 
            placeholder="Ej: Juan Pérez" 
            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#FFB800] transition-all uppercase"
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Cédula / ID</label>
          <input 
            placeholder="172xxxxxxx" 
            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#FFB800] transition-all"
            value={formData.cedula}
            onChange={e => setFormData({...formData, cedula: e.target.value})}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#FFB800] transition-all"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Rol de Usuario</label>
          <select 
            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-[#001F3F] outline-none cursor-pointer appearance-none"
            value={formData.rol}
            onChange={e => setFormData({...formData, rol: e.target.value})}
          >
            <option value="VENDEDOR">VENDEDOR</option>
            <option value="ADMIN">ADMINISTRADOR</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <button 
            disabled={cargando}
            className="bg-[#001F3F] text-[#FFB800] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#FFB800] hover:text-[#001F3F] active:scale-95 transition-all disabled:opacity-50"
          >
            {cargando ? 'PROCESANDO...' : 'REGISTRAR ➔'}
          </button>
        </div>
      </form>
    </div>
  )
}