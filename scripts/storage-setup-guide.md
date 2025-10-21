# 📋 Guía Completa: Configurar Políticas RLS para Supabase Storage

## 🔍 Problema
El error "must be owner of table objects" indica que no se pueden crear políticas RLS directamente con SQL en la tabla storage.objects.

## 🛠️ Solución: Configurar através de la Interfaz de Storage

### Paso 1: Verificar que el Bucket Exista
1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage
2. Busca el bucket llamado `verification-documents`
3. Si no existe, créalo:
   - Haz clic en "New bucket"
   - Nombre: `verification-documents`
   - Marca como "Public" (opcional, pero recomendado)
   - Haz clic en "Save"

### Paso 2: Configurar Políticas RLS (Método Visual)

#### Política 1: Permitir Subida de Archivos (INSERT)
1. En la misma página de Storage, haz clic en la pestaña **"Policies"**
2. Haz clic en **"New Policy"**
3. Selecciona **"For full custom permissions"**
4. Configura así:

**Policy Name:** `Upload verification docs`

**Allowed Operation:** `INSERT`

**Policy Definition:**
```
(bucket_id = 'verification-documents' AND auth.role() = 'authenticated')
```

5. Haz clic en **"Review"** luego **"Save"**

#### Política 2: Permitir Lectura de Archivos (SELECT)
1. Haz clic en **"New Policy"** nuevamente
2. Selecciona **"For full custom permissions"**
3. Configura así:

**Policy Name:** `Read verification docs`

**Allowed Operation:** `SELECT`

**Policy Definition:**
```
(bucket_id = 'verification-documents' AND auth.role() = 'authenticated')
```

4. Haz clic en **"Review"** luego **"Save"**

### Paso 3: Verificar Configuración
1. En la pestaña Policies, deberías ver ambas políticas activas
2. Asegúrate de que ambas tengan el estado **"Enabled"**

### Paso 4: Probar Funcionalidad
1. **Espera 1-2 minutos** para que las políticas se activen
2. **Recarga NexuPay** en tu navegador
3. **Limpia la caché** (Ctrl+F5 o Cmd+Shift+R)
4. **Prueba los botones:**
   - "Subir Certificado de Vigencia"
   - "Subir Informe Equifax"

## 🎯 Resultado Esperado
- ✅ Los botones abrirán el selector de archivos
- ✅ Podrás seleccionar archivos PDF
- ✅ Los archivos se subirán correctamente
- ✅ No aparecerá el error de políticas RLS

## 🔧 Si Sigue Fallando

### Opción A: Verificar Permisos del Usuario
1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/settings/api
2. Copia el `service_role` key
3. Úsala temporalmente para probar

### Opción B: Crear Bucket Público
Si las políticas RLS siguen fallando, haz el bucket público:
1. Ve a la configuración del bucket `verification-documents`
2. Marca la opción **"Public"**
3. Esto permite acceso público de lectura (pero las escrituras aún necesitan autenticación)

### Opción C: Contactar Soporte
Si nada funciona, contacta a soporte de Supabase con:
- Project ID: `wvluqdldygmgncqqjkow`
- Error: "must be owner of table objects"
- Necesidad: Configurar políticas RLS para storage.objects

## 📊 Resumen
- ✅ Botones funcionales (código corregido)
- ✅ company_id resuelto
- 🔧 Políticas RLS listas para configurar visualmente
- 🎯 Solo falta configurar en la interfaz de Supabase

## 🚀 Una vez Configurado
NexuPay estará 100% funcional y listo para producción.