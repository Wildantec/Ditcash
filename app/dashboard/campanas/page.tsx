import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import PanelAdminCampanasPage from '@/components/campanas/PanelAdminCampanasPage';
import HistorialVendedorPage from '@/components/campanas/HistorialVendedorPage';

async function obtenerPermisosModulo(rol: string) {
  try {
    const rutaArchivo = path.join(process.cwd(), 'data', 'permisos.json');
    if (!fs.existsSync(rutaArchivo)) return null;
    
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const listaPermisos = contenido ? JSON.parse(contenido) : [];
    
    return listaPermisos.find((p: any) => p.rol === rol && p.modulo === 'campanas');
  } catch (err) {
    console.error('Error leyendo permisos:', err);
    return null;
  }
}

export const dynamic = 'force-dynamic';

export default async function CampanasRaizPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value || 'VENDEDOR';
  const configPermisos = await obtenerPermisosModulo(role);
  
  const accionesPermitidas = configPermisos ? {
    ver: !!configPermisos.ver,
    crear: !!configPermisos.crear,
    editar: !!configPermisos.editar,
    eliminar: !!configPermisos.eliminar
  } : {
    ver: true,
    crear: role === 'ADMIN',
    editar: role === 'ADMIN',
    eliminar: role === 'ADMIN'
  };
  if (role !== 'ADMIN' && !accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  if (role === 'ADMIN' || role === 'MARKETING') {
    const campanasDB = await prisma.campana.findMany({
      orderBy: { fechaInicio: 'desc' }
    });
    const campanasFormateadas = campanasDB.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? c.detalle ?? null,
      fechaInicio: c.fechaInicio instanceof Date ? c.fechaInicio.toISOString() : c.fechaInicio,
      fechaFin: c.fechaFin instanceof Date ? c.fechaFin.toISOString() : c.fechaFin,
      activa: c.activa ?? (c.estado === 'Activa'),
      valor: Number(c.valor || 0)
    }));

    return (
      <PanelAdminCampanasPage 
        accionesPermitidas={accionesPermitidas} 
        campanasIniciales={campanasFormateadas} 
      />
    );
  }

  return <HistorialVendedorPage accionesPermitidas={accionesPermitidas} />;
}