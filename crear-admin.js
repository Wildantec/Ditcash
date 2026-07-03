const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  try {
    // Intentamos borrar si existía antes
    await prisma.user.deleteMany({
      where: { cedula: '1755221270' }
    }).catch(() => {});

    // Encriptamos la clave usando la librería nativa
    const hash = await bcrypt.hash('admin123', 10);

    // Insertamos el usuario administrador
    const user = await prisma.user.create({
      data: {
        username: '1755221270',
        cedula: '1755221270',
        password: hash,
        nombre: 'Administrador Daya',
        rol: 'ADMIN',
        estado: 'Activo',
        activo: 1,
        updatedAt: new Date()
      }
    });
    console.log('✅ USUARIO ENCRIPTADO NATIVAMENTE CON EXITO:', user.cedula);
  } catch (e) {
    console.error('❌ Error interno:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
