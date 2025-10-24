FROM denoland/deno:latest

WORKDIR /app

COPY . .

# Verificar la estructura de archivos
RUN echo "=== Buscando archivos TypeScript/JavaScript ===" && \
    find . -name "*.ts" -o -name "*.js" | head -20

# Intentar diferentes archivos principales comunes
RUN if [ -f "src/main.ts" ]; then \
        echo "Encontrado src/main.ts" && deno cache src/main.ts; \
    elif [ -f "main.ts" ]; then \
        echo "Encontrado main.ts" && deno cache main.ts; \
    elif [ -f "app.ts" ]; then \
        echo "Encontrado app.ts" && deno cache app.ts; \
    elif [ -f "src/app.ts" ]; then \
        echo "Encontrado src/app.ts" && deno cache src/app.ts; \
    elif [ -f "index.ts" ]; then \
        echo "Encontrado index.ts" && deno cache index.ts; \
    else \
        echo "No se encontró archivo principal. Archivos disponibles:" && \
        find . -name "*.ts" -o -name "*.js"; \
        exit 1; \
    fi

EXPOSE 8000

# El CMD lo ajustaremos después de identificar el archivo
CMD ["run", "--allow-net", "--allow-env", "src/main.ts"]
