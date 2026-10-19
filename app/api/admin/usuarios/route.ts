import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  getSessionRole,
  normalizeRoleName,
  readRolePermissions,
  roleHasPermission
} from '@/lib/role-permissions'

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Los datos del usuario no son válidos' }, { status: 400 })
    }
    const { nombre, cedula, password, rol } = body as Record<string, unknown>
    const actorRole = await getSessionRole()
    if (!actorRole) {
      return NextResponse.json({ success: false, message: 'Sesión no válida' }, { status: 401 })
    }

    const permissions = await readRolePermissions()
    const canCreateUsers = await roleHasPermission(actorRole, 'usuarios', 'crear', permissions)
    if (!canCreateUsers) {
      return NextResponse.json({ success: false, message: 'No tienes permiso para crear usuarios' }, { status: 403 })
    }

    const assignedRole = typeof rol === 'string' ? normalizeRoleName(rol) : ''
    const [userRoles, passwordHash] = await Promise.all([
      prisma.user.findMany({ distinct: ['rol'], select: { rol: true } }),
      typeof password === 'string' && password.length >= 1 ? bcrypt.hash(password, 10) : null
    ])
    const availableRoles = new Set([
      ...permissions.map((permission) => normalizeRoleName(permission.rol)),
      ...userRoles.map((user) => normalizeRoleName(user.rol))
    ])
    if (!assignedRole || !availableRoles.has(assignedRole)) {
      return NextResponse.json({ success: false, message: 'Selecciona un rol existente' }, { status: 400 })
    }
    if (assignedRole === 'ADMIN' && actorRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Solo el Super Admin puede asignar el rol ADMIN' }, { status: 403 })
    }
    if (
      typeof nombre !== 'string' || !nombre.trim() ||
      typeof cedula !== 'string' || !cedula.trim() ||
      !passwordHash
    ) {
      return NextResponse.json({ success: false, message: 'Completa nombre, cédula y contraseña' }, { status: 400 })
    }

    const hashedPassword = passwordHash

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: cedula,
          cedula,
          password: hashedPassword,
          nombre,
          rol: assignedRole,
        },
      })
      if (assignedRole === 'VENDEDOR') {
        await tx.vendedor.create({
          data: {
            cedula,
            nombre,
            puntosAcumulados: 0,
            usuarioId: newUser.id,
          },
        })
      }
      return newUser
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al crear el usuario' }, { status: 500 })
  }
}