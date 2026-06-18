'use client'

import { useEffect, useState } from 'react'

interface DetalleCuotasProps {
  invoiceId?: string
  salesNoteId?: string
  token: string
  montoTotalDoc: number
}

export default function DetalleCuotas({ invoiceId, salesNoteId, token, montoTotalDoc }: DetalleCuotasProps) {
  const [cuotas, setCuotas] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarCuotas() {
      setCargando(true)
      setError(null)
      try {
        const API_BASE = "https://grupoaraujos.cloud/api/v1"
        const url = invoiceId 
          ? `${API_BASE}/receivables/invoices/${invoiceId}/installments`
          : `${API_BASE}/receivables/sales-notes/${salesNoteId}/installments`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-company-id": "1",
            "User-Agent": "Mozilla/5.0"
          }
        })

        if (!res.ok) throw new Error(`Error Status: ${res.status}`)
        
        const json = await res.json()
        const dataCuotas = json.data || json.items || (Array.isArray(json) ? json : [])
        setCuotas(dataCuotas)
      } catch (err: any) {
        setError("No se pudo cargar el desglose de cuotas.")
      } finally {
        setCargando(false)
      }
    }

    cargarCuotas()
  }, [invoiceId, salesNoteId, token])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
        <span>Consultando tabla de amortización...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4 text-xs font-bold text-red-500 bg-red-50/50 rounded-xl border border-red-100">
        {error}
      </div>
    )
  }

  return (
    <div className="px-6 pb-5 pt-2 bg-slate-50/60 mx-4 mb-4 rounded-2xl border border-slate-100/60 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[650px]">
        <thead>
          <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-2">
            <th className="py-2 pl-4">Cuota</th>
            <th className="py-2 text-center">Fch. Vence</th>
            <th className="py-2 pl-4">Concepto</th>
            <th className="py-2 text-right">Débito</th>
            <th className="py-2 text-right">Crédito</th>
            <th className="py-2 text-right pr-4">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white rounded-xl shadow-sm border border-slate-100/50 mt-1">
          {cuotas.length > 0 ? (
            cuotas.map((cuota: any, i: number) => {
              const numeroCuota = cuota.installment_number || cuota.number || (i + 1);
              const fechaVence = cuota.date_due || cuota.due_date || "N/A";
              const totalCuota = Number(cuota.total_amount || cuota.amount || 0);
              const saldoCuota = Number(cuota.balance || cuota.total_balance || 0);
              const abonadoCuota = totalCuota - saldoCuota;

              return (
                <tr key={cuota.id || i} className="text-xs text-slate-600 font-medium hover:bg-slate-50/40">
                  <td className="py-3 pl-6 font-bold text-[#001F3F]">{numeroCuota}</td>
                  <td className="py-3 text-center text-slate-500 font-mono">{fechaVence}</td>
                  <td className="py-3 pl-4 text-slate-400 font-bold uppercase text-[10px]">
                    CUOTA {numeroCuota}/{cuotas.length}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-600">${totalCuota.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-emerald-600">${abonadoCuota.toFixed(2)}</td>
                  <td className="py-3 text-right font-black text-red-600 pr-6">
                    <span className={saldoCuota > 0 ? "bg-red-50/60 px-2 py-0.5 rounded border border-red-100/30" : "text-slate-400 font-normal"}>
                      ${saldoCuota.toFixed(2)}
                    </span>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-6 text-xs italic text-slate-400 font-bold">
                — Detalle único con valor total de ${montoTotalDoc.toFixed(2)} —
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}