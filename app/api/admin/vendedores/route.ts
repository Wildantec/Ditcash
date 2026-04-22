import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client' 

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Insertar en la tabla usando el modelo 'User' (prisma.user)
    const nuevoUsuario = await prisma.user.create({
      data: {
        username: body.cedula, // Usamos la cédula como username ya que es obligatorio y único
        cedula: body.cedula,
        password: body.password,
        nombre: body.nombre,
        rol: 'VENDEDOR',
        estado: 'Activo',
        activo: true
      }
    })

    // 2. Insertar usando el modelo 'Vendedor' (prisma.vendedor)
    await prisma.vendedor.create({
      data: {
        usuarioId: nuevoUsuario.id, // ¡Atención aquí! Es usuarioId según tu esquema
        nombre: body.nombre,
        cedula: body.cedula,
        // puntosAcumulados ya tiene un @default(0.00) en tu esquema, así que no hace falta enviarlo
      }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error en creación de vendedor:", error);

    // Error P2002 de Prisma significa "Violación de restricción única" (Ej. cédula repetida)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Esta cédula (o usuario) ya está registrada" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error de servidor" }, { status: 500 })
  }
}