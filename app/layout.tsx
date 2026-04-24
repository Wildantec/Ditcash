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
      {/* Añadimos overflow-x-hidden para evitar que el sidebar "empuje" la pantalla hacia los lados al animarse */}
      <body className={`${inter.className} flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden`}>
        
        {/* Este componente decide qué sidebar mostrar y ahora maneja su propia versión móvil */}
        <SidebarSelector />
        
        {/* flex-grow: hace que ocupe el resto del espacio.
          w-full: asegura que en móvil tome todo el ancho.
          pt-16 lg:pt-0: reserva un espacio arriba en móviles para que el botón de hamburguesa no tape el contenido.
        */}
        <main className="flex-grow w-full pt-20 lg:pt-0 transition-all duration-300">
          {children}
        </main>

      </body>
    </html>
  )
}