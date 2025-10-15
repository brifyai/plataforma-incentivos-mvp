# Análisis de Arquitectura de Bases de Datos - NexuPay

## Resumen Ejecutivo

Después de un análisis exhaustivo del código fuente de NexuPay, he identificado la arquitectura de bases de datos utilizada por los tres portales (personas, empresas, administrador). **Buenas noticias: todos los portales comparten la misma base de datos production de Supabase**, no hay bases de datos separadas ni datos demo en producción.

## 🏗️ Arquitectura General

### Configuración Centralizada
- **Base de Datos Única**: Todos los portales utilizan la misma instancia de Supabase
- **Configuración**: [`src/config/supabase.js`](src/config/supabase.js:34) - Cliente único de Supabase
- **Variables de Entorno**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- **Schema**: `public` para todos los portales

### Control de Acceso
- **Row Level Security (RLS)**: Implementado en Supabase para segregación de datos
- **Roles**: `debtor`, `company`, `admin`, `god_mode`
- **Autenticación**: Centralizada a través de Supabase Auth

## 📊 Tablas Compartidas

### Tablas Principales
Todas las tablas son compartidas entre los tres portales con acceso controlado por RLS:

1. **`users`** - Usuarios del sistema
   - Portal Personas: Acceso a sus propios datos
   - Portal Empresas: Acceso a deudores asociados
   - Portal Admin: Acceso completo

2. **`companies`** - Empresas de cobranza
   - Portal Personas: Acceso de solo lectura a sus empresas
   - Portal Empresas: Acceso a su propia empresa
   - Portal Admin: Acceso completo

3. **`debts`** - Registros de deudas
   - Portal Personas: `user_id` = su ID
   - Portal Empresas: `company_id` = su ID o `client_id` de sus clientes
   - Portal Admin: Acceso completo

4. **`offers`** - Ofertas de pago
   - Portal Personas: `user_id` = su ID o `user_id IS NULL`
   - Portal Empresas: `company_id` = su ID
   - Portal Admin: Acceso completo

5. **`agreements`** - Acuerdos de pago
   - Portal Personas: `user_id` = su ID
   - Portal Empresas: `company_id` = su ID
   - Portal Admin: Acceso completo

6. **`payments`** - Pagos realizados
   - Portal Personas: `user_id` = su ID
   - Portal Empresas: `company_id` = su ID
   - Portal Admin: Acceso completo

## 🔍 Análisis por Portal

### Portal Personas (Deudores)
**Archivo**: [`src/pages/debtor/DebtorDashboard.jsx`](src/pages/debtor/DebtorDashboard.jsx)

**Queries utilizadas**:
```javascript
// Desde useDebts.js
getUserDebts(user.id) // SELECT * FROM debts WHERE user_id = [user_id]

// Desde useOffers.js  
getUserOffers(user.id) // SELECT * FROM offers WHERE user_id = [user_id] OR user_id IS NULL

// Desde useAgreements.js
getUserAgreements(user.id) // SELECT * FROM agreements WHERE user_id = [user_id]

// Desde usePayments.js
getUserPayments(user.id) // SELECT * FROM payments WHERE user_id = [user_id]
```

### Portal Empresas
**Archivo**: [`src/pages/company/CompanyDashboard.jsx`](src/pages/company/CompanyDashboard.jsx)

**Queries utilizadas**:
```javascript
// Desde useDebts.js
getCompanyDebts(profile.company.id) // SELECT * FROM debts WHERE company_id = [company_id]

// Desde useOffers.js
getCompanyOffers(profile.company.id) // SELECT * FROM offers WHERE company_id = [company_id]

// Desde useAgreements.js
getCompanyAgreements(profile.company.id) // SELECT * FROM agreements WHERE company_id = [company_id]

// Desde usePayments.js
getCompanyPayments(profile.company.id) // SELECT * FROM payments WHERE company_id = [company_id]
```

### Portal Administrador
**Archivo**: [`src/pages/admin/AdminDashboard.jsx`](src/pages/admin/AdminDashboard.jsx)

**Queries utilizadas**:
```javascript
// Acceso completo a todas las tablas
getAllUsers() // SELECT * FROM users
getAllCompanies() // SELECT * FROM companies
getPaymentStats() // SELECT * FROM payments WHERE status = 'completed'
getAdminAnalytics() // Queries agregadas a todas las tablas
```

## 🚫 NO Hay Bases de Datos Demo

