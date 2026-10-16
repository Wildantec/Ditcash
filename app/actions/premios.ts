'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'
import { tienePermiso, PermisoModulo } from '@/lib/permisos'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return false

    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { role: true }
    })

    if (!usuario) return false

    const permisos = (usuario.role?.permisos as unknown as PermisoModulo[]) || []
    const rolNombre = usuario.role?.nombre || usuario.rol

    return tienePermiso(permisos, rolNombre, moduloId, accion)
  } catch (error) {
    return false
  }
}

async function uploadToCloudinary(buffer: Buffer, folder: string) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder, 
        resource_type: 'image',
        quality: "auto:eco", 
        fetch_format: "auto" 
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

export async function crearPremioAction(formData: FormData) {
  try {
    const autorizado = await validarAccionSesion('premios', 'crear')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para CREAR premios." }
    }

    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File

    const puntosRaw = formData.get('puntos') ?? formData.get('valor')
    const puntos = puntosRaw ? parseFloat(puntosRaw.toString()) : 0.0

    if (isNaN(puntos)) {
      return { success: false, error: "El valor o puntaje ingresado no es un número válido." }
    }

    if (!file || file.size === 0) return { success: false, error: "La foto es obligatoria" }
    if (file.size > 10 * 1024 * 1024) return { success: false, error: "La imagen es demasiado pesada" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_premios')

    await prisma.premio.create({
      data: {
        nombre: nombre ? nombre.trim().toUpperCase() : '',
        puntos, 
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        descripcion: descripcion ? descripcion.trim().toUpperCase() : "",
        activo: true,
        reservado: false
      }
    })

    revalidatePath('/dashboard/admin/premios')
    revalidatePath('/dashboard/premios')
    return { success: true }
  } catch (error: any) {
    console.error("Error real en Prisma:", error) 
    return { success: false, error: "Error al guardar el premio en el servidor." }
  }
}

export async function actualizarPremioAction(id: number, formData: FormData) {
  try {
    const autorizado = await validarAccionSesion('premios', 'editar')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para EDITAR premios." }
    }

    const puntosRaw = formData.get('puntos') ?? formData.get('valor')
    const puntos = puntosRaw ? parseFloat(puntosRaw.toString()) : 0.0
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File
    
    const premioActual = await prisma.premio.findUnique({ where: { id } })
    if (!premioActual) return { success: false, error: "Premio no encontrado" }

    let nuevaUrl = premioActual.urlImagen
    let nuevoPublicId = premioActual.publicId

    if (file && file.size > 0) {
      if (premioActual.publicId) await cloudinary.uploader.destroy(premioActual.publicId)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_premios')
      nuevaUrl = uploadResponse.secure_url
      nuevoPublicId = uploadResponse.public_id
    }

    await prisma.premio.update({
      where: { id },
      data: { 
        nombre: nombre ? nombre.trim().toUpperCase() : premioActual.nombre, 
        puntos, 
        descripcion: descripcion ? descripcion.trim().toUpperCase() : premioActual.descripcion, 
        urlImagen: nuevaUrl, 
        publicId: nuevoPublicId 
      }
    })

    revalidatePath('/dashboard/admin/premios')
    revalidatePath('/dashboard/premios')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el premio" }
  }
}

export async function getSolicitudesCanje() {
  try {
    const autorizado = await validarAccionSesion('canjes', 'ver')
    if (!autorizado) return []

    return await prisma.canje.findMany({
      where: { estado: 'pendiente' },
      include: {
        vendedor: true,
        premio: true
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    return []
  }
}

export async function gestionarCanjeAction(canjeId: number, aprobado: boolean) {
  try {
    const autorizado = await validarAccionSesion('canjes', 'editar')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para GESTIONAR canjes." }
    }

    const canje = await prisma.canje.findUnique({
      where: { id: canjeId },
      include: { premio: true, vendedor: true }
    })

    if (!canje) return { success: false, error: "Canje no encontrado" }

    if (aprobado) {
      await prisma.$transaction([
        prisma.canje.update({ 
          where: { id: canjeId }, 
          data: { estado: 'entregado' } 
        }),
        prisma.premio.update({ 
          where: { id: canje.premioId }, 
          data: { reservado: false }
        }),
        prisma.vendedor.update({
          where: { id: canje.vendedorId },
          data: { 
            saldoGastado: { 
              increment: canje.premio.puntos
            } 
          }
        })
      ])
    } else {
      await prisma.$transaction([
        prisma.canje.update({ 
          where: { id: canjeId }, 
          data: { estado: 'rechazado' } 
        }),
        prisma.premio.update({
          where: { id: canje.premioId },
          data: { reservado: false }
        })
      ])
    }

    revalidatePath('/dashboard/vendedor')
    revalidatePath('/dashboard/canjes')
    revalidatePath('/dashboard/canjes/historial')
    revalidatePath('/dashboard/premios')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "No se pudo procesar: verifica la estructura de saldos del vendedor." }
  }
}

export async function solicitarCanjeAction(premioId: number) {
  try {
    const autorizado = await validarAccionSesion('canjes', 'crear')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para SOLICITAR canjes." }
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { success: false, error: "Sesión no encontrada" }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { success: false, error: "Vendedor no encontrado" }
    
    const premio = await prisma.premio.findUnique({ where: { id: premioId } })
    if (!premio || !premio.activo) return { success: false, error: "El premio solicitado ya no se encuentra disponible." }

    const saldoVendedor = Number(vendedor.puntosAcumulados || 0) - Number(vendedor.saldoGastado || 0);
    if (saldoVendedor < Number(premio.puntos)) {
      return { success: false, error: `Saldo insuficiente. Requieres $${Number(premio.puntos).toFixed(2)} para solicitar este premio.` }
    }

    await prisma.$transaction([
      prisma.canje.create({
        data: { 
          vendedorId: vendedor.id, 
          premioId: premioId, 
          estado: 'pendiente'
        }
      }),
      prisma.premio.update({
        where: { id: premioId },
        data: { reservado: false }
      })
    ])

    revalidatePath('/dashboard/vendedor/premios')
    revalidatePath('/dashboard/canjes')
    return { success: true }
  } catch (error: any) {
    console.error("Error en solicitarCanjeAction:", error)
    return { success: false, error: "No se pudo procesar la solicitud de canje" }
  }
}

export async function getPremios() {
  try {
    const autorizado = await validarAccionSesion('premios', 'ver')
    if (!autorizado) return []

    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' }
    })
    return premios.map((p: any) => ({ ...p, puntos: Number(p.puntos) }))
  } catch (error) {
    return []
  }
}

