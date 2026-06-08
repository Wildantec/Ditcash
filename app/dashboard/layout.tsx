// src/app/dashboard/layout.tsx
import SidebarSelector from '@/app/components/SidebarSelector'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 🎯 Aquí se inyecta el Sidebar de Ditcash solo para Admin, Marketing y Vendedores */}
      <SidebarSelector />
      
      {/* El contenido de las páginas del dashboard se despliega a la derecha */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}