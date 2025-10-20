/**
 * Adaptador de Zoho CRM
 * 
 * Este servicio implementa la integración con Zoho CRM utilizando su API REST v3.
 * Requiere configuración de Access Token y API Domain.
 * 
 * @module ZohoService
 */

import axios from 'axios';

class ZohoService {
  constructor() {
    this.accessToken = import.meta.env.VITE_ZOHO_ACCESS_TOKEN;
    this.apiDomain = import.meta.env.VITE_ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
    this.apiVersion = 'v3';
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!this.accessToken;
    return {
      configured,
      message: configured 
        ? 'Zoho CRM configurado correctamente'
        : 'Falta credencial de Zoho (ACCESS_TOKEN)'
    };
  }

  /**
   * Realiza una petición a la API de Zoho
   */
  async makeRequest(method, module, action = '', data = null, params = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('Zoho CRM no está configurado');
      }

      const endpoint = action 
        ? `${this.apiDomain}/crm/${this.apiVersion}/${module}/${action}`
        : `${this.apiDomain}/crm/${this.apiVersion}/${module}`;

      const config = {
        method,
        url: endpoint,
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      if (params) {
        config.params = params;
      }

      const response = await axios(config);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ Error en Zoho API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapeo de campos de la plataforma a Zoho
   */
  mapToZohoContact(debtorData) {
    return {
      First_Name: debtorData.firstName || debtorData.name?.split(' ')[0],
      Last_Name: debtorData.lastName || debtorData.name?.split(' ').slice(1).join(' ') || 'N/A',
      Email: debtorData.email,
      Phone: debtorData.phone,
      RUT: debtorData.rut, // Campo personalizado
      Total_Debt: debtorData.totalDebt, // Campo personalizado
      Platform_User_ID: debtorData.id // Campo personalizado
    };
  }

  /**
   * Mapeo de campos de Zoho a formato de la plataforma
   */
  mapFromZohoContact(zohoContact) {
    return {
      crmId: zohoContact.id,
      crmType: 'zoho',
      firstName: zohoContact.First_Name,
      lastName: zohoContact.Last_Name,
      name: `${zohoContact.First_Name || ''} ${zohoContact.Last_Name || ''}`.trim(),
      email: zohoContact.Email,
      phone: zohoContact.Phone,
      rut: zohoContact.RUT,
      totalDebt: zohoContact.Total_Debt,
      platformUserId: zohoContact.Platform_User_ID,
      createdTime: zohoContact.Created_Time,
      modifiedTime: zohoContact.Modified_Time
    };
  }

  // ==================== OPERACIONES DE CONTACTOS ====================

  /**
   * Sincroniza un contacto con Zoho
   */
  async syncContact(debtorData) {
    try {
      // Buscar si el contacto ya existe por email
      const searchResult = await this.searchContacts(debtorData.email);
      
      const contactData = this.mapToZohoContact(debtorData);
      
      if (searchResult.length > 0) {
        // Actualizar contacto existente
        const contactId = searchResult[0].id;
        const updateData = {
          data: [{
            id: contactId,
            ...contactData
          }]
        };
        
        const result = await this.makeRequest('PUT', 'Contacts', '', updateData);
        
        return {
          success: result.success,
          action: 'updated',
          contactId,
          message: 'Contacto actualizado en Zoho CRM'
        };
      } else {
        // Crear nuevo contacto
        const createData = {
          data: [contactData]
        };
        
        const result = await this.makeRequest('POST', 'Contacts', '', createData);
        
        return {
          success: result.success,
          action: 'created',
          contactId: result.data?.[0]?.details?.id,
          message: 'Contacto creado en Zoho CRM'
        };
      }
    } catch (error) {
      console.error('❌ Error al sincronizar contacto:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincroniza múltiples contactos (operación masiva)
   */
  async syncContacts(debtorsData) {
    try {
      // Zoho permite operaciones masivas de hasta 100 registros
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < debtorsData.length; i += batchSize) {
        batches.push(debtorsData.slice(i, i + batchSize));
      }
      
      const results = [];
      
      for (const batch of batches) {
        const contactsData = {
          data: batch.map(debtor => this.mapToZohoContact(debtor))
        };
        
        const result = await this.makeRequest('POST', 'Contacts', '', contactsData);
        results.push(result);
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      return {
        total: debtorsData.length,
        successful,
        failed,
        results: results
      };
    } catch (error) {
      console.error('❌ Error en sincronización masiva:', error);
      return {
        total: debtorsData.length,
        successful: 0,
        failed: debtorsData.length,
        error: error.message
      };
    }
  }

  /**
   * Obtiene contactos desde Zoho
   */
  async getContacts(filters = {}) {
    try {
      const params = {
        per_page: filters.limit || 200,
        fields: 'First_Name,Last_Name,Email,Phone,RUT,Total_Debt,Platform_User_ID'
      };

      const result = await this.makeRequest('GET', 'Contacts', '', null, params);
      
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(contact => this.mapFromZohoContact(contact));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al obtener contactos:', error);
      return [];
    }
  }

  /**
   * Obtiene un contacto específico
   */
  async getContact(contactId) {
    const result = await this.makeRequest('GET', 'Contacts', contactId);
    
    if (result.success && result.data?.[0]) {
      return this.mapFromZohoContact(result.data[0]);
    }
    
    return null;
  }

  /**
   * Busca contactos por término de búsqueda
   */
  async searchContacts(searchTerm) {
    try {
      const params = {
        criteria: `(Email:equals:${searchTerm})`,
        per_page: 10
      };

      const result = await this.makeRequest('GET', 'Contacts/search', '', null, params);
      
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }

  // ==================== OPERACIONES DE DEUDAS (usando módulo personalizado Debts) ====================

  /**
   * Importa deudas desde Zoho (usando módulo personalizado Debts)
   */
  async importDebts(filters = {}) {
    try {
      const params = {
        per_page: filters.limit || 200,
        fields: 'Name,Amount,Status,Due_Date,Original_Creditor,Contact_Name'
      };

      if (filters.status) {
        params.criteria = `(Status:equals:${filters.status})`;
      }

      const result = await this.makeRequest('GET', 'Debts', '', null, params);
      
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(debt => ({
          crmId: debt.id,
          crmType: 'zoho',
          name: debt.Name,
          amount: debt.Amount,
          status: debt.Status,
          dueDate: debt.Due_Date,
          originalCreditor: debt.Original_Creditor,
          contactId: debt.Contact_Name?.id
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al importar deudas:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una deuda
   */
  async updateDebtStatus(debtId, updateData) {
    const zohoUpdateData = {
      data: [{
        id: debtId,
        Status: updateData.status,
        Last_Payment_Date: updateData.lastPaymentDate,
        Remaining_Amount: updateData.remainingAmount
      }]
    };

    return await this.makeRequest('PUT', 'Debts', '', zohoUpdateData);
  }

  // ==================== OPERACIONES DE ACTIVIDADES ====================

  /**
   * Registra una actividad (Task o Note en Zoho)
   */
  async logActivity(activityData) {
    const taskData = {
      data: [{
        Subject: activityData.subject,
        Description: activityData.description,
        Status: 'Completed',
        Due_Date: activityData.date || new Date().toISOString().split('T')[0],
        What_Id: activityData.contactId, // Relacionar con contacto
        $se_module: 'Contacts'
      }]
    };

    return await this.makeRequest('POST', 'Tasks', '', taskData);
  }

  /**
   * Registra un pago como actividad
   */
  async logPayment(paymentData) {
    const activityData = {
      contactId: paymentData.contactId,
      subject: `Pago recibido: $${paymentData.amount.toLocaleString('es-CL')}`,
      description: `💰 Detalles del Pago\n\nMonto: $${paymentData.amount.toLocaleString('es-CL')}\nMétodo: ${paymentData.method}\nDeuda: ${paymentData.debtName}\nFecha: ${paymentData.date}\n\nEstado: ✅ Confirmado`,
      date: paymentData.date
    };

    return await this.logActivity(activityData);
  }

  /**
   * Crea un acuerdo de pago (Deal en Zoho)
   */
  async createPaymentAgreement(agreementData) {
    const dealData = {
      data: [{
        Deal_Name: `Acuerdo de Pago - ${agreementData.debtorName}`,
        Contact_Name: agreementData.contactId,
        Amount: agreementData.totalAmount,
        Stage: 'Negotiation',
        Closing_Date: agreementData.expectedCloseDate || new Date().toISOString().split('T')[0],
        Description: `Cuotas: ${agreementData.installments}\nIncentivo: $${agreementData.incentive.toLocaleString('es-CL')}`,
        Type: 'Payment Agreement'
      }]
    };

    return await this.makeRequest('POST', 'Deals', '', dealData);
  }

  /**
   * Actualiza un acuerdo de pago
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const dealData = {
      data: [{
        id: agreementId,
        Stage: updateData.status,
        Amount: updateData.remainingAmount,
        Description: updateData.notes
      }]
    };

    return await this.makeRequest('PUT', 'Deals', '', dealData);
  }

  /**
   * Obtiene el historial de actividades de un contacto
   */
  async getContactHistory(contactId) {
    try {
      const params = {
        criteria: `(What_Id:equals:${contactId})`,
        per_page: 50
      };

      const result = await this.makeRequest('GET', 'Tasks', '', null, params);
      
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      return [];
    }
  }

  /**
   * Obtiene actividades recientes
   */
  async getActivities(filters = {}) {
    try {
      const params = {
        per_page: filters.limit || 100,
        sort_by: 'Modified_Time',
        sort_order: 'desc'
      };

      if (filters.since) {
        const sinceDate = new Date(filters.since).toISOString();
        params.criteria = `(Modified_Time:greater_than:${sinceDate})`;
      }

      const result = await this.makeRequest('GET', 'Tasks', '', null, params);
      
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al obtener actividades:', error);
      return [];
    }
  }

  /**
   * Obtiene cambios recientes (para sincronización incremental)
   */
  async getRecentChanges(since) {
    const sinceDate = new Date(since).toISOString();
    
    try {
      // Obtener contactos modificados
      const contactsParams = {
        criteria: `(Modified_Time:greater_than:${sinceDate})`,
        per_page: 200
      };
      const contactsResult = await this.makeRequest('GET', 'Contacts', '', null, contactsParams);
      
      // Obtener deudas modificadas
      const debtsParams = {
        criteria: `(Modified_Time:greater_than:${sinceDate})`,
        per_page: 200
      };
      const debtsResult = await this.makeRequest('GET', 'Debts', '', null, debtsParams);
      
      return {
        debtors: contactsResult.success && Array.isArray(contactsResult.data) ? contactsResult.data : [],
        debts: debtsResult.success && Array.isArray(debtsResult.data) ? debtsResult.data : [],
        activities: []
      };
    } catch (error) {
      console.error('❌ Error al obtener cambios recientes:', error);
      return {
        debtors: [],
        debts: [],
        activities: []
      };
    }
  }
}

// Exportar instancia única (singleton)
const zohoService = new ZohoService();
export default zohoService;
