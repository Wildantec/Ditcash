# Usamos Node 20 para cumplir con el requisito de Next.js
FROM node:20-slim

# Instalamos OpenSSL para que Prisma no falle
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copiamos archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos dependencias y generamos el cliente de Prisma
RUN npm install
RUN npx prisma generate

# Copiamos el resto del código
COPY . .

# Ejecutamos el build (ahora con Node 20 pasará sin problemas)
RUN npm run build

EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
