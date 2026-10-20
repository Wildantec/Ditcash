import { getCurrentUser } from '@/lib/authorization'
import SidebarDitcash from './SidebarDitcash'

export default async function SidebarSelector() {
  try {
    const usuarioLocal = await getCurrentUser()
    if (!usuarioLocal) return null

    const permisosDinamicos = Array.isArray(usuarioLocal.role?.permisos)
      ? (usuarioLocal.role.permisos as any[])
      : null

    const rolLimpio = usuarioLocal.role?.nombre || usuarioLocal.rol.toUpperCase().trim()

    return (
      <SidebarDitcash 
        role={rolLimpio} 
        permisos={permisosDinamicos} 
      />
    )

  } catch (error) {
    console.error('Error en SidebarSelector:', error)
    return null
  }
}