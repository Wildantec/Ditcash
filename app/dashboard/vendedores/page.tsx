import { redirect } from 'next/navigation';
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import GestionVendedoresConAuditoria from '@/components/vendedores/GestionVendedoresConAuditoria';

export const dynamic = 'force-dynamic';

export default async function VendedoresAuditoriaPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')

  if (!userHasPermission(usuario, 'vendedores', 'ver')) {
    redirect('/dashboard');
  }

  return <GestionVendedoresConAuditoria />;
}