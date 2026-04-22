// prisma/seed.ts
import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

async function main() {
  const hashedPassword = await bcrypt.hash('123', 10);

await prisma.user.upsert({
  where: { username: 'admin' },
  update: { 
    password: hashedPassword,
    rol: 'ADMIN', // Nos aseguramos que sea ADMIN
    activo: true
  },
  create: {
    username: 'admin',
    password: hashedPassword,
    cedula: '0000000000',
    nombre: 'Admin Ditec',
    rol: 'ADMIN',
    activo: true,
  },
});
  const hashedPass = await bcrypt.hash('vendedor123', 10);

  // 1. Crear o actualizar el Usuario
  const userVendedor = await prisma.user.upsert({
    where: { username: 'vendedor_test' },
    update: { password: hashedPass },
    create: {
      username: 'vendedor_test',
      cedula: '1234567890',
      password: hashedPass,
      nombre: 'Vendedor Prueba',
      rol: 'VENDEDOR',
      activo: true,
    },
  });

  // 2. Crear o actualizar el Perfil de Vendedor vinculado
  await prisma.vendedor.upsert({
    where: { cedula: '1234567890' },
    update: { usuarioId: userVendedor.id },
    create: {
      cedula: '1234567890',
      nombre: 'Vendedor Prueba',
      puntosAcumulados: 0,
      usuarioId: userVendedor.id, // Aquí es donde se conectan
    },
  });

  console.log("✅ Vendedor y Perfil vinculados correctamente");
}

main().finally(() => prisma.$disconnect());