# 🔧 Fix para el Problema de client_id en la tabla debts

## 🚨 Problema Identificado

El sistema está mostrando errores 404 cuando intenta acceder a la columna `client_id` en la tabla `debts`:

```
GET https://wvluqdldygmgncqqjkow.supabase.co/rest/v1/information_schema.columns?select=column_name&table_name=eq.debts&column_name=eq.client_id&table_schema=eq.public 404 (Not Found)
```

Esto causa que:
- La función `getCompanyDebts()` no pueda filtrar por `client_id`
- Los datos de deudas no se muestren correctamente
- Las estadísticas de deudas sean incorrectas

## ✅ Solución: Aplicar la Migración Manualmente

### Opción 1: Usar el Editor SQL de Supabase (Recomendado)

1. **Ir al Dashboard de Supabase**: https://wvluqdldygmgncqqjkow.supabase.co
2. **Navegar a SQL Editor**
3. **Ejecutar el siguiente SQL**:

```sql
-- Migration: Add client_id column to debts table
-- First check if the column already exists to prevent errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the client_id column as a foreign key to clients table
        ALTER TABLE public.debts 
        ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
        
        RAISE NOTICE 'client_id column added to debts table successfully';
    ELSE
        RAISE NOTICE 'client_id column already exists in debts table';
    END IF;
END $$;

-- Optional: Create a composite index for company_id + client_id queries
CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;

-- Migration completed
SELECT 'Migration 024_add_client_id_to_debts completed successfully' as status;
```

### Opción 2: Usar Supabase CLI

Si tienes el Supabase CLI configurado:

```bash
supabase db push
```

O aplicar la migración específica:

```bash
supabase migration up 024_add_client_id_to_debts.sql
```

### Opción 3: Usar el Script (si tienes credenciales)

1. **Crear archivo .env.local** con las credenciales:
```
NEXT_PUBLIC_SUPABASE_URL=https://wvluqdldygmgncqqjkow.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

2. **Ejecutar el script**:
```bash
node scripts/apply-client-id-migration.cjs
```

## 🔍 Verificación

Después de aplicar la migración, verifica que la columna existe ejecutando:

```sql
-- Verificar que la columna client_id existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'client_id'
AND table_schema = 'public';
```

Deberías ver un resultado como:
```
column_name | data_type | is_nullable
client_id   | uuid      | YES
```

## 🎯 Impacto de la Corrección

Una vez aplicada la migración:

✅ **Funciones que se corregirán:**
- `getCompanyDebts()` en databaseService.js
- `getClientDebts()` en databaseService.js
- Estadísticas de deudas en el panel administrativo
- Gestión de clientes y deudas

✅ **Componentes que funcionarán correctamente:**
- ClientManagement.jsx
- ClientDebtsPage.jsx
- AdminDashboard.jsx
- CompanyDashboard.jsx

✅ **Consultas SQL que dejarán de dar error:**
- Todas las consultas que usan `client_id` en la tabla `debts`

## 📋 Pasos Seguidos

1. ✅ **Identificado el problema**: Columna `client_id` no existe en `debts`
2. ✅ **Creada la migración**: `024_add_client_id_to_debts.sql`
3. ✅ **Creado script de aplicación**: `apply-client-id-migration.cjs`
4. ⏳ **Aplicar la migración**: Usar una de las opciones above
5. ⏳ **Verificar la corrección**: Comprobar que la columna existe
6. ⏳ **Probar la aplicación**: Verificar que los datos se muestran correctamente

## 🚀 Después de Aplicar la Migración

1. **Reiniciar la aplicación**: `npm run dev`
2. **Verificar el panel administrativo**: Debería mostrar datos reales
3. **Probar la gestión de clientes**: Los clientes deberían aparecer correctamente
4. **Verificar las estadísticas**: Los números deberían ser correctos

## 📞 Soporte

Si tienes problemas aplicando la migración:

1. **Verifica permisos**: Asegúrate de tener permisos de administrador en Supabase
2. **Revisa el SQL**: Copia y pega exactamente el SQL proporcionado
3. **Contacta soporte**: Si el problema persiste, proporciona los mensajes de error exactos

---

## 🔄 Estado Actual

- ❌ **Problema**: Columna `client_id` no existe en tabla `debts`
- ⏳ **Acción**: Aplicar migración SQL manualmente
- ✅ **Solución**: SQL y scripts preparados
- ⏳ **Verificación**: Pendiente de aplicar migración

**Prioridad**: 🚨 ALTA - Este problema afecta la funcionalidad principal del sistema