/**
 * Adaptador de Upnify CRM
 *
 * Este servicio implementa la integración con Upnify, un CRM chileno moderno
 * con API REST completa para gestión de contactos, oportunidades y actividades.
 *
 * @module UpnifyService
 */

import axios from 'axios';

class UpnifyService {
  constructor() {
    this.baseURL = 'https://api.upnify.com/v1';
    this.apiKey = null;
    this.apiVersion = 'v1';
  }

  /**
   * Configurar credenciales específicas de empresa
   * @param {Object} config - Configuración de la empresa
   */
  configureForCompany(config) {
    this.apiKey = config.apiKey;
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!(this.apiKey);
    return {
      configured,
      message: configured
        ? 'Upnify CRM configurado correctamente'
        : 'Falta API Key de Upnify'
    };
  }

  /**
   * Realiza una petición a la API de Upnify
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('Upnify no está configurado');
      }

      const url = `${this.baseURL}${endpoint}`;

      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error en Upnify API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapeo de campos de la plataforma a Upnify
   */
  mapToUpnifyContact(debtorData) {
    return {
      first_name: debtorData.firstName || debtorData.name?.split(' ')[0],
      last_name: debtorData.lastName || debtorData.name?.split(' ').slice(1).join(' ') || 'N/A',
      email: debtorData.email,
      phone: debtorData.phone,
      rut: debtorData.rut, // Campo personalizado en Upnify
      total_debt: debtorData.totalDebt, // Campo personalizado
      platform_user_id: debtorData.id, // ID de referencia
      tags: ['Plataforma Incentivos'], // Etiquetas para identificar origen
      source: 'Plataforma Incentivos'
    };
  }

  /**
   * Mapeo de campos de Upnify a formato de la plataforma
   */
  mapFromUpnifyContact(upnifyContact) {
    return {
      crmId: upnifyContact.id,
      crmType: 'upnify',
      firstName: upnifyContact.first_name,
      lastName: upnifyContact.last_name,
      name: `${upnifyContact.first_name} ${upnifyContact.last_name}`,
      email: upnifyContact.email,
      phone: upnifyContact.phone,
      rut: upnifyContact.rut,
      totalDebt: upnifyContact.total_debt,
      platformUserId: upnifyContact.platform_user_id
    };
  }

  // ==================== OPERACIONES DE CONTACTOS ====================

