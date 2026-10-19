import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma'
import {
  getSessionRole,
  normalizeRoleName,
  readRolePermissions,
  roleHasPermission
} from '@/lib/role-permissions'
export const dynamic = 'force-dynamic';

const dataDir = path.join(process.cwd(), 'data');
const rutaArchivo = path.join(dataDir, 'permisos.json');

const inicializarArchivo = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(rutaArchivo)) {
      fs.writeFileSync(rutaArchivo, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error inicializando permisos:', err);
  }
};

export async function GET() {
  try {
    inicializarArchivo();
    const role = await getSessionRole()
    if (!role) {
      return NextResponse.json({ success: false, message: 'Sesión no válida' }, { status: 401 })
    }

    const permissions = await readRolePermissions()
    const managesPermissions = await roleHasPermission(role, 'permisos', 'ver', permissions) ||
      await roleHasPermission(role, 'permisos', 'crear', permissions) ||
      await roleHasPermission(role, 'permisos', 'editar', permissions)
    const canViewUsers = await roleHasPermission(role, 'usuarios', 'ver', permissions)
    const canCreateUsers = await roleHasPermission(role, 'usuarios', 'crear', permissions)
    const canEditUsers = await roleHasPermission(role, 'usuarios', 'editar', permissions)
    const canDeleteUsers = await roleHasPermission(role, 'usuarios', 'eliminar', permissions)
    const managesUsers = canViewUsers || canCreateUsers || canEditUsers
    const canCreateRoles = await roleHasPermission(role, 'permisos', 'crear', permissions)
    const canEditRoles = await roleHasPermission(role, 'permisos', 'editar', permissions)
    const users = managesPermissions || managesUsers
      ? await prisma.user.findMany({ distinct: ['rol'], select: { rol: true } })
      : []
    const roles = Array.from(new Set([
      ...permissions.map((permission) => normalizeRoleName(permission.rol)),
      ...users.map((user) => normalizeRoleName(user.rol)),
      role
    ])).filter(Boolean).sort()

    return NextResponse.json({
      success: true,
      data: managesPermissions ? permissions : permissions.filter((permission) =>
        normalizeRoleName(permission.rol) === role
      ),
      roles: managesPermissions || managesUsers ? roles : [role],
      assignableRoles: managesPermissions || managesUsers
        ? role === 'ADMIN' ? roles : roles.filter((availableRole) => availableRole !== 'ADMIN')
        : [role],
      currentRole: role,
      canCreateRoles,
      canEditRoles,
      canViewUsers,
      canCreateUsers,
      canEditUsers,
      canDeleteUsers
    })
  } catch (error) {
    console.error('Error cargando matriz de permisos:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al cargar los permisos'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    inicializarArchivo();
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'La solicitud no tiene un formato válido' }, { status: 400 })
    }
    const values = body as Record<string, unknown>
    
    const roleValue = values.rol
    const permisos = values.permisos
    const role = typeof roleValue === 'string' ? normalizeRoleName(roleValue) : ''

    if (
      typeof values.modulo === 'string' &&
      /^bodega_[a-zA-Z0-9_-]+$/.test(values.modulo) &&
      typeof values.ver === 'boolean' &&
      typeof values.crear === 'boolean' &&
      typeof values.editar === 'boolean' &&
      typeof values.eliminar === 'boolean' &&
      role
    ) {
      const actorRole = await getSessionRole()
      if (!actorRole) {
        return NextResponse.json({ success: false, message: 'Sesión no válida' }, { status: 401 })
      }
      const existingPermissions = await readRolePermissions()
      if (!await roleHasPermission(actorRole, 'bodegas', 'editar', existingPermissions)) {
        return NextResponse.json({ success: false, message: 'No tienes permiso para actualizar bodegas' }, { status: 403 })
      }
      const updatedPermissions = existingPermissions.filter((permission) =>
        !(normalizeRoleName(permission.rol) === role && permission.modulo === values.modulo)
      )
      updatedPermissions.push({
        rol: role,
        modulo: values.modulo,
        ver: values.ver,
        crear: values.crear,
        editar: values.editar,
        eliminar: values.eliminar
      })
      fs.writeFileSync(rutaArchivo, JSON.stringify(updatedPermissions, null, 2), 'utf-8')
      return NextResponse.json({ success: true, message: 'Permiso de bodega actualizado' })
    }

    if (!/^[A-Z0-9_]{2,40}$/.test(role) || !Array.isArray(permisos)) {
      return NextResponse.json({ success: false, message: 'Formato de matriz de permisos inválido' }, { status: 400 });
    }
    if (role === 'ADMIN') {
      return NextResponse.json({ success: false, message: 'El rol ADMIN es de control total y no se puede modificar' }, { status: 400 })
    }

    const actorRole = await getSessionRole()
    if (!actorRole) {
      return NextResponse.json({ success: false, message: 'Sesión no válida' }, { status: 401 })
    }

    const existingPermissions = await readRolePermissions()
    const users = await prisma.user.findMany({ distinct: ['rol'], select: { rol: true } })
    const roleExists = existingPermissions.some((permission) =>
      normalizeRoleName(permission.rol) === role
    ) || users.some((user) => normalizeRoleName(user.rol) === role)

    const canManage = await roleHasPermission(
      actorRole,
      'permisos',
      roleExists ? 'editar' : 'crear',
      existingPermissions
    )
    if (!canManage) {
      return NextResponse.json({
        success: false,
        message: roleExists
          ? 'No tienes permiso para editar roles'
          : 'No tienes permiso para crear roles'
      }, { status: 403 })
    }

    const uniqueModules = new Set<string>()
    const validPermissions = permisos.every((permission: unknown) => {
      if (!permission || typeof permission !== 'object') return false
      const entry = permission as Record<string, unknown>
      const moduleId = entry.modulo
      const valid = typeof moduleId === 'string' &&
        /^[a-z0-9_]+$/.test(moduleId) &&
        !uniqueModules.has(moduleId) &&
        ['ver', 'crear', 'editar', 'eliminar'].every((action) => typeof entry[action] === 'boolean') &&
        (entry.ver === true || (entry.crear === false && entry.editar === false && entry.eliminar === false))
      if (valid && typeof moduleId === 'string') uniqueModules.add(moduleId)
      return valid
    })
    if (!validPermissions || permisos.length === 0) {
      return NextResponse.json({ success: false, message: 'La lista de permisos tiene un formato inválido' }, { status: 400 })
    }

    const nuevaLista = existingPermissions.filter((permission) =>
      normalizeRoleName(permission.rol) !== role
    )
    for (const permission of permisos) {
      nuevaLista.push({
        rol: role,
        modulo: permission.modulo,
        ver: permission.ver,
        crear: permission.crear,
        editar: permission.editar,
        eliminar: permission.eliminar
      })
    }

    fs.writeFileSync(rutaArchivo, JSON.stringify(nuevaLista, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Matriz de control guardada con éxito' });
  } catch (error) {
    console.error('Error guardando matriz de permisos:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al guardar los permisos'
    }, { status: 500 });
  }
}