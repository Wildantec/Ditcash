import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import SidebarDitcash from './SidebarDitcash'

export default async function SidebarSelector() {
  try {
    const cookieStore = await cookies()
    const userIdRaw = cookieStore.get('user_id')?.value
    if (!userIdRaw) return null

    const userId = parseInt(userIdRaw, 10)
    if (isNaN(userId)) return null

    const usuarioLocal = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!usuarioLocal) return null

    const permisosDinamicos = Array.isArray(usuarioLocal.role?.permisos)
      ? (usuarioLocal.role.permisos as any[])
      : null

    const rolLimpio = usuarioLocal.role?.nombre || (usuarioLocal.rol || 'VENDEDOR').toUpperCase().trim()

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