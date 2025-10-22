# Estructura Jerárquica del Sistema NexuPay

## 📋 Visión General

El sistema NexuPay tiene una estructura jerárquica clara que es fundamental entender para evitar confusiones:

```
Usuario → Empresa → Empresa Corporativa → Clientes → Deudas
```

## 🔍 Nivel 1: Usuario (`users`)

Es la entidad base del sistema que representa a la persona que accede a la plataforma.

**Campos clave:**
- `id`: UUID único del usuario
- `email`: Correo electrónico (único)
- `role`: 'company', 'admin', 'debtor'
- `is_active`: Estado del usuario

**Relación:** Un usuario puede tener una empresa (si role = 'company')

---

## 🏢 Nivel 2: Empresa (`companies`)

Es la entidad legal/empresarial registrada en el sistema. Es la **PRIMERA** entidad empresarial.

**Campos clave:**
- `id`: UUID único de la empresa
- `user_id`: FK → users.id (dueño de la empresa)
- `business_name`: Nombre legal de la empresa
- `contact_email`: Email de contacto
- `validation_status`: 'pending', 'validated', 'rejected'
- `rut`: RUT de la empresa

**Relación:** Una empresa SIEMPRE tiene una empresa corporativa asociada

---

## 🏦 Nivel 3: Empresa Corporativa (`corporate_clients`)

Es la representación de la empresa como **CLIENTE CORPORATIVO** del sistema NexuPay. Es la **SEGUNDA** entidad empresarial, derivada de la primera.

**Propósito:** Representa a la empresa como cliente que puede gestionar deudores y cobranzas.

**Campos clave:**
- `id`: UUID único del cliente corporativo
- `company_id`: FK → companies.id (empresa original)
- `contact_email`: Email de contacto del cliente corporativo
- `contact_phone`: Teléfono de contacto
- `rut`: RUT del cliente corporativo
- `industry`: Tipo/industria del cliente corporativo

**Relación:** Una empresa corporativa puede tener múltiples clientes

---

## 👥 Nivel 4: Clientes (`clients`)

Son los deudores que pertenecen a una empresa corporativa.

**Campos clave:**
- `id`: UUID único del cliente
- `corporate_client_id`: FK → corporate_clients.id
- `name`: Nombre del cliente/deudor
- `email`: Email del cliente
- `status`: Estado del cliente

**Relación:** Un cliente puede tener múltiples deudas

---

## 💰 Nivel 5: Deudas (`debts`)

Son las deudas específicas de cada cliente.

**Campos clave:**
- `id`: UUID único de la deuda
- `company_id`: FK → companies.id (empresa propietaria)
- `client_id`: FK → clients.id (cliente deudor)
- `amount`: Monto de la deuda
- `status`: Estado de la deuda

---

## 🔄 Flujo Jerárquico

1. **Registro:** Usuario crea cuenta
2. **Creación de Empresa:** Usuario registra su empresa (`companies`)
3. **Auto-creación de Cliente Corporativo:** Sistema crea automáticamente `corporate_clients`
4. **Gestión de Clientes:** Empresa corporativa gestiona sus deudores (`clients`)
5. **Registro de Deudas:** Se registran las deudas de cada cliente (`debts`)

## 🚨 Puntos Clave para Evitar Confusión

### ✅ Lo que SÍ es:
- `companies` = La empresa real/legal del usuario
- `corporate_clients` = La empresa como cliente del sistema NexuPay
- Siempre existe 1:1 entre `companies` y `corporate_clients`

### ❌ Lo que NO es:
- No son entidades intercambiables
- No es lo mismo `companies` que `corporate_clients`
- No puede existir una sin la otra

## 📊 Ejemplo Práctico

```
Usuario: empresa@nexupay.cl
  ↓
Empresa: "NexuPay Cobranzas SpA" (companies)
  - ID: e27b3162-e7db-4b00-bc60-32abea7e171b
  - Email: empresa@nexupay.cl
  - RUT: 76.123.456-7
  ↓
Empresa Corporativa: "NexuPay Cobranzas" (corporate_clients)
  - ID: 5f15d831-3a51-4288-a363-d6fb2b2dd1ef
  - Company ID: e27b3162-e7db-4b00-bc60-32abea7e171b
  - Industria: 🏢 Acreedor Directo
  ↓
Clientes: ["María Concha", "Juan Pérez"] (clients)
  ↓
Deudas: [$100.000, $50.000] (debts)
```

## 🔧 Implementación en Código

### Funciones Clave:

```javascript
// Obtener perfil de empresa (Nivel 2)
getCompanyProfile(userId) → companies

// Obtener cliente corporativo (Nivel 3)
getCorporateClient(companyId) → corporate_clients

// Obtener clientes de la empresa corporativa (Nivel 4)
getClients(corporateClientId) → clients

// Obtener deudas de la empresa (Nivel 5)
getCompanyDebts(companyId) → debts
```

## 🎯 Reglas de Negocio

1. **Todo usuario 'company' debe tener una empresa**
2. **Toda empresa debe tener un cliente corporativo**
3. **Todo cliente debe pertenecer a un cliente corporativo**
4. **Toda deuda debe pertenecer a una empresa y un cliente**

Esta estructura garantiza claridad y evita confusiones en el sistema.