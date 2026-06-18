import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientes = await prisma.clienteWeb.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: clientes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modificados, eliminadosIds } = body;

    await prisma.$transaction([
      ...(eliminadosIds && eliminadosIds.length > 0 
        ? [prisma.clienteWeb.deleteMany({ where: { id: { in: eliminadosIds } } })] 
        : []),
      ...(modificados && modificados.length > 0
        ? modificados.map((cli: any) => 
            prisma.clienteWeb.update({
              where: { id: Number(cli.id) },
              data: {
                cedula: cli.cedula,
                nombre: cli.nombre,
                activo: Boolean(cli.activo),
                ...(cli.password && cli.password.trim() !== "" ? { password: cli.password } : {})
              }
            })
          )
        : [])
    ]);

    return NextResponse.json({ success: true, message: 'Base de datos sincronizada con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}