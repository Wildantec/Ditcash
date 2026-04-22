import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Usamos flex-grow y items-center para centrar el contenido y eliminar distracciones laterales */}
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Crear cuenta</h1>
            <p className="text-slate-500 text-center">Regístrate en Ditec para comenzar</p>
          </div>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                className="w-full border border-slate-200 p-3.5 rounded-xl text-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Usuario</label>
              <input 
                type="text" 
                placeholder="usuario123" 
                className="w-full border border-slate-200 p-3.5 rounded-xl text-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full border border-slate-200 p-3.5 rounded-xl text-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <button 
              className="bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4"
            >
              Crear Cuenta
            </button>
          </div>

          <p className="text-center mt-8 text-slate-600">
            ¿Ya tienes una cuenta? <br />
            <Link href="/" className="text-blue-600 font-bold hover:underline">Inicia sesión aquí</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}