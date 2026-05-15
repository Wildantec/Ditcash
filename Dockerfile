# ETAPA 1: Construcción (Builder)
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build

# ETAPA 2: Ejecución (Runner) - Aquí ocurre la magia del diseño
# ETAPA 1: Construcción (Builder)
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build

# ETAPA 2: Ejecución (Runner)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
RUN apt-get update -y && apt-get install -y openssl

# Copiamos el servidor optimizado
COPY --from=builder /app/.next/standalone ./

# Copiamos los archivos estáticos e imágenes para que el diseño NO se rompa
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Iniciamos con node directamente para estabilidad de las APIs
CMD ["node", "server.js"]