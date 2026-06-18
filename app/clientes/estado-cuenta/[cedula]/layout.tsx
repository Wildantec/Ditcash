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
      
      <Navbar 
        esCliente={true} 
        clienteCedula={clienteCedulaReal} 
      />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}