# 🛡️ Guía de Implementación: Bloqueo de Operaciones sin Verificación Aprobada

## 📋 Resumen

Esta guía explica cómo implementar el sistema de bloqueo para asegurar que las empresas no puedan operar hasta que el administrador apruebe su verificación.

## 🎯 Objetivo

Impedir que las empresas sin verificación aprobada puedan acceder a funcionalidades críticas del sistema, como:
- Importación masiva de deudas
- Creación de campañas
- Envío de mensajes
- Gestión de propuestas
- Transferencias de dinero
- Configuración de IA

## 🔧 Componentes Implementados

### 1. **Middleware de Verificación** (`src/middleware/verificationGuard.jsx`)

#### Funciones clave:

```javascript
// Verifica si la empresa puede operar
export const canCompanyOperate = (verification) => {
  return verification?.status === VERIFICATION_STATUS.APPROVED;
};

// Verifica si tiene acceso básico
export const hasBasicAccess = (verification) => {
  return verification && [
    VERIFICATION_STATUS.PENDING,
    VERIFICATION_STATUS.SUBMITTED,
    VERIFICATION_STATUS.UNDER_REVIEW,
    VERIFICATION_STATUS.APPROVED
  ].includes(verification.status);
};

// Componente de bloqueo
export const VerificationBlock = ({ verification, children, fallback = null }) => {
  if (!canCompanyOperate(verification)) {
    return fallback || <MensajeDeBloqueo />;
  }
  return children;
};
```

## 📝 Implementación en Páginas Críticas

### Paso 1: Importar el guard

```javascript
import { VerificationBlock } from '../../middleware/verificationGuard.jsx';
import { getCompanyVerification } from '../../services/verificationService';
```

### Paso 2: Agregar estado de verificación

```javascript
const [verification, setVerification] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadVerification = async () => {
    try {
      const companyId = profile?.company?.id;
      if (!companyId) return;

      const { verification: data } = await getCompanyVerification(companyId);
      setVerification(data);
    } catch (error) {
      console.error('Error loading verification:', error);
    } finally {
      setLoading(false);
    }
  };

  loadVerification();
}, [profile?.company?.id]);
```

### Paso 3: Envolver el contenido con VerificationBlock

```javascript
return (
  <VerificationBlock verification={verification}>
    {/* Tu contenido existente */}
  </VerificationBlock>
);
```

## 🚀 Páginas que Necesitan Bloqueo

### 1. **Funcionalidades Críticas** (Requieren aprobación completa)

- ✅ `BulkImportPage.jsx` - Importación masiva de deudas
- ⏳ `CampaignsPage.jsx` - Creación de campañas
- ⏳ `NewMessagePage.jsx` - Envío de mensajes
- ⏳ `ProposalsPage.jsx` - Gestión de propuestas
- ⏳ `TransferDashboard.jsx` - Transferencias
- ⏳ `AIDashboardPage.jsx` - Configuración de IA

### 2. **Funcionalidades Básicas** (Permitidas con verificación pendiente)

- ⏳ `CompanyDashboard.jsx` - Dashboard principal
- ⏳ `ProfilePage.jsx` - Perfil de empresa
- ⏳ `CompanyVerificationPage.jsx` - Página de verificación

## 📊 Estados de Verificación y Mensajes

### 🟢 **APPROVED** (Aprobado)
- ✅ Puede operar sin restricciones
- ✅ Acceso a todas las funcionalidades

### 🟡 **PENDING** (Pendiente)
- ⚠️ Puede acceder a funciones básicas
- ❌ No puede operar funcionalidades críticas
- 📝 Mensaje: "Debe subir todos los documentos requeridos para poder operar."

### 🟡 **SUBMITTED / UNDER_REVIEW** (Enviado / En revisión)
- ⚠️ Puede acceder a funciones básicas
- ❌ No puede operar funcionalidades críticas
- 📝 Mensaje: "Su verificación está siendo revisada. Recibirá una notificación cuando sea aprobada."

