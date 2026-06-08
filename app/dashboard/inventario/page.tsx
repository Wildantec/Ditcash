// src/app/dashboard/inventario/page.tsx
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import TablaInventario from './TablaInventario'

export const dynamic = 'force-dynamic';

// 🔄 Reutilizamos la misma lógica limpia para el Server Component de inventarios
async function obtenerBodegasDeAraujos() {
  try {
    const API_BASE = "https://grupoaraujos.cloud/api/v1"
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

    const res = await fetch(`${API_BASE}/warehouses/`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1"
      },
      cache: 'no-store'
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Error trayendo bodegas para inventario:", error)
    return []
  }
}
async function obtenerProductosDeAraujos() {
  try {
    const API_BASE = "https://grupoaraujos.cloud/api/v1"
    
    // 1. Login para obtener el token
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

    // 2. Petición para traer los productos con stock
    // Nota: Ajusta la ruta (/products o /items) según cómo la tenga estructurada Araujos
    const res = await fetch(`${API_BASE}/products/`, { 
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1"
      },
      cache: 'no-store'
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error("Error trayendo productos para inventario:", error)
    return []
  }
}

export default async function InventarioPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value || ''
  
  // Consultas dinámicas concurrentes (más rápido)
  const [bodegasAraujos, configsLocales, productosAraujos] = await Promise.all([
    obtenerBodegasDeAraujos(),
    prisma.bodegaConfig.findMany(),
    obtenerProductosDeAraujos() // <--- ¡Traemos la data real de los productos!
  ])

  // Buscamos los datos de sesión locales
  const usuarioLocal = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
  const rolUsuario = usuarioLocal?.rol || 'VENDEDOR'
  const nombreVendedor = usuarioLocal?.nombre || 'VENDEDOR REQUISITOS'

  // Cruzamos la data inyectando el booleano dinámico de Ditcash
  const bodegasMapeadasParaTabla = bodegasAraujos.map((bod: any) => {
    const configLocal = configsLocales.find(c => c.id_bodega_araujo === bod.id.toString())
    return {
      id: bod.id,
      name: bod.name,
      is_main: configLocal ? configLocal.es_principal : false
    }
  })

  return (
    <div className="p-6 md:p-10 pt-24 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">
          Kardex de <span className="text-[#FFB800]">Inventario</span>
        </h1>
      </div>

      {/* Le pasamos la variable productosAraujos cargada con la data de la API */}
      <TablaInventario 
        productosIniciales={productosAraujos}
        bodegasAPI={bodegasMapeadasParaTabla} 
        nombreVendedorActual={nombreVendedor}
        rolUsuario={rolUsuario}
      />
    </div>
  )
}