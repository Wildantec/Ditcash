import { redirect } from 'next/navigation';
import { getSessionRole, readRolePermissions, roleHasPermission } from '@/lib/role-permissions';
import PanelAdminPremios from '@/components/premios/PanelAdminPremios';
import PantallaPremiosVendedor from '@/components/premios/PantallaPremiosVendedor';

export default async function PremiosRaizPage() {
  const role = await getSessionRole();
  if (!role) redirect('/login');
  const permissions = await readRolePermissions();
  const accionesPermitidas = {
    ver: await roleHasPermission(role, 'premios', 'ver', permissions),
    crear: await roleHasPermission(role, 'premios', 'crear', permissions),
    editar: await roleHasPermission(role, 'premios', 'editar', permissions),
    eliminar: await roleHasPermission(role, 'premios', 'eliminar', permissions)
  };

  if (!accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  if (role === 'VENDEDOR') {
    return <PantallaPremiosVendedor accionesPermitidas={accionesPermitidas} />;
  }

  return <PanelAdminPremios accionesPermitidas={accionesPermitidas} />;
}