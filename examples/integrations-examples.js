/**
 * Ejemplos de Uso - Integraciones Externas
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar
 * las integraciones externas de la plataforma.
 */

// ============================================
// WHATSAPP BUSINESS API
// ============================================

import { useWhatsApp } from '../src/hooks/integrations';

// Ejemplo 1: Enviar mensaje simple
async function ejemploWhatsAppSimple() {
  const { sendMessage, loading, error } = useWhatsApp();
  
  const resultado = await sendMessage(
    '56912345678',
    '¡Hola! Este es un mensaje de prueba.'
  );
  
  if (resultado.success) {
    console.log('✅ Mensaje enviado:', resultado.messageId);
  } else {
    console.error('❌ Error:', resultado.error);
  }
}

// Ejemplo 2: Enviar recordatorio de pago
async function ejemploRecordatorioPago() {
  const { sendPaymentReminder } = useWhatsApp();
  
  await sendPaymentReminder(
    '56912345678',
    'Juan Pérez',
    {
      amount: 50000,
      companyName: 'Banco Example'
    },
    5 // días hasta vencimiento
  );
}

// Ejemplo 3: Enviar confirmación de pago
async function ejemploConfirmacionPago() {
  const { sendPaymentConfirmation } = useWhatsApp();
  
  await sendPaymentConfirmation(
    '56912345678',
    'María González',
    {
      amount: 75000,
      debtName: 'Deuda Banco XYZ',
      incentiveEarned: 3750 // 5% de incentivo
    }
  );
}

// Ejemplo 4: Enviar notificación de nueva oferta
async function ejemploNuevaOferta() {
  const { sendNewOfferNotification } = useWhatsApp();
  
  await sendNewOfferNotification(
    '56912345678',
    'Carlos Muñoz',
    {
      type: 'Descuento especial del mes',
      discount: 25,
      incentive: 10000,
      expiryDate: '30/11/2025'
    }
  );
}

// Ejemplo 5: Envío masivo de mensajes
async function ejemploEnvioMasivo() {
  const { sendBulkMessages } = useWhatsApp();
  
  const destinatarios = [
    { phoneNumber: '56912345678', message: 'Mensaje para Juan' },
    { phoneNumber: '56987654321', message: 'Mensaje para María' },
    { phoneNumber: '56911111111', message: 'Mensaje para Carlos' }
  ];
  
  const resultado = await sendBulkMessages(destinatarios);
  
  console.log(`✅ Enviados: ${resultado.successful}`);
  console.log(`❌ Fallidos: ${resultado.failed}`);
}

// ============================================
// CRM INTEGRATIONS
// ============================================

import { useCRM } from '../src/hooks/integrations';

// Ejemplo 1: Verificar CRMs disponibles
function ejemploCRMsDisponibles() {
  const { availableCRMs, activeCRM } = useCRM();
  
  console.log('CRM activo:', activeCRM);
  console.log('CRMs disponibles:', availableCRMs);
  
  availableCRMs.forEach(crm => {
    console.log(`- ${crm.name}: ${crm.configured ? '✅ Configurado' : '❌ No configurado'}`);
  });
}

// Ejemplo 2: Cambiar CRM activo
function ejemploCambiarCRM() {
  const { changeCRM } = useCRM();
  
  changeCRM('salesforce'); // o 'hubspot' o 'zoho'
}

// Ejemplo 3: Sincronizar un deudor
async function ejemploSincronizarDeudor() {
  const { syncDebtor } = useCRM();
  
  const resultado = await syncDebtor({
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '56912345678',
    rut: '12345678-9',
    totalDebt: 500000
  });
  
  if (resultado.success) {
    console.log('✅ Deudor sincronizado');
    console.log('Acción:', resultado.action); // 'created' o 'updated'
    console.log('ID en CRM:', resultado.contactId);
  }
}

