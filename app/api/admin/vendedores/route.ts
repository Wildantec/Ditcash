import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client' 

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nuevoUsuario = await prisma.user.create({
      data: {
        username: body.cedula,
        cedula: body.cedula,
        password: body.password,
        nombre: body.nombre,
        rol: 'VENDEDOR',
        estado: 'Activo',
        activo: true
      }
    })
    await prisma.vendedor.create({
      data: {
        usuarioId: nuevoUsuario.id,
        nombre: body.nombre,
        cedula: body.cedula,
      }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Esta cédula (o usuario) ya está registrada" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error de servidor" }, { status: 500 })
  }
}