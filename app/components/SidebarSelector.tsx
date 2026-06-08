// src/app/components/SidebarSelector.tsx
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import SidebarDitcash from './SidebarDitcash'

export default async function SidebarSelector() {
  try {
    const cookieStore = await cookies()
    const userIdRaw = cookieStore.get('user_id')?.value

    // 1. Si no hay cookie de sesión, evitamos cualquier renderizado
    if (!userIdRaw) return null

    // 2. Validamos que el ID sea realmente un número antes de consultar a Prisma
    const userId = parseInt(userIdRaw)
    if (isNaN(userId)) {
      console.error("❌ Error: El user_id en cookies no es un número válido:", userIdRaw)
      return null
    }

    // 3. Consultamos el usuario en la base de datos local
    const usuarioLocal = await prisma.user.findUnique({
      where: { id: userId }
    })

    // 4. Si el usuario fue borrado o no existe en la BD, no cargamos el Sidebar
    if (!usuarioLocal) {
      console.warn(`⚠️ Usuario con ID ${userId} no encontrado en la base de datos.`)
      return null
    }

    // 5. Normalizamos el rol y le damos un salvavidas por si viene vacío o en minúsculas
    const rolLimpio = (usuarioLocal.rol || 'VENDEDOR').toUpperCase().trim()

    // 6. Validamos que pertenezca a los roles permitidos por tu interfaz
    const rolesPermitidos = ['ADMIN', 'MARKETING', 'VENDEDOR']
    const rolFinal = rolesPermitidos.includes(rolLimpio) 
      ? (rolLimpio as 'ADMIN' | 'MARKETING' | 'VENDEDOR')
      : 'VENDEDOR' // Rol por defecto seguro si hay basura en la BD

    return <SidebarDitcash role={rolFinal} />

  } catch (error) {
    // Captura cualquier caída de conexión de la BD y evita que la página muera por completo
    console.error("❌ Error crítico en SidebarSelector Server Component:", error)
    return null
  }
}