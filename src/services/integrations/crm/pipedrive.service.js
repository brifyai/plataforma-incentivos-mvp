/**
 * Adaptador de Pipedrive CRM
 *
 * Este servicio implementa la integración con Pipedrive, un CRM de ventas
 * con API REST completa para gestión de personas, organizaciones y deals.
 *
 * @module PipedriveService
 */

import axios from 'axios';

class PipedriveService {
  constructor() {
    this.baseURL = 'https://api.pipedrive.com/v1';
    this.apiToken = null;
    this.apiVersion = 'v1';
  }

  /**
   * Configurar credenciales específicas de empresa
   * @param {Object} config - Configuración de la empresa
   */
  configureForCompany(config) {
    this.apiToken = config.apiToken;
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!(this.apiToken);
    return {
      configured,
      message: configured
        ? 'Pipedrive CRM configurado correctamente'
        : 'Falta API Token de Pipedrive'
    };
  }

  /**
   * Realiza una petición a la API de Pipedrive
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('Pipedrive no está configurado');
      }

      const url = `${this.baseURL}${endpoint}`;

      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {
          api_token: this.apiToken,
          ...params
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
      console.error('❌ Error en Pipedrive API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapeo de campos de la plataforma a Pipedrive
   */
  mapToPipedrivePerson(debtorData) {
    return {
      name: `${debtorData.firstName || debtorData.name?.split(' ')[0]} ${debtorData.lastName || debtorData.name?.split(' ').slice(1).join(' ') || 'N/A'}`,
      email: debtorData.email,
      phone: debtorData.phone,
      rut: debtorData.rut, // Campo personalizado
      total_debt: debtorData.totalDebt, // Campo personalizado
      platform_user_id: debtorData.id, // Campo personalizado
      label: 1, // Label ID para identificar contactos de la plataforma
      visible_to: 3, // Visible a todos en la organización
      marketing_status: 'no_consent' // Estado de marketing
    };
  }

