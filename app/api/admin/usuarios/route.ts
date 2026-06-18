import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { nombre, cedula, password, rol } = await req.json()
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          username: cedula,
          cedula,
          password: hashedPassword,
          nombre,
          rol: rol || 'VENDEDOR',
        },
      })
      if (rol === 'VENDEDOR') {
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
    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 })
  }
}