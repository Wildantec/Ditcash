import Link from 'next/link'
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Agregamos text-center y items-center para centrar todo el contenido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center">
          
          {/* Columna 1: Logo y Eslogan */}
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

          {/* Columna 2: Espacio vacío o Enlaces adicionales si lo deseas en el futuro */}
          <div className="hidden md:block">
            {/* Puedes dejarlo vacío para mantener equilibrio visual */}
          </div>

          {/* Columna 3: Legal */}
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

        {/* Línea final centrada */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            &copy; 2026 DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA. LTDA.
          </p>
        </div>
      </div>
    </footer>
  )
}