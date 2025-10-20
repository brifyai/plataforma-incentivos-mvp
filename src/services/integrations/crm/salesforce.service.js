/**
 * Adaptador de Salesforce CRM
 * 
 * Este servicio implementa la integración con Salesforce utilizando su API REST.
 * Requiere configuración de Access Token e Instance URL.
 * 
 * @module SalesforceService
 */

import axios from 'axios';

class SalesforceService {
  constructor() {
    this.accessToken = import.meta.env.VITE_SALESFORCE_ACCESS_TOKEN;
    this.instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL;
    this.apiVersion = 'v58.0'; // Versión de la API de Salesforce
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!(this.accessToken && this.instanceUrl);
    return {
      configured,
      message: configured 
        ? 'Salesforce CRM configurado correctamente'
        : 'Faltan credenciales de Salesforce (ACCESS_TOKEN o INSTANCE_URL)'
    };
  }

  /**
   * Realiza una petición a la API de Salesforce
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('Salesforce no está configurado');
      }

      const url = `${this.instanceUrl}/services/data/${this.apiVersion}${endpoint}`;
      
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error en Salesforce API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapeo de campos de la plataforma a Salesforce
   */
  mapToSalesforceContact(debtorData) {
    return {
      FirstName: debtorData.firstName || debtorData.name?.split(' ')[0],
      LastName: debtorData.lastName || debtorData.name?.split(' ').slice(1).join(' ') || 'N/A',
      Email: debtorData.email,
      Phone: debtorData.phone,
      RUT__c: debtorData.rut, // Campo personalizado
      Total_Debt__c: debtorData.totalDebt, // Campo personalizado
      Platform_User_ID__c: debtorData.id // Campo personalizado para vincular
    };
  }

  /**
   * Mapeo de campos de Salesforce a formato de la plataforma
   */
  mapFromSalesforceContact(sfContact) {
    return {
      crmId: sfContact.Id,
      crmType: 'salesforce',
      firstName: sfContact.FirstName,
      lastName: sfContact.LastName,
      name: `${sfContact.FirstName} ${sfContact.LastName}`,
      email: sfContact.Email,
      phone: sfContact.Phone,
      rut: sfContact.RUT__c,
      totalDebt: sfContact.Total_Debt__c,
      platformUserId: sfContact.Platform_User_ID__c
    };
  }

  // ==================== OPERACIONES DE CONTACTOS ====================

