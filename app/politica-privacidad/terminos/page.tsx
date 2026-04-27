'use client'

import { useRouter } from 'next/navigation';

export default function TerminosCondicionesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-20 text-[#001F3F]">
      <div className="max-w-5xl mx-auto">
        
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-[#FFB800] font-black text-[10px] uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform"
        >
          ← Regresar
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          {/* Banner Superior Estilo DITEC */}
          <div className="bg-[#001F3F] p-8 md:p-12 text-white relative">
            <div className="absolute right-0 top-0 opacity-10 text-9xl font-black italic select-none">DITEC</div>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-4">Términos y Condiciones</h1>
            <p className="text-[#FFB800] font-bold text-xs uppercase tracking-[0.3em]">Wildantec Cia Ltda</p>
          </div>

          <div className="p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-12 text-slate-600 text-sm leading-relaxed text-justify">
              
              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">1. Uso y restricciones</h2>
                <p>
                  La utilización de este sitio web y de los canales digitales de <strong>DITEC</strong> expresa la adhesión plena y sin reservas del usuario a los presentes Términos y Condiciones. A través de este sitio, el usuario podrá consultar el catálogo de productos tecnológicos, electrodomésticos, agroforestales y material didáctico, así como gestionar solicitudes de crédito directo para servidores públicos. DITEC se reserva el derecho a negar, restringir o condicionar el acceso a sus recursos, total o parcialmente, así como a modificar los servicios y contenidos en cualquier momento sin previo aviso.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">2. Propiedad intelectual</h2>
                <p>
                  Los derechos de propiedad intelectual sobre los contenidos, logotipos, descripciones de productos y herramientas de cálculo de crédito son propiedad exclusiva de <strong>DITEC</strong>. El usuario tiene prohibida la reproducción, distribución o transformación de cualquier material del sitio sin autorización expresa por escrito de la empresa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">3. Usos permitidos y comercialización</h2>
                <p>
                  El uso de los servicios de DITEC es responsabilidad exclusiva del usuario. Al ser un servicio enfocado al beneficio del servidor público, el usuario se obliga a proporcionar información veraz para el análisis de su capacidad crediticia. Queda estrictamente prohibido el uso de este portal para fines comerciales ajenos a DITEC o cualquier actividad que atente contra las leyes ecuatorianas o las normas de convivencia en internet.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">4. Calidad de los servicios y productos</h2>
                <p>
                  DITEC se esfuerza por mantener la exactitud en la descripción de sus productos y las condiciones de crédito. Sin embargo, no se responsabiliza por errores tipográficos o cambios técnicos realizados por los fabricantes de la tecnología o maquinaria comercializada. La aprobación del crédito directo está sujeta a la verificación de documentos y cumplimiento de políticas internas de riesgo de la empresa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">5. Confidencialidad y Protección de Datos</h2>
                <p>
                  En cumplimiento con la <strong>Ley Orgánica de Protección de Datos Personales de Ecuador</strong>, DITEC garantiza la confidencialidad de la información del servidor público. Los datos proporcionados para la gestión de créditos y entregas en zonas distantes del país serán utilizados únicamente para los fines contractuales y de mejora del servicio, asegurando un aporte positivo al estilo de vida del cliente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">6. Seguridad de la cuenta y claves</h2>
                <p>
                  El usuario es el único responsable de mantener la confidencialidad de sus claves de acceso a los portales de consulta de saldo o solicitudes de crédito. DITEC no se hace responsable por el uso negligente de las credenciales de acceso por parte del cliente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-[#001F3F] uppercase italic mb-4 border-b-2 border-[#FFB800] inline-block">7. Cobertura y Entregas</h2>
                <p>
                  Dado el compromiso de DITEC de llegar a los lugares más distantes del país, las condiciones de entrega de productos (tecnología, electrodomésticos o material agroforestal) estarán sujetas a la logística de acceso geográfico, la cual será comunicada de forma transparente al usuario durante el proceso de compra o financiamiento.
                </p>
              </section>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Última actualización: Abril 2026 • Wildantec Cia Ltda
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}