export async function eliminarPremioAction(id: number) {
  try {
    const autorizado = await validarAccionSesion('premios', 'eliminar')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para ELIMINAR premios." }
    }

    const premio = await prisma.premio.findUnique({ where: { id } })
    if (premio?.publicId) await cloudinary.uploader.destroy(premio.publicId)
    await prisma.premio.delete({ where: { id } })
    revalidatePath('/dashboard/admin/premios')
    revalidatePath('/dashboard/premios')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar el premio." }
  }
}

export async function realizarCanjeAction(vendedorId: number, premioId: number) {
  try {
    const autorizado = await validarAccionSesion('canjes', 'crear')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para PROCESAR canjes." }
    }

    const resultado = await prisma.$transaction(async (tx: any) => {
      const premio = await tx.premio.findUnique({ where: { id: premioId } });
      const vendedor = await tx.vendedor.findUnique({ where: { id: vendedorId } });

      if (!premio || !vendedor) {
        throw new Error("Premio o Vendedor no encontrado");
      }

      const saldoActual = Number(vendedor.puntosAcumulados || 0) - Number(vendedor.saldoGastado || 0);
      if (saldoActual < Number(premio.puntos)) {
        throw new Error("Saldo insuficiente para este premio");
      }

      const nuevoCanje = await tx.canje.create({
        data: {
          vendedorId: vendedorId,
          premioId: premioId,
          estado: 'pendiente'
        }
      });

      const vendedorActualizado = await tx.vendedor.update({
        where: { id: vendedorId },
        data: {
          saldoGastado: { increment: Number(premio.puntos) }
        }
      });

      const saldoFinal = Number(vendedorActualizado.puntosAcumulados || 0) - Number(vendedorActualizado.saldoGastado || 0);

      return { nuevoCanje, nuevoSaldo: saldoFinal };
    });

    revalidatePath('/dashboard/vendedor');
    revalidatePath('/dashboard/admin/canjes');

    return { success: true, saldoActual: resultado.nuevoSaldo };

  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar el canje" };
  }
}

export async function procesarAprobacionConEvidenciaAction(canjeId: number, formData: FormData) {
  try {
    const autorizado = await validarAccionSesion('canjes', 'editar')
    if (!autorizado) {
      return { success: false, error: "Acceso Denegado: Tu rol no tiene permisos para ADJUNTAR EVIDENCIA o APROBAR la entrega." }
    }

    const file = formData.get('fotoEvidencia') as File
    if (!file || file.size === 0) return { success: false, error: "La foto de la evidencia es obligatoria." }
    const canje = await prisma.canje.findUnique({
      where: { id: canjeId },
      include: { premio: true, vendedor: true }
    })
    if (!canje) return { success: false, error: "El registro de canje ya no existe en el sistema." }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_entregas_evidencias')

    if (!uploadResponse || !uploadResponse.secure_url) {
      return { success: false, error: "Cloudinary no pudo procesar el almacenamiento del archivo físico." }
    }

    await prisma.$transaction([
      prisma.canje.update({
        where: { id: canjeId },
        data: {
          estado: 'entregado',
          urlEvidencia: uploadResponse.secure_url,
          publicIdEvidencia: uploadResponse.public_id
        } as any
      }),
      prisma.premio.update({
        where: { id: canje.premioId },
        data: { reservado: false }
      })
    ])

    revalidatePath('/dashboard/canjes')
    revalidatePath('/dashboard/canjes/historial')
    revalidatePath('/dashboard/vendedor/premios')
    return { success: true }
  } catch (error: any) {
    console.error("ERROR EN AUDITORÍA DE ENTREGA:", error)
    return { success: false, error: `Error interno en DITCASH: ${error.message || error}` }
  }
}

export async function getHistorialEntregas() {
  try {
    const autorizado = await validarAccionSesion('historial', 'ver') || await validarAccionSesion('canjes', 'ver')
    if (!autorizado) return []

    const canjesAprobados = await prisma.canje.findMany({
      where: {
        estado: { in: ['aprobado', 'entregado'] }
      },
      include: {
        vendedor: true,
        premio: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return canjesAprobados.map((item: any) => {
      const necesitaAuditoria = !item.urlEvidencia; 

      return {
        ...item,
        auditoriaStatus: necesitaAuditoria ? 'PENDIENTE' : 'AL_DIA'
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}