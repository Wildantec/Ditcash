'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getUsuarioByIdAction, actualizarUsuarioAction } from '@/app/actions/usuarios'
import Swal from 'sweetalert2'
import Link from 'next/link'

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = parseInt(resolvedParams.id)
  const router = useRouter()

  const [formData, setFormData] = useState({ 
    nombre: '', 
    cedula: '', 
    rol: '', 
    activo: true 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const u = await getUsuarioByIdAction(id)
      if (u) {
        setFormData({
          nombre: u.vendedor?.nombre || u.nombre || '',
          cedula: u.cedula,
          rol: u.rol,
          activo: u.activo
        })
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await actualizarUsuarioAction(id, formData)
    
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'CAMBIOS GUARDADOS',
        text: 'El perfil de Ditec ha sido actualizado correctamente.',
        confirmButtonColor: '#001F3F'
      })
      router.push('/dashboard/admin/usuarios')
      router.refresh()
    } else {
      Swal.fire('Error', res.error || 'No se pudo actualizar', 'error')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
      Sincronizando con Ditec...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 md:p-10">
      
      <div className="w-full max-w-2xl">
        {/* HEADER DEL FORMULARIO */}
        <header className="mb-8 flex items-center gap-5">
          <Link href="/dashboard/admin/usuarios" className="bg-[#001F3F] text-white p-3 rounded-2xl shadow-lg hover:bg-[#FFB800] hover:text-[#001F3F] transition-all">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-[#001F3F]">Configurar Acceso</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión de identidad DITCASH 2026</p>
          </div>
        </header>

        {/* CUERPO DEL FORMULARIO */}
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {/* Círculo decorativo */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#001F3F]/5 rounded-full -mr-20 -mt-20" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre Completo</label>
                <input 
                  className="p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm text-[#001F3F] outline-none focus:border-[#FFB800] transition-all uppercase"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cédula</label>
                <input 
                  className="p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-sm text-[#001F3F] outline-none focus:border-[#FFB800] transition-all"
                  value={formData.cedula}
                  onChange={e => setFormData({...formData, cedula: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Rol de Sistema</label>
                <select 
                  className="p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xs text-[#001F3F] outline-none cursor-pointer appearance-none"
                  value={formData.rol}
                  onChange={e => setFormData({...formData, rol: e.target.value})}
                >
                  <option value="VENDEDOR">VENDEDOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Estado</label>
                <select 
                  className="p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xs text-[#001F3F] outline-none cursor-pointer appearance-none"
                  value={formData.activo ? 'true' : 'false'}
                  onChange={e => setFormData({...formData, activo: e.target.value === 'true'})}
                >
                  <option value="true">● USUARIO ACTIVO</option>
                  <option value="false">○ BLOQUEAR ACCESO</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-4">
              <button 
                type="submit"
                className="flex-[2] bg-[#001F3F] text-[#FFB800] py-5 rounded-3xl font-black text-[12px] uppercase tracking-[0.25em] shadow-xl hover:bg-[#FFB800] hover:text-[#001F3F] transition-all active:scale-95"
              >
                Actualizar Perfil ➔
              </button>
              <Link href="/dashboard/admin/usuarios" className="flex-1">
                <button type="button" className="w-full py-5 rounded-3xl font-bold text-[11px] uppercase tracking-widest text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
                  Cancelar
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}