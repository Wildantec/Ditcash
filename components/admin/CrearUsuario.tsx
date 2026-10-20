'use client'

import { useState, useRef, useEffect } from 'react'
import { IdCard, ShieldCheck, User, Key, Loader2, ChevronDown } from 'lucide-react'
import Swal from 'sweetalert2'
import { obtenerRolesParaAsignacionAction } from '@/app/actions/roles'
import { crearUsuarioAction } from '@/app/actions/usuarios'

interface CrearUsuarioProps {
  onSuccess?: () => void
}

export default function CrearUsuario({ onSuccess }: CrearUsuarioProps) {
  const [formData, setFormData] = useState({ 
    nombre: '', 
    cedula: '', 
    password: '', 
    username: '' 
  })

  // Estado para guardar la lista de roles dinámicos de la BD
  const [rolesBD, setRolesBD] = useState<any[]>([])
  const [rolSeleccionado, setRolSeleccionado] = useState<any | null>(null)
  
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar roles dinámicos de la BD al montar el componente
  useEffect(() => {
    async function cargarRoles() {
      try {
        setLoadingRoles(true)
        const res = await obtenerRolesParaAsignacionAction()
        if (res.success && res.roles) {
          setRolesBD(res.roles)
          if (res.roles.length > 0) {
            setRolSeleccionado(res.roles[0]) // Selecciona el primero por defecto
          }
        }
      } catch (error) {
        console.error('Error al cargar roles dinámicos:', error)
      } finally {
        setLoadingRoles(false)
      }
    }
    cargarRoles()
  }, [])

  // Cerrar el dropdown al hacer clic fuera
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

    // 🛡️ VALIDACIÓN DE CÉDULA A 10 DÍGITOS
    const cedulaLimpia = formData.cedula.trim()
    if (!/^\d{10}$/.test(cedulaLimpia)) {
      Swal.fire({
        title: '<span style="font-size:15px; font-weight:bold; color:#ef4444;">CÉDULA INVÁLIDA</span>',
        text: 'No se puede crear el usuario: El número de cédula debe contener exactamente 10 dígitos numéricos.',
        icon: 'warning',
        confirmButtonColor: '#001F3F'
      })
      return
    }

    if (!rolSeleccionado) {
      Swal.fire('Atención', 'Debes seleccionar un rol para el usuario.', 'warning')
      return
    }

    setCargando(true)

    try {
      // Intentar enviar mediante Server Action (o fallback fetch si usas API Route)
      const res = await crearUsuarioAction({
        username: formData.username.trim() || formData.cedula.trim(),
        cedula: cedulaLimpia,
        nombreCompleto: formData.nombre.trim(),
        password: formData.password,
        rol: rolSeleccionado.nombre,
        roleId: rolSeleccionado.id
      })

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">USUARIO CREADO</span>',
          text: `El acceso para ${formData.nombre.toUpperCase()} se ha registrado correctamente.`,
          confirmButtonColor: '#001F3F'
        })

        setFormData({ nombre: '', cedula: '', password: '', username: '' })
        if (onSuccess) onSuccess()
      } else {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; color:#ef4444;">NO SE PUDO REGISTRAR</span>',
          text: res.error || 'Ocurrió un error al crear el usuario',
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

  return (
    <div className="text-[#001F3F] bg-white">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
        <div className="w-1.5 h-5 bg-[#FFB800] rounded-full" />
        <h2 className="text-[#001F3F] font-black text-base uppercase italic tracking-tighter">
          Registrar Nuevo Acceso
        </h2>
      </div>

      <form onSubmit={enviar} className="space-y-3">
        {/* Nombre Completo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <User size={11} className="text-slate-400" /> Nombre Completo
          </label>
          <input 
            placeholder="Ej: Juan Pérez" 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all uppercase shadow-inner"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>

        {/* Cédula y Contraseña */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
              <IdCard size={11} className="text-slate-400" /> Cédula / ID (10 dígitos)
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Key size={11} className="text-slate-400" /> Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#001F3F] outline-none focus:border-[#001F3F] focus:bg-white transition-all shadow-inner"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Dropdown de Roles Dinámicos de BD */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <ShieldCheck size={11} className="text-slate-400" /> Rol de Usuario
          </label>
          
          {loadingRoles ? (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 font-bold animate-pulse">
              Cargando roles desde la BD...
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-[#001F3F] transition-all shadow-inner flex items-center justify-between hover:bg-slate-100/50"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#FFB800]" />
                  <span>{rolSeleccionado ? rolSeleccionado.nombre : 'SELECCIONAR ROL'}</span>
                </div>
                <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto">
                  {rolesBD.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 font-bold text-center">No hay roles creados</div>
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
          )}
        </div>

        {/* Botón de Enviar */}
        <div className="pt-2 flex justify-end">
          <button 
            disabled={cargando || loadingRoles}
            className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] py-3.5 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-black hover:text-[#FFB800] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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