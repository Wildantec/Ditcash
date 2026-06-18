'use client'

import { useState, useEffect } from 'react'
import { 
  Warehouse, 
  Package, 
  Search, 
  Image, 
  Calendar, 
  PlusCircle, 
  Eye, 
  X, 
  Edit3 
} from 'lucide-react'
import Swal from 'sweetalert2'

interface PriceReal {
  price?: string;
  price_type?: { name?: string };
}

interface ProductoReal {
  id: number;
  code?: string;
  barcode?: string;
  name?: string;
  unit_price?: string;
  stock_quantity?: number;
  total_stock?: string;
  unit_measure?: string;
  prices?: PriceReal[];
  publicidadAsignada?: {
    id: number;
    title: string;
    imagePath: string;
    endDate: string;
  } | null;
}

interface TablaProps {
  productosIniciales: ProductoReal[]
  bodegasAPI: any[]
  nombreVendedorActual: string
  rolUsuario: string 
}

export default function TablaInventario({ productosIniciales, bodegasAPI, nombreVendedorActual, rolUsuario }: TablaProps) {
  const nombreLimpioVendedor = nombreVendedorActual.toUpperCase().trim()
  const [productos, setProductos] = useState<ProductoReal[]>(productosIniciales)

  useEffect(() => {
    setProductos(productosIniciales)
  }, [productosIniciales])

  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>(() => {
    if (bodegasAPI && bodegasAPI.length > 0) {
      const propia = bodegasAPI.find(b => b.name.toUpperCase().includes(nombreLimpioVendedor))
      return propia ? propia.id.toString() : bodegasAPI[0].id.toString()
    }
    return ''
  })
  
  const [busqueda, setBusqueda] = useState('')
  const [estaCargando, setEstaCargando] = useState(false)

  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoReal | null>(null)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [modalVerAbierto, setModalVerAbierto] = useState(false)

  const [campanaTitulo, setCampanaTitulo] = useState('')
  const [fechaExpiracion, setFechaExpiracion] = useState('')
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null)
  const [guardandoPublicidad, setGuardandoPublicidad] = useState(false)

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

  const productosFiltradosBase = productos.filter((prod) => {
    const termino = busqueda.toLowerCase().trim()
    return (
      prod.name?.toLowerCase().includes(termino) ||
      prod.code?.toLowerCase().includes(termino) ||
      prod.barcode?.toLowerCase().includes(termino)
    )
  })

  const bodegasARenderizar = (() => {
    if (rolUsuario === 'ADMIN') return bodegasAPI;
    return bodegasAPI.filter((b) => {
      const nameUpper = b.name.toUpperCase().trim();
      return b.is_main === true || nameUpper.includes(nombreLimpioVendedor);
    });
  })();

  const handleGuardarPublicidad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productoSeleccionado || !campanaTitulo || !fechaExpiracion || (!productoSeleccionado.publicidadAsignada && !archivoImagen)) {
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">CAMPOS INCOMPLETOS</span>',
        text: 'Por favor complete todos los campos requeridos en el diseño del banner.',
        icon: 'warning',
        confirmButtonColor: '#001F3F',
        confirmButtonText: 'REVISAR'
      })
      return
    }

    setGuardandoPublicidad(true)
    try {
      const formData = new FormData()
      formData.append('productCode', productoSeleccionado.code || '')
      formData.append('productName', productoSeleccionado.name || '')
      formData.append('title', campanaTitulo)
      formData.append('endDate', fechaExpiracion)
      if (archivoImagen) {
        formData.append('image', archivoImagen)
      }

      const res = await fetch('/dashboard/inventario/api', {
        method: 'POST',
        body: formData
      })

      const jsonResponse = await res.json()
      
      if (jsonResponse.success) {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">¡BANNER VINCULADO!</span>',
          text: 'La campaña publicitaria se asignó correctamente al artículo.',
          icon: 'success',
          confirmButtonColor: '#001F3F',
          confirmButtonText: 'GENIAL'
        })

        setProductos(prevProductos => 
          prevProductos.map(p => {
            if (p.code === productoSeleccionado.code) {
              return {
                ...p,
                publicidadAsignada: {
                  id: jsonResponse.data.id,
                  title: jsonResponse.data.title,
                  imagePath: jsonResponse.data.imagePath,
                  endDate: jsonResponse.data.endDate
                }
              }
            }
            return p
          })
        )

        setModalCrearAbierto(false)
        setCampanaTitulo('')
        setFechaExpiracion('')
        setArchivoImagen(null)
      } else {
        Swal.fire({
          title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">INCONVENIENTE</span>',
          text: jsonResponse.message || 'Error guardando publicidad.',
          icon: 'error',
          confirmButtonColor: '#001F3F'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: '<span style="font-size:16px; font-weight:bold; text-transform:uppercase; color:#001F3F;">ERROR CRÍTICO</span>',
        text: 'Error de conexión con el servidor interno de Ditcash.',
        icon: 'error',
        confirmButtonColor: '#001F3F'
      })
    } finally {
      setGuardandoPublicidad(false)
    }
  }

  const abrirModalCrear = (item: ProductoReal) => {
    setProductoSeleccionado(item)
    if (item.publicidadAsignada) {
      setCampanaTitulo(item.publicidadAsignada.title)
      const fechaFormateada = new Date(item.publicidadAsignada.endDate).toISOString().split('T')[0]
      setFechaExpiracion(fechaFormateada)
    } else {
      setCampanaTitulo('')
      setFechaExpiracion('')
    }
    setArchivoImagen(null)
    setModalCrearAbierto(true)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-[#001F3F]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Filtro por Locación</label>
          <div className="relative flex items-center">
            <Warehouse size={16} className="absolute left-4 text-slate-400" strokeWidth={2.5} />
            <select
              value={idBodegaActiva}
              onChange={(e) => setBodegaSeleccionada(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[#001F3F] text-xs font-black rounded-xl pl-11 pr-4 py-3.5 focus:outline-none uppercase tracking-wider transition-all cursor-pointer appearance-none shadow-inner"
            >
              {bodegasARenderizar.map((bod) => (
                <option key={bod.id} value={bod.id}>{bod.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Búsqueda de Artículo</label>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-inner focus-within:border-[#001F3F] transition-all">
            <Search size={16} className="text-slate-400" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="ESCRIBA EL NOMBRE, CÓDIGO SINC o CÓDIGO DE BARRAS DEL ARTÍCULO..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent text-xs text-[#001F3F] font-black uppercase tracking-wider focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>
      </div>
      {bodegasARenderizar
        .filter(b => busqueda.trim() !== '' || b.id.toString() === idBodegaActiva)
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
                return esBodegaDelVendedor ? stockVendedorReal > 0 : stockCentralReal > 0;
              })
            : productosFiltradosBase

          return (
            <div key={bodega.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
              <div className="bg-[#001F3F] px-10 py-6 flex items-center gap-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white">
                  <Warehouse size={16} strokeWidth={2.5} />
                </div>
                <h2 className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.25em]">Kardex Disponible — {nombreBodegaUpper}</h2>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10 shadow-sm">
                    <tr className="text-[#001F3F] text-[10px] uppercase tracking-[0.25em] font-bold">
                      <th className="py-5 px-10">Código Araujos</th>
                      <th className="py-5 px-6">Descripción del Artículo</th>
                      <th className="py-5 px-6 text-center">Stock Físico</th>
                      <th className="py-5 px-6 text-center">Precio PVP</th>
                      <th className="py-5 px-6 text-center">Variaciones Escala</th>
                      <th className="py-5 px-6 text-center">Medida</th>
                      <th className="py-5 px-10 text-right">Estrategia Publicitaria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 bg-white">
                    {productosAIterar.map((item, oddsIdx) => {
                      const stockCentralReal = item.stock_quantity || 0
                      const stockTotalGlobal = parseInt(item.total_stock || '0')
                      const stockVendedorReal = Math.max(0, stockTotalGlobal - stockCentralReal)
                      
                      const stockFinalVisual = rolUsuario === 'ADMIN' 
                        ? (esBodegaCentral ? stockCentralReal : stockTotalGlobal)
                        : (esBodegaCentral ? stockCentralReal : stockVendedorReal);

                      const precioBaseReal = Number(item.unit_price || 0);
                      const tienePublicidad = !!item.publicidadAsignada;

                      return (
                        <tr key={item.id || oddsIdx} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-10 font-mono text-[11px] text-slate-400 font-bold tracking-widest">{item.code || 'N/A'}</td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#FFB800]/10 group-hover:text-[#001F3F] transition-all">
                                <Package size={14} strokeWidth={2.5} />
                              </div>
                              <p className="font-black text-[#001F3F] uppercase text-[12px] tracking-tight">{item.name}</p>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-black border ${
                              stockFinalVisual > 0 
                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                : 'bg-red-50 text-red-500 border-red-100'
                            }`}>
                              {stockFinalVisual.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-center font-mono font-black text-[#001F3F] text-[12px]">${precioBaseReal.toFixed(2)}</td>
                          <td className="py-5 px-6 text-center">
                            {item.prices && item.prices.length > 0 ? (
                              <select className="bg-slate-50 border border-slate-200 text-[#001F3F] font-black text-[9px] rounded-lg p-1.5 focus:outline-none uppercase tracking-wider cursor-pointer shadow-sm">
                                {item.prices.map((p, pIdx) => (
                                  <option key={pIdx} disabled>
                                    {p.price_type?.name?.toUpperCase()}: ${parseFloat(p.price || '0').toFixed(2)}
                                  </option>
                                ))}
                              </select>
                            ) : <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Único</span>}
                          </td>
                          <td className="py-5 px-6 text-center font-black text-slate-400 tracking-wider text-[11px] uppercase">{item.unit_measure || 'UN'}</td>
                          
                          <td className="py-5 px-10 text-right">
                            {tienePublicidad ? (
                              <div className="flex justify-end items-center gap-4">
                                <button 
                                  onClick={() => { setProductoSeleccionado(item); setModalVerAbierto(true); }}
                                  className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b-2 border-transparent hover:border-blue-500 transition-colors pb-0.5"
                                >
                                  Ver Banner
                                </button>
                                {(rolUsuario === 'ADMIN' || rolUsuario === 'MARKETING') && (
                                  <button 
                                    onClick={() => abrirModalCrear(item)}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-transparent hover:border-[#001F3F] text-[#001F3F] transition-colors pb-0.5"
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            ) : (
                              (rolUsuario === 'ADMIN' || rolUsuario === 'MARKETING') ? (
                                <button 
                                  onClick={() => abrirModalCrear(item)}
                                  className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b-2 border-transparent hover:border-emerald-500 transition-colors pb-0.5 inline-flex items-center gap-1"
                                >
                                  + Vincular
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">Limpio</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      {modalVerAbierto && productoSeleccionado?.publicidadAsignada && (
        <div className="fixed inset-0 bg-[#001F3F]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col">
            <div className="bg-[#001F3F] px-8 py-5 text-white flex justify-between items-center border-b border-white/10">
              <div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[#FFB800]">{productoSeleccionado.publicidadAsignada.title}</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider mt-0.5">REF: {productoSeleccionado.name?.toUpperCase()}</p>
              </div>
              <button onClick={() => setModalVerAbierto(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-slate-50">
              <img 
                src={productoSeleccionado.publicidadAsignada.imagePath} 
                alt="Banner Publicitario" 
                className="max-w-full h-auto rounded-2xl shadow-xl border border-white object-contain max-h-[320px] bg-white p-2"
              />
              <div className="flex items-center gap-2 mt-6 text-slate-400 font-bold text-[11px] uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                <Calendar size={13} className="text-red-400" strokeWidth={2.5} />
                <span>Expira: <span className="text-red-500 font-mono font-black">{new Date(productoSeleccionado.publicidadAsignada.endDate).toLocaleDateString('es-EC')}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalCrearAbierto && productoSeleccionado && (
        <div className="fixed inset-0 bg-[#001F3F]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-md w-full border border-slate-100">
            <div className="bg-[#001F3F] px-8 py-5 text-white flex justify-between items-center border-b border-white/10">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[#FFB800]">
                {productoSeleccionado.publicidadAsignada ? 'Ajustar' : 'Diseñar'} Campaña
              </h3>
              <button onClick={() => setModalCrearAbierto(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleGuardarPublicidad} className="p-8 space-y-5 bg-white">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Artículo Amarrado</label>
                <div className="relative flex items-center">
                  <Package size={14} className="absolute left-4 text-slate-400" strokeWidth={2.5} />
                  <input type="text" disabled value={`[${productoSeleccionado.code}] ${productoSeleccionado.name}`} className="w-full bg-slate-50 p-3 pl-11 text-xs font-black text-slate-400 border border-slate-200 rounded-xl focus:outline-none uppercase tracking-wide" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Encabezado Promocional *</label>
                <div className="relative flex items-center">
                  <Edit3 size={14} className="absolute left-4 text-slate-400" strokeWidth={2.5} />
                  <input type="text" required placeholder="EJ: ¡SÚPER LOTE EXCLUSIVO DITEC!" value={campanaTitulo} onChange={(e) => setCampanaTitulo(e.target.value)} className="w-full bg-slate-50 p-3 pl-11 text-xs font-black text-[#001F3F] border border-slate-200 rounded-xl focus:outline-none uppercase tracking-wide focus:border-[#001F3F] focus:bg-white transition-all shadow-inner" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Término de Difusión *</label>
                <div className="relative flex items-center">
                  <Calendar size={14} className="absolute left-4 text-slate-400" strokeWidth={2.5} />
                  <input type="date" required value={fechaExpiracion} onChange={(e) => setFechaExpiracion(e.target.value)} className="w-full bg-slate-50 p-3 pl-11 text-xs font-black text-[#001F3F] border border-slate-200 rounded-xl focus:outline-none tracking-wide focus:border-[#001F3F] focus:bg-white transition-all shadow-inner cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Pieza Gráfica {productoSeleccionado.publicidadAsignada && '(OPCIONAL SI MANTIENE)'} *
                </label>
                <div className="relative flex items-center">
                  <Image size={14} className="absolute left-4 text-slate-400" strokeWidth={2.5} />
                  <input type="file" required={!productoSeleccionado.publicidadAsignada} accept="image/*" onChange={(e) => setArchivoImagen(e.target.files?.[0] || null)} className="w-full text-[11px] font-black text-slate-500 bg-slate-50 border border-slate-200 p-3 pl-11 rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:bg-[#001F3F] file:text-[#FFB800] file:uppercase file:tracking-widest cursor-pointer shadow-inner" />
                </div>
              </div>
              <button type="submit" disabled={guardandoPublicidad} className="w-full bg-[#001F3F] text-[#FFB800] border border-[#001F3F] font-black text-xs uppercase py-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 tracking-widest flex items-center justify-center gap-2 mt-2">
                <PlusCircle size={14} strokeWidth={2.5} />
                <span>{guardandoPublicidad ? 'Publicando...' : 'Lanzar Campaña Publicitaria'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}