  /**
   * Mapeo de campos de Pipedrive a formato de la plataforma
   */
  mapFromPipedrivePerson(pipedrivePerson) {
    const nameParts = pipedrivePerson.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      crmId: pipedrivePerson.id,
      crmType: 'pipedrive',
      firstName,
      lastName,
      name: pipedrivePerson.name,
      email: pipedrivePerson.primary_email || pipedrivePerson.email?.[0]?.value,
      phone: pipedrivePerson.primary_phone || pipedrivePerson.phone?.[0]?.value,
      rut: pipedrivePerson.rut,
      totalDebt: pipedrivePerson.total_debt,
      platformUserId: pipedrivePerson.platform_user_id
    };
  }

  // ==================== OPERACIONES DE PERSONAS ====================

  /**
   * Sincroniza una persona con Pipedrive
   */
  async syncContact(debtorData) {
    try {
      // Buscar si la persona ya existe por email
      const searchResult = await this.searchPersons(debtorData.email);

      const personData = this.mapToPipedrivePerson(debtorData);

      if (searchResult.length > 0) {
        // Actualizar persona existente
        const personId = searchResult[0].id;
        const result = await this.makeRequest('PUT', `/persons/${personId}`, personData);

        return {
          success: result.success,
          action: 'updated',
          contactId: personId,
          message: 'Persona actualizada en Pipedrive'
        };
      } else {
        // Crear nueva persona
        const result = await this.makeRequest('POST', '/persons', personData);

        return {
          success: result.success,
          action: 'created',
          contactId: result.data?.data?.id,
          message: 'Persona creada en Pipedrive'
        };
      }
    } catch (error) {
      console.error('❌ Error al sincronizar persona:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincroniza múltiples personas (operación masiva)
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
   * Obtiene personas desde Pipedrive
   */
  async getContacts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        start: filters.start || 0
      };

      const result = await this.makeRequest('GET', '/persons', null, params);

      if (result.success) {
        return result.data.data.map(person => this.mapFromPipedrivePerson(person));
      }

      return [];
    } catch (error) {
      console.error('❌ Error al obtener personas:', error);
      return [];
    }
  }

  /**
   * Obtiene una persona específica
   */
  async getContact(personId) {
    const result = await this.makeRequest('GET', `/persons/${personId}`);

    if (result.success) {
      return this.mapFromPipedrivePerson(result.data.data);
    }

    return null;
  }

  /**
   * Busca personas por término de búsqueda
   */
  async searchPersons(searchTerm) {
    try {
      const params = {
        term: searchTerm,
        limit: 10,
        search_by_email: 1
      };

      const result = await this.makeRequest('GET', '/persons/search', null, params);

      if (result.success) {
        return result.data.data?.items || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }

  // ==================== OPERACIONES DE DEALS ====================

  /**
   * Mapeo de deudas a deals en Pipedrive
   */
  mapToPipedriveDeal(debtData) {
    return {
      title: `Deuda - ${debtData.description || 'Sin descripción'}`,
      person_id: debtData.contactId,
      value: debtData.amount,
      currency: 'CLP',
      status: this.mapDebtStatusToPipedrive(debtData.status),
      expected_close_date: debtData.dueDate,
      pipeline_id: debtData.pipelineId || null,
      stage_id: debtData.stageId || null,
      label: 'Deuda', // Label para identificar deals de deuda
      visible_to: 3, // Visible a todos
      custom_fields: {
        original_creditor: debtData.originalCreditor,
        platform_debt_id: debtData.id
      }
    };
  }

  /**
   * Mapeo de estados de deuda a Pipedrive
   */
  mapDebtStatusToPipedrive(status) {
    const statusMap = {
      'active': 'open',
      'negotiating': 'open',
      'agreed': 'won',
      'paid': 'won',
      'cancelled': 'lost'
    };
    return statusMap[status] || 'open';
  }

  /**
   * Mapeo de deals de Pipedrive a deudas
   */
  mapFromPipedriveDeal(pipedriveDeal) {
    return {
      crmId: pipedriveDeal.id,
      crmType: 'pipedrive',
      name: pipedriveDeal.title,
      contactId: pipedriveDeal.person_id,
      amount: pipedriveDeal.value,
      status: this.mapPipedriveStatusToDebt(pipedriveDeal.status),
      dueDate: pipedriveDeal.expected_close_date,
      description: pipedriveDeal.title,
      originalCreditor: pipedriveDeal.custom_fields?.original_creditor
    };
  }

  /**
   * Mapeo de estados de Pipedrive a deuda
   */
  mapPipedriveStatusToDebt(status) {
    const statusMap = {
      'open': 'active',
      'won': 'paid',
      'lost': 'cancelled',
      'deleted': 'cancelled'
    };
    return statusMap[status] || 'active';
  }

  /**
   * Importa deudas desde Pipedrive (como deals)
   */
  async importDebts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        start: filters.start || 0,
        status: filters.status || 'open'
      };

      const result = await this.makeRequest('GET', '/deals', null, params);

      if (result.success) {
        return result.data.data.map(deal => this.mapFromPipedriveDeal(deal));
      }

      return [];
    } catch (error) {
      console.error('❌ Error al importar deudas:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una deuda/deal
   */
  async updateDebtStatus(debtId, updateData) {
    const pipedriveData = {
      status: this.mapDebtStatusToPipedrive(updateData.status),
      value: updateData.remainingAmount
    };

    return await this.makeRequest('PUT', `/deals/${debtId}`, pipedriveData);
  }

  // ==================== OPERACIONES DE ACTIVIDADES ====================

  /**
   * Registra una actividad en Pipedrive
   */
  async logActivity(activityData) {
    const activityDataPD = {
      person_id: activityData.contactId,
      subject: activityData.subject,
      type: this.mapActivityType(activityData.type),
      due_date: activityData.date || new Date().toISOString().split('T')[0],
      due_time: '12:00',
      duration: '00:15', // 15 minutos por defecto
      done: 1, // Marcar como completada
      note: activityData.description,
      user_id: activityData.userId || null
    };

    return await this.makeRequest('POST', '/activities', activityDataPD);
  }

  /**
   * Mapeo de tipos de actividad
   */
  mapActivityType(type) {
    const typeMap = {
      'call': 'call',
      'meeting': 'meeting',
      'email': 'email',
      'payment': 'task',
      'follow_up': 'task',
      'other': 'task'
    };
    return typeMap[type] || 'task';
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
   * Crea un acuerdo de pago (deal especial)
   */
  async createPaymentAgreement(agreementData) {
    const dealData = {
      title: `Acuerdo de Pago - ${agreementData.debtorName}`,
      person_id: agreementData.contactId,
      value: agreementData.totalAmount,
      currency: 'CLP',
      status: 'open',
      expected_close_date: agreementData.expectedCloseDate,
      pipeline_id: agreementData.pipelineId || null,
      stage_id: agreementData.stageId || null,
      label: 'Acuerdo de Pago',
      note: `Cuotas: ${agreementData.installments}\nIncentivo: $${agreementData.incentive}`
    };

    return await this.makeRequest('POST', '/deals', dealData);
  }

  /**
   * Actualiza un acuerdo de pago
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const dealData = {
      status: updateData.status === 'active' ? 'open' : 'won',
      value: updateData.remainingAmount,
      note: updateData.notes
    };

    return await this.makeRequest('PUT', `/deals/${agreementId}`, dealData);
  }

  /**
   * Obtiene el historial de actividades de una persona
   */
  async getContactHistory(personId) {
    try {
      const params = {
        person_id: personId,
        limit: 50,
        done: 1 // Solo actividades completadas
      };

      const result = await this.makeRequest('GET', '/activities', null, params);

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
        start: filters.start || 0,
        done: filters.done || 1 // Por defecto actividades completadas
      };

      if (filters.since) {
        params.due_date_after = filters.since;
      }

      const result = await this.makeRequest('GET', '/activities', null, params);

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

      // Obtener personas modificadas
      const personsResult = await this.makeRequest('GET', '/persons', null, {
        updated_after: sinceDate,
        limit: 100
      });

      // Obtener deals modificados
      const dealsResult = await this.makeRequest('GET', '/deals', null, {
        updated_after: sinceDate,
        limit: 100
      });

      return {
        debtors: personsResult.success ? personsResult.data.data : [],
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

  /**
   * Obtiene información del usuario autenticado
   */
  async getUserInfo() {
    try {
      const result = await this.makeRequest('GET', '/users/me');

      if (result.success) {
        return result.data.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al obtener info de usuario:', error);
      return null;
    }
  }
}

// Exportar instancia única (singleton)
const pipedriveService = new PipedriveService();
export default pipedriveService;