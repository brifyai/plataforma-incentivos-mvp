FROM denoland/deno:latest

WORKDIR /app

# Copiar archivos de configuración primero
COPY deno.json deno.lock ./
COPY src/ ./src/

# Instalar dependencias y cachear
RUN deno cache src/main.ts

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar
CMD ["run", "--allow-net", "--allow-env", "src/main.ts"]
