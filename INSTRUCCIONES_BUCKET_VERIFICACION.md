# 🔧 Instrucciones para Configurar Bucket de Verificación

## Problema identificado
Los botones de "Subir Certificado de Vigencia" y "Subir Informe Equifax" no funcionan porque el bucket `verification-documents` no existe en Supabase Storage.

## Solución: Crear bucket manualmente

### Paso 1: Acceder al panel de Supabase Storage
1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage
2. Inicia sesión con tu cuenta de Supabase

### Paso 2: Crear el bucket
1. Haz clic en el botón **"New bucket"**
2. Configura el bucket con estos datos:
   - **Name**: `verification-documents`
   - **Public bucket**: ✅ Marca esta casilla
   - **File size limit**: `5242880` (5 MB)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/png`

### Paso 3: Guardar configuración
1. Haz clic en **"Save"**
2. Espera a que se cree el bucket
3. Deberías ver `verification-documents` en la lista de buckets

### Paso 4: Verificar configuración
El bucket debería aparecer así:
```
📁 verification-documents (public)
   📄 Size limit: 5MB
   📄 MIME types: PDF, JPEG, PNG
```

### Paso 5: Configurar políticas RLS (si es necesario)
Si ves errores de permisos, ve a:
1. https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage/policies
2. Crea estas políticas:

**Política de INSERT:**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);
```

**Política de SELECT:**
```sql
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);
```

### Paso 6: Probar la subida
1. Vuelve a: http://localhost:3002/empresa/verification
2. Intenta subir un documento PDF
3. Debería funcionar correctamente

## ✅ Resultado esperado
- ✅ Bucket `verification-documents` creado y accesible
- ✅ Botones de subida funcionando
- ✅ Documentos PDF se suben correctamente
- ✅ Sistema de verificación 100% operativo

## 🔍 Si tienes problemas

### Error "Bucket not found"
- Verifica que el bucket se haya creado correctamente
- Refresca la página de Supabase Storage

### Error "Permission denied"
- Configura las políticas RLS como se indica en el Paso 5
- Asegúrate de que el bucket sea público

### Error "File too large"
- Verifica que el archivo no supere los 5MB
- Ajusta el límite si es necesario

### Error "Invalid file type"
- Asegúrate de subir solo archivos PDF
- Verifica los MIME types permitidos

## 📞 Soporte
Si después de seguir estos pasos los botones aún no funcionan:
1. Abre la consola del navegador (F12)
2. Intenta subir un documento
3. Copia y pega los errores que aparecen
4. Verifica que el bucket exista en el panel de Supabase

## 🎯 Verificación final
Una vez configurado, deberías poder:
- ✅ Subir el Certificado de Vigencia
- ✅ Subir el Informe Empresarial Equifax
- ✅ Ver los documentos subidos
- ✅ Enviar la verificación para revisión