### Verificación Realizada
1. **Búsqueda de referencias demo**: Busqué en todo el código base referencias a "demo", "test", "mock", "localhost" en contexto de bases de datos
2. **Configuración única**: Solo hay una configuración de Supabase en todo el sistema
3. **Variables de entorno**: No hay variables de entorno condicionales por ambiente
4. **Hardcoding**: No hay hardcoded URLs o conexiones a diferentes bases de datos

### Únicas Referencias a "Demo"
Las únicas referencias a "demo" encontradas son:
- **Datos mock para desarrollo**: En [`src/services/bankTransferService.js`](src/services/bankTransferService.js:64) para simular respuestas de Mercado Pago
- **Usuarios mock**: En [`src/services/authService.js`](src/services/authService.js:524) para compatibilidad con sistema anterior
- **Testing**: En archivos de prueba como [`src/modules/ai-negotiation/utils/testAI.js`](src/modules/ai-negotiation/utils/testAI.js:6)

**Ninguna de estas afecta la base de datos production**.

## 🔐 Mecanismos de Segregación de Datos

### Row Level Security (RLS)
La segregación de datos se implementa a través de políticas RLS en Supabase:

```sql
-- Ejemplo de política RLS para tabla debts
CREATE POLICY "Users can view their own debts" ON debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view their debts" ON debts  
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND user_id = auth.uid()
    )
  );
```

### Filtrado a Nivel de Aplicación
Además del RLS, la aplicación implementa filtrado adicional:

```javascript
// En databaseService.js - getCompanyDebts
if (clientIds.length > 0) {
  query = query.or(`client_id.in.(${clientIds.join(',')}),company_id.eq.${companyId}`);
} else {
  query = query.eq('company_id', companyId);
}
```

## 📈 Flujo de Datos Consistente

### Diagrama de Flujo
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Portal        │    │   Portal        │    │   Portal        │
│   Personas      │    │   Empresas      │    │   Admin         │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │  Supabase Production      │
                    │  (Base de Datos Única)   │
                    └───────────────────────────┘
```

### Consistencia Garantizada
1. **Misma fuente de datos**: Todos leen/escriben en las mismas tablas
2. **Transacciones ACID**: Supabase garantiza integridad transaccional
3. **Actualizaciones en tiempo real**: Todos los portales usan suscripciones realtime
4. **Validación centralizada**: Mismas reglas de negocio para todos

## 🎯 Conclusión

### ✅ Hallazgos Positivos
1. **Arquitectura unificada**: Todos los portales comparten la misma base de datos
2. **Sin datos demo en producción**: No hay bases de datos separadas ni datos de prueba
3. **Segregación proper**: RLS y filtrado a nivel de aplicación garantizan acceso correcto
4. **Consistencia de datos**: Todos ven los mismos datos en tiempo real

### 🔍 Áreas Monitoreadas
1. **Mock data**: Solo para desarrollo/testing, no afecta producción
2. **Fallbacks**: Algunos servicios tienen fallbacks mock para desarrollo
3. **Compatibilidad**: Código legacy con mock sessions para compatibilidad

### 📋 Recomendaciones
1. **Mantener arquitectura actual**: Está bien diseñada y funciona correctamente
2. **Documentar RLS**: Considerar documentar las políticas RLS existentes
3. **Monitorear rendimiento**: Observar queries complejas en getAdminAnalytics
4. **Limpiar legacy**: Considerar remover código mock de compatibilidad cuando sea posible

## 📁 Archivos Clave Analizados

- [`src/config/supabase.js`](src/config/supabase.js) - Configuración única
- [`src/services/databaseService.js`](src/services/databaseService.js) - Todas las queries
- [`src/hooks/useDebts.js`](src/hooks/useDebts.js) - Lógica de deudas
- [`src/hooks/useOffers.js`](src/hooks/useOffers.js) - Lógica de ofertas  
- [`src/hooks/useAgreements.js`](src/hooks/useAgreements.js) - Lógica de acuerdos
- [`src/hooks/usePayments.js`](src/hooks/usePayments.js) - Lógica de pagos
- [`src/pages/debtor/DebtorDashboard.jsx`](src/pages/debtor/DebtorDashboard.jsx) - Portal personas
- [`src/pages/company/CompanyDashboard.jsx`](src/pages/company/CompanyDashboard.jsx) - Portal empresas
- [`src/pages/admin/AdminDashboard.jsx`](src/pages/admin/AdminDashboard.jsx) - Portal admin

---

**Estado**: ✅ **CONFIRMADO** - Todos los portales usan la misma base de datos production sin datos demo.