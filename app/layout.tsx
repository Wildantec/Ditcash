import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DITCASH - Sistema de Gestión",
  description: "Plataforma Administrativa Corporativa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans bg-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}