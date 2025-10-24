# 🔧 Solución: Error "Bucket not found" al ver documentos

## 🚨 Problema Identificado
El error `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}` indica que el bucket `verification-documents` no existe o no es accesible públicamente.

## 🛠️ Solución Paso a Paso

### Paso 1: Verificar si el bucket existe
1. **Ve a:** https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage
2. **Busca el bucket** llamado `verification-documents`

### Paso 2: Si el bucket no existe, créalo:
1. **Haz clic en "New bucket"**
2. **Configura así:**
   - **Name:** `verification-documents`
   - **Public bucket:** ✅ Marca esta opción (MUY IMPORTANTE)
   - **File size limit:** Deja el valor por defecto (50MB)
3. **Haz clic en "Save"**

### Paso 3: Si el bucket existe pero no es público:
1. **Haz clic en el bucket** `verification-documents`
2. **Ve a "Settings"**
3. **Activa "Public"** si está desactivado
4. **Haz clic en "Save"**

### Paso 4: Verificar políticas RLS (si aún hay problemas)
Si después de hacer el bucket público sigues teniendo problemas, ejecuta este SQL:

```sql
-- Verificar si el bucket existe
SELECT * FROM storage.buckets WHERE name = 'verification-documents';

-- Si no existe, créalo con SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  gen_random_uuid(),
  'verification-documents',
  true,
  52428800, -- 50MB en bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- Verificar políticas RLS para el bucket
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🎯 ¿Por Qué es Importante que sea Público?

- **URLs públicas:** Las URLs generadas por `getPublicUrl()` solo funcionan con buckets públicos
- **Acceso directo:** Los administradores necesitan ver los documentos sin autenticación adicional
- **Enlaces externos:** Los enlaces en el SweetAlert deben funcionar directamente

## 🚀 Verificación Final

1. **Crea/Configura el bucket** como público
2. **Espera 1-2 minutos** para que los cambios se propaguen
3. **Prueba el botón "Ver"** en la lista de empresas
4. **Deberías poder ver** los documentos sin errores

## 📋 Si el Problema Persiste

1. **Verifica la URL:** Asegúrate que la URL en la base de datos sea correcta
2. **Revisa los logs:** Revisa los logs de Supabase para más detalles
3. **Prueba manualmente:** Intenta acceder a la URL directamente en el navegador

## 🔍 URL Esperada

Las URLs de los documentos deberían verse así:
```
https://wvluqdldygmgncqqjkow.supabase.co/storage/v1/object/public/verification-documents/[company_id]/[filename]
```

Si la URL no contiene `/public/`, el bucket no es público.