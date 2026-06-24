import SidebarSelector from '@/components/SidebarSelector'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarSelector />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}