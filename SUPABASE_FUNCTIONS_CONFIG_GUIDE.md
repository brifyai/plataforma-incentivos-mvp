# 📋 Guía Visual - Configurar Variables de Entorno en Supabase Functions

## ❌ ERROR COMÚN: No usar SQL Editor

El error que viste:
```
ERROR: 42601: syntax error at or near "SENDGRID_API_KEY"
```

**Esto ocurre porque intentaste configurar variables de entorno en el SQL Editor**, que solo sirve para consultas SQL.

---

## ✅ FORMA CORRECTA: Usar Secrets de Functions

### Paso 1: Ve a Functions

1. **Dashboard de Supabase**: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow
2. **Menú lateral** → **Edge Functions**
3. **Selecciona** la función `send-email`

### Paso 2: Configura Secrets

1. **Haz clic en la función** `send-email`
2. **Ve a la pestaña** **Settings**
3. **Haz clic en** **Secrets**
4. **Agrega las variables** una por una:

```
Variable: SENDGRID_API_KEY
Value: SG.YOUR_API_KEY_HERE
```

```
Variable: SENDGRID_FROM_EMAIL  
Value: hola@aintelligence.cl
```

```
Variable: SENDGRID_FROM_NAME
Value: AIntelligence
```

### Paso 3: Redespliega la Función

1. **Vuelve a la pestaña** **Overview**
2. **Haz clic en** **Redeploy**
3. **Espera 1-2 minutos**

---

## 🖼️ Referencia Visual

```
Supabase Dashboard
├── Project: wvluqdldygmgncqqjkow
├── Edge Functions
│   ├── send-email
│   │   ├── Overview (ver logs, status)
│   │   ├── Settings ← AQUÍ CONFIGURAS
│   │   │   ├── Secrets ← AQUÍ VAN LAS VARIABLES
│   │   │   ├── Environment
│   │   │   └── Logs
│   │   └── Redeploy ← DESPUÉS DE CONFIGURAR
│   └── ...
└── ...
```

---

## 🚨 Diferencia Clave

| ❌ SQL Editor | ✅ Functions Secrets |
|--------------|---------------------|
| Para consultas SQL | Para variables de entorno |
| `SELECT * FROM users` | `SENDGRID_API_KEY=SG.xxx` |
| No guarda configuración | Guarda configuración segura |
| Error de sintaxis | Funciona correctamente |

---

## 🧪 Verificación

Después de configurar:

1. **Ejecuta el test**:
   ```bash
   node test_email_sending.js
   ```

2. **Deberías ver**:
   ```
   ✅ Email enviado exitosamente!
   📧 Message ID: sg-xxxxxxxx
   ```

3. **Si sigue fallando**, revisa:
   - Que la API key empiece con `SG.`
   - Que no haya espacios extra
   - Que hayas hecho clic en "Redeploy"

---

## 📞 Si sigues con problemas

1. **Verifica los logs** de la función en Supabase
2. **Confirma que las variables** estén en Secrets, no en otro lugar
3. **Asegúrate de redesplegar** después de configurar

---

## ✅ Checklist Final

- [ ] Entré a Edge Functions (no SQL Editor)
- [ ] Seleccioné la función `send-email`
- [ ] Fui a Settings > Secrets
- [ ] Agregué las 3 variables correctamente
- [ ] Hice clic en Redeploy
- [ ] Esperé 2 minutos
- [ ] Ejecuté `node test_email_sending.js`
- [ ] Vi "✅ Email enviado exitosamente!"

**El sistema funcionará inmediatamente después de configurar correctamente las variables.**