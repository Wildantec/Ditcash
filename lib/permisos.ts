export interface PermisoModulo {
  modulo: string
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

export function tienePermiso(
  permisos: PermisoModulo[] | null | undefined,
  rolNombre: string | null | undefined,
  moduloId: string,
  accion: 'ver' | 'crear' | 'editar' | 'eliminar'
): boolean {
  if (rolNombre?.toUpperCase() === 'ADMIN' || !rolNombre) return true

  if (!permisos || !Array.isArray(permisos)) return false

  const permisoObj = permisos.find((p) => p.modulo === moduloId)
  if (!permisoObj) return false

  return !!permisoObj[accion]
}