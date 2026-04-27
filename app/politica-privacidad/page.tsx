'use client'

import { useRouter } from 'next/navigation';

export default function PoliticaPrivacidadPrincipalPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-20 text-[#001F3F]">
      <div className="max-w-5xl mx-auto">
        
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-[#FFB800] font-black text-[10px] uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform"
        >
          ← Regresar al Sistema
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          {/* Banner Superior Estilo DITEC */}
          <div className="bg-[#001F3F] p-8 md:p-12 text-white relative">
            <div className="absolute right-0 top-0 opacity-10 text-9xl font-black italic select-none">DITEC</div>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-4">Política de Privacidad</h1>
            <p className="text-[#FFB800] font-bold text-xs uppercase tracking-[0.3em]">Protección de Datos Personales</p>
          </div>

          <div className="p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-12 text-slate-600 text-sm leading-relaxed text-justify">
              
              {/* Introducción y Fecha */}
              <section className="border-l-4 border-[#FFB800] pl-6 py-2 bg-slate-50 rounded-r-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Última actualización: Marzo 2026</p>
                <p>
                  En cumplimiento de la Ley Orgánica de Protección de Datos Personales, su Reglamento General y la normativa emitida por la Superintendencia de Protección de Datos Personales, <strong>DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</strong> informa a los titulares sobre el tratamiento de sus datos personales a través de esta política de privacidad.
                </p>
              </section>

              {/* Identificación del responsable */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-[#001F3F] uppercase italic mb-4">Responsable del Tratamiento</h2>
                  <p className="font-bold">DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA LTDA</p>
                  <p>RUC: 1792490049001</p>
                </div>
                <div className="md:border-l md:pl-8 border-slate-100">
                  <h2 className="text-lg font-black text-[#001F3F] uppercase italic mb-4">Canal de Derechos</h2>
                  <p className="text-[#FFB800] font-black">protecciondedatos@ditec-ec.com</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-2">Atención prioritaria LOPDP</p>
                </div>
              </section>

              {/* ¿Qué datos personales tratamos? */}
              <section>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-6 border-b-4 border-[#FFB800] inline-block">¿Qué datos personales tratamos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Datos identificativos (Nombres, apellidos y cédula)",
                    "Datos de contacto (Dirección, teléfono y correo)",
                    "Datos laborales o institucionales",
                    "Datos económicos, financieros y crediticios",
                    "Datos derivados de la relación contractual y cobranza"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="w-2 h-2 bg-[#FFB800] rounded-full" />
                      <span className="font-bold text-[#001F3F] text-xs uppercase italic">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ¿Para qué tratamos sus datos? */}
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-2 border-b-4 border-[#FFB800] inline-block">¿Para qué tratamos sus datos?</h2>
                <p>Tratamos sus datos para finalidades específicas y legítimas:</p>
                <ul className="grid grid-cols-1 gap-3">
                  {[
                    "Atender solicitudes a través de la web",
                    "Evaluar crédito y capacidad de pago",
                    "Gestionar procesos precontractuales y contractuales",
                    "Administrar facturación, cobranza y recuperación de cartera",
                    "Cumplir con requerimientos de autoridades competentes",
                    "Prevenir fraude y validar seguridad operativa"
                  ].map((finalidad, i) => (
                    <li key={i} className="text-xs flex gap-3 items-start">
                      <span className="text-[#FFB800]">➔</span> {finalidad}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Base legitimadora */}
              <section>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-6 border-b-4 border-[#FFB800] inline-block">Base legitimadora</h2>
                <p className="mb-4">El tratamiento se sustenta en:</p>
                <div className="bg-[#001F3F] text-white p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[#FFB800] font-black text-xs uppercase">Contrato:</p>
                    <p className="text-xs opacity-80 text-justify">Ejecución de la relación contractual y medidas precontractuales.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[#FFB800] font-black text-xs uppercase">Legal:</p>
                    <p className="text-xs opacity-80 text-justify">Cumplimiento de obligaciones regulatorias y tributarias.</p>
                  </div>
                </div>
              </section>

              {/* Derechos */}
              <section>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-6 border-b-4 border-[#FFB800] inline-block">Sus Derechos</h2>
                <p className="mb-6">Usted puede ejercer sus derechos de Acceso, Rectificación, Eliminación, Oposición, Suspensión y Portabilidad.</p>
                <div className="text-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-4">Enviar solicitud formal a:</p>
                  <a href="mailto:protecciondedatos@ditec-ec.com" className="text-xl md:text-2xl font-black text-[#001F3F] hover:text-[#FFB800] transition-colors underline decoration-[#FFB800] decoration-4">
                    protecciondedatos@ditec-ec.com
                  </a>
                </div>
              </section>

              {/* Seguridad */}
              <section>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-4 border-b-4 border-[#FFB800] inline-block">Seguridad de la información</h2>
                <p>
                  La empresa aplica medidas técnicas, organizativas y jurídicas razonables para proteger los datos personales frente a pérdida, acceso no autorizado o alteración. No obstante, en caso de incidentes de seguridad, se actuará conforme a la normativa aplicable para proteger sus libertades.
                </p>
              </section>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Política Integral de Privacidad • Wildantec Cia Ltda • DITCASH
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}