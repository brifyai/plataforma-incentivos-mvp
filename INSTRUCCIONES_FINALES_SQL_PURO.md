# 🚨 **INSTRUCCIONES FINALES - SQL PURO**

## ⚠️ **PROBLEMA ACTUAL**
Las columnas `client_id` y `corporate_client_id` necesitan ser verificadas/agregadas en la base de datos.

## ✅ **SOLUCIÓN INMEDIATA**

### **PASO 1: Ir a Supabase**
1. Abrir navegador: https://app.supabase.com
2. Iniciar sesión
3. Seleccionar proyecto: **wvluqdldygmgncqqjkow**
4. Hacer clic en **"SQL Editor"** (menú lateral izquierdo)

### **PASO 2: Copiar y Ejecutar SQL PURO**
1. Hacer clic en **"New query"**
2. Copiar el contenido del archivo **[`SQL_FINAL_PURO.sql`](SQL_FINAL_PURO.sql:1)** 
3. Pegar en el editor SQL
4. Hacer clic en **"Run"**
5. Esperar mensaje "Success"

**IMPORTANTE:** Este SQL es 100% puro (sin JavaScript) y verifica si las columnas existen antes de agregarlas.

### **PASO 3: Verificar**
1. Volver a la terminal
2. Ejecutar: `node scripts/check-client-debt-structure.cjs`
3. Debe mostrar "✅ SÍ" para ambas columnas

### **PASO 4: Probar**
1. Recargar: http://localhost:3002
2. Iniciar sesión como empresa
3. Ir a "Clientes"
4. Agregar cliente corporativo
5. ✅ Debe funcionar sin errores

## 🔥 **SI HAY ERRORES**

### **ERROR: "column already exists"**
- ✅ **Es normal**: Significa que la columna ya existe
- **Solución**: Continuar con el PASO 3

### **ERROR: "syntax error at or near const"**
- ❌ **Problema**: Estás ejecutando JavaScript como SQL
- **Solución**: Asegúrate de copiar solo el contenido de `SQL_FINAL_PURO.sql`

### **ERROR de permisos**
- Asegurarse de tener permisos de administrador en Supabase

## 📞 **CONTACTO**
Si después de 3 intentos no funciona:
1. Verificar que estás usando el archivo `SQL_FINAL_PURO.sql`
2. Confirmar permisos de administrador
3. Contactar al administrador de Supabase

## 🎯 **RESUMEN**
- ✅ Usar **[`SQL_FINAL_PURO.sql`](SQL_FINAL_PURO.sql:1)** (100% SQL puro)
- ✅ No contiene JavaScript
- ✅ Verifica existencia de columnas
- ✅ Seguro para ejecutar múltiples veces