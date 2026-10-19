import { redirect } from 'next/navigation';
import GestionVendedoresConAuditoria from '@/components/vendedores/GestionVendedoresConAuditoria';
import { getSessionRole, readRolePermissions, roleHasPermission } from '@/lib/role-permissions';

export const dynamic = 'force-dynamic';

export default async function VendedoresAuditoriaPage() {
  const role = await getSessionRole();
  if (!role) redirect('/login');

  const permissions = await readRolePermissions();
  const accionesPermitidas = {
    ver: await roleHasPermission(role, 'vendedores', 'ver', permissions),
    crear: await roleHasPermission(role, 'vendedores', 'crear', permissions),
    editar: await roleHasPermission(role, 'vendedores', 'editar', permissions),
    eliminar: await roleHasPermission(role, 'vendedores', 'eliminar', permissions)
  };
  if (!accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  return <GestionVendedoresConAuditoria accionesPermitidas={accionesPermitidas} />;
}