// Ejemplo 4: Sincronización masiva
async function ejemploSincronizacionMasiva() {
  const { syncDebtors } = useCRM();
  
  const deudores = [
    {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '56912345678',
      rut: '12345678-9',
      totalDebt: 500000
    },
    {
      firstName: 'María',
      lastName: 'González',
      email: 'maria@example.com',
      phone: '56987654321',
      rut: '98765432-1',
      totalDebt: 750000
    }
    // ... más deudores
  ];
  
  const resultado = await syncDebtors(deudores);
  
  console.log(`Total: ${resultado.total}`);
  console.log(`Exitosos: ${resultado.successful}`);
  console.log(`Fallidos: ${resultado.failed}`);
}

// Ejemplo 5: Importar deudas desde CRM
async function ejemploImportarDeudas() {
  const { importDebts } = useCRM();
  
  const resultado = await importDebts({
    status: 'Pending', // Solo deudas pendientes
    limit: 100
  });
  
  if (resultado.success) {
    console.log(`✅ Importadas ${resultado.debts.length} deudas`);
    resultado.debts.forEach(deuda => {
      console.log(`- ${deuda.name}: $${deuda.amount}`);
    });
  }
}

// Ejemplo 6: Sincronización completa
async function ejemploSincronizacionCompleta() {
  const { fullSync } = useCRM();
  
  const resultado = await fullSync({
    debtorFilters: {
      hasDebt: true // Solo deudores con deudas
    },
    debtFilters: {
      status: 'Pending'
    },
    includeHistory: true // Incluir historial de actividades
  });
  
  if (resultado.success) {
    console.log('✅ Sincronización completa exitosa');
    console.log(`Deudores: ${resultado.summary.debtors}`);
    console.log(`Deudas: ${resultado.summary.debts}`);
    console.log(`Actividades: ${resultado.summary.activities}`);
  }
}

// Ejemplo 7: Sincronización incremental
async function ejemploSincronizacionIncremental() {
  const { incrementalSync } = useCRM();
  
  // Sincronizar cambios de las últimas 24 horas
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const resultado = await incrementalSync(hace24Horas);
  
  if (resultado.success) {
    console.log('✅ Sincronización incremental exitosa');
    console.log(`Deudores actualizados: ${resultado.summary.updatedDebtors}`);
    console.log(`Deudas actualizadas: ${resultado.summary.updatedDebts}`);
  }
}

// Ejemplo 8: Registrar actividad en CRM
async function ejemploRegistrarActividad() {
  const { logActivity } = useCRM();
  
  await logActivity({
    contactId: 'contact-id-del-crm',
    subject: 'Llamada telefónica',
    description: 'Se contactó al deudor para negociar pago',
    type: 'Call',
    date: new Date().toISOString()
  });
}

// Ejemplo 9: Crear acuerdo de pago en CRM
async function ejemploCrearAcuerdo() {
  const { createPaymentAgreement } = useCRM();
  
  await createPaymentAgreement({
    contactId: 'contact-id-del-crm',
    debtorName: 'Juan Pérez',
    totalAmount: 500000,
    installments: 4,
    incentive: 25000,
    expectedCloseDate: '2025-12-31'
  });
}

// ============================================
// MERCADO PAGO
// ============================================

import { useMercadoPago } from '../src/hooks/integrations';

// Ejemplo 1: Verificar configuración
function ejemploVerificarMercadoPago() {
  const { isConfigured } = useMercadoPago();
  
  if (isConfigured) {
    console.log('✅ Mercado Pago está configurado');
  } else {
    console.log('❌ Mercado Pago NO está configurado');
  }
}

// Ejemplo 2: Crear pago para deuda completa
async function ejemploPagarDeudaCompleta() {
  const { createDebtPayment } = useMercadoPago();
  
  const deuda = {
    id: 'debt-123',
    amount: 50000,
    company_name: 'Banco Example'
  };
  
  const resultado = await createDebtPayment(deuda);
  
  if (resultado.success) {
    console.log('✅ Preferencia creada');
    console.log('ID:', resultado.preferenceId);
    console.log('Link de pago:', resultado.initPoint);
    
    // Redirigir al usuario al checkout
    window.location.href = resultado.initPoint;
  }
}

