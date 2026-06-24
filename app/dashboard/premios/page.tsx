import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import path from 'path';
import fs from 'fs';
import PanelAdminPremios from '@/components/premios/PanelAdminPremios';
import PantallaPremiosVendedor from '@/components/premios/PantallaPremiosVendedor';

async function obtenerPermisosModulo(rol: string) {
  try {
    const rutaArchivo = path.join(process.cwd(), 'data', 'permisos.json');
    if (!fs.existsSync(rutaArchivo)) return null;
    
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const listaPermisos = contenido ? JSON.parse(contenido) : [];
    
    return listaPermisos.find((p: any) => p.rol === rol && p.modulo === 'premios');
  } catch (err) {
    console.error('Error leyendo permisos:', err);
    return null;
  }
}

export default async function PremiosRaizPage() {
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
    return <PanelAdminPremios accionesPermitidas={accionesPermitidas} />;
  }

  return <PantallaPremiosVendedor accionesPermitidas={accionesPermitidas} />;
}