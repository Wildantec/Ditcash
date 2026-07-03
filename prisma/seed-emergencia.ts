const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Primero limpiamos el registro fallido anterior
  await prisma.$executeRaw`DELETE FROM usuarios WHERE cedula = '1755221270'`;

  // Generamos el hash con la librería interna que usa Next.js
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Insertamos usando el ORM nativo para que cuadren los modelos
  const nuevoAdmin = await prisma.user.create({
    data: {
      username: '1755221270',
      cedula: '1755221270',
      password: hashedPassword,
      nombre: 'Administrador Daya',
      rol: 'ADMIN', // Cambia a 'admin' si tu Enum es minúscula
      estado: 'Activo',
      activo: 1,
      updatedAt: new Date()
    }
  });

  console.log('✅ Usuario administrador creado con éxito:', nuevoAdmin.cedula);
}

main()
  .catch((e) => {
    console.error('❌ Error al insertar:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
