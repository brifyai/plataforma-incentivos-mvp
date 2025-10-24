FROM denoland/deno:latest

WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Cachear el archivo principal (cambia main.ts por tu archivo real)
RUN deno cache src/main.ts

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "src/main.ts"]
