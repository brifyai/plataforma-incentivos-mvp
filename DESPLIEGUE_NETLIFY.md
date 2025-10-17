# 🚀 Guía de Despliegue en Netlify

## ✅ **ESTADO ACTUAL**

- **Git:** ✅ Cambios enviados correctamente (Commit: 8dced92)
- **Netlify:** ⏳ Esperando despliegue automático

## 🔍 **VERIFICAR ESTADO DE DESPLIEGUE**

### **Opción 1: Verificar en Netlify Dashboard**
1. Ir a: https://app.netlify.com
2. Seleccionar el sitio: `plataforma-incentivos-mvp`
3. Revisar la pestaña "Deploys"
4. Buscar el commit más reciente: `8dced92`

### **Opción 2: Verificar logs de despliegue**
1. En Netlify Dashboard → Deploys
2. Hacer clic en el deploy más reciente
3. Revisar si hay errores en el log

## 🔄 **FORZAR DESPLIEGUE (SI ES NECESARIO)**

### **Método 1: Trigger Manual en Netlify**
1. Ir a: https://app.netlify.com/sites/plataforma-incentivos-mvp/deploys
2. Hacer clic en "Trigger deploy"
3. Seleccionar "Branch deploy"
4. Elegir rama: `main`
5. Hacer clic en "Trigger deploy"

### **Método 2: Push Vacío (Forzar Despliegue)**
```bash
cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"
"C:\Program Files\Git\bin\git.exe" commit --allow-empty -m "🔄 Trigger Netlify deploy"
"C:\Program Files\Git\bin\git.exe" push origin main
```

### **Método 3: Webhook de Netlify**
```bash
# Si tienes el webhook URL de Netlify:
curl -X POST -d {} https://api.netlify.com/build_hooks/TU_WEBHOOK_ID
```

## 🛠️ **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Problema: "Build failed"**
1. **Revisar logs de error** en Netlify
2. **Verificar variables de entorno** en Netlify Settings
3. **Comprobar que el build command** es correcto:
   ```
   npm run build
   ```

### **Problema: "Deploy stuck"**
1. **Cancelar deploy** en Netlify
2. **Limpiar cache** en Netlify Settings
3. **Forzar nuevo deploy**

### **Problema: "Changes not visible"**
1. **Verificar que el commit** incluye los cambios
2. **Limpiar cache del navegador**
3. **Esperar 5-10 minutos** para propagación CDN

## 📋 **VERIFICACIÓN POST-DESPLIEGUE**

### **1. Verificar que los archivos estén en producción:**
- Visitar: https://plataforma-incentivos-mvp.netlify.app
- Abrir DevTools (F12)
- Revisar Network → Buscar archivos nuevos:
  - `bulkImportServiceFixed.js`
  - `BulkImportDebtsFixed.jsx`

### **2. Probar la funcionalidad:**
1. Iniciar sesión como empresa
2. Ir a Importación de Deudores
3. Probar subir archivo Excel
4. Verificar que el nuevo componente funcione

## 🚨 **SI NETLIFY NO RECIBE LOS CAMBIOS**

### **Verificar conexión Git-NETLIFY:**
1. **Netlify Settings** → **Build & deploy** → **Continuous Deployment**
2. **Verificar que esté conectado** al repositorio correcto
3. **Verificar la rama** de despliegue sea `main`

### **Reconectar repositorio:**
1. **Settings** → **Build & deploy** → **Continuous Deployment**
2. **Edit settings**
3. **Disconnect** y **reconnect** el repositorio
4. **Guardar y forzar deploy**

## 📞 **CONTACTO SOPORTE**

Si nada funciona:
1. **Netlify Status**: https://www.netlifystatus.com/
2. **Netlify Support**: https://www.netlify.com/support/

---

## ✅ **CHECKLIST FINAL**

- [ ] Cambios enviados a Git ✅
- [ ] Netlify conectado al repositorio
- [ ] Deploy automático en progreso/completado
- [ ] Funcionalidad probada en producción
- [ ] Usuarios notificados de los cambios

---

**Última actualización:** 2025-10-17
**Estado:** Esperando despliegue Netlify