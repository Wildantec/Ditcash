'use client'

import { useState, useRef, useEffect } from 'react'
import { IdCard, ShieldCheck, User, Key, Loader2, ChevronDown, Users, Briefcase,FileSpreadsheet, Wallet, FileText, Wrench } from 'lucide-react'
import Swal from 'sweetalert2'

interface CrearUsuarioProps {
  onSuccess?: () => void;
}
const ROLES = [
  { value: 'ADMIN', label: 'ADMINISTRADOR', icon: ShieldCheck },
  { value: 'MARKETING', label: 'MARKETING', icon: Users },
  { value: 'VENDEDOR', label: 'VENDEDOR', icon: Briefcase },
  { value: 'CONTABILIDAD', label: 'CONTABILIDAD', icon: FileSpreadsheet },
  { value: 'COBRANZAS', label: 'COBRANZAS', icon: Wallet },
  { value: 'FACTURACION', label: 'FACTURACIÓN', icon: FileText },
  { value: 'SERVICIO_TECNICO', label: 'SERVICIO TÉCNICO', icon: Wrench }
]

export default function CrearUsuario({ onSuccess }: CrearUsuarioProps) {
  const [formData, setFormData] = useState({ nombre: '', cedula: '', password: '', rol: 'VENDEDOR' })
  const [cargando, setCargando] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">USUARIO CREADO</span>',
          text: 'El acceso se ha registrado correctamente en Ditec.',
          confirmButtonColor: '#001F3F'
        })
        
        setFormData({ nombre: '', cedula: '', password: '', rol: 'VENDEDOR' })
        if (onSuccess) onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({}));
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; color:#ef4444;">ERROR</span>',
          text: errorData.message || 'No se pudo crear el usuario',
          icon: 'error',
          confirmButtonColor: '#001F3F'
        })
      }
    } catch (error) {
      Swal.fire('Error Crítico', 'Fallo de conexión con el servidor.', 'error')
    } finally {
      setCargando(false)
    }
  }

  const currentRol = ROLES.find(r => r.value === formData.rol) || ROLES[0]

  return (
    <div className="text-[#001F3F] bg-white">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
        <h2 className="text-[#001F3F] font-black text-lg uppercase italic tracking-tighter">
          Registrar Nuevo Acceso
        </h2>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <User size={11} className="text-slate-400" /> Nombre Completo
          </label>
          <input 
            placeholder="Ej: Juan Pérez" 
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all uppercase shadow-inner"
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
              <IdCard size={11} className="text-slate-400" /> Cédula / ID
            </label>
            <input 
              placeholder="172xxxxxxx" 
              maxLength={10}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all font-mono tracking-widest shadow-inner"
              value={formData.cedula}
              onChange={e => setFormData({...formData, cedula: e.target.value.replace(/\D/g, '')})}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
              <Key size={11} className="text-slate-400" /> Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1" ref={dropdownRef}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <ShieldCheck size={11} className="text-slate-400" /> Rol de Usuario
          </label>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] transition-all shadow-inner flex items-center justify-between hover:bg-slate-100/50"
            >
              <div className="flex items-center gap-2">
                <currentRol.icon size={14} className="text-[#FFB800]" />
                <span>{currentRol.label}</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                {ROLES.map((rol) => {
                  const Icon = rol.icon;
                  return (
                    <button
                      key={rol.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, rol: rol.value })
                        setIsOpen(false)
                      }}
                      className={`w-full px-5 py-3.5 text-left font-black text-xs transition-colors flex items-center gap-2 ${
                        formData.rol === rol.value 
                          ? 'bg-[#001F3F] text-[#FFB800]' 
                          : 'text-[#001F3F] hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} className={formData.rol === rol.value ? 'text-[#FFB800]' : 'text-slate-400'} />
                      {rol.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button 
            disabled={cargando}
            className="w-full sm:w-auto bg-[#001F3F] text-[#FFB800] border border-[#001F3F] py-4 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-black hover:text-[#FFB800] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 min-h-[48px]"
          >
            {cargando ? (
              <>
                <Loader2 size={13} className="animate-spin" strokeWidth={2.5} />
                <span>Procesando...</span>
              </>
            ) : (
              <span>Registrar ➔</span>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}