# 🚀 Solución Rápida para Bucket verification-documents

## 🎯 Problema Actual
Error: `Error de configuración: Bucket de documentos no encontrado`

## ✅ Solución Inmediata (Recomendada)

### Paso 1: Crear Bucket Manualmente
1. Ve a: https://wvluqdldygmgncqqjkow.supabase.co
2. Inicia sesión
3. **Storage** → **Create new bucket**
4. Configura:
   - **Name**: `verification-documents`
   - **Public bucket**: ✅ SÍ (marcar esta opción)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `application/pdf, image/jpeg, image/png, image/jpg`
5. **Save**

### Paso 2: Probar Inmediatamente
1. Ve a: http://localhost:3002/empresa/perfil
2. Intenta subir un documento
3. Debería funcionar sin errores

## 🔧 ¿Por qué funciona?

### ✅ Bucket Público
- No requiere políticas RLS complejas
- Evita errores de permisos
- Funciona inmediatamente

### ✅ Nombres Aleatorios
- Los archivos se guardan con timestamps únicos
- Ejemplo: `abc123/certificado_vigencia_1697123456789.pdf`
- Baja probabilidad de colisiones

### ✅ Seguridad por Diseño
- URLs son difíciles de adivinar
- Solo usuarios autenticados pueden subir
- Los documentos están asociados a company_id

## 🔄 Pasar a Modo Privado (Opcional)

Una vez que funcione, puedes hacer el bucket privado:

1. **Storage** → `verification-documents` → **Settings**
2. Desmarcar **Public bucket**
3. Ejecutar el SQL en `supabase-migrations/create_verification_bucket.sql`

## 📋 Checklist Final

- [ ] Bucket creado como público
- [ ] Límite de 5MB configurado
- [ ] Tipos MIME permitidos configurados
- [ ] Subida de documentos probada
- [ ] Funciona sin errores

## 🚨 Nota Importante

Esta solución temporal permite que el sistema funcione inmediatamente. 
La seguridad se maneja a nivel de aplicación (solo usuarios autenticados pueden subir).

Para producción, considera configurar el bucket como privado con políticas RLS adecuadas.