import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const permisosContabilidad = [
  { modulo: 'vendedores', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'campanas', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'canjes', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'historial', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'premios', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'inventario', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'bodegas', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'vehiculos', ver: true, crear: false, editar: false, eliminar: false },
  { modulo: 'mantenimientos', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'vehiculos_cont', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'estaciones', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'facturas_comb', ver: true, crear: true, editar: true, eliminar: true },
  { modulo: 'facturacion', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'cobranzas', ver: false, crear: false, editar: false, eliminar: false },
  { modulo: 'usuarios', ver: false, crear: false, editar: false, eliminar: false }
]

async function main() {
  await prisma.role.upsert({
    where: { nombre: 'CONTABILIDAD' },
    update: { permisos: permisosContabilidad },
    create: {
      nombre: 'CONTABILIDAD',
      descripcion: 'Acceso a módulos financieros, estaciones y facturas de combustible',
      permisos: permisosContabilidad
    }
  })
  console.log('Rol CONTABILIDAD migrado exitosamente.')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())