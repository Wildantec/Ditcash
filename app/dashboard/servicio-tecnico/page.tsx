import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import ServicioTecnicoClient from '@/components/servicio-tecnico/ServicioTecnicoClient'

export default async function ServicioTecnicoPage() {
  const usuario = await getCurrentUser()
  if (!userHasPermission(usuario, 'servicio_tecnico', 'ver')) return <div className="p-8 text-slate-500">No tienes permiso para acceder a Servicio Técnico.</div>
  return <ServicioTecnicoClient puedeCrear={userHasPermission(usuario, 'servicio_tecnico', 'crear')} puedeEditar={userHasPermission(usuario, 'servicio_tecnico', 'editar')} puedeEliminar={userHasPermission(usuario, 'servicio_tecnico', 'eliminar')} />
}
