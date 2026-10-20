import SidebarSelector from '@/components/SidebarSelector'
import { getCurrentUser } from '@/lib/authorization'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarSelector />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}