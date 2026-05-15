'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { consultarClienteExterno } from '@/lib/grupoAraujos'

// 1. LOGIN TRADICIONAL ADMINISTRATIVO
export async function loginAction(formData: FormData) {
  const cedula = formData.get('cedula') as string
  const password = formData.get('password') as string

  try {
    const user = await prisma.user.findUnique({
      where: { cedula: cedula }
    })

    if (!user || user.rol === 'CLIENTE') {
      return { error: "Credenciales incorrectas" }
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return { error: "Credenciales incorrectas" }
    }

    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id.toString(), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24
    })

    if (user.rol === 'ADMIN') {
      redirect('/dashboard/admin')
    } else {
      redirect('/dashboard/vendedor')
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    return { error: "Error en el servidor administrativo" }
  }
}

// 2. FLUJO DINÁMICO PARA PORTAL CLIENTES (CON GUARDADO)
export async function manejarFlujoClienteAction(cedula: string, passwordIngresada?: string) {
  try {
    const usuarioWeb = await prisma.user.findUnique({ where: { cedula } });

    if (usuarioWeb) {
      if (passwordIngresada) {
        const match = await bcrypt.compare(passwordIngresada, usuarioWeb.password);
        if (!match) return { error: "Contraseña incorrecta." };
        const cookieStore = await cookies();
        cookieStore.set('user_id', usuarioWeb.id.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
        return { status: "LOGIN_SUCCESS" };
      }
      return { status: "EXISTE_LOCAL" };
    }

    const clienteContable = await consultarClienteExterno(cedula);
    if (!clienteContable) {
      return { error: "Usted no consta como cliente registrado en el sistema contable." };
    }

    if (passwordIngresada) {
      const hashedPassword = await bcrypt.hash(passwordIngresada, 10);
      const nuevoUsuario = await prisma.user.create({
        data: {
          cedula,
          username: cedula,
          password: hashedPassword,
          nombre: clienteContable.nombre,
          rol: 'CLIENTE'
        }
      });
      const cookieStore = await cookies();
      cookieStore.set('user_id', nuevoUsuario.id.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
      return { status: "ACTIVACION_COMPLETA" };
    }

    return { status: "REQUIERE_ACTIVACION", nombre: clienteContable.nombre };
  } catch (e) {
    return { error: "Error en el servidor de autenticación." };
  }
}