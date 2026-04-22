'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        alert("Vendedor creado con éxito")
        setFormData({ nombre: '', cedula: '', password: '', estado: 'Activo' })
        router.refresh() // Recarga la tabla
      }
    } catch (error) {
      alert("Error al guardar")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
      <h2 className="text-[#001F3F] font-bold mb-4">Registrar Nuevo Vendedor</h2>
      <form onSubmit={guardarVendedor} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input 
          placeholder="Nombre Completo"
          className="px-4 py-2 bg-slate-50 border rounded-xl"
          value={formData.nombre}
          onChange={e => setFormData({...formData, nombre: e.target.value})}
          required
        />
        <input 
          placeholder="Cédula"
          className="px-4 py-2 bg-slate-50 border rounded-xl"
          value={formData.cedula}
          onChange={e => setFormData({...formData, cedula: e.target.value})}
          required
        />
        <input 
          type="password"
          placeholder="Asignar Contraseña"
          className="px-4 py-2 bg-slate-50 border rounded-xl"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
          required
        />
        <button 
          disabled={cargando}
          className="bg-[#D4AF37] text-[#001F3F] font-bold rounded-xl hover:bg-[#001F3F] hover:text-white transition-all"
        >
          {cargando ? 'Guardando...' : 'Crear Vendedor'}
        </button>
      </form>
    </div>
  )
}