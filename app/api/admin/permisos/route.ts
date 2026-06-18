import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
export const dynamic = 'force-dynamic';

const dataDir = path.join(process.cwd(), 'data');
const rutaArchivo = path.join(dataDir, 'permisos.json');

const inicializarArchivo = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(rutaArchivo)) {
      fs.writeFileSync(rutaArchivo, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
  }
};

export async function GET() {
  try {
    inicializarArchivo();
    if (!fs.existsSync(rutaArchivo)) {
      return NextResponse.json({ success: true, data: [] });
    }
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const datos = contenido ? JSON.parse(contenido) : [];
    return NextResponse.json({ success: true, data: datos });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    inicializarArchivo();
    const body = await request.json();
    const { rol, modulo, ver, crear, editar, eliminar } = body;

    if (!rol || !modulo) {
      return NextResponse.json({ success: false, message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let listaPermisos = [];
    if (fs.existsSync(rutaArchivo)) {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
      listaPermisos = contenido ? JSON.parse(contenido) : [];
    }

    const index = listaPermisos.findIndex((p: any) => p.rol === rol && p.modulo === modulo);
    const nuevoPermiso = { rol, modulo, ver, crear, editar, eliminar };

    if (index !== -1) {
      listaPermisos[index] = nuevoPermiso;
    } else {
      listaPermisos.push(nuevoPermiso);
    }

    fs.writeFileSync(rutaArchivo, JSON.stringify(listaPermisos, null, 2), 'utf-8');

    return NextResponse.json({ success: true, data: nuevoPermiso });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}