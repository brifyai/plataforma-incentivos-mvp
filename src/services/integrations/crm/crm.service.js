/**
 * Servicio Genérico de CRM
 * 
 * Este servicio proporciona una interfaz unificada para interactuar con diferentes
 * sistemas CRM (Salesforce, HubSpot, Zoho). Actúa como fachada para los adaptadores
 * específicos de cada plataforma.
 * 
 * @module CRMService
 */

import salesforceService from './salesforce.service';
import hubspotService from './hubspot.service';
import zohoService from './zoho.service';

class CRMService {
  constructor() {
    this.adapters = {
      salesforce: salesforceService,
      hubspot: hubspotService,
      zoho: zohoService
    };
    
    // CRM activo por defecto (puede configurarse desde la UI)
    this.activeCRM = this.detectActiveCRM();
  }

  /**
   * Detecta cuál CRM está configurado
   * @returns {string|null} Nombre del CRM activo
   */
  detectActiveCRM() {
    for (const [name, adapter] of Object.entries(this.adapters)) {
      if (adapter.isConfigured().configured) {
        console.log(`✅ CRM detectado: ${name}`);
        return name;
      }
    }
    console.warn('⚠️ No hay ningún CRM configurado');
    return null;
  }

  /**
   * Establece el CRM activo manualmente
   * @param {string} crmName - Nombre del CRM (salesforce, hubspot, zoho)
   */
  setActiveCRM(crmName) {
    if (this.adapters[crmName]) {
      this.activeCRM = crmName;
      console.log(`✅ CRM activo establecido: ${crmName}`);
    } else {
      throw new Error(`CRM no soportado: ${crmName}`);
    }
  }

  /**
   * Obtiene el adaptador del CRM activo
   * @returns {Object} Adaptador del CRM
   */
  getActiveAdapter() {
    if (!this.activeCRM) {
      throw new Error('No hay ningún CRM configurado o activo');
    }
    return this.adapters[this.activeCRM];
  }

  /**
   * Obtiene información sobre los CRMs disponibles
   * @returns {Object} Estado de configuración de cada CRM
   */
  getAvailableCRMs() {
    return Object.entries(this.adapters).map(([name, adapter]) => ({
      name,
      ...adapter.isConfigured(),
      active: name === this.activeCRM
    }));
  }

  // ==================== OPERACIONES UNIFICADAS ====================

  /**
   * Sincroniza un deudor con el CRM
   * @param {Object} debtorData - Datos del deudor
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async syncDebtor(debtorData) {
    const adapter = this.getActiveAdapter();
    return await adapter.syncContact(debtorData);
  }

  /**
   * Sincroniza múltiples deudores
   * @param {Array<Object>} debtorsData - Array de deudores
   * @returns {Promise<Object>} Resultado de la sincronización masiva
   */
  async syncDebtors(debtorsData) {
    const adapter = this.getActiveAdapter();
    return await adapter.syncContacts(debtorsData);
  }

  /**
   * Obtiene deudores desde el CRM
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de deudores
   */
  async getDebtors(filters = {}) {
    const adapter = this.getActiveAdapter();
    return await adapter.getContacts(filters);
  }

  /**
   * Obtiene un deudor específico por ID del CRM
   * @param {string} crmId - ID del contacto en el CRM
   * @returns {Promise<Object>} Datos del deudor
   */
  async getDebtor(crmId) {
    const adapter = this.getActiveAdapter();
    return await adapter.getContact(crmId);
  }

  /**
   * Importa deudas desde el CRM
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de deudas
   */
  async importDebts(filters = {}) {
    const adapter = this.getActiveAdapter();
    return await adapter.importDebts(filters);
  }

  /**
   * Actualiza el estado de una deuda en el CRM
   * @param {string} debtId - ID de la deuda en el CRM
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updateDebtStatus(debtId, updateData) {
    const adapter = this.getActiveAdapter();
    return await adapter.updateDebtStatus(debtId, updateData);
  }

  /**
   * Registra una actividad en el CRM (llamada, email, pago, etc.)
   * @param {Object} activityData - Datos de la actividad
   * @returns {Promise<Object>} Resultado del registro
   */
  async logActivity(activityData) {
    const adapter = this.getActiveAdapter();
    return await adapter.logActivity(activityData);
  }

  /**
   * Registra un pago en el CRM
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Resultado del registro
   */
  async logPayment(paymentData) {
    const adapter = this.getActiveAdapter();
    return await adapter.logPayment(paymentData);
  }

  /**
   * Crea un acuerdo de pago en el CRM
   * @param {Object} agreementData - Datos del acuerdo
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createPaymentAgreement(agreementData) {
    const adapter = this.getActiveAdapter();
    return await adapter.createPaymentAgreement(agreementData);
  }

  /**
   * Actualiza un acuerdo de pago en el CRM
   * @param {string} agreementId - ID del acuerdo en el CRM
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const adapter = this.getActiveAdapter();
    return await adapter.updatePaymentAgreement(agreementId, updateData);
  }

  /**
   * Obtiene el historial de actividades de un deudor
   * @param {string} debtorId - ID del deudor
   * @returns {Promise<Array>} Lista de actividades
   */
  async getDebtorHistory(debtorId) {
    const adapter = this.getActiveAdapter();
    return await adapter.getContactHistory(debtorId);
  }

  /**
   * Busca deudores en el CRM
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Array>} Resultados de búsqueda
   */
  async searchDebtors(query) {
    const adapter = this.getActiveAdapter();
    return await adapter.searchContacts(query);
  }

  // ==================== OPERACIONES DE SINCRONIZACIÓN ====================

  /**
   * Sincronización completa: importa todos los deudores y deudas desde el CRM
   * @param {Object} options - Opciones de sincronización
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async fullSync(options = {}) {
    try {
      console.log('🔄 Iniciando sincronización completa con CRM...');
      
      const adapter = this.getActiveAdapter();
      
      // 1. Importar contactos/deudores
      console.log('📥 Importando deudores...');
      const debtors = await adapter.getContacts(options.debtorFilters || {});
      
      // 2. Importar deudas
      console.log('📥 Importando deudas...');
      const debts = await adapter.importDebts(options.debtFilters || {});
      
      // 3. Importar historial si está habilitado
      let activities = [];
      if (options.includeHistory) {
        console.log('📥 Importando historial de actividades...');
        activities = await adapter.getActivities(options.historyFilters || {});
      }
      
      console.log('✅ Sincronización completa finalizada');
      
      return {
        success: true,
        summary: {
          debtors: debtors.length,
          debts: debts.length,
          activities: activities.length
        },
        data: {
          debtors,
          debts,
          activities
        }
      };
    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincronización incremental: solo actualiza cambios recientes
   * @param {Date} since - Fecha desde la cual buscar cambios
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async incrementalSync(since) {
    try {
      console.log('🔄 Iniciando sincronización incremental...');
      
      const adapter = this.getActiveAdapter();
      
      // Obtener registros modificados desde la fecha indicada
      const changes = await adapter.getRecentChanges(since);
      
      console.log('✅ Sincronización incremental finalizada');
      
      return {
        success: true,
        summary: {
          updatedDebtors: changes.debtors?.length || 0,
          updatedDebts: changes.debts?.length || 0,
          newActivities: changes.activities?.length || 0
        },
        data: changes
      };
    } catch (error) {
      console.error('❌ Error en sincronización incremental:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instancia única (singleton)
const crmService = new CRMService();
export default crmService;
