'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers' // Importante importar cookies

import { v2 as cloudinary } from 'cloudinary'

// Configuración robusta
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function loginAction(formData: FormData) {
  const cedula = formData.get('cedula') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({
    where: { cedula: cedula }
  })

  if (!user) {
    return { error: "Credenciales incorrectas" }
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return { error: "Credenciales incorrectas" }
  }

  // --- SOLUCIÓN AQUÍ: GUARDAR LA COOKIE ---
  const cookieStore = await cookies()
  cookieStore.set('user_id', user.id.toString(), {
    path: '/',
    httpOnly: true, // Por seguridad
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 // 1 día de duración
  })

  // Redirección según el ROL
  if (user.rol === 'ADMIN') {
    redirect('/dashboard/admin')
  } else {
    redirect('/dashboard/vendedor')
  }
}