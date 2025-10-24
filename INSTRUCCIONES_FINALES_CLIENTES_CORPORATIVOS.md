# 🚨 INSTRUCCIONES FINALES - CORRECCIÓN CLIENTES CORPORATIVOS

## 📋 PROBLEMA IDENTIFICADO

Los clientes corporativos no se guardan porque faltan 2 columnas críticas en la base de datos:
- ❌ `debts.client_id` - NO existe
- ❌ `clients.corporate_client_id` - NO existe

## 🔧 SOLUCIÓN - EJECUTAR SQL MANUALMENTE

### PASO 1: Ir a Supabase
1. Abre: https://app.supabase.com
2. Inicia sesión
3. Selecciona el proyecto: `wvluqdldygmgncqqjkow`
4. En el menú lateral, haz clic en **"SQL Editor"**

### PASO 2: Copiar y Ejecutar el SQL

Copia el siguiente SQL y pégalo en el editor:

```sql
-- Fix Client-Debt Relations for Corporate Clients
-- This migration adds the missing columns for corporate client functionality

-- Add client_id column to debts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        RAISE NOTICE '✅ Columna client_id agregada a debts';
    ELSE
        RAISE NOTICE '⚠️ Columna client_id ya existe en debts';
    END IF;
END $$;

-- Add corporate_client_id column to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE '✅ Columna corporate_client_id agregada a clients';
    ELSE
        RAISE NOTICE '⚠️ Columna corporate_client_id ya existe en clients';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

RAISE NOTICE '✅ Índices creados exitosamente';
```

### PASO 3: Ejecutar el SQL
1. Haz clic en el botón **"Run"** o **"Execute"**
2. Espera a que se complete la ejecución
3. Deberías ver mensajes como: `✅ Columna client_id agregada a debts`

### PASO 4: Verificar la Solución

Después de ejecutar el SQL, vuelve a ejecutar este script para verificar:

```bash
node scripts/check-client-debt-structure.cjs
```

Debería mostrar:
- ✅ `debts.client_id: EXISTE`
- ✅ `clients.corporate_client_id: EXISTE`

### PASO 5: Probar la Aplicación

1. Recarga la aplicación: http://localhost:3002
2. Inicia sesión como empresa
3. Ve a la sección de Clientes
4. Intenta agregar un nuevo cliente corporativo
5. Debería funcionar sin errores

## 🎯 ¿Qué hace este SQL?

1. **Agrega `client_id` a la tabla `debts`**: Permite relacionar deudas con clientes
2. **Agrega `corporate_client_id` a la tabla `clients`**: Permite relacionar clientes individuales con clientes corporativos
3. **Crea índices**: Mejora el rendimiento de las consultas
4. **Verifica existencia**: Solo agrega las columnas si no existen (seguro)

## 🚨 Si tienes errores

### Error: "permission denied"
- Asegúrate de tener permisos de administrador en Supabase
- Contacta al administrador del proyecto

### Error: "column already exists"
- Es normal, significa que la columna ya estaba agregada
- Continúa con el PASO 4

### Error: "relation does not exist"
- Significa que alguna tabla no existe
- Ejecuta primero las migraciones básicas del proyecto

## 📞 Soporte

Si después de seguir estos pasos los clientes corporativos aún no funcionan:

1. Verifica que no haya errores en la consola del navegador
2. Revisa los logs de la aplicación
3. Ejecuta el script de verificación nuevamente
4. Contacta al equipo de desarrollo

---

## 📊 Resumen Técnico

**Problema**: Las columnas `client_id` y `corporate_client_id` faltan en la base de datos
**Causa**: Las migraciones no se ejecutaron completamente
**Solución**: Ejecutar SQL manual para agregar las columnas faltantes
**Impacto**: Sin estas columnas, los clientes corporativos no pueden guardarse correctamente

**Tiempo estimado**: 5-10 minutos
**Dificultad**: Bajo (solo requiere copiar y pegar SQL)