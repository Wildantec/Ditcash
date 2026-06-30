'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUsuarioByIdAction, actualizarUsuarioAction } from '@/app/actions/usuarios'
import { IdCard, ShieldCheck, User, ChevronDown, Users, Briefcase, FileSpreadsheet, Wallet, FileText, Wrench } from 'lucide-react'
import Swal from 'sweetalert2'

interface EditarUsuarioFormProps {
  usuarioId: number;
  onFormSuccess?: () => void;
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

export default function EditarUsuarioForm({ usuarioId, onFormSuccess }: EditarUsuarioFormProps) {
  const router = useRouter()

  const [formData, setFormData] = useState({ 
    nombre: '', 
    cedula: '', 
    rol: '', 
    activo: true 
  })
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    async function cargar() {
      const u = await getUsuarioByIdAction(usuarioId)
      if (u) {
        setFormData({
          nombre: u.vendedor?.nombre || u.nombre || '',
          cedula: u.cedula,
          rol: u.rol || 'VENDEDOR',
          activo: u.activo
        })
      }
      setLoading(false)
    }
    cargar()
  }, [usuarioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await actualizarUsuarioAction(usuarioId, formData)
    
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">CAMBIOS GUARDADOS</span>',
        text: 'El perfil de Ditec ha sido actualizado correctamente.',
        confirmButtonColor: '#001F3F'
      }).then(() => {
        if (onFormSuccess) {
          onFormSuccess()
        } else {
          router.push('/dashboard/admin/usuarios')
          router.refresh()
        }
      })
    } else {
      Swal.fire('Error de Sincronización', res.error || 'Error desconocido en base de datos', 'error')
      setLoading(false)
    }
  }

  const currentRol = ROLES.find(r => r.value === formData.rol) || ROLES[2]

  if (loading) return (
    <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#001F3F] animate-pulse">
      Sincronizando con Ditec...
    </div>
  )

  return (
    <div className="w-full max-w-2xl mx-auto text-[#001F3F] bg-white">
      <header className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-1.5 h-6 bg-[#FFB800] rounded-full" />
        <h2 className="text-[#001F3F] font-black text-lg uppercase italic tracking-tighter">
          Configurar Acceso Operativo
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <User size={11} className="text-slate-400" /> Nombre Completo
          </label>
          <input 
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all uppercase shadow-inner"
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
              <IdCard size={11} className="text-slate-400" /> Cédula / ID
            </label>
            <input 
              placeholder="172xxxxxxx" 
              maxLength={10}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all font-mono tracking-widest shadow-inner"
              value={formData.cedula}
              onChange={e => setFormData({...formData, cedula: e.target.value.replace(/\D/g, '')})}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
              ● Estado de Acceso
            </label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-[#001F3F] outline-none cursor-pointer shadow-inner uppercase tracking-wider h-[50px] appearance-none"
                value={formData.activo ? 'true' : 'false'}
                onChange={e => setFormData({...formData, activo: e.target.value === 'true'})}
              >
                <option value="true">● USUARIO ACTIVO</option>
                <option value="false">○ BLOQUEAR ACCESO</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5" ref={dropdownRef}>
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
                <span className="tracking-wider">{currentRol.label}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FFB800]' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-50">
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
                      className={`w-full px-5 py-3.5 text-left font-black text-xs transition-colors flex items-center gap-2 tracking-wider ${
                        formData.rol === rol.value 
                          ? 'bg-[#001F3F] text-[#FFB800]' 
                          : 'text-[#001F3F] hover:bg-slate-50/80'
                      }`}
                    >
                      <Icon size={14} className={formData.rol === rol.value ? 'text-[#FFB800]' : 'text-slate-400'} />
                      <span>{rol.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit"
            className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] py-4 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-black hover:text-[#FFB800] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 min-h-[50px]"
          >
            <span>Actualizar</span>
          </button>
        </div>
      </form>
    </div>
  )
}