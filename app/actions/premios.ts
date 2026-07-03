'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

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
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File

    const puntosRaw = formData.get('puntos') ?? formData.get('valor')
    const puntos = puntosRaw ? parseFloat(puntosRaw.toString()) : 0.0

    if (isNaN(puntos)) {
      return { error: "El valor o puntaje ingresado no es un número válido." }
    }

    if (!file || file.size === 0) return { error: "La foto es obligatoria" }
    if (file.size > 10 * 1024 * 1024) return { error: "La imagen es demasiado pesada" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_premios')

    await prisma.premio.create({
      data: {
        nombre,
        puntos, 
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        descripcion: descripcion || "",
        activo: true,
        reservado: false
      }
    })

    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error: any) {
    console.error("Error real en Prisma:", error) 
    return { error: "Error al guardar el premio en el servidor." }
  }
}

export async function actualizarPremioAction(id: number, formData: FormData) {
  try {
    const puntosRaw = formData.get('puntos') ?? formData.get('valor')
    const puntos = puntosRaw ? parseFloat(puntosRaw.toString()) : 0.0
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File
    
    const premioActual = await prisma.premio.findUnique({ where: { id } })
    if (!premioActual) return { error: "Premio no encontrado" }

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
      data: { nombre, puntos, descripcion, urlImagen: nuevaUrl, publicId: nuevoPublicId }
    })

    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error) {
    return { error: "No se pudo actualizar el premio" }
  }
}

export async function getSolicitudesCanje() {
  try {
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
    const canje = await prisma.canje.findUnique({
      where: { id: canjeId },
      include: { premio: true, vendedor: true }
    })

    if (!canje) return { error: "Canje no encontrado" }

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
    return { error: "No se pudo procesar: verifica la estructura de saldos del vendedor." }
  }
}

export async function solicitarCanjeAction(premioId: number) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { error: "Sesión no encontrada" }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { error: "Vendedor no encontrado" }
    
    const premio = await prisma.premio.findUnique({ where: { id: premioId } })
    if (!premio || !premio.activo) return { error: "El premio solicitado ya no se encuentra disponible." }

    const saldoVendedor = Number(vendedor.puntosAcumulados) - Number(vendedor.saldoGastado);
    if (saldoVendedor < Number(premio.puntos)) {
      return { error: `Saldo insuficiente. Requieres $${Number(premio.puntos).toFixed(2)} para solicitar este premio.` }
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
    return { success: true }
  } catch (error: any) {
    console.error("Error en solicitarCanjeAction:", error)
    return { error: "No se pudo procesar la solicitud de canje" }
  }
}

export async function getPremios() {
  try {
    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' }
    })
    return premios.map((p: any )=> ({ ...p, puntos: Number(p.puntos) }))
  } catch (error) {
    return []
  }
}

export async function eliminarPremioAction(id: number) {
  try {
    const premio = await prisma.premio.findUnique({ where: { id } })
    if (premio?.publicId) await cloudinary.uploader.destroy(premio.publicId)
    await prisma.premio.delete({ where: { id } })
    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar" }
  }
}

export async function realizarCanjeAction(vendedorId: number, premioId: number) {
  try {
    const resultado = await prisma.$transaction(async (tx:any) => {
      const premio = await tx.premio.findUnique({ where: { id: premioId } });
      const vendedor = await tx.vendedor.findUnique({ where: { id: vendedorId } });

      if (!premio || !vendedor) {
        throw new Error("Premio o Vendedor no encontrado");
      }
      if (vendedor.saldo < premio.costo) {
        throw new Error("Saldo insuficiente para este premio");
      }
      const nuevoCanje = await tx.canje.create({
        data: {
          vendedorId: vendedorId,
          premioId: premioId,
          estado: 'pendiente',
          valorCanjeado: premio.costo
        }
      });
      const vendedorActualizado = await tx.vendedor.update({
        where: { id: vendedorId },
        data: {
          saldo: { decrement: premio.costo }
        }
      });

      return { nuevoCanje, nuevoSaldo: vendedorActualizado.saldo };
    });
    revalidatePath('/dashboard/vendedor');
    revalidatePath('/dashboard/admin/canjes');

    return { success: true, saldoActual: resultado.nuevoSaldo };

  } catch (error: any) {
    return { error: error.message || "Error al procesar el canje" };
  }
}
export async function procesarAprobacionConEvidenciaAction(canjeId: number, formData: FormData) {
  try {
    const file = formData.get('fotoEvidencia') as File
    if (!file || file.size === 0) return { error: "La foto de la evidencia es obligatoria." }
    const canje = await prisma.canje.findUnique({
      where: { id: canjeId },
      include: { premio: true, vendedor: true }
    })
    if (!canje) return { error: "El registro de canje ya no existe en el sistema." }
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_entregas_evidencias')

    if (!uploadResponse || !uploadResponse.secure_url) {
      return { error: "Cloudinary no pudo procesar el almacenamiento del archivo físico." }
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
    return { error: `Error interno en DITCASH: ${error.message || error}` }
  }
}
export async function getHistorialEntregas() {
  try {
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