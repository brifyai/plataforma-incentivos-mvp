# 🚨 **INSTRUCCIONES ULTRA SIMPLIFICADAS**

## ⚠️ **PROBLEMA ACTUAL**
Las columnas `client_id` y `corporate_client_id` AÚN NO EXISTEN en la base de datos.

## ✅ **SOLUCIÓN INMEDIATA**

### **PASO 1: Ir a Supabase**
1. Abrir navegador: https://app.supabase.com
2. Iniciar sesión
3. Seleccionar proyecto: **wvluqdldygmgncqqjkow**
4. Hacer clic en **"SQL Editor"** (menú lateral izquierdo)

### **PASO 2: Copiar y Ejecutar SQL**
1. Hacer clic en **"New query"**
2. Copiar **ESTE SQL EXACTO** (todo el contenido):

```sql
-- Add client_id column to debts table
ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);

-- Add corporate_client_id column to clients table  
ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);

-- Create indexes
CREATE INDEX idx_debts_client_id ON debts(client_id);
CREATE INDEX idx_clients_corporate_client_id ON clients(corporate_client_id);
```

3. Pegar en el editor SQL
4. Hacer clic en **"Run"**
5. Esperar mensaje "Success"

### **PASO 3: Verificar**
1. Volver a la terminal
2. Ejecutar: `node scripts/check-client-debt-structure.cjs`
3. Debe mostrar "✅ SÍ" para ambas columnas

### **PASO 4: Probar**
1. Recargar: http://localhost:3002
2. Iniciar sesión como empresa
3. Ir a "Clientes"
4. Agregar cliente corporativo
5. ✅ Debe funcionar sin errores

## 🔥 **SI HAY ERRORES**
- **ERROR de columna**: El SQL no se ejecutó correctamente. Repetir PASO 2
- **ERROR de permisos**: Asegurarse de tener permisos de administrador en Supabase
- **ERROR de sintaxis**: Copiar exactamente el SQL de arriba, sin modificar nada

## 📞 **CONTACTO**
Si después de 3 intentos no funciona, el problema puede ser:
1. Permisos insuficientes en Supabase
2. Conexión a la base de datos incorrecta
3. Configuración del proyecto

**En ese caso, contactar al administrador de Supabase.**