# 🚨 Configuración Crítica de Supabase para Producción

## Problema Detectado

El **Site URL** en Supabase está configurado para desarrollo:
```
❌ Site URL actual: http://localhost:3002
```

Esto causará problemas en producción porque:
- Los emails de verificación apuntarán a localhost
- Los callbacks de autenticación fallarán
- Los enlaces de recuperación de contraseña no funcionarán

## ✅ Configuración Correcta para Producción

### 1. Site URL
```
✅ Site URL correcto: https://nexupay.netlify.app
```

### 2. Redirect URLs (ya están correctos)
```
✅ https://nexupay.netlify.app/auth/callback
✅ https://nexupay.netlify.app
✅ http://localhost:3002/auth/callback (desarrollo)
✅ http://127.0.0.1:3002/auth/callback (desarrollo)
```

## 🛠️ Pasos para Corregir

### Paso 1: Actualizar Site URL en Supabase

1. Ir a [Supabase Dashboard](https://app.supabase.com/)
2. Seleccionar el proyecto
3. Ir a **Authentication** → **Settings**
4. En **Site URL**, cambiar:
   ```
   De: http://localhost:3002
   A: https://nexupay.netlify.app
   ```
5. Hacer clic en **Save**

### Paso 2: Verificar Redirect URLs

Asegurarse que estas URLs estén configuradas:
```
https://nexupay.netlify.app/auth/callback
https://nexupay.netlify.app
http://localhost:3002/auth/callback
http://127.0.0.1:3002/auth/callback
```

### Paso 3: Configurar Variables de Entorno en Netlify

Si aún no está hecho, configurar en Netlify:
```
VITE_SUPABASE_URL=https://[TU-PROYECTO].supabase.co
VITE_SUPABASE_ANON_KEY=[TU-ANON-KEY]
```

## 🔍 Verificación

Después de los cambios:

1. **Probar registro**: Debería llegar email de verificación
2. **Probar login**: Debería funcionar correctamente
3. **Probar recuperación**: Debería enviar email con enlace funcional

## ⚠️ Importante

- **No eliminar** las URLs de localhost (necesarias para desarrollo)
- **Site URL** debe apuntar siempre al ambiente de producción
- Los cambios toman efecto inmediatamente

## 🚨 Si no se corrige

Sin esta configuración:
- ❌ Los usuarios no podrán verificar su email
- ❌ El login con OAuth fallará
- ❌ La recuperación de contraseña no funcionará
- ❌ Los enlaces en emails apuntarán a localhost

## 📞 Soporte

Si hay problemas:
- **Documentación Supabase**: https://supabase.com/docs/guides/auth
- **Email**: soporte@nexupay.cl

---

**URGENTE**: Este cambio es crítico para el funcionamiento correcto de la autenticación en producción.