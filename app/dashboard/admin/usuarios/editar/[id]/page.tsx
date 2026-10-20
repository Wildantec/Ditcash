import { notFound, redirect } from 'next/navigation'
import EditarUsuarioForm from '@/components/admin/EditarUsuarioForm'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'

export default async function EditarUsuarioPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const usuarioActual = await getCurrentUser()
  if (!usuarioActual) redirect('/login')
  if (!userHasPermission(usuarioActual, 'usuarios', 'editar')) redirect('/dashboard')

  const { id: idParam } = await params
  const usuarioId = Number(idParam)
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) notFound()

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-[#001F3F] md:p-12">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl md:p-10">
        <EditarUsuarioForm usuarioId={usuarioId} />
      </div>
    </div>
  )
}