### 🔴 **REJECTED / NEEDS_CORRECTIONS** (Rechazado)
- ❌ Acceso limitado solo a verificación
- 📝 Mensaje: "Su verificación fue rechazada. Contacte al administrador para más información."

## 🔥 Ejemplo Completo de Implementación

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VerificationBlock } from '../../middleware/verificationGuard.jsx';
import { getCompanyVerification } from '../../services/verificationService';

const CriticalPage = () => {
  const { profile } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const companyId = profile?.company?.id;
        if (!companyId) return;

        const { verification: data } = await getCompanyVerification(companyId);
        setVerification(data);
      } catch (error) {
        console.error('Error loading verification:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVerification();
  }, [profile?.company?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <VerificationBlock 
      verification={verification}
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Funcionalidad Bloqueada
          </h3>
          <p className="text-yellow-700">
            Su empresa debe estar verificada para acceder a esta función.
          </p>
        </div>
      }
    >
      {/* Contenido de la página */}
      <div>
        <h1>Funcionalidad Crítica</h1>
        {/* ... resto del contenido ... */}
      </div>
    </VerificationBlock>
  );
};

export default CriticalPage;
```

## 🎨 Personalización de Mensajes

Puedes personalizar el mensaje de bloqueo para cada página:

```javascript
<VerificationBlock 
  verification={verification}
  fallback={
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        🚫 Importación Masiva Bloqueada
      </h3>
      <p className="text-red-700">
        Su empresa debe estar verificada y aprobada para importar deudas masivamente.
        Complete el proceso de verificación para continuar.
      </p>
      <button 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => window.location.href = '/empresa/verificacion'}
      >
        Ir a Verificación
      </button>
    </div>
  }
>
  {/* Contenido */}
</VerificationBlock>
```

## 📋 Checklist de Implementación

### ✅ Para cada página crítica:

1. [ ] Importar `VerificationBlock` y `getCompanyVerification`
2. [ ] Agregar estado para `verification` y `loading`
3. [ ] Implementar `useEffect` para cargar verificación
4. [ ] Envolver contenido con `VerificationBlock`
5. [ ] Probar con diferentes estados de verificación
6. [ ] Verificar que el mensaje sea claro y útil

### ✅ Verificación final:

1. [ ] Las empresas no aprobadas no pueden acceder a funciones críticas
2. [ ] Los mensajes son claros y orientan al usuario
3. [ ] El rendimiento no se ve afectado
4. [ ] No hay errores en la consola
5. [ ] La experiencia de usuario es fluida

## 🔍 Pruebas Recomendadas

### 1. **Prueba con empresa no verificada**
- Accede a una página crítica
- Verifica que se muestre el mensaje de bloqueo
- Confirma que no puedes realizar operaciones

### 2. **Prueba con empresa en revisión**
- Sube documentos pero no envíes a revisión
- Verifica el mensaje correspondiente
- Envía a revisión y verifica el cambio de mensaje

### 3. **Prueba con empresa aprobada**
- Aprobación manual por administrador
- Verifica acceso completo a funcionalidades
- Confirma que no haya bloqueos

## 🚨 Consideraciones de Seguridad

1. **Validación del lado del servidor**: Además del bloqueo frontend, implementa validación backend
2. **Logs de acceso**: Registra intentos de acceso no autorizados
3. **Notificaciones**: Informa al administrador sobre accesos bloqueados sospechosos
4. **Rate limiting**: Limita intentos de bypass del sistema

## 📞 Soporte

Si tienes problemas durante la implementación:

1. Revisa la consola del navegador
2. Verifica que el `companyId` sea correcto
3. Confirma que el servicio de verificación esté funcionando
4. Verifica las políticas RLS en Supabase

---

Esta implementación asegura que solo las empresas verificadas y aprobadas puedan operar funcionalidades críticas, manteniendo la integridad y seguridad del sistema.