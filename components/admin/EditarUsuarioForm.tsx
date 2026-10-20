'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUsuarioByIdAction, actualizarUsuarioAction } from '@/app/actions/usuarios'
import { obtenerRolesParaAsignacionAction } from '@/app/actions/roles'
import { IdCard, ShieldCheck, User, ChevronDown, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface EditarUsuarioFormProps {
  usuarioId: number;
  onFormSuccess?: () => void;
}

export default function EditarUsuarioForm({ usuarioId, onFormSuccess }: EditarUsuarioFormProps) {
  const router = useRouter()

  const [formData, setFormData] = useState({ 
    nombre: '', 
    cedula: '', 
    activo: true 
  })

  const [rolesBD, setRolesBD] = useState<any[]>([])
  const [rolSeleccionado, setRolSeleccionado] = useState<any | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
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
    async function cargarDatos() {
      try {
        setLoading(true)
        const [u, resRoles] = await Promise.all([
          getUsuarioByIdAction(usuarioId),
          obtenerRolesParaAsignacionAction()
        ])

        const listaRoles = resRoles?.roles || []
        setRolesBD(listaRoles)

        if (u) {
          setFormData({
            nombre: u.vendedor?.nombre || u.nombre || '',
            cedula: u.cedula || '',
            activo: u.activo
          })
          const rolEncontrado = listaRoles.find(r => r.id === u.roleId || r.nombre === u.rol)
          if (rolEncontrado) {
            setRolSeleccionado(rolEncontrado)
          } else if (listaRoles.length > 0) {
            setRolSeleccionado(listaRoles[0])
          }
        }
      } catch (err) {
        console.error('Error cargando usuario o roles:', err)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [usuarioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cedulaLimpia = formData.cedula.trim()
    if (!/^\d{10}$/.test(cedulaLimpia)) {
      Swal.fire({
        title: '<span style="font-size:15px; font-weight:bold; color:#ef4444;">CÉDULA INVÁLIDA</span>',
        text: 'No se pueden guardar los cambios: El número de cédula debe tener exactamente 10 dígitos numéricos.',
        icon: 'warning',
        confirmButtonColor: '#001F3F'
      })
      return
    }

    if (!rolSeleccionado) {
      Swal.fire('Atención', 'Debes seleccionar un rol para el usuario.', 'warning')
      return
    }

    setGuardando(true)

    const payload = {
      nombre: formData.nombre.trim(),
      cedula: cedulaLimpia,
      activo: formData.activo,
      rol: rolSeleccionado.nombre,
      roleId: rolSeleccionado.id
    }

    const res = await actualizarUsuarioAction(usuarioId, payload)
    setGuardando(false)
    
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">CAMBIOS GUARDADOS</span>',
        text: 'El perfil de usuario ha sido actualizado correctamente.',
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
      Swal.fire('Error de Actualización', res.error || 'Error en base de datos', 'error')
    }
  }

  if (loading) return (
    <div className="p-8 text-center text-xs font-black uppercase tracking-widest text-[#001F3F] animate-pulse">
      Cargando perfil desde la base de datos...
    </div>
  )

  return (
    <div className="w-full text-[#001F3F] bg-white">
      <header className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="w-1.5 h-5 bg-[#FFB800] rounded-full" />
        <h2 className="text-[#001F3F] font-black text-base uppercase italic tracking-tighter">
          Editar Acceso Operativo
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nombre Completo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <User size={11} className="text-slate-400" /> Nombre Completo
          </label>
          <input 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all uppercase shadow-inner"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>

        {/* Cédula y Estado de Acceso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
              <IdCard size={11} className="text-slate-400" /> Cédula (10 dígitos)
            </label>
            <input 
              placeholder="172xxxxxxx" 
              maxLength={10}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all font-mono tracking-widest shadow-inner"
              value={formData.cedula}
              onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              ● Estado de Acceso
            </label>
            <div className="relative">
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] outline-none cursor-pointer shadow-inner uppercase tracking-wider h-[42px] appearance-none"
                value={formData.activo ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, activo: e.target.value === 'true' })}
              >
                <option value="true">● USUARIO ACTIVO</option>
                <option value="false">○ BLOQUEAR ACCESO</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selector Desplegable de Roles Dinámicos */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <ShieldCheck size={11} className="text-slate-400" /> Rol de Usuario
          </label>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] transition-all shadow-inner flex items-center justify-between hover:bg-slate-100/50"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#FFB800]" />
                <span className="tracking-wider">{rolSeleccionado ? rolSeleccionado.nombre : 'SELECCIONAR ROL'}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FFB800]' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto divide-y divide-slate-50">
                {rolesBD.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 font-bold text-center">No hay roles registrados</div>
                ) : (
                  rolesBD.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setRolSeleccionado(r)
                        setIsOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left font-black text-xs transition-colors flex items-center gap-2 ${
                        rolSeleccionado?.id === r.id 
                          ? 'bg-[#001F3F] text-[#FFB800]' 
                          : 'text-[#001F3F] hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck size={13} className={rolSeleccionado?.id === r.id ? 'text-[#FFB800]' : 'text-slate-400'} />
                      <span>{r.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div className="pt-2 flex justify-end">
          <button 
            type="submit"
            disabled={guardando}
            className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] py-3.5 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-black hover:text-[#FFB800] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 h-[44px]"
          >
            {guardando ? (
              <>
                <Loader2 size={13} className="animate-spin" strokeWidth={2.5} />
                <span>Actualizando...</span>
              </>
            ) : (
              <span>Actualizar Cambios</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}