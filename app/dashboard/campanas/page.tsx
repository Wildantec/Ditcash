import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import PanelAdminCampanasPage from '@/components/campanas/PanelAdminCampanasPage';
import HistorialVendedorPage from '@/components/campanas/HistorialVendedorPage';

export const dynamic = 'force-dynamic';

export default async function CampanasRaizPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')
  const role = (usuario.role?.nombre || usuario.rol).trim().toUpperCase()

  const accionesPermitidas = {
    ver: userHasPermission(usuario, 'campanas', 'ver'),
    crear: userHasPermission(usuario, 'campanas', 'crear'),
    editar: userHasPermission(usuario, 'campanas', 'editar'),
    eliminar: userHasPermission(usuario, 'campanas', 'eliminar')
  }
  if (!accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  if (role === 'ADMIN' || role === 'MARKETING' || accionesPermitidas.crear || accionesPermitidas.editar) {
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