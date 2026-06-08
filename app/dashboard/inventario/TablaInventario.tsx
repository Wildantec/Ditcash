'use client'

import { useState, useEffect } from 'react'

interface TablaProps {
  productosIniciales: any[]
  bodegasAPI: any[]
  nombreVendedorActual: string
  rolUsuario: string 
}

export default function TablaInventario({ productosIniciales, bodegasAPI, nombreVendedorActual, rolUsuario }: TablaProps) {
  const nombreLimpioVendedor = nombreVendedorActual.toUpperCase().trim()

  // Inicializamos el estado buscando la bodega del vendedor en la data real
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>(() => {
    if (bodegasAPI && bodegasAPI.length > 0) {
      const propia = bodegasAPI.find(b => b.name.toUpperCase().includes(nombreLimpioVendedor))
      return propia ? propia.id.toString() : bodegasAPI[0].id.toString()
    }
    return ''
  })
  
  const [busqueda, setBusqueda] = useState('')
  const [estaCargando, setEstaCargando] = useState(false)

  // Efecto visual rápido para simular la recarga al cambiar de bodega
  useEffect(() => {
    setEstaCargando(true)
    const timer = setTimeout(() => setEstaCargando(false), 250)
    return () => clearTimeout(timer)
  }, [bodegaSeleccionada])

  const idBodegaActiva = bodegaSeleccionada || (() => {
    if (bodegasAPI && bodegasAPI.length > 0) {
      const propia = bodegasAPI.find(b => b.name.toUpperCase().includes(nombreLimpioVendedor))
      return propia ? propia.id.toString() : bodegasAPI[0].id.toString()
    }
    return ''
  })()

  // 🔍 FILTRO 1: Por Producto (Barra de búsqueda)
  const productosFiltradosBase = productosIniciales.filter((prod) => {
    const termino = busqueda.toLowerCase().trim()
    return (
      prod.name?.toLowerCase().includes(termino) ||
      prod.code?.toLowerCase().includes(termino) ||
      prod.barcode?.toLowerCase().includes(termino)
    )
  })

  // 🏢 FILTRO 2: LÓGICA DE FILTRADO DE BODEGAS AUTOMÁTICA Y GLOBAL (CORREGIDO)
  const bodegasARenderizar = (() => {
    // REGLA A: Si el usuario es ADMIN GLOBAL, tiene acceso completo a revisar todo sin restricciones sin importar la búsqueda
    if (rolUsuario === 'ADMIN') {
      return bodegasAPI;
    }

    // REGLA B: Si es un vendedor normal, extraemos dinámicamente sus bodegas autorizadas (Su nombre + Principales)
    return bodegasAPI.filter((b) => {
      const nameUpper = b.name.toUpperCase().trim();
      
      // Evaluamos si el administrador la marcó como principal en Ditcash (base de datos)
      const esCentralOPrivilegiada = b.is_main === true;
      
      // Comprobamos si es la bodega que lleva su propio nombre
      const esPropiaDelVendedor = nameUpper.includes(nombreLimpioVendedor);

      return esCentralOPrivilegiada || esPropiaDelVendedor;
    });
  })();

  return (
    <div className="space-y-6">
      
      {/* PANEL DE CONTROLES */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Selector de Bodega */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Seleccionar Bodega</label>
          <div className="relative">
            <select
              value={idBodegaActiva}
              onChange={(e) => setBodegaSeleccionada(e.target.value)}
              disabled={false}
              className="w-full bg-slate-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg p-2.5 focus:outline-none uppercase"
            >
              {bodegasARenderizar.length === 0 && (
                <option value="">Sincronizando bodegas...</option>
              )}
              {bodegasARenderizar.map((bod) => (
                <option key={bod.id} value={bod.id}>
                  {bod.name.toUpperCase()}
                </option>
              ))}
            </select>
            
            {/* Indicador de actualización elegante */}
            {estaCargando && (
              <span className="absolute right-10 top-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </div>
        </div>

        {/* Buscador de Producto */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Filtrar por Producto</label>
          <div className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <input
              type="text"
              placeholder="Escriba el nombre o código del producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 font-medium focus:outline-none placeholder-gray-400"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold px-2 py-1 rounded transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE TABLAS POR BODEGA */}
      {bodegasARenderizar
        .filter(b => busqueda.trim() !== '' || b.id.toString() === idBodegaActiva) // 🎯 ¡EL TRUCO!: Filtramos en el renderizado de abajo para que solo se dibuje visualmente la tabla de la bodega activa en pantalla, manteniendo vivo tu menú select de arriba.
        .map((bodega) => {
          const nombreBodegaUpper = bodega.name.toUpperCase()
          const esBodegaDelVendedor = nombreBodegaUpper.includes(nombreLimpioVendedor)
          const esBodegaCentral = bodega.id === 1 || nombreBodegaUpper.includes('CENTRAL')

          const productosAIterar = busqueda.trim() !== ''
            ? productosFiltradosBase.filter(prod => {
                const stockCentralReal = prod.stock_quantity || 0
                const stockTotalGlobal = parseInt(prod.total_stock || '0')
                const stockVendedorReal = Math.max(0, stockTotalGlobal - stockCentralReal)
                
                if (rolUsuario === 'ADMIN') return true; 
                if (esBodegaDelVendedor) return stockVendedorReal > 0
                if (esBodegaCentral) return stockCentralReal > 0
                return false 
              })
            : productosFiltradosBase

          return (
            <div key={bodega.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-5">
              
              {/* Título de la tabla de la Bodega */}
              <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xs font-black text-[#001F3F] uppercase tracking-wider font-sans">
                  KARDEX - {nombreBodegaUpper}
                </h2>
              </div>

              {/* Renderizado de Filas con Scroll Interno */}
              {productosAIterar.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-bold text-xs tracking-tight bg-white uppercase">
                  No hay datos disponibles
                </div>
              ) : (
                <div 
                  className={`overflow-x-auto max-h-[480px] overflow-y-auto transition-opacity duration-200 ${
                    estaCargando ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                      <tr className="bg-slate-100 text-[#001F3F] text-[11px] uppercase tracking-widest font-black border-b border-gray-200">
                        <th className="py-3 px-6">Código</th>
                        <th className="py-3 px-6">Producto</th>
                        <th className="py-3 px-6 text-center">Stock Final</th>
                        <th className="py-3 px-6 text-center">Precios Especiales</th>
                        <th className="py-3 px-6 text-center">Unidad</th>
                        <th className="py-3 px-6 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm bg-white">
                      {productosAIterar.map((item, idx) => {
                        const stockCentralReal = item.stock_quantity || 0
                        const stockTotalGlobal = parseInt(item.total_stock || '0')
                        const stockVendedorReal = Math.max(0, stockTotalGlobal - stockCentralReal)

                        let stockFinalVisual = 0
                        
                        if (rolUsuario === 'ADMIN') {
                          stockFinalVisual = esBodegaCentral ? stockCentralReal : stockTotalGlobal
                        } else {
                          if (esBodegaCentral) {
                            stockFinalVisual = stockCentralReal
                          } else if (esBodegaDelVendedor) {
                            stockFinalVisual = stockVendedorReal
                          }
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-6 font-mono text-xs text-gray-400 font-semibold tracking-tight">
                              {item.code || 'N/A'}
                            </td>
                            <td className="py-3 px-6 font-bold text-gray-700 uppercase tracking-tight text-xs">
                              {item.name}
                            </td>
                            <td className="py-3 px-6 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${stockFinalVisual > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                                {stockFinalVisual.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-center text-xs text-gray-500 font-medium">
                              {item.prices && item.prices.length > 1 ? (
                                <select className="bg-gray-50 border border-gray-200 rounded p-0.5 text-[10px] font-bold text-gray-600 focus:outline-none">
                                  {item.prices.map((p: any, pIdx: number) => (
                                    <option key={pIdx} disabled>
                                      {p.price_type?.name || 'Precio'}: ${parseFloat(p.price || '0').toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-400 text-[11px]">Sin variaciones</span>
                              )}
                            </td>
                            <td className="py-3 px-6 text-center text-xs font-bold text-gray-500">
                              {item.unit_measure || 'UN'}
                            </td>
                            <td className="py-3 px-6 text-center">
                              <button 
                                onClick={() => console.log('Ver publicidad de:', item.code)}
                                className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white font-black text-[10px] tracking-wider uppercase px-4 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
                              >
                                Ver Publicidad
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}