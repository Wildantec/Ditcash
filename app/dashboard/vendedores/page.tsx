import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestionVendedoresConAuditoria from '@/components/vendedores/GestionVendedoresConAuditoria';

export const dynamic = 'force-dynamic';

export default async function VendedoresAuditoriaPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value || 'VENDEDOR';

  if (role !== 'ADMIN' && role !== 'MARKETING') {
    redirect('/dashboard');
  }

  return <GestionVendedoresConAuditoria />;
}