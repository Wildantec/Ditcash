import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const productCode = formData.get('productCode') as string
    const productName = formData.get('productName') as string
    const title = formData.get('title') as string
    const endDate = formData.get('endDate') as string
    const imageFile = formData.get('image') as File | null

    if (!productCode || !title || !endDate) {
      return NextResponse.json({ success: false, message: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    let webImagePath = ''

    if (imageFile && imageFile.size > 0) {

      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = buffer.toString('base64')
      const dataUri = `data:${imageFile.type};base64,${base64Image}`


      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'ditcash/publicidad',
        public_id: `${productCode}_${Date.now()}`,
        resource_type: 'image'
      })

      webImagePath = uploadResult.secure_url
    }

    const publicidadExistente = await prisma.productAdvertisement.findUnique({
      where: { productCode: productCode }
    })

    const publicidad = await prisma.productAdvertisement.upsert({
      where: { productCode: productCode },
      update: {
        title,
        productName,
        imagePath: webImagePath || publicidadExistente?.imagePath || '',
        endDate: new Date(endDate),
        isActive: true
      },
      create: {
        productCode,
        productName,
        title,
        imagePath: webImagePath,
        endDate: new Date(endDate),
        isActive: true
      }
    })

    revalidatePath('/dashboard/inventario')
    revalidatePath('/dashboard/publicidad')

    return NextResponse.json({ success: true, message: 'Publicidad guardada con éxito.', data: publicidad })

  } catch (error: any) {
    console.error('ERROR CRÍTICO EN API PUBLICIDAD (BASE64):', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno en los servicios de Ditcash.',
      error: error?.message || String(error) 
    }, { status: 500 })
  }
}