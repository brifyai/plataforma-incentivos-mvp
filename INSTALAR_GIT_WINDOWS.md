# 🪟 INSTALAR GIT EN WINDOWS - INSTRUCCIONES ESPECÍFICAS

## 🚨 **PROBLEMAS IDENTIFICADOS**
- Git no está instalado en el sistema
- Ruta incorrecta en el comando cd (doble directorio)
- Comandos de Git no reconocidos por PowerShell

## 📋 **SOLUCIÓN PASO A PASO**

### **PASO 1: INSTALAR GIT**

#### **Opción A: Descargar Git (Recomendado)**
1. Ir a: https://git-scm.com/download/win
2. Descargar "Git for Windows Setup"
3. Ejecutar el instalador
4. En las opciones de instalación:
   - ✅ Marcar "Git Bash Here"
   - ✅ Marcar "Git GUI Here"
   - ✅ Usar "Git from the command line and also from 3rd-party software"
5. Finalizar instalación

#### **Opción B: Usar Winget (Windows 10/11)**
```powershell
winget install --id Git.Git -e --source winget
```

### **PASO 2: VERIFICAR INSTALACIÓN**
```powershell
# Abrir NUEVA ventana de PowerShell después de instalar
git --version
```

### **PASO 3: CONFIGURAR GIT**
```powershell
git config --global user.name "Camilo"
git config --global user.email "brifyaimaster@gmail.com"
```

### **PASO 4: NAVEGAR AL DIRECTORIO CORRECTO**
```powershell
# El directorio correcto es:
cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"

# Verificar que estás en el lugar correcto:
pwd
```

### **PASO 5: INICIALIZAR REPOSITORIO (si es necesario)**
```powershell
# Si el directorio ya es un repositorio Git:
git status

# Si no es un repositorio:
git init
git remote add origin <URL_DEL_REPOSITORIO>
```

### **PASO 6: AGREGAR CAMBIOS**
```powershell
git add .
```

### **PASO 7: CONFIRMAR CAMBIOS**
```powershell
git commit -m "🔧 Solución definitiva importación Excel deudores

✅ Problemas resueltos:
- Corregidas políticas RLS para importación masiva
- Añadidos campos faltantes a tabla debts
- Implementado servicio robusto con reintentos automáticos
- Creado componente mejorado con flujo por pasos

🛠️ Archivos modificados/creados:
- src/services/bulkImportServiceFixed.js (nuevo)
- src/components/company/BulkImportDebtsFixed.jsx (nuevo)
- src/pages/company/BulkImportPage.jsx (actualizado)
- supabase-migrations/022_fix_bulk_import_permissions.sql (nuevo)
- GUIA_RAPIDA_SOLUCION.md (nuevo)
- IMPLEMENTACION_COMPLETADA.md (nuevo)"
```

### **PASO 8: ENVIAR A REPOSITORIO REMOTO**
```powershell
git push origin main
# o si usas otra rama:
git push origin <nombre-rama>
```

## 🔧 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Si Git no se reconoce después de instalar:**
1. Cerrar todas las ventanas de PowerShell
2. Abrir nueva ventana de PowerShell
3. Ejecutar: `git --version`

### **Si el comando cd no encuentra la ruta:**
```powershell
# Usar comillas para rutas con espacios:
cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"

# O navegar paso a paso:
cd C:\Users\admin\Desktop\AIntelligence\Cobranzas
cd plataforma-incentivos-mvp
```

### **Si hay errores de permisos:**
```powershell
# Ejecutar PowerShell como Administrador
# Botón derecho > "Ejecutar como administrador"
```

## 📁 **VERIFICACIÓN FINAL**

Después de instalar Git, verificar:

### **1. Versión de Git:**
```powershell
git --version
# Debe mostrar algo como: git version 2.41.0.windows.1
```

### **2. Configuración:**
```powershell
git config --list
# Debe mostrar user.name y user.email
```

### **3. Estado del Repositorio:**
```powershell
git status
# Debe mostrar los archivos modificados/creados
```

## 🎯 **RESUMEN DE COMANDOS CORRECTOS**

```powershell
# 1. Instalar Git (descargar desde git-scm.com)
# 2. Abrir nueva ventana PowerShell

# 3. Configurar Git
git config --global user.name "Camilo"
git config --global user.email "brifyaimaster@gmail.com"

# 4. Navegar al directorio correcto
cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"

# 5. Agregar cambios
git add .

# 6. Confirmar cambios
git commit -m "🔧 Solución definitiva importación Excel deudores"

# 7. Enviar a repositorio
git push origin main
```

## 🚀 **ALTERNATIVA: USAR GITHUB DESKTOP**

Si tienes problemas con la línea de comandos:

1. **Instalar GitHub Desktop** desde: https://desktop.github.com/
2. **Clonar el repositorio** o abrir carpeta existente
3. **Arrastrar archivos modificados** a la interfaz
4. **Hacer commit** desde la interfaz gráfica
5. **Push** con el botón "Publish repository"

## 📞 **SOPORTE**

Si persisten los problemas:

1. **Reiniciar el equipo** después de instalar Git
2. **Verificar la instalación** en "Programas y características"
3. **Usar Git Bash** (incluido con Git for Windows)
4. **Contactar al administrador** si hay restricciones de permisos

---

## ✅ **LISTO PARA PROCEDER**

Con estas instrucciones, debería poder:
1. ✅ Instalar Git correctamente
2. ✅ Configurar usuario y email
3. ✅ Navegar al directorio correcto
4. ✅ Enviar todos los cambios a Git
5. ✅ Verificar que todo esté en el repositorio

**La solución de importación Excel está completa y lista para enviar a Git.**