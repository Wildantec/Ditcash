import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import TablaInventario from './TablaInventario'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic';

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
    let todosLosProductos: any[] = []
    let paginaActual = 1
    let tieneMasPaginas = true

    while (tieneMasPaginas) {
      const res = await fetch(`${API_BASE}/products/?page=${paginaActual}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1"
        },
        cache: 'no-store'
      })

      if (!res.ok) break;

      const json = await res.json()
      const listaProductos = json.data?.items || json.data || json.items || []

      if (listaProductos.length === 0) {
        tieneMasPaginas = false
      } else {
        todosLosProductos = [...todosLosProductos, ...listaProductos]
        const ultimaPagina = json.data?.last_page || json.last_page || json.meta?.last_page || null

        if (ultimaPagina && paginaActual >= ultimaPagina) {
          tieneMasPaginas = false
        } else {
          paginaActual++
        }
      }
      if (paginaActual > 20) break;
    }

    return todosLosProductos
  } catch (error) {
    console.error("Error trayendo productos para inventario:", error)
    return []
  }
}

export default async function InventarioPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value || ''
  
  const [bodegasAraujos, configsLocales, productosAraujos, bannersLocales] = await Promise.all([
    obtenerBodegasDeAraujos(),
    prisma.bodegaConfig.findMany(),
    obtenerProductosDeAraujos(),
    prisma.productAdvertisement.findMany({ where: { isActive: true } })
  ])
  
  const usuarioLocal = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
  const rolUsuario = usuarioLocal?.rol || 'VENDEDOR'
  const nombreVendedor = usuarioLocal?.nombre || 'VENDEDOR REQUISITOS'
  
  const bodegasMapeadasParaTabla = bodegasAraujos.map((bod: any) => {
    const configLocal = configsLocales.find(c => c.id_bodega_araujo === bod.id.toString())
    return {
      id: bod.id,
      name: bod.name,
      is_main: configLocal ? configLocal.es_principal : false
    }
  })

  const productosConPublicidadInyectada = productosAraujos.map((prod: any) => {
    const banner = bannersLocales.find(b => b.productCode === prod.code)
    return {
      ...prod,
      publicidadAsignada: banner ? {
        id: banner.id,
        title: banner.title,
        imagePath: banner.imagePath,
        endDate: banner.endDate.toISOString()
      } : null
    }
  })

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen text-[#001F3F]">
      <header className="flex justify-between items-end mb-10 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Package className="text-[#FFB800]" size={28} strokeWidth={2.5} /> Kardex de Inventario
          </h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Existencias sincronizadas y administración estratégica de banners
          </p>
        </div>
      </header>
      <TablaInventario
        productosIniciales={productosConPublicidadInyectada}
        bodegasAPI={bodegasMapeadasParaTabla}
        nombreVendedorActual={nombreVendedor}
        rolUsuario={rolUsuario}
      />
    </div>
  )
}