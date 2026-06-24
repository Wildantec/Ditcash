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
    console.error('Error inicializando permisos:', err);
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
    
    const { rol, permisos } = body;

    if (!rol || !Array.isArray(permisos)) {
      return NextResponse.json({ success: false, message: 'Formato de matriz de permisos inválido' }, { status: 400 });
    }

    let listaPermisosExistentes = [];
    if (fs.existsSync(rutaArchivo)) {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
      listaPermisosExistentes = contenido ? JSON.parse(contenido) : [];
    }

    let nuevaLista = listaPermisosExistentes.filter((p: any) => p.role !== rol && p.rol !== rol);

    permisos.forEach((perm: any) => {
      nuevaLista.push({
        rol: rol,
        modulo: perm.modulo,
        ver: !!perm.ver,
        crear: !!perm.crear,
        editar: !!perm.editar,
        eliminar: !!perm.eliminar
      });
    });

    fs.writeFileSync(rutaArchivo, JSON.stringify(nuevaLista, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Matriz de control guardada con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}