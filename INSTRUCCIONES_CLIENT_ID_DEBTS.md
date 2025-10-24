# 🎯 SOLUCIÓN CLIENTES CORPORATIVOS - SOLO CLIENT_ID EN DEBTS

## 📋 SITUACIÓN ACTUAL

✅ **Tabla `clients`**: Ya tiene `corporate_client_id` (confirmado por el usuario)  
❌ **Tabla `debts`**: Necesita el campo `client_id`

## 🔧 PASO ÚNICO: Ejecutar SQL en Supabase

### Opción 1: Automática (Recomendada)
```bash
node scripts/apply-client-corporate-fix.cjs
```

### Opción 2: Manual en Supabase Dashboard

1. **Ir a Supabase**: https://app.supabase.com
2. **Seleccionar proyecto**: `wvluqdldygmgncqqjkow`
3. **Ir a SQL Editor** (menú lateral)
4. **Copiar y pegar** este SQL:

```sql
-- =====================================================
-- AGREGAR client_id A TABLA DEBTS
-- =====================================================
-- Este SQL agrega únicamente el campo client_id a la tabla debts
-- La tabla clients ya tiene corporate_client_id (confirmado por el usuario)

-- Agregar client_id a debts (seguro)
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
        RAISE NOTICE 'ℹ️ Columna client_id ya existe en debts';
    END IF;
END $$;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);

-- Confirmar operación
SELECT 
    'debts' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'client_id'
AND table_schema = 'public';

RAISE NOTICE '🎯 Operación completada: client_id ahora disponible en debts';
```

5. **Hacer clic en "Run"**
6. **Verificar que aparezca**: `✅ Columna client_id agregada a debts`

## ✅ VERIFICACIÓN FINAL

Ejecutar este comando para verificar:
```bash
node scripts/check-client-debt-structure.cjs
```

Debería mostrar:
- ✅ `debts.client_id`: **SÍ**
- ✅ `clients.corporate_client_id`: **SÍ**

## 🎯 RESULTADO ESPERADO

Una vez aplicado el SQL:
1. ✅ Los clientes corporativos se guardarán correctamente
2. ✅ Los errores 404 en consola desaparecerán
3. ✅ El sistema funcionará con 100% de funcionalidad

## 📞 SI HAY PROBLEMAS

Si el SQL falla:
1. **Verificar permisos** en Supabase
2. **Ejecutar línea por línea** el SQL
3. **Contactar soporte** con el error específico

---

**Estado**: Solución específica y lista para ejecutar. Solo falta aplicar el SQL en Supabase.