  /**
   * Sincroniza un contacto con Salesforce
   */
  async syncContact(debtorData) {
    try {
      // Buscar si el contacto ya existe
      const searchResult = await this.searchContacts(debtorData.email || debtorData.rut);
      
      const contactData = this.mapToSalesforceContact(debtorData);
      
      if (searchResult.length > 0) {
        // Actualizar contacto existente
        const contactId = searchResult[0].Id;
        const result = await this.makeRequest('PATCH', `/sobjects/Contact/${contactId}`, contactData);
        
        return {
          success: result.success,
          action: 'updated',
          contactId,
          message: 'Contacto actualizado en Salesforce'
        };
      } else {
        // Crear nuevo contacto
        const result = await this.makeRequest('POST', '/sobjects/Contact', contactData);
        
        return {
          success: result.success,
          action: 'created',
          contactId: result.data?.id,
          message: 'Contacto creado en Salesforce'
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
    const results = await Promise.allSettled(
      debtorsData.map(debtor => this.syncContact(debtor))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results: results
    };
  }

  /**
   * Obtiene contactos desde Salesforce
   */
  async getContacts(filters = {}) {
    try {
      let query = 'SELECT Id, FirstName, LastName, Email, Phone, RUT__c, Total_Debt__c, Platform_User_ID__c FROM Contact';
      
      const conditions = [];
      if (filters.email) conditions.push(`Email = '${filters.email}'`);
      if (filters.rut) conditions.push(`RUT__c = '${filters.rut}'`);
      if (filters.hasDebt) conditions.push(`Total_Debt__c > 0`);
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` LIMIT ${filters.limit || 100}`;
      
      const result = await this.makeRequest('GET', `/query?q=${encodeURIComponent(query)}`);
      
      if (result.success) {
        return result.data.records.map(record => this.mapFromSalesforceContact(record));
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
    const result = await this.makeRequest('GET', `/sobjects/Contact/${contactId}`);
    
    if (result.success) {
      return this.mapFromSalesforceContact(result.data);
    }
    
    return null;
  }

  /**
   * Busca contactos por término de búsqueda
   */
  async searchContacts(searchTerm) {
    try {
      const query = `SELECT Id, FirstName, LastName, Email, Phone, RUT__c FROM Contact WHERE Email = '${searchTerm}' OR RUT__c = '${searchTerm}' OR Phone = '${searchTerm}' LIMIT 10`;
      
      const result = await this.makeRequest('GET', `/query?q=${encodeURIComponent(query)}`);
      
      if (result.success) {
        return result.data.records;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }

  // ==================== OPERACIONES DE DEUDAS ====================

  /**
   * Importa deudas desde Salesforce (usando objeto personalizado Debt__c)
   */
  async importDebts(filters = {}) {
    try {
      let query = 'SELECT Id, Name, Contact__c, Amount__c, Status__c, Due_Date__c, Original_Creditor__c FROM Debt__c';
      
      const conditions = [];
      if (filters.status) conditions.push(`Status__c = '${filters.status}'`);
      if (filters.contactId) conditions.push(`Contact__c = '${filters.contactId}'`);
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` ORDER BY Due_Date__c DESC LIMIT ${filters.limit || 100}`;
      
      const result = await this.makeRequest('GET', `/query?q=${encodeURIComponent(query)}`);
      
      if (result.success) {
        return result.data.records.map(debt => ({
          crmId: debt.Id,
          crmType: 'salesforce',
          name: debt.Name,
          contactId: debt.Contact__c,
          amount: debt.Amount__c,
          status: debt.Status__c,
          dueDate: debt.Due_Date__c,
          originalCreditor: debt.Original_Creditor__c
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
    const sfUpdateData = {
      Status__c: updateData.status,
      Last_Payment_Date__c: updateData.lastPaymentDate,
      Remaining_Amount__c: updateData.remainingAmount
    };

    return await this.makeRequest('PATCH', `/sobjects/Debt__c/${debtId}`, sfUpdateData);
  }

  // ==================== OPERACIONES DE ACTIVIDADES ====================

  /**
   * Registra una actividad (Task en Salesforce)
   */
  async logActivity(activityData) {
    const taskData = {
      WhoId: activityData.contactId, // ID del contacto
      Subject: activityData.subject,
      Description: activityData.description,
      Status: 'Completed',
      ActivityDate: activityData.date || new Date().toISOString().split('T')[0],
      Type: activityData.type || 'Other'
    };

    return await this.makeRequest('POST', '/sobjects/Task', taskData);
  }

  /**
   * Registra un pago como actividad
   */
  async logPayment(paymentData) {
    const activityData = {
      contactId: paymentData.contactId,
      subject: `Pago recibido: $${paymentData.amount}`,
      description: `Monto: $${paymentData.amount}\nMétodo: ${paymentData.method}\nDeuda: ${paymentData.debtName}\nFecha: ${paymentData.date}`,
      type: 'Payment',
      date: paymentData.date
    };

    return await this.logActivity(activityData);
  }

  /**
   * Crea un acuerdo de pago (Opportunity en Salesforce)
   */
  async createPaymentAgreement(agreementData) {
    const opportunityData = {
      Name: `Acuerdo de Pago - ${agreementData.debtorName}`,
      ContactId: agreementData.contactId,
      Amount: agreementData.totalAmount,
      StageName: 'Negotiation',
      CloseDate: agreementData.expectedCloseDate || new Date().toISOString().split('T')[0],
      Description: `Cuotas: ${agreementData.installments}\nIncentivo: $${agreementData.incentive}`,
      Type: 'Payment Agreement'
    };

    return await this.makeRequest('POST', '/sobjects/Opportunity', opportunityData);
  }

  /**
   * Actualiza un acuerdo de pago
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const opportunityData = {
      StageName: updateData.status,
      Amount: updateData.remainingAmount,
      Description: updateData.notes
    };

    return await this.makeRequest('PATCH', `/sobjects/Opportunity/${agreementId}`, opportunityData);
  }

  /**
   * Obtiene el historial de actividades de un contacto
   */
  async getContactHistory(contactId) {
    try {
      const query = `SELECT Id, Subject, Description, ActivityDate, Type, Status FROM Task WHERE WhoId = '${contactId}' ORDER BY ActivityDate DESC LIMIT 50`;
      
      const result = await this.makeRequest('GET', `/query?q=${encodeURIComponent(query)}`);
      
      if (result.success) {
        return result.data.records;
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
      let query = 'SELECT Id, Subject, Description, ActivityDate, Type, Status, WhoId FROM Task';
      
      if (filters.since) {
        const sinceDate = new Date(filters.since).toISOString().split('T')[0];
        query += ` WHERE ActivityDate >= ${sinceDate}`;
      }
      
      query += ` ORDER BY ActivityDate DESC LIMIT ${filters.limit || 100}`;
      
      const result = await this.makeRequest('GET', `/query?q=${encodeURIComponent(query)}`);
      
      if (result.success) {
        return result.data.records;
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
      const contactsQuery = `SELECT Id, FirstName, LastName, Email, Phone, RUT__c, LastModifiedDate FROM Contact WHERE LastModifiedDate >= ${sinceDate}`;
      const contactsResult = await this.makeRequest('GET', `/query?q=${encodeURIComponent(contactsQuery)}`);
      
      // Obtener deudas modificadas
      const debtsQuery = `SELECT Id, Name, Amount__c, Status__c, LastModifiedDate FROM Debt__c WHERE LastModifiedDate >= ${sinceDate}`;
      const debtsResult = await this.makeRequest('GET', `/query?q=${encodeURIComponent(debtsQuery)}`);
      
      return {
        debtors: contactsResult.success ? contactsResult.data.records : [],
        debts: debtsResult.success ? debtsResult.data.records : [],
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
const salesforceService = new SalesforceService();
export default salesforceService;