  /**
   * Sincroniza un contacto con Upnify
   */
  async syncContact(debtorData) {
    try {
      // Buscar si el contacto ya existe por email o RUT
      const searchResult = await this.searchContacts(debtorData.email || debtorData.rut);

      const contactData = this.mapToUpnifyContact(debtorData);

      if (searchResult.length > 0) {
        // Actualizar contacto existente
        const contactId = searchResult[0].id;
        const result = await this.makeRequest('PUT', `/contacts/${contactId}`, contactData);

        return {
          success: result.success,
          action: 'updated',
          contactId,
          message: 'Contacto actualizado en Upnify'
        };
      } else {
        // Crear nuevo contacto
        const result = await this.makeRequest('POST', '/contacts', contactData);

        return {
          success: result.success,
          action: 'created',
          contactId: result.data?.id,
          message: 'Contacto creado en Upnify'
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
      results
    };
  }

  /**
   * Obtiene contactos desde Upnify
   */
  async getContacts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        page: filters.page || 1
      };

      if (filters.email) params.email = filters.email;
      if (filters.rut) params.rut = filters.rut;
      if (filters.hasDebt) params.total_debt = '>0';

      const result = await this.makeRequest('GET', '/contacts', null, params);

      if (result.success) {
        return result.data.data.map(contact => this.mapFromUpnifyContact(contact));
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
    const result = await this.makeRequest('GET', `/contacts/${contactId}`);

    if (result.success) {
      return this.mapFromUpnifyContact(result.data);
    }

    return null;
  }

  /**
   * Busca contactos por término de búsqueda
   */
  async searchContacts(searchTerm) {
    try {
      const params = {
        search: searchTerm,
        limit: 10
      };

      const result = await this.makeRequest('GET', '/contacts/search', null, params);

      if (result.success) {
        return result.data.data || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }

  // ==================== OPERACIONES DE DEUDAS (OPORTUNIDADES) ====================

  /**
   * Mapeo de deudas a oportunidades en Upnify
   */
  mapToUpnifyDeal(debtData) {
    return {
      title: `Deuda - ${debtData.description || 'Sin descripción'}`,
      contact_id: debtData.contactId,
      value: debtData.amount,
      currency: 'CLP',
      status: this.mapDebtStatusToUpnify(debtData.status),
      expected_close_date: debtData.dueDate,
      description: debtData.description,
      tags: ['Deuda', 'Plataforma Incentivos'],
      custom_fields: {
        original_creditor: debtData.originalCreditor,
        platform_debt_id: debtData.id
      }
    };
  }

  /**
   * Mapeo de estados de deuda a Upnify
   */
  mapDebtStatusToUpnify(status) {
    const statusMap = {
      'active': 'open',
      'negotiating': 'negotiation',
      'agreed': 'won',
      'paid': 'won',
      'cancelled': 'lost'
    };
    return statusMap[status] || 'open';
  }

  /**
   * Mapeo de estados de Upnify a la plataforma
   */
  mapFromUpnifyDeal(upnifyDeal) {
    return {
      crmId: upnifyDeal.id,
      crmType: 'upnify',
      name: upnifyDeal.title,
      contactId: upnifyDeal.contact_id,
      amount: upnifyDeal.value,
      status: this.mapUpnifyStatusToDebt(upnifyDeal.status),
      dueDate: upnifyDeal.expected_close_date,
      description: upnifyDeal.description,
      originalCreditor: upnifyDeal.custom_fields?.original_creditor
    };
  }

  /**
   * Mapeo de estados de Upnify a deuda
   */
  mapUpnifyStatusToDebt(status) {
    const statusMap = {
      'open': 'active',
      'negotiation': 'negotiating',
      'won': 'paid',
      'lost': 'cancelled'
    };
    return statusMap[status] || 'active';
  }

  /**
   * Importa deudas desde Upnify (como oportunidades)
   */
  async importDebts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        status: filters.status || 'open'
      };

      const result = await this.makeRequest('GET', '/deals', null, params);

      if (result.success) {
        return result.data.data.map(deal => this.mapFromUpnifyDeal(deal));
      }

      return [];
    } catch (error) {
      console.error('❌ Error al importar deudas:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una deuda/oportunidad
   */
  async updateDebtStatus(debtId, updateData) {
    const upnifyData = {
      status: this.mapDebtStatusToUpnify(updateData.status),
      value: updateData.remainingAmount
    };

    return await this.makeRequest('PUT', `/deals/${debtId}`, upnifyData);
  }

  // ==================== OPERACIONES DE ACTIVIDADES ====================

  /**
   * Registra una actividad (tarea) en Upnify
   */
  async logActivity(activityData) {
    const taskData = {
      contact_id: activityData.contactId,
      title: activityData.subject,
      description: activityData.description,
      type: activityData.type || 'call',
      due_date: activityData.date || new Date().toISOString().split('T')[0],
      status: 'completed',
      assigned_to: activityData.assignedTo || null
    };

    return await this.makeRequest('POST', '/tasks', taskData);
  }

  /**
   * Registra un pago como actividad
   */
  async logPayment(paymentData) {
    const activityData = {
      contactId: paymentData.contactId,
      subject: `Pago recibido: $${paymentData.amount}`,
      description: `Monto: $${paymentData.amount}\nMétodo: ${paymentData.method}\nDeuda: ${paymentData.debtName}\nFecha: ${paymentData.date}`,
      type: 'payment',
      date: paymentData.date
    };

    return await this.logActivity(activityData);
  }

  /**
   * Crea un acuerdo de pago (oportunidad especial)
   */
  async createPaymentAgreement(agreementData) {
    const dealData = {
      title: `Acuerdo de Pago - ${agreementData.debtorName}`,
      contact_id: agreementData.contactId,
      value: agreementData.totalAmount,
      currency: 'CLP',
      status: 'negotiation',
      expected_close_date: agreementData.expectedCloseDate,
      description: `Cuotas: ${agreementData.installments}\nIncentivo: $${agreementData.incentive}`,
      tags: ['Acuerdo de Pago', 'Plataforma Incentivos'],
      pipeline_id: agreementData.pipelineId || null
    };

    return await this.makeRequest('POST', '/deals', dealData);
  }

  /**
   * Actualiza un acuerdo de pago
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const dealData = {
      status: updateData.status === 'active' ? 'negotiation' : 'won',
      value: updateData.remainingAmount,
      description: updateData.notes
    };

    return await this.makeRequest('PUT', `/deals/${agreementId}`, dealData);
  }

  /**
   * Obtiene el historial de actividades de un contacto
   */
  async getContactHistory(contactId) {
    try {
      const params = {
        contact_id: contactId,
        limit: 50
      };

      const result = await this.makeRequest('GET', '/tasks', null, params);

      if (result.success) {
        return result.data.data || [];
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
        limit: filters.limit || 100,
        page: filters.page || 1
      };

      if (filters.since) {
        params.created_after = filters.since;
      }

      const result = await this.makeRequest('GET', '/tasks', null, params);

      if (result.success) {
        return result.data.data || [];
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
    try {
      const sinceDate = new Date(since).toISOString();

      // Obtener contactos modificados
      const contactsResult = await this.makeRequest('GET', '/contacts', null, {
        updated_after: sinceDate,
        limit: 100
      });

      // Obtener deals modificados
      const dealsResult = await this.makeRequest('GET', '/deals', null, {
        updated_after: sinceDate,
        limit: 100
      });

      return {
        debtors: contactsResult.success ? contactsResult.data.data : [],
        debts: dealsResult.success ? dealsResult.data.data : [],
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
const upnifyService = new UpnifyService();
export default upnifyService;