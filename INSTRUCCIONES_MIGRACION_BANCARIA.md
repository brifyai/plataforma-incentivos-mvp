# 🚀 Instrucciones para Habilitar Configuración Bancaria

## Problema identificado
Las columnas `bank_account_info` y `mercadopago_beneficiary_id` no existen en la tabla `companies`.

## Solución: Aplicar migración manual

### Paso 1: Acceder al panel de Supabase
1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql
2. Inicia sesión con tu cuenta de Supabase

### Paso 2: Ejecutar SQL
Copia y pega estos comandos en el editor SQL:

```sql
-- Add bank_account_info column to store bank account details as JSON
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT NULL;

-- Add mercadopago_beneficiary_id column to store Mercado Pago beneficiary ID
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id TEXT DEFAULT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN companies.bank_account_info IS 'Bank account information stored as JSON: {bankName, accountType, accountNumber, accountHolderName, bankId}';
COMMENT ON COLUMN companies.mercadopago_beneficiary_id IS 'Mercado Pago beneficiary ID for automatic transfers';

-- Create index on mercadopago_beneficiary_id for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_mercadopago_beneficiary_id ON companies(mercadopago_beneficiary_id);

-- Create GIN index on bank_account_info for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_companies_bank_account_info_gin ON companies USING GIN (bank_account_info);
```

### Paso 3: Ejecutar
1. Haz clic en el botón **"Run"** (o **"Execute"**)
2. Espera a que se complete la ejecución
3. Deberías ver un mensaje de éxito

### Paso 4: Verificar
Para verificar que las columnas se crearon correctamente, ejecuta:

```sql
-- Verificar que las columnas existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('bank_account_info', 'mercadopago_beneficiary_id');
```

Deberías ver algo como:
```
column_name                  | data_type
-----------------------------+----------
bank_account_info            | jsonb
mercadopago_beneficiary_id   | text
```

### Paso 5: Probar
1. Vuelve a la aplicación de NexuPay
2. Intenta configurar la cuenta bancaria nuevamente
3. El botón "Confirmar" debería funcionar ahora

## ✅ Resultado esperado
- Las columnas se agregarán a la tabla `companies`
- La configuración bancaria funcionará correctamente
- Serás redirigido al dashboard después de configurar

## 🔍 Si tienes problemas
Si los comandos SQL no funcionan:
1. Asegúrate de tener permisos de administrador en el proyecto
2. Verifica que estás en el proyecto correcto: `wvluqdldygmgncqqjkow`
3. Contacta al administrador del sistema si no tienes permisos

## 📞 Soporte
Si necesitas ayuda adicional:
- Revisa la consola del navegador para mensajes de error
- Verifica que las columnas se hayan creado correctamente
- Confirma que puedes ver la empresa en la tabla `companies`