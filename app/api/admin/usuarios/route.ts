import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { currentUserHasPermission, getCurrentUser, permissionsAreWithinGrant } from '@/lib/authorization'

export const dynamic = 'force-dynamic'
async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  return currentUserHasPermission(moduloId, accion)
}

export async function POST(req: Request) {
  try {
    const autorizado = await validarAccionSesion('usuarios', 'crear')
    if (!autorizado) {
      return NextResponse.json(
        { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR usuarios.' },
        { status: 403 }
      )
    }

    const { nombre, cedula, password, roleId } = await req.json()

    if (!cedula || typeof password !== 'string' || password.length < 8 || !nombre || !Number.isSafeInteger(Number(roleId)) || Number(roleId) <= 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    const usuarioActual = await getCurrentUser()
    const rolAsignado = await prisma.role.findUnique({ where: { id: Number(roleId) } })
    if (!rolAsignado) {
      return NextResponse.json({ error: 'El rol seleccionado no existe.' }, { status: 400 })
    }
    const esAdmin = (usuarioActual?.role?.nombre || usuarioActual?.rol || '').trim().toUpperCase() === 'ADMIN'
    if (rolAsignado.nombre.toUpperCase() === 'ADMIN' && !esAdmin) {
      return NextResponse.json({ error: 'Solo un administrador puede asignar el rol ADMIN.' }, { status: 403 })
    }
    if (
      !esAdmin &&
      !permissionsAreWithinGrant(
        rolAsignado.permisos,
        usuarioActual?.role?.permisos
      )
    ) {
      return NextResponse.json({ error: 'No puedes asignar un rol con más permisos que los que tienes.' }, { status: 403 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          username: cedula,
          cedula,
          password: hashedPassword,
          nombre,
          rol: rolAsignado.nombre,
          roleId: rolAsignado.id
        },
      })

      if (rolAsignado.nombre === 'VENDEDOR') {
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

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        username: result.username,
        cedula: result.cedula,
        nombre: result.nombre,
        rol: result.rol,
        roleId: result.roleId
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear el usuario' }, { status: 500 })
  }
}