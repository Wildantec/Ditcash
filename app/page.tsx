'use client'
import { useState } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function Home() {
  const [cedula, setCedula] = useState('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const router = useRouter();

  // DATO QUEMADO PARA PRUEBAS
  const CEDULA_PRUEBA = "1723456789";

  const manejarConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aceptaPrivacidad) {
      alert("Debes aceptar la política de privacidad para consultar tu estado de cuenta.");
      return;
    }

    if (cedula.length < 10) {
      alert("Por favor, ingresa un número de cédula válido (10 dígitos).");
      return;
    }

    // SIMULACIÓN DE CONSULTA A BASE DE DATOS
    if (cedula === CEDULA_PRUEBA) {
      // Si la cédula coincide con nuestro dato quemado, redirigimos
      router.push(`/clientes/estado-cuenta/${cedula}`);
    } else {
      // Si es cualquier otra cédula, simulamos que no existe en el sistema
      alert("Cliente no encontrado. Para esta prueba usa la cédula: 1723456789");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-grow">
        {/* Sección Hero con Estilo DITCASH */}
        <div className="pt-32 pb-20 px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#001F3F] mb-6 leading-tight">
            Simplifica tus finanzas y <br /> 
            <span className="text-[#D4AF37]">gana</span> con ClientesAPP
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            Consulta tu estado de cuenta al instante o gestiona tus pagos para ganar beneficios.
          </p>
          
          {/* Card de Consulta por Cédula */}
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,31,63,0.15)] border border-slate-50">
            <form onSubmit={manejarConsulta}>
              <div className="text-left mb-4">
                <label htmlFor="cedula" className="text-xs font-bold text-[#001F3F] uppercase tracking-widest ml-1">
                  Ingresa tu Cédula
                </label>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  id="cedula"
                  type="text" 
                  maxLength={10}
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1723456789"
                  className="flex-grow px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-lg font-bold text-[#001F3F]"
                />
                <button 
                  type="submit"
                  className={`px-8 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    aceptaPrivacidad 
                    ? 'bg-[#001F3F] text-white hover:bg-black hover:scale-105' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Ver Estado de Cuenta
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              {/* CHECKLIST DE PRIVACIDAD */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-4">
                <label className="flex items-start gap-3 cursor-pointer group text-left">
                  <input 
                    type="checkbox" 
                    checked={aceptaPrivacidad}
                    onChange={() => setAceptaPrivacidad(!aceptaPrivacidad)}
                    className="mt-1 w-5 h-5 accent-[#D4AF37] cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-medium leading-tight">
                    Acepto el tratamiento de mis datos personales de acuerdo con la <span className="text-[#001F3F] font-bold underline">Política de Privacidad</span> de ClientesApp. Entiendo que mi información financiera es confidencial y protegida.
                  </span>
                </label>
              </div>
            </form>

            <p className="mt-4 text-sm text-slate-500 text-left">
              ¿Eres vendedor? <Link href="/login" className="text-[#D4AF37] font-bold hover:underline">Inicia sesión aquí</Link> para ver tus campañas.
            </p>
          </div>
        </div>

        {/* Sección de Información Adicional */}
        <div className="py-20 bg-slate-50 border-y border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-6">
            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="text-[#D4AF37] text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-[#001F3F] mb-2">Consulta Rápida</h3>
              <p className="text-sm text-slate-600">Accede a tus saldos con solo tu número de identificación al instante.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="text-[#D4AF37] text-3xl mb-3">🏆</div>
              <h3 className="font-bold text-[#001F3F] mb-2">Gana Dinero</h3>
              <p className="text-sm text-slate-600">Registra tus evidencias fotográficas y acumula $2.00 por cada una.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="text-[#D4AF37] text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-[#001F3F] mb-2">100% Seguro</h3>
              <p className="text-sm text-slate-600">Protegemos tu privacidad con los estándares bancarios más altos del país.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}