"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle, Trash2, Edit2, FileSpreadsheet, DollarSign, Target, Activity, BarChart3, Plus, LayoutDashboard, Settings } from "lucide-react";

type Mes = { id: number; mesAnio: string; presupuesto: number; estado: string };
type Equipo = { id: number; nombre: string; habilitado: boolean };
type Reparacion = { id: number; mesId: number; equipoId: number; fecha: string; cliente: string; descripcion: string | null; comprobante: string | null; valorGastado: number; valorRecuperado: number; resultadoNeto: number; estadoRentabilidad: string; mes: Mes; equipo: Equipo };

async function solicitarServicioTecnico(url: string, opciones?: RequestInit) {
  try {
    const respuesta = await fetch(url, opciones);
    const data = await respuesta.json();
    return data;
  } catch {
    return { success: false, error: "No se pudo conectar con Servicio Técnico. Intenta nuevamente." };
  }
}


export default function ServicioTecnicoClient({ puedeCrear, puedeEditar, puedeEliminar }: { puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean }) {
  // --- ESTADOS DE DATOS ---
  const [meses, setMeses] = useState<Mes[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  // --- CONTROL DE PESTAÑAS Y FILTROS ---
  const [tabActiva, setTabActiva] = useState<"REGISTRO" | "REPORTES">("REGISTRO");
  const [fechaDesde, setFechaDesde] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaHasta, setFechaHasta] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // --- FORMULARIOS ---
  const [mesActivo, setMesActivo] = useState<Mes | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [formReparacion, setFormReparacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cliente: "",
    equipoId: "",
    descripcion: "",
    comprobante: "",
    valorGastado: "",
    valorRecuperado: ""
  });

  // Modales
  const [mostrarModalMes, setMostrarModalMes] = useState(false);
  const [formMes, setFormMes] = useState({ mesAnio: new Date().toISOString().slice(0, 7), presupuesto: "" });

  const [mostrarModalEquipo, setMostrarModalEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState("");
  const [equipoEditando, setEquipoEditando] = useState<number | null>(null);
  const [mesFiltro, setMesFiltro] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  // --- HELPERS ---
  const mostrarMensaje = useCallback((texto: string, tipo: string) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);
  }, []);

  const formatearMoneda = (valor: number) => {
    return "$ " + Number(valor).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const cargarDatos = useCallback(async () => {
    try {
      const dataM = await solicitarServicioTecnico("/api/servicio-tecnico/meses");
      if (dataM.success) {
        setMeses(dataM.data);
        setMesActivo((actual: Mes | null) => dataM.data.find((m: Mes) => m.id === actual?.id && m.estado === "ABIERTO") || dataM.data.find((m: Mes) => m.estado === "ABIERTO") || null);
      } else mostrarMensaje(dataM.error, "error");

      const dataE = await solicitarServicioTecnico("/api/servicio-tecnico/equipos");
      if (dataE.success) setEquipos(dataE.data); else mostrarMensaje(dataE.error, "error");

      const dataR = await solicitarServicioTecnico("/api/servicio-tecnico/reparaciones");
      if (dataR.success) setReparaciones(dataR.data); else mostrarMensaje(dataR.error, "error");
    } catch (error) {
      console.error("Error cargando datos:", error); mostrarMensaje("No se pudieron cargar los datos de servicio técnico", "error");
    }
  }, [mostrarMensaje]);

  useEffect(() => { void Promise.resolve().then(cargarDatos); }, [cargarDatos]);

  // --- MATEMÁTICA DEL MES ACTIVO (Pestaña Registro) ---
  const rangoValido = !!fechaDesde && !!fechaHasta && fechaDesde <= fechaHasta;
  const filtradas = reparaciones.filter(r => mesFiltro
    ? r.mes.mesAnio === mesFiltro
    : rangoValido && r.fecha.slice(0, 10) >= fechaDesde && r.fecha.slice(0, 10) <= fechaHasta);
  const mesesPeriodo = meses.filter(m => mesFiltro ? m.mesAnio === mesFiltro
    : rangoValido && m.mesAnio >= fechaDesde.slice(0, 7) && m.mesAnio <= fechaHasta.slice(0, 7));
  const presupuestoPeriodo = mesesPeriodo.reduce((acc, m) => acc + m.presupuesto, 0);
  const gastoBrutoMes = filtradas.reduce((acc, r) => acc + r.valorGastado, 0);
  const recuperadoMes = filtradas.reduce((acc, r) => acc + r.valorRecuperado, 0);
  const saldoDisponible = presupuestoPeriodo - gastoBrutoMes;
  const rendimientoNeto = recuperadoMes - gastoBrutoMes;

  // --- OPERACIONES: CATÁLOGO DE EQUIPOS ---
  const crearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEquipo.trim() || !(equipoEditando ? puedeEditar : puedeCrear)) return;
    const data = await solicitarServicioTecnico("/api/servicio-tecnico/equipos", {
      method: equipoEditando ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: equipoEditando, nombre: nuevoEquipo })
    });

    if (data.success) {
      mostrarMensaje(equipoEditando ? "Producto actualizado" : "Equipo agregado al catálogo", "success");
      setNuevoEquipo("");
      setEquipoEditando(null);
      setMostrarModalEquipo(false);
      cargarDatos();
      // Autoseleccionar el nuevo equipo creado
      setFormReparacion({ ...formReparacion, equipoId: data.data.id.toString() });
    } else {
      mostrarMensaje(data.error, "error");
    }
  };

  const eliminarEquipo = async (id: number) => {
    if (!puedeEliminar) return;
    if (!confirm("¿Eliminar este producto del catálogo? Sus registros históricos se conservarán.")) return;
    try {
      const data = await solicitarServicioTecnico(`/api/servicio-tecnico/equipos?id=${id}`, { method: "DELETE" });

      if (!data.success) return mostrarMensaje(data.error, "error");
      setFormReparacion(actual => actual.equipoId === String(id) ? { ...actual, equipoId: "" } : actual);
      mostrarMensaje("Producto eliminado del catálogo", "success");
      await cargarDatos();
    } catch { mostrarMensaje("No se pudo eliminar el producto", "error"); }
  };

  const reabrirMes = async () => {
    if (!puedeEditar) return;
    if (!mesSeleccionado) return;
    try {
      const data = await solicitarServicioTecnico("/api/servicio-tecnico/meses", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(mesSeleccionado), estado: "ABIERTO" })
      });

      if (!data.success) return mostrarMensaje(data.error, "error");
      setMesActivo(data.data);
      setEditandoId(null);
      setFormReparacion(actual => ({ ...actual, fecha: `${data.data.mesAnio}-01` }));
      mostrarMensaje("Mes reabierto. Ya puedes completar sus registros.", "success");
      await cargarDatos();
    } catch { mostrarMensaje("No se pudo reabrir el mes", "error"); }
  };

  // --- OPERACIONES: MESES ---
  const abrirMes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCrear) return;

    const data = await solicitarServicioTecnico("/api/servicio-tecnico/meses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formMes)
    });

    if (data.success) {
      mostrarMensaje("Presupuesto mensual asignado.", "success");
      setMostrarModalMes(false);
      setMesActivo(data.data);
      cargarDatos();
    } else mostrarMensaje(data.error, "error");
  };

  const cerrarMesActual = async () => {
    if (!puedeEditar) return;
    if (!mesActivo) return;
    if (!confirm("¿Seguro que deseas cerrar este ciclo presupuestario?")) return;
    const data = await solicitarServicioTecnico("/api/servicio-tecnico/meses", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: mesActivo.id, estado: "CERRADO" })
    });

    if (data.success) { mostrarMensaje("Mes cerrado.", "success"); cargarDatos(); }
    else mostrarMensaje(data.error, "error");
  };

  // --- OPERACIONES: REPARACIONES ---
  const guardarReparacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(editandoId ? puedeEditar : puedeCrear)) return;
    if (!mesActivo) return mostrarMensaje("⚠️ ALERTA: Debes abrir un mes primero.", "error");

    const payload = { ...formReparacion, mesId: mesActivo.id, id: editandoId };
    const data = await solicitarServicioTecnico("/api/servicio-tecnico/reparaciones", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });


    if (data.success) {
      mostrarMensaje(editandoId ? "Corrección guardada" : "Reparación registrada", "success");
      setFormReparacion({ fecha: new Date().toISOString().split('T')[0], cliente: "", equipoId: "", descripcion: "", comprobante: "", valorGastado: "", valorRecuperado: "" });
      setEditandoId(null);
      cargarDatos();
    } else mostrarMensaje(data.error, "error");
  };

  const cargarParaEditar = (rep: Reparacion) => {
    if (!puedeEditar) return;
    if (rep.mes.estado !== "ABIERTO") return mostrarMensaje("Reabre el mes de este registro antes de editarlo.", "error");
    setMesActivo(rep.mes);
    setTabActiva("REGISTRO");
    setEditandoId(rep.id);
    setFormReparacion({
      fecha: rep.fecha.split("T")[0],
      cliente: rep.cliente,
      equipoId: rep.equipoId.toString(),
      descripcion: rep.descripcion || "",
      comprobante: rep.comprobante || "",
      valorGastado: rep.valorGastado.toString(),
      valorRecuperado: rep.valorRecuperado.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarReparacion = async (id: number) => {
    if (!puedeEliminar) return;
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    const data = await solicitarServicioTecnico(`/api/servicio-tecnico/reparaciones?id=${id}`, { method: "DELETE" });

    if (!data.success) return mostrarMensaje(data.error, "error");
    mostrarMensaje("Registro eliminado", "success");
    cargarDatos();
  };

  // --- CEREBRO EXCEL (DOBLE HOJA) ---
  const exportarExcelGerencial = async () => {


    if (filtradas.length === 0) return mostrarMensaje("No hay datos en este rango para exportar.", "error");

    // HOJA 1: FINANZAS POR MES
    const mesesEnRango = Array.from(new Set(filtradas.map(r => r.mes.mesAnio)));
    const dataFinanzas = mesesEnRango.map(mesStr => {
      const repDelMes = filtradas.filter(r => r.mes.mesAnio === mesStr);
      const infoMes = repDelMes[0].mes;
      const gasto = repDelMes.reduce((acc, r) => acc + r.valorGastado, 0);
      const recuperado = repDelMes.reduce((acc, r) => acc + r.valorRecuperado, 0);
      const neto = recuperado - gasto;
      return {
        "Mes": mesStr,
        "Presupuesto Asignado ($)": infoMes.presupuesto,
        "Total Gastado ($)": gasto,
        "Total Cobrado ($)": recuperado,
        "Rendimiento Neto ($)": neto,
        "Estado": neto > 0 ? "GANANCIA" : neto < 0 ? "PÉRDIDA" : "EMPATE",
        "% Presupuesto Consumido": (infoMes.presupuesto ? (gasto / infoMes.presupuesto) * 100 : 0).toFixed(2) + "%"
      };
    });
    const equiposMap = new Map<string, { fallas: number; gastoTotal: number; recuperadoTotal: number }>();
    filtradas.forEach(r => {
      const eq = r.equipo.nombre;
      if (!equiposMap.has(eq)) equiposMap.set(eq, { fallas: 0, gastoTotal: 0, recuperadoTotal: 0 });
      const stats = equiposMap.get(eq)!;
      stats.fallas += 1;
      stats.gastoTotal += r.valorGastado;
      stats.recuperadoTotal += r.valorRecuperado;
    });

    const dataProductos = Array.from(equiposMap.entries())
      .map(([nombre, stats]) => ({
        "Equipo / Producto": nombre,
        "N° de Fallas": stats.fallas,
        "Costo Drenado ($)": stats.gastoTotal,
        "Dinero Recuperado ($)": stats.recuperadoTotal,
        "Impacto Neto ($)": stats.recuperadoTotal - stats.gastoTotal
      }))
      .sort((a, b) => b["N° de Fallas"] - a["N° de Fallas"]);
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    const agregarHoja = (nombre: string, filas: Record<string, unknown>[]) => {
      const hoja = workbook.addWorksheet(nombre);
      if (!filas.length) return;
      hoja.columns = Object.keys(filas[0]).map(key => ({ header: key, key, width: 26 }));
      filas.forEach(fila => hoja.addRow(fila));
      hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001F3F" } };
    };
    agregarHoja("Resumen Financiero", dataFinanzas);
    agregarHoja("Ranking Productos", dataProductos);
    agregarHoja("Registros del período", filtradas.map(r => ({ Fecha: r.fecha.slice(0,10), Mes: r.mes.mesAnio, Cliente: r.cliente, Producto: r.equipo.nombre, Detalle: r.descripcion, Comprobante: r.comprobante, Gastado: r.valorGastado, Cobrado: r.valorRecuperado, Neto: r.resultadoNeto })));
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `Reporte_Servicio_Tecnico_${mesFiltro || `${fechaDesde}_al_${fechaHasta}`}.xlsx`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    mostrarMensaje("Excel descargado con resumen, productos y registros.", "success");
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen text-[#001F3F] relative">
      {mensaje.texto && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-sm text-sm font-bold border-l-4 whitespace-pre-line min-w-[320px] ${
          mensaje.tipo === 'success' ? 'bg-green-600 text-white border-green-800' : 'bg-red-800 text-white border-red-950'
        }`}>
          <div className="flex items-start gap-3"><span className="text-xl">{mensaje.tipo === 'success' ? "✅" : "⚠️"}</span><span>{mensaje.texto}</span></div>
        </div>
      )}
      {mostrarModalEquipo && (
        <div className="fixed inset-0 bg-[#001F3F]/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={crearEquipo} className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-sm shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 text-[#001F3F]">{equipoEditando ? "Editar producto" : "Nuevo producto"}</h3>
            <label className="text-xs font-bold text-slate-600 block mb-2">Nombre del Producto/Equipo</label>
            <input required type="text" maxLength={191} placeholder="Ej: Refrigerador Mabe..." value={nuevoEquipo} onChange={e => setNuevoEquipo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-bold mb-6"/>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors bg-[#001F3F] text-white hover:bg-[#003366]">Guardar</button>
              <button type="button" onClick={() => setMostrarModalEquipo(false)} className="flex-1 py-3  border bg-white hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-[#001F3F] transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {mostrarModalMes && (
        <div className="fixed inset-0 bg-[#001F3F]/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={abrirMes} className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-sm shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 text-[#001F3F]">Asignar Presupuesto Mensual</h3>
            <label className="text-xs font-bold text-slate-600 block mb-2">Mes y Año</label>
            <input required type="month" value={formMes.mesAnio} onChange={e => setFormMes({...formMes, mesAnio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-mono text-sm "/>
            <label className="text-xs font-bold text-slate-600 block mb-2">Presupuesto ($) Máximo a gastar</label>
            <input required type="number" min="0" max="999999999" step="0.01" value={formMes.presupuesto} onChange={e => setFormMes({...formMes, presupuesto: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-emerald-600 font-mono text-xl font-black outline-none focus:border-[#FFB800] mb-6"/>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors bg-[#001F3F] text-white hover:bg-[#003366]">Confirmar</button>
              <button type="button" onClick={() => setMostrarModalMes(false)} className="flex-1 py-3 border bg-white hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-[#001F3F] transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2"><Settings className="text-[#FFB800]" size={32}/> Servicio Técnico</h1>
          <p className="text-slate-600 text-sm mt-2">Control de costos y analítica de reparaciones.</p>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit mt-6">
            <button onClick={() => setTabActiva("REGISTRO")} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${tabActiva === "REGISTRO" ? "bg-[#001F3F] text-white shadow-md" : "text-slate-500 hover:text-[#001F3F]"}`}><LayoutDashboard size={16}/> Operativo</button>
            <button onClick={() => setTabActiva("REPORTES")} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${tabActiva === "REPORTES" ? "bg-[#001F3F] text-white shadow-md" : "text-slate-500 hover:text-[#001F3F]"}`}><BarChart3 size={16}/> Reportes</button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs">Mes contable:
              <select aria-label="Filtrar por mes" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="bg-slate-50 border border-slate-200 p-2 rounded-lg ml-2">
                <option value="">Rango de fechas</option>
                {meses.map(m => <option key={m.id} value={m.mesAnio}>{m.mesAnio}</option>)}
              </select>
            </label>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Desde:</span>
            <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setMesFiltro(""); }} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-mono text-[#001F3F] outline-none focus:border-[#FFB800] "/>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hasta:</span>
            <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setMesFiltro(""); }}className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-mono text-[#001F3F] outline-none focus:border-[#FFB800] "/>
        </div>
      </div>
      {!mesFiltro && !rangoValido && <p className="text-red-600">Selecciona un rango de fechas válido.</p>}
      {tabActiva === "REGISTRO" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Mes operativo" value={mesActivo?.id || ""} onChange={e => { setMesActivo(meses.find(m => m.id === Number(e.target.value)) || null); setEditandoId(null); }} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
              <option value="">Selecciona mes abierto</option>
              {meses.filter(m => m.estado === "ABIERTO").map(m => <option key={m.id} value={m.id}>{m.mesAnio}</option>)}
            </select>
            <button disabled={!puedeCrear} onClick={() => setMostrarModalMes(true)} className="text-sm text-[#001F3F]">Asignar nuevo mes</button>
            <select aria-label="Mes cerrado para reabrir" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
              <option value="">Mes cerrado...</option>
              {meses.filter(m => m.estado === "CERRADO").map(m => <option key={m.id} value={m.id}>{m.mesAnio}</option>)}
            </select>
            <button disabled={!mesSeleccionado || !puedeEditar} onClick={reabrirMes} className="text-sm text-emerald-700 disabled:opacity-40">Reabrir mes</button>
            {mesActivo ? (
              <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>
                <div>
                  <p className="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Mes Operativo: {mesActivo.mesAnio}</p>
                  <p className="text-xs font-mono font-bold text-[#001F3F]">Presupuesto Asignado</p>
                </div>
                <button disabled={!puedeEditar} onClick={cerrarMesActual} className="ml-4 text-xs bg-red-600 hover:bg-red-500 text-[#001F3F] px-3 py-1.5 rounded-xl font-bold transition-all">Cerrar Mes</button>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"/>
              <div>
                <p className="text-[10px] uppercase font-black text-red-600 tracking-wider">Sin Presupuesto</p>
                <p className="text-xs font-bold text-neutral-300">Abre un mes para registrar</p>
              </div>
              <button disabled={!puedeCrear} onClick={() => setMostrarModalMes(true)} className="ml-2 text-xs bg-[#001F3F] text-white hover:bg-[#003366] text-[#001F3F] px-4 py-1.5 rounded-xl font-bold transition-all">Asignar Fondo</button>
            </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Target size={14}/> Presupuesto de los meses del período</p>
              <p className="text-3xl font-mono font-black text-[#001F3F]">{formatearMoneda(presupuestoPeriodo)}</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><DollarSign size={14}/> Gasto Bruto</p>
              <p className="text-3xl font-mono font-black text-red-600">{formatearMoneda(gastoBrutoMes)}</p>
            </div>
            <div className={`border p-6 rounded-3xl shadow-sm transition-colors ${saldoDisponible <= 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><CheckCircle size={14}/> Saldo Disponible</p>
              <p className={`text-3xl font-mono font-black ${saldoDisponible <= 0 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{formatearMoneda(saldoDisponible)}</p>
            </div>
            <div className={`border p-6 rounded-3xl shadow-sm ${rendimientoNeto > 0 ? 'bg-emerald-50 border-emerald-200' : rendimientoNeto < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Activity size={14}/> Rendimiento Neto</p>
              <p className={`text-3xl font-mono font-black ${rendimientoNeto > 0 ? 'text-emerald-600' : rendimientoNeto < 0 ? 'text-red-600' : 'text-[#001F3F]'}`}>
                 {rendimientoNeto > 0 ? '+' : ''}{formatearMoneda(rendimientoNeto)}
              </p>
            </div>
          </div>
          <div className={`border rounded-3xl p-6 md:p-8 shadow-sm relative transition-all ${editandoId ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
            <h2 className="text-xl font-black text-[#001F3F] flex items-center gap-2 mb-6"><FileText className={editandoId ? "text-blue-500" : "text-[#FFB800]"}/> {editandoId ? "Modo Edición" : "Nueva Reparación"}</h2>
            <form onSubmit={guardarReparacion} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Fecha</label>
                <input required type="date" value={formReparacion.fecha} onChange={e => setFormReparacion({...formReparacion, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-mono text-sm "/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Cliente / Sucursal</label>
                <input required type="text" value={formReparacion.cliente} onChange={e => setFormReparacion({...formReparacion, cliente: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-bold text-sm"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex justify-between items-center mb-2">
                  <span>Equipo / Producto</span>
                  <button type="button" disabled={!puedeCrear} onClick={() => { setEquipoEditando(null); setNuevoEquipo(""); setMostrarModalEquipo(true); }} className="text-slate-600 flex items-center gap-1 bg-[#FFB800] text-[#001F3F] px-2 py-0.5 rounded"><Plus size={12}/> Nuevo</button>
                </label>
                <select required value={formReparacion.equipoId} onChange={e => setFormReparacion({...formReparacion, equipoId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-bold text-sm">
                  <option value="">Selecciona del catálogo...</option>
                  {equipos.filter(eq => eq.habilitado || String(eq.id) === formReparacion.equipoId).map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}{!eq.habilitado ? " (eliminado)" : ""}</option>)}
                </select>
                <div className="flex gap-3 mt-2">
                  <button type="button" disabled={!formReparacion.equipoId || !puedeEditar} onClick={() => { const eq = equipos.find(e => String(e.id) === formReparacion.equipoId); if (eq) { setEquipoEditando(eq.id); setNuevoEquipo(eq.nombre); setMostrarModalEquipo(true); } }} className="text-xs text-blue-600 disabled:opacity-40">Editar producto</button>
                  <button type="button" disabled={!formReparacion.equipoId || !puedeEliminar} onClick={() => eliminarEquipo(Number(formReparacion.equipoId))} className="text-xs text-red-600 disabled:opacity-40">Eliminar producto</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">N° Comprobante (Opcional)</label>
                <input type="text" value={formReparacion.comprobante} onChange={e => setFormReparacion({...formReparacion, comprobante: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] font-mono text-sm"/>
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Descripción del Daño</label>
                <input type="text" value={formReparacion.descripcion} onChange={e => setFormReparacion({...formReparacion, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-[#001F3F] outline-none focus:border-[#FFB800] text-sm"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Valor Gastado ($)</label>
                <input required type="number" min="0" max="999999999" step="0.01" value={formReparacion.valorGastado} onChange={e => setFormReparacion({...formReparacion, valorGastado: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-red-600 font-mono text-lg font-black text-right outline-none focus:border-red-500"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Cobrado ($)</label>
                <input required type="number" min="0" max="999999999" step="0.01" value={formReparacion.valorRecuperado} onChange={e => setFormReparacion({...formReparacion, valorRecuperado: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-emerald-600 font-mono text-lg font-black text-right outline-none focus:border-emerald-500"/>
              </div>

              <div className="lg:col-span-4 flex gap-4 mt-2">
                <button type="submit" disabled={!mesActivo || !(editandoId ? puedeEditar : puedeCrear)} className={`flex-1 py-4 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-sm ${!mesActivo ? 'bg-white border text-slate-400 cursor-not-allowed' : editandoId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#001F3F] text-white hover:bg-[#003366]'}`}>
                  {editandoId ? "Guardar Corrección" : mesActivo ? "Registrar Reparación" : "⚠️ Abre un mes para registrar"}
                </button>
                {editandoId && <button type="button" onClick={() => { setEditandoId(null); setFormReparacion({ fecha: new Date().toISOString().split('T')[0], cliente: "", equipoId: "", descripcion: "", comprobante: "", valorGastado: "", valorRecuperado: "" }); }} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-[#001F3F] rounded-xl font-black text-sm uppercase tracking-widest">Cancelar</button>}
              </div>
            </form>
          </div>

        </div>
      )}

      {tabActiva === "REPORTES" && (
        <div className="space-y-8 animate-in fade-in duration-300">

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-widest flex items-center gap-2"><BarChart3 size={24}/> Panel de Inteligencia</h2>
            <button onClick={exportarExcelGerencial} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-emerald-950/20">
              <FileSpreadsheet size={16}/> <span>Exportar Excel Consolidado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Target size={14}/> Presupuesto de los meses del período</p>
              <p className="text-3xl font-mono font-black text-[#001F3F]">{formatearMoneda(presupuestoPeriodo)}</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><DollarSign size={14}/> Gasto Bruto</p>
              <p className="text-3xl font-mono font-black text-red-600">{formatearMoneda(gastoBrutoMes)}</p>
            </div>
            <div className={`border p-6 rounded-3xl shadow-sm transition-colors ${saldoDisponible <= 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><CheckCircle size={14}/> Saldo Disponible</p>
              <p className={`text-3xl font-mono font-black ${saldoDisponible <= 0 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{formatearMoneda(saldoDisponible)}</p>
            </div>
            <div className={`border p-6 rounded-3xl shadow-sm ${rendimientoNeto > 0 ? 'bg-emerald-50 border-emerald-200' : rendimientoNeto < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest flex items-center gap-2 mb-2"><Activity size={14}/> Rendimiento Neto</p>
              <p className={`text-3xl font-mono font-black ${rendimientoNeto > 0 ? 'text-emerald-600' : rendimientoNeto < 0 ? 'text-red-600' : 'text-[#001F3F]'}`}>
                 {rendimientoNeto > 0 ? '+' : ''}{formatearMoneda(rendimientoNeto)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{mesFiltro ? `Mes contable: ${mesFiltro}` : `Fechas: ${fechaDesde} al ${fechaHasta}`} · {filtradas.length} registros. El presupuesto corresponde a los meses completos incluidos.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* BLOQUE A: FINANZAS POR MES */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><DollarSign className="text-[#FFB800]" size={16}/> Consolidado Financiero Mensual</h3>
                <p className="text-xs text-slate-600 mt-2">Rentabilidad agrupada por mes contable.</p>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] sticky top-0 border-b border-slate-200 z-10 tracking-widest">
                    <tr><th className="p-4">Mes (Carpeta)</th><th className="p-4 text-right">Gastado</th><th className="p-4 text-right">Neto Mensual</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(() => {

                      if (filtradas.length === 0) return <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-bold">Sin datos.</td></tr>;

                      const mesesMap = new Map<string, { gasto: number; neto: number }>();
                      filtradas.forEach(r => {
                        const m = r.mes.mesAnio;
                        if (!mesesMap.has(m)) mesesMap.set(m, { gasto: 0, neto: 0 });
                        mesesMap.get(m)!.gasto += r.valorGastado;
                        mesesMap.get(m)!.neto += r.resultadoNeto;
                      });
                      return Array.from(mesesMap.entries()).map(([mes, stats]) => (
                        <tr key={mes} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-black text-[#001F3F]">{mes}</td>
                          <td className="p-4 text-right font-mono text-slate-600">{formatearMoneda(stats.gasto)}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2 py-1 rounded font-mono font-black ${stats.neto > 0 ? 'text-emerald-600 bg-emerald-500/10' : stats.neto < 0 ? 'text-red-600 bg-red-500/10' : 'text-slate-500'}`}>
                              {stats.neto > 0 ? '+' : ''}{formatearMoneda(stats.neto)}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><Target className="text-[#FFB800]" size={16}/> Ranking de Fallas por Equipo</h3>
                <p className="text-xs text-slate-600 mt-1">Top de productos con mayor recurrencia de daños.</p>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] sticky top-0 border-b border-slate-200 z-10 tracking-widest">
                    <tr><th className="p-4">N°</th><th className="p-4">Equipo / Producto</th><th className="p-4 text-center">Reparaciones</th><th className="p-4 text-right text-red-600">Costo Consumido</th><th className="p-4 text-right">Cobrado</th><th className="p-4 text-right">Neto</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(() => {

                      if (filtradas.length === 0) return <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold">Sin datos.</td></tr>;

                      const equiposMap = new Map<string, { fallas: number; costo: number; cobrado: number }>();
                      filtradas.forEach(r => {
                        const eq = r.equipo.nombre;
                        if (!equiposMap.has(eq)) equiposMap.set(eq, { fallas: 0, costo: 0, cobrado: 0 });
                        equiposMap.get(eq)!.fallas += 1;
                        equiposMap.get(eq)!.costo += r.valorGastado;
                        equiposMap.get(eq)!.cobrado += r.valorRecuperado;
                      });

                      const ranking = Array.from(equiposMap.entries()).sort((a, b) => b[1].fallas - a[1].fallas);

                      return ranking.map(([nombre, stats], idx) => (
                        <tr key={nombre} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-black text-slate-600">{idx + 1}</td>
                          <td className="p-4 font-bold text-[#001F3F]">{nombre}</td>
                          <td className="p-4 text-center font-mono text-[#001F3F]">{stats.fallas}</td>
                          <td className="p-4 text-right font-mono text-red-600/80">{formatearMoneda(stats.costo)}</td>
                          <td className="p-4 text-right font-mono text-emerald-600">{formatearMoneda(stats.cobrado)}</td>
                          <td className="p-4 text-right font-mono">{formatearMoneda(stats.cobrado - stats.costo)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="text-sm font-black uppercase tracking-widest text-slate-600">Registros del Período Filtrado</h3></div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] sticky top-0 border-b border-slate-200 z-10 tracking-widest">
                  <tr><th className="p-4">Fecha</th><th className="p-4">Cliente / Producto</th><th className="p-4">Detalle / Fac</th><th className="p-4 text-right text-red-600">Gastado</th><th className="p-4 text-right text-emerald-600">Cobrado</th><th className="p-4 text-right">Neto Real</th><th className="p-4 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(() => {

                    if (filtradas.length === 0) return <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-bold">No hay registros en este rango de fechas.</td></tr>;
                    return filtradas.map((r: Reparacion) => {
                      const isGanancia = r.estadoRentabilidad === "GANANCIA";
                      const isPerdida = r.estadoRentabilidad === "PERDIDA";
                      return (
                        <tr key={r.id} className={`transition-colors hover:bg-slate-50 ${editandoId === r.id ? 'bg-blue-50' : ''}`}>
                          <td className="p-4 font-mono text-slate-600">{r.fecha.split("T")[0]}</td>
                          <td className="p-4"><p className="font-bold text-[#001F3F]">{r.cliente}</p><p className="text-[11px] uppercase text-slate-600 mt-0.5">{r.equipo?.nombre}</p></td>
                          <td className="p-4 max-w-[200px] truncate text-slate-600"><p className="truncate" title={r.descripcion || undefined}>{r.descripcion || "—"}</p>{r.comprobante && <p className="text-[10px] font-mono text-[#001F3F] mt-0.5">FAC: {r.comprobante}</p>}</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600">{formatearMoneda(r.valorGastado)}</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600">{formatearMoneda(r.valorRecuperado)}</td>
                          <td className="p-4 text-right"><span className={`px-3 py-1 rounded-lg font-mono font-black tracking-wider ${isGanancia ? 'bg-emerald-500/10 text-emerald-600' : isPerdida ? 'bg-red-500/20 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{isGanancia ? '+' : ''}{formatearMoneda(r.resultadoNeto)}</span></td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button aria-label="Editar reparación" disabled={!puedeEditar} onClick={() => cargarParaEditar(r)} className="p-2 bg-white border border-slate-200 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors"><Edit2 size={14}/></button>
                            <button aria-label="Eliminar reparación" disabled={!puedeEliminar} onClick={() => eliminarReparacion(r.id)} className="p-2 bg-white border border-slate-200 hover:bg-red-50 rounded-xl text-red-600 transition-colors"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
