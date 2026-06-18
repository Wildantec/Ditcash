import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const productCode = formData.get('productCode') as string;
    const productName = formData.get('productName') as string;
    const title = formData.get('title') as string;
    const endDate = formData.get('endDate') as string;
    const imageFile = formData.get('image') as File | null;

    if (!productCode || !title || !endDate) {
      return NextResponse.json({ success: false, message: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    let webImagePath = '';

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const mimeType = imageFile.type;
      const base64Data = buffer.toString('base64');
      const fileUri = `data:${mimeType};base64,${base64Data}`;

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', fileUri);
      
      cloudinaryFormData.append('upload_preset', 'ditcash_preset'); 
      cloudinaryFormData.append('folder', 'ditcash/publicidad');
      cloudinaryFormData.append('public_id', `${productCode}_${Date.now()}`);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      if (!cloudinaryResponse.ok) {
        const errorText = await cloudinaryResponse.text();
        throw new Error(`Cloudinary REST API Error: ${errorText}`);
      }

      const uploadResult = await cloudinaryResponse.json();
      webImagePath = uploadResult.secure_url;
    }

    const publicidadExistente = await prisma.productAdvertisement.findUnique({
      where: { productCode: productCode }
    });

    const publicidad = await prisma.productAdvertisement.upsert({
      where: { productCode: productCode },
      update: {
        title: title,
        productName: productName,
        imagePath: webImagePath || publicidadExistente?.imagePath || '',
        endDate: new Date(endDate),
        isActive: true
      },
      create: {
        productCode: productCode,
        productName: productName,
        title: title,
        imagePath: webImagePath, 
        endDate: new Date(endDate),
        isActive: true
      }
    });

    return NextResponse.json({ success: true, message: 'Publicidad guardada con éxito.', data: publicidad });

  } catch (error: any) {
    console.error('ERROR CRÍTICO REST HTTP:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno al procesar el banner.',
      error: error?.message || String(error) 
    }, { status: 500 });
  }
}