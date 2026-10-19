import { NextResponse } from 'next/server'
import { getSessionRole, readRolePermissions, roleHasPermission, type PermissionAction } from '@/lib/role-permissions'

export async function autorizarFacturacion(accion: PermissionAction) {
  let rol: string | null
  try {
    rol = await getSessionRole()
  } catch (error) {
    console.error('Error validando usuario para facturación:', error)
    return NextResponse.json({ success: false, error: 'No se pudo validar la sesión' }, { status: 500 })
  }

  if (!rol) {
    return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 401 })
  }

  let permitido: boolean
  try {
    const permissions = await readRolePermissions()
    permitido = await roleHasPermission(rol, 'facturacion', accion, permissions)
  } catch (error) {
    console.error('Error leyendo permisos del módulo de facturación:', error)
    return NextResponse.json({ success: false, error: 'No se pudieron validar los permisos' }, { status: 500 })
  }

  if (!permitido) {
    return NextResponse.json({ success: false, error: `No tienes permiso para ${accion} en facturación` }, { status: 403 })
  }

  return null
}
