# ==========================================
# ETAPA 1: Construcción (Builder)
# ==========================================
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npx prisma generate
RUN npm run build
# ==========================================
# ETAPA 2: Ejecución (Runner) - Producción
# ==========================================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl

# Copiamos el servidor optimizado standalone de Next.js
COPY --from=builder /app/.next/standalone ./

# Copiamos los archivos estáticos e imágenes para que el diseño unificado NO se rompa
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Copiamos la carpeta de Prisma para asegurar que el motor de Base de Datos inicie bien
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Iniciamos el servidor de forma directa y ultra estable
CMD ["node", "server.js"]
