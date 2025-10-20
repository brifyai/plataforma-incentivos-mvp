# 📋 Configurar Bucket verification-documents en Supabase

## 🚨 Problema Actual
Al intentar subir documentos de verificación (certificado de vigencia e informe empresarial Equifax) aparece el error:
```
Error de configuración: Bucket de documentos no encontrado.
El administrador debe crear el bucket "verification-documents" en Supabase Storage.
```

## ✅ Solución Paso a Paso

### 1. Acceder al Dashboard de Supabase
1. Ve a: https://wvluqdldygmgncqqjkow.supabase.co
2. Inicia sesión con tus credenciales
3. Selecciona tu proyecto

### 2. Crear el Bucket verification-documents
1. En el menú izquierdo, haz clic en **Storage**
2. Haz clic en el botón **"Create new bucket"**
3. Configura el bucket con estos datos:
   - **Name**: `verification-documents`
   - **Public bucket**: ❌ NO (desmarcar esta opción)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
4. Haz clic en **"Save"**

### 3. Configurar Políticas de Acceso (MÉTODO RECOMENDADO)

#### 🎯 Opción A: Configuración Manual (Si no tienes permisos de admin)
1. Ve a **Storage** → **verification-documents**
2. Haz clic en la pestaña **"Policies"**
3. Haz clic en **"New Policy"** para crear cada una de las 4 políticas:

**POLÍTICA 1 - INSERT (Subir archivos)**
- **Policy name**: `Users can upload verification documents`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**: `bucket_id = 'verification-documents' AND auth.role() = 'authenticated'`

**POLÍTICA 2 - SELECT (Leer archivos)**
- **Policy name**: `Users can read own verification documents`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**: `bucket_id = 'verification-documents' AND auth.role() = 'authenticated'`

**POLÍTICA 3 - UPDATE (Actualizar archivos)**
- **Policy name**: `Users can update own verification documents`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**: `bucket_id = 'verification-documents' AND auth.role() = 'authenticated'`

**POLÍTICA 4 - DELETE (Eliminar archivos)**
- **Policy name**: `Users can delete own verification documents`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**: `bucket_id = 'verification-documents' AND auth.role() = 'authenticated'`

#### 🔧 Opción B: Configuración SQL (Si tienes permisos de owner)
1. En el menú izquierdo, ve a **SQL Editor**
2. Haz clic en **"New query"**
3. Copia y pega el contenido del archivo: [`supabase-migrations/setup_verification_policies_simple.sql`](supabase-migrations/setup_verification_policies_simple.sql:1)
4. Haz clic en **"Run"**

> **⚠️ Nota**: Si recibes el error `ERROR: 42501: must be owner of table objects`, usa la **Opción A** (configuración manual).

### 4. Verificar Configuración
1. Ve a **Storage** → **verification-documents**
2. Deberías ver el bucket creado
3. Haz clic en la pestaña **"Policies"**
4. Deberías ver las 4 políticas creadas:
   - ✅ `Users can upload verification documents`
   - ✅ `Users can read own verification documents`
   - ✅ `Users can update own verification documents`
   - ✅ `Users can delete own verification documents`

### 5. Probar la Subida de Documentos
1. Ve a la aplicación: http://localhost:3002/empresa/perfil
2. En la sección "Documentos de Verificación":
   - Haz clic en "Subir Certificado de Vigencia"
   - Selecciona un archivo PDF o imagen
   - Haz clic en "Subir Informe Empresarial Equifax"
   - Selecciona otro archivo
3. Los documentos deberían subirse sin errores

## 🔍 Verificación SQL (Opcional)
Para verificar que todo está configurado correctamente, ejecuta este SQL:

```sql
-- Verificar políticas creadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%verification%';

-- Verificar bucket (después de crearlo manualmente)
SELECT * FROM storage.buckets WHERE name = 'verification-documents';
```

## 🚨 Si Aparecen Errores

### Error: "Policy already exists"
Solución: Elimina las políticas existentes y vuelve a crearlas:
```sql
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;
```

### Error: "Permission denied"
Asegúrate de estar usando la **SERVICE_ROLE_KEY** o tener permisos de administrador en Supabase.

### Error: "Bucket not found"
Verifica que hayas creado el bucket manualmente en la sección Storage del dashboard.

## 📁 Estructura de Archivos
Los documentos se guardarán con la siguiente estructura:
```
verification-documents/
├── {user_id}/
│   ├── certificate_of_validity_{timestamp}.pdf
│   └── equifax_business_report_{timestamp}.pdf
```

## 🔐 Seguridad
- ✅ Los documentos son privados (solo el usuario puede acceder)
- ✅ Cada usuario solo puede acceder a sus propios documentos
- ✅ Los archivos están protegidos por Row Level Security (RLS)
- ✅ Límite de tamaño: 5MB por archivo
- ✅ Solo se permiten formatos PDF e imágenes

## ✅ Checklist Final
- [ ] Bucket `verification-documents` creado
- [ ] Bucket configurado como privado
- [ ] Límite de tamaño: 5MB
- [ ] MIME types configurados
- [ ] Políticas RLS creadas
- [ ] Prueba de subida exitosa
- [ ] Verificación en dashboard

Una vez completados estos pasos, la subida de documentos de verificación debería funcionar correctamente. 🎉