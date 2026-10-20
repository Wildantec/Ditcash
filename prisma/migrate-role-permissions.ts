import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LegacyPermission {
  rol: string
  modulo: string
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

function normalizeRoleName(value: string) {
  return value.trim().toUpperCase()
}

async function main() {
  const permissionsPath = process.env.LEGACY_PERMISSIONS_PATH
    ? path.resolve(process.env.LEGACY_PERMISSIONS_PATH)
    : path.join(process.cwd(), 'data', 'permisos.json')
  const legacyPermissions: LegacyPermission[] = fs.existsSync(permissionsPath)
    ? JSON.parse(fs.readFileSync(permissionsPath, 'utf8'))
    : []
  if (process.env.LEGACY_PERMISSIONS_PATH && !fs.existsSync(permissionsPath)) {
    throw new Error(`No se encontró el archivo LEGACY_PERMISSIONS_PATH: ${permissionsPath}`)
  }
  if (!Array.isArray(legacyPermissions)) {
    throw new Error('data/permisos.json debe contener un arreglo de permisos.')
  }

  const permissionsByRole = new Map<string, LegacyPermission[]>()
  for (const item of legacyPermissions) {
    if (
      !item ||
      typeof item.rol !== 'string' ||
      typeof item.modulo !== 'string' ||
      ['ver', 'crear', 'editar', 'eliminar'].some((action) => typeof item[action as keyof LegacyPermission] !== 'boolean')
    ) {
      throw new Error('data/permisos.json contiene una entrada de permisos inválida.')
    }
    const key = normalizeRoleName(item.rol)
    const rolePermissions = permissionsByRole.get(key) || []
    const moduleKey = item.modulo === 'permisos' ? 'roles' : item.modulo.trim()
    const existingIndex = rolePermissions.findIndex((permission) => permission.modulo === moduleKey)
    const normalizedPermission = {
      rol: key,
      modulo: moduleKey,
      ver: item.ver,
      crear: item.crear,
      editar: item.editar,
      eliminar: item.eliminar
    }
    if (existingIndex >= 0) {
      rolePermissions[existingIndex] = normalizedPermission
      permissionsByRole.set(key, rolePermissions)
      continue
    }
    rolePermissions.push({
      ...normalizedPermission
    })
    permissionsByRole.set(key, rolePermissions)
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingRoles = await tx.role.findMany()
    const rolesByName = new Map(existingRoles.map((role) => [normalizeRoleName(role.nombre), role]))
    const rolesById = new Map(existingRoles.map((role) => [role.id, role]))
    const users = await tx.user.findMany({ select: { id: true, rol: true, roleId: true } })
    const roleNames = new Set<string>([
      ...existingRoles.map((role) => normalizeRoleName(role.nombre)),
      ...users.map((user) => normalizeRoleName(user.rol)),
      ...permissionsByRole.keys()
    ])
    roleNames.delete('CLIENTE')

    let createdRoles = 0
    let importedMatrices = 0
    for (const nombre of roleNames) {
      if (!nombre) continue

      const role = rolesByName.get(nombre)
      const legacy = permissionsByRole.get(nombre) || []
      if (!role) {
        const created = await tx.role.create({
          data: {
            nombre,
            descripcion: `Rol migrado desde los usuarios existentes (${nombre}).`,
            permisos: legacy.map(({ modulo, ver, crear, editar, eliminar }) => ({
              modulo, ver, crear, editar, eliminar
            })) as Prisma.InputJsonValue
          }
        })
        rolesByName.set(nombre, created)
        rolesById.set(created.id, created)
        createdRoles += 1
      } else if (legacy.length > 0 && (!Array.isArray(role.permisos) || role.permisos.length === 0)) {
        await tx.role.update({
          where: { id: role.id },
          data: {
            permisos: legacy.map(({ modulo, ver, crear, editar, eliminar }) => ({
              modulo, ver, crear, editar, eliminar
            })) as Prisma.InputJsonValue
          }
        })
        importedMatrices += 1
      }
    }

    let linkedUsers = 0
    for (const user of users) {
      const normalizedName = normalizeRoleName(user.rol)
      if (!normalizedName || normalizedName === 'CLIENTE') continue
      const role = (user.roleId && rolesById.get(user.roleId)) || rolesByName.get(normalizedName)
      if (!role) continue
      if (user.roleId !== role.id || user.rol !== role.nombre) {
        await tx.user.update({
          where: { id: user.id },
          data: { roleId: role.id, rol: role.nombre }
        })
        linkedUsers += 1
      }
    }

    return { createdRoles, importedMatrices, linkedUsers }
  })

  console.log(
    `Roles creados: ${result.createdRoles}; matrices importadas: ${result.importedMatrices}; usuarios vinculados: ${result.linkedUsers}.`
  )
}

main()
  .catch((error) => {
    console.error('No se pudo migrar la configuración de roles:', error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
