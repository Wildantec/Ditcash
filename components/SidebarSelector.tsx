import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import SidebarDitcash from './SidebarDitcash'

export default async function SidebarSelector() {
  try {
    const cookieStore = await cookies()
    const userIdRaw = cookieStore.get('user_id')?.value
    if (!userIdRaw) return null

    const userId = parseInt(userIdRaw)
    if (isNaN(userId)) {
      return null
    }

    const usuarioLocal = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!usuarioLocal) {
      return null
    }
    const rolLimpio = (usuarioLocal.rol || 'VENDEDOR').toUpperCase().trim()

    const rolesPermitidos = ['ADMIN', 'MARKETING', 'VENDEDOR']
    const rolFinal = rolesPermitidos.includes(rolLimpio) 
      ? (rolLimpio as 'ADMIN' | 'MARKETING' | 'VENDEDOR')
      : 'VENDEDOR'

    return <SidebarDitcash role={rolFinal} />

  } catch (error) {
    return null
  }
}