import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { AUTH_SESSION_COOKIE, readAuthSessionToken } from '@/lib/auth-session'
import { PermisoModulo, tienePermiso } from '@/lib/permisos'

export type AccionPermiso = 'ver' | 'crear' | 'editar' | 'eliminar'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = readAuthSessionToken(cookieStore.get(AUTH_SESSION_COOKIE)?.value)
  if (!userId) return null

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  if (
    !usuario ||
    !usuario.activo ||
    usuario.estado !== 'Activo' ||
    usuario.rol.trim().toUpperCase() === 'CLIENTE'
  ) return null

  if (!usuario.role) {
    const nombreRol = usuario.rol.trim().toUpperCase()
    const rolExistente = await prisma.role.findUnique({ where: { nombre: nombreRol } })
    if (rolExistente) {
      await prisma.user.updateMany({
        where: { id: usuario.id, roleId: null },
        data: { roleId: rolExistente.id }
      })
      return { ...usuario, role: rolExistente }
    }
  }

  return usuario
}

export function userHasPermission(
  usuario: Awaited<ReturnType<typeof getCurrentUser>>,
  modulo: string,
  accion: AccionPermiso
) {
  if (!usuario) return false
  const permisos = usuario.role?.permisos as PermisoModulo[] | null | undefined
  return tienePermiso(permisos, usuario.role?.nombre || usuario.rol, modulo, accion)
}

export async function currentUserHasPermission(modulo: string, accion: AccionPermiso) {
  return userHasPermission(await getCurrentUser(), modulo, accion)
}

export function permissionsAreWithinGrant(
  requested: unknown,
  granted: unknown
) {
  if (!Array.isArray(requested) || !Array.isArray(granted)) return false

  const isValidPermission = (permission: unknown): permission is PermisoModulo => {
    if (typeof permission !== 'object' || permission === null || !('modulo' in permission)) return false
    const candidate = permission as Record<string, unknown>
    return typeof candidate.modulo === 'string' &&
      ['ver', 'crear', 'editar', 'eliminar'].every((action) => typeof candidate[action] === 'boolean')
  }
  if (!requested.every(isValidPermission) || !granted.every(isValidPermission)) return false

  return requested.every((permission) => {
    const actorPermission = granted.find((item) => item.modulo === permission.modulo)
    if (!actorPermission) {
      return !permission.ver && !permission.crear && !permission.editar && !permission.eliminar
    }
    return (
      (!permission.ver || actorPermission.ver) &&
      (!permission.crear || actorPermission.crear) &&
      (!permission.editar || actorPermission.editar) &&
      (!permission.eliminar || actorPermission.eliminar)
    )
  })
}
