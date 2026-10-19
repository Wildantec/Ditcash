import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionRole, readRolePermissions, roleHasPermission } from '@/lib/role-permissions';
import PanelAdminCampanasPage from '@/components/campanas/PanelAdminCampanasPage';
import HistorialVendedorPage from '@/components/campanas/HistorialVendedorPage';

export const dynamic = 'force-dynamic';

export default async function CampanasRaizPage() {
  const role = await getSessionRole();
  if (!role) redirect('/login');
  const permissions = await readRolePermissions();
  const accionesPermitidas = {
    ver: await roleHasPermission(role, 'campanas', 'ver', permissions),
    crear: await roleHasPermission(role, 'campanas', 'crear', permissions),
    editar: await roleHasPermission(role, 'campanas', 'editar', permissions),
    eliminar: await roleHasPermission(role, 'campanas', 'eliminar', permissions)
  };
  if (!accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  if (role !== 'VENDEDOR') {
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