import { cookies } from 'next/headers'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { prisma } from '@/lib/prisma'

export type ModulePermission = {
  rol: string
  modulo: string
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar'

const permissionsPath = path.join(process.cwd(), 'data', 'permisos.json')

export async function readRolePermissions(): Promise<ModulePermission[]> {
  const content = await readFile(permissionsPath, 'utf-8')
  const parsed: unknown = JSON.parse(content)
  if (!Array.isArray(parsed) || !parsed.every((item) =>
    item &&
    typeof item === 'object' &&
    typeof item.rol === 'string' &&
    typeof item.modulo === 'string' &&
    typeof item.ver === 'boolean' &&
    typeof item.crear === 'boolean' &&
    typeof item.editar === 'boolean' &&
    typeof item.eliminar === 'boolean'
  )) {
    throw new Error('El archivo de permisos tiene un formato inválido')
  }
  return parsed as ModulePermission[]
}

export async function getSessionRole(): Promise<string | null> {
  const userId = Number((await cookies()).get('user_id')?.value)
  if (!Number.isSafeInteger(userId) || userId <= 0) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true }
  })
  return user?.rol.trim().toUpperCase() || null
}

export async function roleHasPermission(
  role: string,
  moduleId: string,
  action: PermissionAction,
  permissions?: ModulePermission[]
): Promise<boolean> {
  if (role.trim().toUpperCase() === 'ADMIN') return true
  const entries = permissions || await readRolePermissions()
  const permission = entries.find((entry) =>
    entry.rol.trim().toUpperCase() === role.trim().toUpperCase() &&
    entry.modulo === moduleId
  )
  return permission?.[action] === true
}

export function normalizeRoleName(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_')
}
