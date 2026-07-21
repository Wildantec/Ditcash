import Link from 'next/link'
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center">
          
          {/* BLOQUE 1: LOGO E IDENTIDAD */}
          <div className="flex flex-col items-center space-y-4">
            <Image 
              src="/logo_ditec-2.png" 
              alt="DITCASH Logo"
              width={150} 
              height={110}
              className="object-contain"
              priority 
            />
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Soluciones tecnológicas inteligentes y gestión estratégica de activos. 
              Comprometidos con la seguridad de la información y la transparencia.
            </p>
          </div>

          {/* BLOQUE 2: ACERCA DE NOSOTROS (Reemplaza la columna vacía anterior) */}
          <div className="flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-900 tracking-widest uppercase mb-6 italic">
              Acerca de Nosotros
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto text-justify md:text-center">
              En <strong className="text-[#001F3F]">WILDANTEC</strong> innovamos en el desarrollo de herramientas corporativas y plataformas de control inteligente. Brindamos soporte de alta calidad tecnológica, optimizando los recursos institucionales y garantizando la excelencia operativa para todos nuestros clientes.
            </p>
          </div>

          {/* BLOQUE 3: DOCUMENTACIÓN LEGAL */}
          <div className="flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-900 tracking-widest uppercase mb-6 italic">
              Documentación Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/politica-privacidad" className="text-xs text-slate-600 hover:text-[#001F3F] hover:font-bold transition-all">
                  Política de Privacidad y Protección de Datos
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad/aviso" className="text-xs text-slate-600 hover:text-[#001F3F] hover:font-bold transition-all">
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad/terminos" className="text-xs text-slate-600 hover:text-[#001F3F] hover:font-bold transition-all">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            &copy; 2026 DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA. LTDA.
          </p>
        </div>
      </div>
    </footer>
  )
}