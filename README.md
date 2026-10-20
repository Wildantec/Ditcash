This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Roles, permisos y sesiones administrativas

Los permisos vigentes se almacenan en `Role.permisos` en la base de datos. `data/permisos.json` se conserva como fuente de importación para instalaciones existentes; la aplicación ya no lo usa en tiempo de ejecución.

Antes de iniciar la aplicación, configura `AUTH_SECRET` en el entorno con un secreto aleatorio de al menos 32 caracteres. Por ejemplo, en Linux:

```bash
openssl rand -base64 48
```

Guarda el resultado en el `.env` del servidor, no en el repositorio. En despliegues con Docker Compose, define también `AUTH_SECRET` en ese archivo para que Compose lo pase al contenedor. Después del cambio a sesiones firmadas, los usuarios administrativos deberán iniciar sesión de nuevo.

Para vincular usuarios antiguos con sus registros `Role` e importar las matrices heredadas sin sobrescribir permisos no vacíos ya configurados en la base, primero respalda la base y el archivo de permisos. Luego ejecuta una vez:

```bash
LEGACY_PERMISSIONS_PATH=/ruta/al/permisos-produccion.json npm run migrate:roles
```

Si no se define `LEGACY_PERMISSIONS_PATH`, el comando lee `data/permisos.json` del proyecto. El script es idempotente; revisa su resumen antes de continuar con el despliegue.

## Facturación comercial

El módulo de Facturación usa `Role.permisos` con la clave `facturacion`. Asigna al rol los permisos de visualizar, crear y editar desde Seguridad Corp.; el menú y las rutas del servidor respetan esos permisos.

El módulo agrega las tablas `semanas_comerciales` y `evaluaciones_vendedores`. En el despliegue, respalda primero la base MySQL y verifica que `DATABASE_URL` apunte al servidor correcto. Como el repositorio no mantiene migraciones Prisma, aplica el cambio desde el proyecto actualizado:

```bash
npx prisma db push
npx prisma generate
```

El cambio previsto añade las tablas de Facturación y sus claves foráneas. `db push` compara todo el esquema, así que comprueba su salida y no continúes si propone modificar o borrar algo fuera de esas tablas nuevas. La imagen Docker regenera Prisma Client al construirse.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
