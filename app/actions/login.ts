'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { consultarClienteExterno } from '@/lib/grupoAraujos'


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

export async function manejarFlujoClienteAction(cedula: string, passwordIngresada?: string) {
  try {
    const clientesExistentes: any[] = await prisma.$queryRaw`
      SELECT * FROM clientes_web WHERE cedula = ${cedula} LIMIT 1
    `;
    
    const usuarioWeb = clientesExistentes[0] || null;

    if (usuarioWeb) {
      if (passwordIngresada) {
        const match = await bcrypt.compare(passwordIngresada, usuarioWeb.password);
        if (!match) {
          return { error: "Contraseña incorrecta." };
        }
        
        const cookieStore = await cookies()
        cookieStore.set('user_id', usuarioWeb.id.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
        return { status: "LOGIN_SUCCESS" };
      }
      
      return { status: "EXISTE_LOCAL", nombre: usuarioWeb.nombre }; 
    }
    const clienteContable = await consultarClienteExterno(cedula);

    if (!clienteContable) {
      return { error: "Usted no consta como cliente registrado en el sistema contable." };
    }

    const esPersonalInterno = await prisma.user.findUnique({ where: { cedula } });
    
    if (esPersonalInterno) {
      return { error: "Esta identificación pertenece al personal administrativo de la empresa." };
    }

    if (passwordIngresada) {
      const hashedPassword = await bcrypt.hash(passwordIngresada, 10);

      await prisma.$queryRaw`
        INSERT INTO clientes_web (cedula, password, nombre) 
        VALUES (${cedula}, ${hashedPassword}, ${clienteContable.nombre})
      `;

      const recienCreado: any[] = await prisma.$queryRaw`
        SELECT id FROM clientes_web WHERE cedula = ${cedula} LIMIT 1
      `;
      const nuevoId = recienCreado[0]?.id || 999;

      const cookieStore = await cookies()
      cookieStore.set('user_id', nuevoId.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
      
      return { status: "ACTIVACION_COMPLETA" };
    }

    return { status: "REQUIERE_ACTIVACION", nombre: clienteContable.nombre };

  } catch (e) {
    return { error: "Error en el servidor de autenticación." };
  }
}