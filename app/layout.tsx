// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DITCASH',
  description: 'Sistema de Gestión Institucional',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Totalmente limpio: Sin contenedores flex ni barras laterales molestas */}
        {children}
      </body>
    </html>
  )
}