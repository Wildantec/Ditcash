import { cookies } from 'next/headers';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default async function EstadoCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Buscamos la cookie de la cédula o el user_id para dárselo de forma forzada al Navbar
  const cookieStore = await cookies();
  const clienteCedulaReal = cookieStore.get('user_id')?.value || null;

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-between">
      
      {/* 🔒 INYECTAMOS EL NAVBAR DESDE EL LAYOUT CAPTURANDO LA COOKIE DIRECTA */}
      <Navbar 
        esCliente={true} 
        clienteCedula={clienteCedulaReal} 
      />

      {/* Aquí caerá el contenido real del page.tsx */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* 🏢 EL FOOTER FORZADO AL PIE DE LA INFRAESTRUCTURA */}
      <Footer />
    </div>
  );
}