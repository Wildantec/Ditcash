// src/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Columna 1: Logo y Eslogan */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-orange-600">
              CLIENTE<span className="text-slate-800">APP</span>
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              Soluciones inteligentes para la gestión de préstamos y finanzas empresariales. 
              Seguridad y rapidez en un solo lugar.
            </p>
          </div>
          {/* Columna 4: Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600">Privacidad</Link></li>
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600">Términos</Link></li>
            </ul>
          </div>
        </div>

        {/* Línea final */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-400">
            &copy; 2026 Cliente App. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-xs text-slate-300 font-medium uppercase tracking-widest">DIDACTICOS Y TECNOLOGICOS WILDANTEC CIA.LTDA.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}