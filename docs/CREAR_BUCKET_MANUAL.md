# Crear Bucket Manualmente en Supabase Storage

## ⚠️ Problema Actual
La SERVICE_ROLE_KEY no está configurada correctamente, por lo que no se puede crear el bucket automáticamente. Este error aparece cuando intentas subir documentos de verificación:

```
Error: signature verification failed
```

## 🔧 Solución: Crear Bucket Manualmente

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow
2. Inicia sesión con tu cuenta

### Paso 2: Ir a Storage
1. En el menú lateral izquierdo, haz clic en **Storage**

### Paso 3: Crear el Bucket
1. Haz clic en **"New bucket"**
2. Configura los siguientes datos:
   ```
   Name: verification-documents
   Public bucket: ✅ (marcar esta opción)
   File size limit: 5242880 (5MB)
   Allowed MIME types: 
   - application/pdf
   - image/jpeg
   - image/png
   - image/jpg
   ```

### Paso 4: Guardar
1. Haz clic en **"Save"**
2. Espera unos segundos para que se cree el bucket

### Paso 5: Verificar
1. Deberías ver el bucket "verification-documents" en la lista
2. Asegúrate que tenga el ícono de público (🌐)

## 🧪 Probar la Subida

Después de crear el bucket manualmente:

1. Ve a: `http://localhost:3002/empresa/perfil`
2. Intenta subir los documentos de verificación
3. Debería funcionar sin errores

## 📋 Si sigues teniendo problemas

### Error de permisos (RLS)
Si aparece un error de políticas RLS, ejecuta este SQL en el dashboard:

```sql
-- Crear políticas para el bucket verification-documents
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'verification-documents');

CREATE POLICY "Insert Files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Update Files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-documents' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Delete Files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'verification-documents' AND 
  auth.role() = 'authenticated'
);
```

### Verificar configuración
Para verificar que todo esté correcto, puedes ejecutar:

```sql
-- Listar buckets
SELECT * FROM storage.buckets WHERE name = 'verification-documents';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

## ✅ Checklist Final

- [ ] Bucket "verification-documents" creado
- [ ] Bucket configurado como público
- [ ] Límite de tamaño: 5MB
- [ ] MIME types configurados
- [ ] Políticas RLS aplicadas (si es necesario)
- [ ] Prueba de subida exitosa

## 🎯 Resumen

Una vez que crees el bucket manualmente, la subida de documentos de verificación debería funcionar perfectamente. El error "signature verification failed" estará resuelto.

Si necesitas ayuda adicional, revisa los logs en la consola del navegador para ver mensajes más específicos.