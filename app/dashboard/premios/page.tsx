import { redirect } from 'next/navigation';
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import PanelAdminPremios from '@/components/premios/PanelAdminPremios';
import PantallaPremiosVendedor from '@/components/premios/PantallaPremiosVendedor';

export default async function PremiosRaizPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')
  const role = (usuario.role?.nombre || usuario.rol).trim().toUpperCase()
  const accionesPermitidas = {
    ver: userHasPermission(usuario, 'premios', 'ver'),
    crear: userHasPermission(usuario, 'premios', 'crear'),
    editar: userHasPermission(usuario, 'premios', 'editar'),
    eliminar: userHasPermission(usuario, 'premios', 'eliminar')
  }
  const puedeSolicitarCanje = userHasPermission(usuario, 'canjes', 'crear')

  if (!accionesPermitidas.ver) {
    redirect('/dashboard');
  }

  if (role === 'ADMIN' || role === 'MARKETING' || accionesPermitidas.crear || accionesPermitidas.editar) {
    return <PanelAdminPremios accionesPermitidas={accionesPermitidas} />;
  }

  return <PantallaPremiosVendedor accionesPermitidas={accionesPermitidas} puedeSolicitarCanje={puedeSolicitarCanje} />;
}