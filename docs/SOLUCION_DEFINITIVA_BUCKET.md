# 🚨 SOLUCIÓN DEFINITIVA: Error al subir documentos de verificación

## Problema Identificado

El error `Bucket "verification-documents" no encontrado` ocurre porque:
1. ✅ Las variables de entorno están configuradas correctamente
2. ✅ La conexión con Supabase funciona con ANON_KEY
3. ❌ **El bucket `verification-documents` no existe en Supabase Storage**
4. ❌ La SERVICE_ROLE_KEY está truncada/incompleta (error de firma)

## Solución Inmediata (5 minutos)

### Paso 1: Crear el bucket manualmente

1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/storage
2. Haz clic en **"New bucket"**
3. Configura el bucket:
   - **Name**: `verification-documents`
   - **Public bucket**: ✅ (marcar esta opción)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/jpg`
4. Haz clic en **"Save"**

### Paso 2: Esperar y probar

1. Espera **1-2 minutos** después de crear el bucket
2. Recarga la página de la aplicación
3. Intenta subir el documento nuevamente

## Verificación

Después de crear el bucket, puedes verificar que funciona con:

```bash
node scripts/diagnose_bucket_issue.js
```

Debería mostrar:
```
✅ Bucket verification-documents encontrado
```

## Si el problema persiste

### Opción A: Actualizar SERVICE_ROLE_KEY

La SERVICE_ROLE_KEY actual parece estar truncada. Para obtener la correcta:

1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/settings/api
2. Copia la **Service Role Key** (la que empieza con `eyJ...`)
3. Reemplaza la línea 7 en tu archivo `.env`:
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY=aquí_la_key_completa
   ```

### Opción B: Usar solo ANON_KEY (recomendado para desarrollo)

Modifica el `verificationService.js` para que no dependa de SERVICE_ROLE_KEY:

```javascript
// En src/services/verificationService.js, comenta esta línea:
// const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Y usa solo el cliente normal:
const supabaseAdmin = null; // Forzar creación manual del bucket
```

## Configuración Óptima del Bucket

Para que todo funcione correctamente, el bucket debe tener:

### Configuración Básica
- **Nombre**: `verification-documents`
- **Tipo**: Público
- **Límite de tamaño**: 5MB
- **Tipos MIME permitidos**: PDF, JPEG, PNG

### Políticas (RLS) - Opcional para desarrollo

Si quieres configurar políticas de seguridad:

```sql
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'verification-documents');

-- Permitir inserción a usuarios autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualización a dueños de archivos
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Flujo Completo de Verificación

Una vez que el bucket esté creado:

1. **Usuario sube documento** → Se guarda en `verification-documents/{userId}/{documentType}/`
2. **Sistema procesa documento** → Verifica formato y tamaño
3. **Actualiza estado de verificación** → Cambia estado en la base de datos
4. **Notificación** → Envía confirmación al usuario

## Troubleshooting Avanzado

### Error 403: "signature verification failed"
- La SERVICE_ROLE_KEY está incorrecta o truncada
- Solución: Obtener la key completa del dashboard de Supabase

### Error 404: "bucket not found"
- El bucket no existe o no está accesible
- Solución: Crear el bucket manualmente como se indica arriba

### Error de permisos
- El bucket existe pero no tiene las políticas correctas
- Solución: Configurar como público o agregar políticas RLS

## Checklist Final

- [ ] Bucket `verification-documents` creado en Supabase Storage
- [ ] Bucket configurado como público
- [ ] Límite de tamaño: 5MB
- [ ] Tipos MIME permitidos configurados
- [ ] Esperar 1-2 minutos después de crear
- [ ] Probar subida de documento
- [ ] Verificar que el documento aparece en el bucket

## Soporte

Si después de seguir estos pasos el problema persiste:

1. Ejecuta el script de diagnóstico:
   ```bash
   node scripts/diagnose_bucket_issue.js
   ```

2. Revisa la consola del navegador para errores detallados

3. Verifica que el archivo tenga el formato correcto (PDF, JPEG, PNG)

4. Asegúrate que el tamaño no exceda 5MB

---

**Tiempo estimado de solución**: 5-10 minutos
**Dificultad**: Fácil
**Requiere acceso a**: Dashboard de Supabase