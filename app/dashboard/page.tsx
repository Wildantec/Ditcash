import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardVendedor from '@/components/dashboard/DashboardVendedor'
import DashboardAdmin from '@/components/dashboard/DashboardAdmin'
import DashboardMarketing from '@/components/dashboard/DashboardMarketing'
import DashboardServicioTecnico from '@/app/dashboard/servicio-tecnico/page'
import DashboardContabilidad from '@/components/dashboard/DashboardContabilidad'
import { getSessionRole } from '@/lib/role-permissions'

export const dynamic = 'force-dynamic'

function DashboardRolPersonalizado({ role }: { role: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-[#001F3F]">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">DITCASH | PANEL DE ACCESO</p>
        <h1 className="mt-3 text-2xl md:text-3xl font-black uppercase italic tracking-tight">{role.replace(/_/g, ' ')}</h1>
        <p className="mt-4 text-sm font-medium text-slate-500">
          Tu acceso está configurado. Usa el menú lateral para abrir los módulos que tienes autorizados.
        </p>
      </div>
    </div>
  )
}

export default async function DashboardRaizPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_id')?.value

  if (!token) {
    redirect('/login')
  }

  const role = await getSessionRole()
  if (!role) redirect('/login')

  try {
    if (role === 'ADMIN') {
      return <DashboardAdmin />
    }
    if (role === 'MARKETING') {
      return <DashboardMarketing />
    }
    if (role === 'SERVICIO_TECNICO') {
      return <DashboardServicioTecnico />
    }
    
    // Aquí puedes ir mapeando los otros roles cuando crees sus vistas:
    if (role === 'CONTABILIDAD') return <DashboardContabilidad />

    if (role === 'VENDEDOR') return <DashboardVendedor />

    return <DashboardRolPersonalizado role={role} />

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