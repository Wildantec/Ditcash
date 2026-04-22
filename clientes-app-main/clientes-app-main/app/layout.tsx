// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SidebarSelector from './components/SidebarSelector'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DITCASH | Panel de Gestión',
  description: 'Sistema de gestión de campañas e incentivos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex min-h-screen bg-slate-50 text-slate-900`}>
        <SidebarSelector />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  )
}