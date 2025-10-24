FROM denoland/deno:latest

WORKDIR /app

# Copiar primero los archivos de configuración
COPY deno.json deno.lock ./
COPY src/ ./src/

# Cachear usando el archivo principal de tu app
# CAMBIA "main.ts" por el nombre real de tu archivo principal
RUN deno cache src/main.ts

EXPOSE 8000

# Comando para ejecutar (ajusta los permisos según necesites)
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "src/main.ts"]
