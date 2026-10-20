'use client'

import { useState } from 'react'
import { guardarRolAction, PermisoModulo } from '@/app/actions/roles'
import Swal from 'sweetalert2'
import { 
  ShieldCheck, Loader2, ChevronDown, 
  Search, Gift, Wrench, FileSpreadsheet as GasIcon, FileText, Settings 
} from 'lucide-react'

const ESTRUCTURA_PERMISOS = [
  {
    id: 'operaciones',
    label: 'Auditoría Campo',
    icon: Search,
    submodulos: [
      { id: 'vendedores', label: 'Monitoreo Asesores' },
      { id: 'campanas', label: 'Control Campañas' },
      { id: 'canjes', label: 'Validar Canjes' },
      { id: 'historial', label: 'Historial Entregas' }
    ]
  },
  {
    id: 'incentivos',
    label: 'Premios & Stock',
    icon: Gift,
    submodulos: [
      { id: 'premios', label: 'Catálogo Premios' },
      { id: 'inventario', label: 'Inventario Global' },
      { id: 'bodegas', label: 'Bodegas' }
    ]
  },
  {
    id: 'logistica',
    label: 'Logística y Activos',
    icon: Wrench,
    submodulos: [
      { id: 'vehiculos', label: 'Flota de Vehículos' },
      { id: 'mantenimientos', label: 'Servicio y Reparaciones' }
    ]
  },
  {
    id: 'contabilidad_modulo',
    label: 'Contabilidad',
    icon: GasIcon,
    submodulos: [
      { id: 'vehiculos_cont', label: 'Vehículos' },
      { id: 'estaciones', label: 'Estaciones' },
      { id: 'facturas_comb', label: 'Ingresar Factura' }
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: FileText,
    submodulos: [
      { id: 'facturacion', label: 'Facturación Comercial' },
      { id: 'cobranzas', label: 'Gestión de Cartera' }
    ]
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    submodulos: [
      { id: 'usuarios', label: 'Gestión Usuarios' },
      { id: 'roles', label: 'Gestión de Roles y Permisos' }
    ]
  }
]

interface CrearRolFormProps {
  onSuccess: () => void
}

export default function CrearRolForm({ onSuccess }: CrearRolFormProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)

  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null)

  const [matrizPermisos, setMatrizPermisos] = useState<PermisoModulo[]>(() => {
    const lista: PermisoModulo[] = []
    ESTRUCTURA_PERMISOS.forEach(seccion => {
      seccion.submodulos.forEach(m => {
        lista.push({ modulo: m.id, ver: false, crear: false, editar: false, eliminar: false })
      })
    })
    return lista
  })

  const toggleSeccionExclusiva = (id: string) => {
    setSeccionAbierta(prev => (prev === id ? null : id))
  }

  const buscarPermiso = (submoduloId: string): PermisoModulo => {
    return matrizPermisos.find(p => p.modulo === submoduloId) || {
      modulo: submoduloId,
      ver: false,
      crear: false,
      editar: false,
      eliminar: false
    }
  }

  const handleSwitchChange = (submoduloId: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    setMatrizPermisos(prev =>
      prev.map(item => {
        if (item.modulo === submoduloId) {
          const nuevoValor = !item[campo]
          const copia = { ...item, [campo]: nuevoValor }

          if (campo === 'ver' && !nuevoValor) {
            copia.crear = false
            copia.editar = false
            copia.eliminar = false
          }
          if ((campo === 'crear' || campo === 'editar' || campo === 'eliminar') && nuevoValor) {
            copia.ver = true
          }
          return copia
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      Swal.fire('Atención', 'El nombre del rol es obligatorio.', 'warning')
      return
    }

    setLoading(true)
    const res = await guardarRolAction({
      nombre,
      descripcion,
      permisos: matrizPermisos
    })
    setLoading(false)

    if (res.success) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; color:#001F3F;">¡ROL CREADO!</span>',
        text: `El rol "${nombre.toUpperCase()}" ha sido guardado exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#001F3F'
      })
      onSuccess()
    } else {
      Swal.fire('Error', res.error || 'No se pudo registrar el rol', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#001F3F]">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="p-2 bg-[#001F3F] text-[#FFB800] rounded-xl shadow-md">
          <ShieldCheck size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-base font-black uppercase italic tracking-tighter text-[#001F3F]">Nuevo Rol Dinámico</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Define el identificador y asigna sus privilegios por módulo</p>
        </div>
      </div>

      {/* Datos Básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nombre del Rol</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="EJ: SUPERVISOR_TECNICO"
            className="w-full border border-slate-200 p-3 rounded-xl font-black uppercase text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] bg-slate-50/50"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Descripción (Opcional)</label>
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Alcance del rol en el sistema"
            className="w-full border border-slate-200 p-3 rounded-xl font-medium text-xs text-[#001F3F] focus:outline-none focus:border-[#001F3F] bg-slate-50/50"
          />
        </div>
      </div>

      {/* Lista de Módulos (Exactamente igual al modal del engranaje) */}
      <div>
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
          Matriz de Accesos por Módulo
        </label>
        
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {ESTRUCTURA_PERMISOS.map(seccion => {
            const isAbierto = seccionAbierta === seccion.id

            return (
              <div key={seccion.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeccionExclusiva(seccion.id)}
                  className="w-full bg-slate-50/50 px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white shadow-sm rounded-lg border border-slate-100 text-[#001F3F]">
                      <seccion.icon size={15} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest text-[#001F3F]">{seccion.label}</span>
                  </div>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-300 ${isAbierto ? 'rotate-180 text-[#FFB800]' : ''}`} />
                </button>

                {isAbierto && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                          <th className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest w-1/2">Submódulo</th>
                          <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Visualizar</th>
                          <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Crear</th>
                          <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Editar</th>
                          <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-center">Eliminar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {seccion.submodulos.map(sub => {
                          const perm = buscarPermiso(sub.id)

                          return (
                            <tr key={sub.id} className="hover:bg-blue-50/10 transition-colors">
                              <td className="px-6 py-2.5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                                <span className="font-bold text-xs text-slate-700 uppercase">{sub.label}</span>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.ver}
                                  onChange={() => handleSwitchChange(sub.id, 'ver')}
                                  className="w-4 h-4 accent-[#001F3F] cursor-pointer rounded"
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.crear}
                                  onChange={() => handleSwitchChange(sub.id, 'crear')}
                                  className="w-4 h-4 accent-[#001F3F] cursor-pointer rounded"
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.editar}
                                  onChange={() => handleSwitchChange(sub.id, 'editar')}
                                  className="w-4 h-4 accent-[#001F3F] cursor-pointer rounded"
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.eliminar}
                                  onChange={() => handleSwitchChange(sub.id, 'eliminar')}
                                  className="w-4 h-4 accent-[#001F3F] cursor-pointer rounded"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botón Guardar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#001F3F] text-[#FFB800] p-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Nuevo Rol'}
      </button>
    </form>
  )
}