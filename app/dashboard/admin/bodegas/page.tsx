import { prisma } from '@/lib/prisma'
import ComponenteFilaBodega from './ComponenteFilaBodega'

export const dynamic = 'force-dynamic';
async function obtenerBodegasDeAraujos() {
  try {
    const API_BASE = "https://grupoaraujos.cloud/api/v1"
    
    // Autenticación dinámica secuencial
    const tokenResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
        password: process.env.API_CONTABLE_PASSWORD || "admin123",
      }),
    })
    
    if (!tokenResponse.ok) return []
    const tokenData = await tokenResponse.json()
    const token = tokenData.data?.access_token || tokenData.access_token

    // Petición real verificada según tu estructura de JSON compartida
    const res = await fetch(`${API_BASE}/warehouses/`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    })
    
    if (!res.ok) return []
    const json = await res.json()
    
    // Mapeamos de forma estricta contra la propiedad 'data' de la API
    return json.data || []
  } catch (error) {
    console.error("Error al obtener bodegas desde el endpoint de Araujos:", error)
    return []
  }
}

export default async function AdminBodegasPage() {
  // Consultas paralelas en caliente
  const bodegasAraujos = await obtenerBodegasDeAraujos()
  const configsLocales = await prisma.bodegaConfig.findMany()

  // Consolidamos el arreglo cruzando los identificadores contables
  const bodegasConsolidadas = bodegasAraujos.map((bod: any) => {
    const configLocal = configsLocales.find(c => c.id_bodega_araujo === bod.id.toString())
    return {
      id: bod.id.toString(),
      name: bod.name || "BODEGA INDEFINIDA",
      is_main: configLocal ? configLocal.es_principal : false
    }
  })

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-10 pt-28 space-y-6 flex-grow">
      
      {/* CABECERA EDITORIAL */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800] opacity-5 rounded-full -mr-10 -mt-10" />
        <h1 className="text-2xl font-black uppercase italic leading-none text-[#001F3F]">
          Configuración de <span className="text-[#FFB800]">Bodegas</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xl leading-relaxed">
          Asigne cuáles bodegas contables de Araujos se consideran principales para habilitar su visibilidad automática en el perfil de inventarios de los vendedores.
        </p>
      </div>

      {/* CONTENEDOR DE LA LISTA */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,31,63,0.03)] border border-white overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-black uppercase text-xs tracking-wider text-slate-400">Bodegas Sincronizadas</h2>
          <span className="bg-[#001F3F] text-[#FFB800] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {bodegasConsolidadas.length} Totales
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {bodegasConsolidadas.length > 0 ? (
            bodegasConsolidadas.map((bodega: any) => (
              <ComponenteFilaBodega 
                key={bodega.id} 
                id={bodega.id} 
                name={bodega.name} 
                isMainInicial={bodega.is_main} 
              />
            ))
          ) : (
            <div className="py-20 text-center">
              <span className="text-3xl block mb-2">🔄</span>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
                No se logró recuperar deudas ni locaciones del servidor externo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}