# Imagen base de Node.js
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias y generar cliente de Prisma
RUN npm install
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer el puerto de NestJS
EXPOSE 3000

# Comando para iniciar en producción
CMD ["npm", "run", "start:prod"]