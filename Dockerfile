FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instalar dependencias sin las opcionales problemáticas
RUN npm ci --no-optional

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Servir con nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
