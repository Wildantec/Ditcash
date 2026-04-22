// app/components/SidebarSelector.tsx
'use client'

import { usePathname } from 'next/navigation'
import SidebarCliente from './SidebarCliente'
import SidebarDitcash from './SidebarDitcash'

export default function SidebarSelector() {
  const pathname = usePathname()

  // 1. Si la URL contiene "/dashboard", mostramos el Sidebar de DITCASH (Vendedores/Admin)
  if (pathname.startsWith('/dashboard')) {
    // Pasamos el rol 'admin' si la URL lo contiene, de lo contrario es 'vendedor'
    const isAdmin = pathname.includes('/admin')
    return <SidebarDitcash role={isAdmin ? 'admin' : 'vendedor'} />
  }

  // 2. Si la URL contiene "/estado-cuenta", mostramos el Sidebar de ClienteApp
  if (pathname.startsWith('/estado-cuenta')) {
    return <SidebarCliente />
  }

  // Por defecto, si quieres ver un sidebar base o el de cliente en todas partes:
  return null
}