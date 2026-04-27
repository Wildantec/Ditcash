'use client'

import { useRouter } from 'next/navigation';

export default function AvisoPrivacidadPage() {
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
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-4">Aviso de Privacidad</h1>
            <p className="text-[#FFB800] font-bold text-xs uppercase tracking-[0.3em]">Wildantec Cia Ltda • LOPDP</p>
          </div>

          <div className="p-8 md:p-16 space-y-12">
            
            {/* Introducción */}
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-sm text-slate-600 leading-relaxed text-justify">
              <p>
                El presente Aviso de Privacidad tiene por objeto informar de manera clara, previa, accesible y transparente sobre el tratamiento de datos personales realizado por <strong>DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</strong>, en cumplimiento de la Ley Orgánica de Protección de Datos Personales, su Reglamento General y la normativa aplicable emitida por la Superintendencia de Protección de Datos Personales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600">
              
              {/* Bloque 1: Responsable */}
              <section className="space-y-4">
                <h2 className="text-lg font-black text-[#001F3F] uppercase italic border-b-2 border-[#FFB800] inline-block">1. Responsable del Tratamiento</h2>
                <div className="space-y-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p><strong>Razón Social:</strong> DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</p>
                  <p><strong>RUC:</strong> 1792490049001</p>
                  <p><strong>Domicilio:</strong> Barrio Pomasqui, calle ESK Marieta de Veintimilla, N3-34, Quito, Ecuador.</p>
                  <p className="text-[#001F3F] font-bold">protecciondedatos@ditec-ec.com</p>
                </div>
              </section>

              {/* Bloque 2: Delegado */}
              <section className="space-y-4">
                <h2 className="text-lg font-black text-[#001F3F] uppercase italic border-b-2 border-[#FFB800] inline-block">2. Delegado de Protección</h2>
                <div className="space-y-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p><strong>Nombre:</strong> Ricardo Herrada Galindo</p>
                  <p><strong>Correo:</strong> rherrada@praxislegalgroup.com</p>
                  <p><strong>Dirección:</strong> Av. Portugal E10-63 y Av. 6 de diciembre, Quito.</p>
                </div>
              </section>
            </div>

            {/* Contenido Extenso */}
            <div className="space-y-10 text-sm text-slate-600 leading-relaxed text-justify">
              
              <section>
                <h3 className="font-black text-[#001F3F] uppercase mb-3">3. Categorías de titulares</h3>
                <p>Tratamos datos de: Clientes (naturales y jurídicos), potenciales clientes, deudores, codeudores, garantes, colaboradores y proveedores vinculados a la operación de la compañía.</p>
              </section>

              <section>
                <h3 className="font-black text-[#001F3F] uppercase mb-3">4. Categorías de datos personales</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Identificación:</strong> Nombres, cédula, estado civil, firma.</li>
                  <li><strong>Contacto:</strong> Domicilio, teléfonos, correo electrónico.</li>
                  <li><strong>Laborales:</strong> Empresa, cargo, ingresos, capacidad de pago.</li>
                  <li><strong>Económicos:</strong> Historial crediticio, referencias comerciales, obligaciones financieras.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-black text-[#001F3F] uppercase mb-3">5. Finalidades del tratamiento</h3>
                <p>Evaluación de solicitudes de crédito, validación de identidad, análisis de riesgo, gestión de cobranza, recuperación de cartera, cumplimiento de obligaciones legales y atención de garantías.</p>
              </section>

              <section>
                <h3 className="font-black text-[#001F3F] uppercase mb-3">6. Bases legitimadoras</h3>
                <p>Aplicación de medidas precontractuales, ejecución de la relación contractual, cumplimiento de obligaciones legales e interés legítimo de la compañía.</p>
              </section>

              <section className="bg-[#001F3F] p-8 rounded-[2.5rem] text-white">
                <h3 className="font-black text-[#FFB800] uppercase mb-4">9. Derechos de los titulares</h3>
                <p className="mb-4 text-xs opacity-90">Usted puede ejercer sus derechos de Acceso, Rectificación, Eliminación, Oposición y Portabilidad enviando su solicitud a:</p>
                <div className="inline-block bg-white/10 px-6 py-3 rounded-xl border border-white/20 font-bold text-[#FFB800]">
                  protecciondedatos@ditec-ec.com
                </div>
              </section>

              <section>
                <h3 className="font-black text-[#001F3F] uppercase mb-3">10. Seguridad de la información</h3>
                <p>Implementamos medidas técnicas y organizativas para proteger sus datos frente a pérdida, acceso no autorizado o alteración, incluyendo controles de acceso y cifrado de bases de datos.</p>
              </section>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Aviso de Privacidad Oficial • Abril 2026 • DITEC Ecuador
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}