// Ejemplo 3: Crear pago para cuota de acuerdo
async function ejemploPagarCuota() {
  const { createInstallmentPaymentForAgreement } = useMercadoPago();
  
  const acuerdo = {
    id: 'agreement-456',
    debt_id: 'debt-123',
    total_amount: 200000,
    installments: 4
  };
  
  const numeroCuota = 1; // Primera cuota
  
  const resultado = await createInstallmentPaymentForAgreement(acuerdo, numeroCuota);
  
  if (resultado.success) {
    console.log('✅ Link de pago para cuota 1 generado');
    window.location.href = resultado.initPoint;
  }
}

// Ejemplo 4: Consultar información de un pago
async function ejemploConsultarPago() {
  const { getPayment } = useMercadoPago();
  
  const paymentId = '123456789';
  const resultado = await getPayment(paymentId);
  
  if (resultado.success) {
    const pago = resultado.payment;
    console.log('Estado:', pago.status);
    console.log('Monto:', pago.amount);
    console.log('Método:', pago.paymentMethod.id);
    console.log('Fecha aprobación:', pago.dateApproved);
  }
}

// Ejemplo 5: Verificar estado de pago
async function ejemploVerificarEstadoPago() {
  const { checkPaymentStatus } = useMercadoPago();
  
  const paymentId = '123456789';
  const resultado = await checkPaymentStatus(paymentId);
  
  // Muestra notificación automáticamente según el estado
}

// Ejemplo 6: Buscar pagos por filtros
async function ejemploBuscarPagos() {
  const { searchPayments } = useMercadoPago();
  
  const resultado = await searchPayments({
    externalReference: 'debt-123',
    beginDate: 'NOW-30DAYS',
    endDate: 'NOW',
    limit: 50
  });
  
  if (resultado.success) {
    console.log(`Encontrados ${resultado.payments.length} pagos`);
    resultado.payments.forEach(pago => {
      console.log(`- ${pago.id}: $${pago.amount} (${pago.status})`);
    });
  }
}

// Ejemplo 7: Obtener estadísticas de pagos
async function ejemploEstadisticasPagos() {
  const { getPaymentStats } = useMercadoPago();
  
  const resultado = await getPaymentStats(null, 'month'); // Último mes
  
  if (resultado.success) {
    const stats = resultado.stats;
    console.log(`Total transacciones: ${stats.totalTransactions}`);
    console.log(`Monto total: $${stats.totalAmount.toLocaleString()}`);
    console.log(`Monto promedio: $${stats.averageAmount.toLocaleString()}`);
  }
}

// Ejemplo 8: Crear reembolso
async function ejemploCrearReembolso() {
  const { createRefund } = useMercadoPago();
  
  const paymentId = '123456789';
  const montoReembolso = 25000; // Reembolso parcial
  
  const resultado = await createRefund(paymentId, montoReembolso);
  
  if (resultado.success) {
    console.log('✅ Reembolso creado');
    console.log('ID reembolso:', resultado.refundId);
    console.log('Monto:', resultado.amount);
  }
}

// ============================================
// COMPONENTES UI
// ============================================

import React from 'react';
import {
  IntegrationsPanel,
  MercadoPagoPayment,
  CRMSyncStatus,
  WhatsAppNotificationSettings
} from '../src/components/integrations';

// Ejemplo 1: Panel de administración de integraciones
function EjemploPanelAdmin() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Integraciones</h1>
      <IntegrationsPanel />
    </div>
  );
}

// Ejemplo 2: Componente de pago
function EjemploPago() {
  const deuda = {
    id: 'debt-123',
    amount: 50000,
    company_name: 'Banco Example',
    company_id: 'company-456'
  };
  
  const handlePaymentCreated = (result) => {
    console.log('Pago creado:', result);
    // Guardar en base de datos, mostrar confirmación, etc.
  };
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Pagar Deuda</h2>
      <MercadoPagoPayment 
        debt={deuda}
        onPaymentCreated={handlePaymentCreated}
      />
    </div>
  );
}

// Ejemplo 3: Estado de sincronización CRM
function EjemploSincronizacionCRM() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sincronización con CRM</h1>
      <CRMSyncStatus />
    </div>
  );
}

// Ejemplo 4: Configuración de notificaciones WhatsApp
function EjemploConfigWhatsApp() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Notificaciones</h1>
      <WhatsAppNotificationSettings />
    </div>
  );
}

