// src/app/estado-cuenta/layout.tsx
import { cookies } from 'next/headers';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default async function EstadoCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const clienteCedulaReal = cookieStore.get('user_id')?.value || null;

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-between">
      
      {/* 🔒 Únicamente el Navbar superior para la experiencia del cliente externo */}
      <Navbar 
        esCliente={true} 
        clienteCedula={clienteCedulaReal} 
      />

      {/* Aquí cae el contenido real del page.tsx del estado de cuenta */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* El Footer corporativo al pie */}
      <Footer />
    </div>
  );
}