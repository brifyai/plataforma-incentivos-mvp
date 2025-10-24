# 🚨 **INSTRUCCIONES CLARAS PARA EJECUTAR LA MIGRACIÓN SQL**

## ⚠️ **IMPORTANTE: NO EJECUTAR ARCHIVOS .CJS**

**NO debes ejecutar archivos que terminen en `.cjs` en el editor SQL de Supabase.**
Los archivos `.cjs` contienen código JavaScript que causará el error:
```
ERROR: 42601: syntax error at or near "const"
LINE 1: const { createClient } = require('@supabase/supabase-js');
```

## ✅ **ARCHIVO CORRECTO A EJECUTAR**

**ÚNICAMENTE debes ejecutar este archivo:**
📁 `supabase-migrations/042_fix_client_debt_relations_pure_sql.sql`

## 📋 **PASOS EXACTOS A SEGUIR**

### **PASO 1: Acceder a Supabase**
1. Ir a: https://app.supabase.com
2. Iniciar sesión
3. Seleccionar proyecto: **wvluqdldygmgncqqjkow**
4. Ir a **"SQL Editor"** en el menú lateral

### **PASO 2: Crear Nueva Consulta**
1. Hacer clic en **"New query"**
2. Se abrirá un editor SQL vacío

### **PASO 3: Copiar el SQL CORRECTO**
1. Abrir el archivo: **`supabase-migrations/042_fix_client_debt_relations_pure_sql.sql`**
2. **SELECCIONAR Y COPIAR TODO EL CONTENIDO** (desde la línea 1 hasta la 134)
3. **NO** abras ningún archivo que termine en `.cjs`

### **PASO 4: Pegar y Ejecutar**
1. Pegar el contenido copiado en el editor SQL de Supabase
2. Hacer clic en el botón **"Run"**
3. Esperar a que se complete (debería mostrar "Success")

### **PASO 5: Verificar**
1. Volver a la terminal
2. Ejecutar: `node scripts/check-client-debt-structure.cjs`
3. Debería mostrar "✅ SÍ" para ambas columnas

## 🔍 **CONTENIDO DEL ARCHIVO SQL CORRECTO**

El archivo `042_fix_client_debt_relations_pure_sql.sql` contiene:
- Líneas 1-134 de SQL puro
- Comienza con: `-- Fix Client-Debt Relations`
- Termina con: `ON CONFLICT (name) DO UPDATE SET executed_at = NOW();`
- **NO contiene** `const` o `require()`

## ❌ **ARCHIVOS QUE NO DEBES EJECUTAR EN SUPABASE**

- `scripts/check-client-debt-structure.cjs` ❌
- `scripts/create-empresa-user.cjs` ❌
- Cualquier archivo `.cjs` ❌

## ✅ **RESULTADO ESPERADO**

Después de ejecutar el SQL correcto:
- ✅ Columna `client_id` agregada a tabla `debts`
- ✅ Columna `corporate_client_id` agregada a tabla `clients`
- ✅ Índices, políticas y triggers creados
- ✅ Clientes corporativos funcionarán correctamente

**Recuerda: Solo ejecuta archivos `.sql` en el editor SQL de Supabase, nunca archivos `.cjs`**