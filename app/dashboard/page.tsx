import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardVendedor from '@/components/dashboard/DashboardVendedor'
import DashboardAdmin from '@/components/dashboard/DashboardAdmin'
import DashboardMarketing from '@/components/dashboard/DashboardMarketing'
import DashboardServicioTecnico from '@/app/dashboard/servicio-tecnico/page' // ◄ Importamos tu panel técnico

export const dynamic = 'force-dynamic'

export default async function DashboardRaizPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_id')?.value
  const role = cookieStore.get('user_role')?.value || 'VENDEDOR'

  if (!token) {
    redirect('/login')
  }

  try {
    // 🟢 ENRUTAMIENTO INTELIGENTE SEGÚN EL ROL REAL DE BASE DE DATOS
    if (role === 'ADMIN') {
      return <DashboardAdmin />
    }
    if (role === 'MARKETING') {
      return <DashboardMarketing />
    }
    if (role === 'SERVICIO_TECNICO') {
      return <DashboardServicioTecnico /> // ◄ Redirección nativa al panel de soporte
    }
    
    // Aquí puedes ir mapeando los otros roles cuando crees sus vistas:
    // if (role === 'CONTABILIDAD') return <DashboardContabilidad />
    // if (role === 'COBRANZAS') return <DashboardCobranzas />
    // if (role === 'FACTURACION') return <DashboardFacturacion />

    // Si no es ninguno de los roles administrativos o de soporte, es un asesor en campo
    return <DashboardVendedor />

  } catch (err) {
    console.error("Error en inicialización del dashboard:", err)
    
    async function resetearSesionInvalida() {
      'use server'
      const c = await cookies()
      c.delete('user_id')
      c.delete('user_role')
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-6 text-[#001F3F]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-sm space-y-4">
          <p className="text-xl font-black uppercase italic">Excepción Detectada</p>
          <p className="text-xs text-slate-400 font-bold uppercase leading-tight">
            Hay inconsistencias graves entre tus cookies locales y el modelo Prisma de Ditec.
          </p>
          <form action={resetearSesionInvalida}>
            <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Cerrar Sesión Forzado ➔
            </button>
          </form>
        </div>
      </div>
    )
  }
}