// ============================================
// FLUJOS COMPLETOS
// ============================================

// Flujo completo: Pago con notificación
async function flujoCompletoPago(deuda, deudor) {
  const { createDebtPayment } = useMercadoPago();
  const { sendPaymentConfirmation } = useWhatsApp();
  const { logPayment } = useCRM();
  
  // 1. Crear preferencia de pago
  const pago = await createDebtPayment(deuda);
  
  if (!pago.success) {
    console.error('Error al crear pago');
    return;
  }
  
  // 2. Redirigir a Mercado Pago
  window.location.href = pago.initPoint;
  
  // 3. Después del webhook (cuando el pago es aprobado)
  // Este código se ejecutaría en el procesamiento del webhook
  
  // Enviar confirmación por WhatsApp
  await sendPaymentConfirmation(
    deudor.phone,
    deudor.name,
    {
      amount: deuda.amount,
      debtName: deuda.company_name,
      incentiveEarned: deuda.amount * 0.05
    }
  );
  
  // Registrar en CRM
  await logPayment({
    contactId: deudor.crmId,
    amount: deuda.amount,
    method: 'mercadopago',
    debtName: deuda.company_name,
    date: new Date().toISOString()
  });
}

// Flujo completo: Sincronización periódica
async function flujoSincronizacionPeriodica() {
  const { incrementalSync } = useCRM();
  
  // Configurar sincronización cada hora
  setInterval(async () => {
    console.log('🔄 Iniciando sincronización automática...');
    
    const lastSync = localStorage.getItem('lastCRMSync');
    const since = lastSync 
      ? new Date(lastSync)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Última semana
    
    const resultado = await incrementalSync(since);
    
    if (resultado.success) {
      console.log('✅ Sincronización automática completada');
      localStorage.setItem('lastCRMSync', new Date().toISOString());
    } else {
      console.error('❌ Error en sincronización automática');
    }
  }, 60 * 60 * 1000); // Cada hora
}

// Flujo completo: Notificación de recordatorio
async function flujoRecordatorioPago() {
  const { sendPaymentReminder } = useWhatsApp();
  
  // Buscar deudas con pagos próximos a vencer
  const deudas = await obtenerDeudasProximasVencer(); // Función personalizada
  
  for (const deuda of deudas) {
    const diasHastaVencimiento = calcularDiasHastaVencimiento(deuda.dueDate);
    
    if (diasHastaVencimiento <= 5 && diasHastaVencimiento > 0) {
      await sendPaymentReminder(
        deuda.debtor.phone,
        deuda.debtor.name,
        {
          amount: deuda.amount,
          companyName: deuda.company_name
        },
        diasHastaVencimiento
      );
      
      console.log(`✅ Recordatorio enviado a ${deuda.debtor.name}`);
      
      // Pausa de 1 segundo entre mensajes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  // WhatsApp
  ejemploWhatsAppSimple,
  ejemploRecordatorioPago,
  ejemploConfirmacionPago,
  ejemploNuevaOferta,
  ejemploEnvioMasivo,
  
  // CRM
  ejemploCRMsDisponibles,
  ejemploCambiarCRM,
  ejemploSincronizarDeudor,
  ejemploSincronizacionMasiva,
  ejemploImportarDeudas,
  ejemploSincronizacionCompleta,
  ejemploSincronizacionIncremental,
  ejemploRegistrarActividad,
  ejemploCrearAcuerdo,
  
  // Mercado Pago
  ejemploVerificarMercadoPago,
  ejemploPagarDeudaCompleta,
  ejemploPagarCuota,
  ejemploConsultarPago,
  ejemploVerificarEstadoPago,
  ejemploBuscarPagos,
  ejemploEstadisticasPagos,
  ejemploCrearReembolso,
  
  // Componentes
  EjemploPanelAdmin,
  EjemploPago,
  EjemploSincronizacionCRM,
  EjemploConfigWhatsApp,
  
  // Flujos
  flujoCompletoPago,
  flujoSincronizacionPeriodica,
  flujoRecordatorioPago
};
