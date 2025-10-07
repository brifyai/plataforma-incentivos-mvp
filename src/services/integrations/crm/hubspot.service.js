/**
 * Adaptador de HubSpot CRM
 * 
 * Este servicio implementa la integración con HubSpot utilizando su API REST v3.
 * Requiere configuración de Access Token (Private App Token).
 * 
 * @module HubSpotService
 */

import axios from 'axios';

class HubSpotService {
  constructor() {
    this.accessToken = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN;
    this.baseURL = 'https://api.hubapi.com';
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!this.accessToken;
    return {
      configured,
      message: configured 
        ? 'HubSpot CRM configurado correctamente'
        : 'Falta credencial de HubSpot (ACCESS_TOKEN)'
    };
  }

  /**
   * Realiza una petición a la API de HubSpot
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('HubSpot no está configurado');
      }

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error en HubSpot API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mapeo de campos de la plataforma a HubSpot
   */
  mapToHubSpotContact(debtorData) {
    return {
      properties: {
        firstname: debtorData.firstName || debtorData.name?.split(' ')[0],
        lastname: debtorData.lastName || debtorData.name?.split(' ').slice(1).join(' ') || 'N/A',
        email: debtorData.email,
        phone: debtorData.phone,
        rut: debtorData.rut, // Propiedad personalizada
        total_debt: debtorData.totalDebt, // Propiedad personalizada
        platform_user_id: debtorData.id // Propiedad personalizada
      }
    };
  }

  /**
   * Mapeo de campos de HubSpot a formato de la plataforma
   */
  mapFromHubSpotContact(hsContact) {
    const props = hsContact.properties;
    return {
      crmId: hsContact.id,
      crmType: 'hubspot',
      firstName: props.firstname,
      lastName: props.lastname,
      name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
      email: props.email,
      phone: props.phone,
      rut: props.rut,
      totalDebt: props.total_debt ? parseFloat(props.total_debt) : 0,
      platformUserId: props.platform_user_id,
      createdAt: hsContact.createdAt,
      updatedAt: hsContact.updatedAt
    };
  }

  // ==================== OPERACIONES DE CONTACTOS ====================

  /**
   * Sincroniza un contacto con HubSpot
   */
  async syncContact(debtorData) {
    try {
      // Buscar si el contacto ya existe por email
      const searchResult = await this.searchContacts(debtorData.email);
      
      const contactData = this.mapToHubSpotContact(debtorData);
      
      if (searchResult.length > 0) {
        // Actualizar contacto existente
        const contactId = searchResult[0].id;
        const result = await this.makeRequest(
          'PATCH',
          `/crm/v3/objects/contacts/${contactId}`,
          contactData
        );
        
        return {
          success: result.success,
          action: 'updated',
          contactId,
          message: 'Contacto actualizado en HubSpot'
        };
      } else {
        // Crear nuevo contacto
        const result = await this.makeRequest(
          'POST',
          '/crm/v3/objects/contacts',
          contactData
        );
        
        return {
          success: result.success,
          action: 'created',
          contactId: result.data?.id,
          message: 'Contacto creado en HubSpot'
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
   * Obtiene contactos desde HubSpot
   */
  async getContacts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'rut',
          'total_debt',
          'platform_user_id'
        ].join(',')
      };

      // Si hay filtros, usar búsqueda en lugar de listar todos
      if (filters.email || filters.rut) {
        return await this.searchContacts(filters.email || filters.rut);
      }

      const result = await this.makeRequest('GET', '/crm/v3/objects/contacts', null, params);
      
      if (result.success) {
        return result.data.results.map(contact => this.mapFromHubSpotContact(contact));
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
    const params = {
      properties: [
        'firstname',
        'lastname',
        'email',
        'phone',
        'rut',
        'total_debt',
        'platform_user_id'
      ].join(',')
    };

    const result = await this.makeRequest('GET', `/crm/v3/objects/contacts/${contactId}`, null, params);
    
    if (result.success) {
      return this.mapFromHubSpotContact(result.data);
    }
    
    return null;
  }

  /**
   * Busca contactos por término de búsqueda
   */
  async searchContacts(searchTerm) {
    try {
      const searchData = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: searchTerm
              }
            ]
          }
        ],
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'rut',
          'total_debt'
        ],
        limit: 10
      };

      const result = await this.makeRequest('POST', '/crm/v3/objects/contacts/search', searchData);
      
      if (result.success) {
        return result.data.results;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  }

  // ==================== OPERACIONES DE DEUDAS (DEALS) ====================

  /**
   * Importa deudas desde HubSpot (usando Deals)
   */
  async importDebts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        properties: [
          'dealname',
          'amount',
          'dealstage',
          'closedate',
          'original_creditor',
          'debt_type'
        ].join(','),
        associations: ['contacts']
      };

      const result = await this.makeRequest('GET', '/crm/v3/objects/deals', null, params);
      
      if (result.success) {
        return result.data.results.map(deal => ({
          crmId: deal.id,
          crmType: 'hubspot',
          name: deal.properties.dealname,
          amount: deal.properties.amount ? parseFloat(deal.properties.amount) : 0,
          status: deal.properties.dealstage,
          dueDate: deal.properties.closedate,
          originalCreditor: deal.properties.original_creditor,
          type: deal.properties.debt_type,
          contactId: deal.associations?.contacts?.results?.[0]?.id
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error al importar deudas:', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una deuda (Deal)
   */
  async updateDebtStatus(debtId, updateData) {
    const hsUpdateData = {
      properties: {
        dealstage: updateData.status,
        amount: updateData.remainingAmount,
        last_payment_date: updateData.lastPaymentDate
      }
    };

    return await this.makeRequest('PATCH', `/crm/v3/objects/deals/${debtId}`, hsUpdateData);
  }

  // ==================== OPERACIONES DE ACTIVIDADES (ENGAGEMENTS) ====================

  /**
   * Registra una actividad (Note en HubSpot)
   */
  async logActivity(activityData) {
    const noteData = {
      properties: {
        hs_note_body: activityData.description,
        hs_timestamp: activityData.date ? new Date(activityData.date).getTime() : Date.now()
      },
      associations: [
        {
          to: { id: activityData.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 202 // Note to Contact
            }
          ]
        }
      ]
    };

    return await this.makeRequest('POST', '/crm/v3/objects/notes', noteData);
  }

  /**
   * Registra un pago como actividad
   */
  async logPayment(paymentData) {
    const activityData = {
      contactId: paymentData.contactId,
      description: `💰 Pago Recibido\n\nMonto: $${paymentData.amount.toLocaleString('es-CL')}\nMétodo: ${paymentData.method}\nDeuda: ${paymentData.debtName}\nFecha: ${paymentData.date}\n\nEstado: ✅ Confirmado`,
      date: paymentData.date
    };

    return await this.logActivity(activityData);
  }

  /**
   * Crea un acuerdo de pago (Deal en HubSpot)
   */
  async createPaymentAgreement(agreementData) {
    const dealData = {
      properties: {
        dealname: `Acuerdo - ${agreementData.debtorName}`,
        amount: agreementData.totalAmount,
        dealstage: 'negotiation',
        closedate: agreementData.expectedCloseDate || new Date().toISOString().split('T')[0],
        pipeline: 'default',
        installments: agreementData.installments,
        incentive_amount: agreementData.incentive
      },
      associations: [
        {
          to: { id: agreementData.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3 // Deal to Contact
            }
          ]
        }
      ]
    };

    return await this.makeRequest('POST', '/crm/v3/objects/deals', dealData);
  }

  /**
   * Actualiza un acuerdo de pago
   */
  async updatePaymentAgreement(agreementId, updateData) {
    const dealData = {
      properties: {
        dealstage: updateData.status,
        amount: updateData.remainingAmount,
        hs_deal_notes: updateData.notes
      }
    };

    return await this.makeRequest('PATCH', `/crm/v3/objects/deals/${agreementId}`, dealData);
  }

  /**
   * Obtiene el historial de actividades de un contacto
   */
  async getContactHistory(contactId) {
    try {
      // Obtener asociaciones de notas con el contacto
      const result = await this.makeRequest(
        'GET',
        `/crm/v4/objects/contacts/${contactId}/associations/notes`
      );
      
      if (result.success && result.data.results) {
        // Obtener detalles de cada nota
        const noteIds = result.data.results.map(r => r.toObjectId);
        const notes = await Promise.all(
          noteIds.map(id => this.makeRequest('GET', `/crm/v3/objects/notes/${id}`))
        );
        
        return notes
          .filter(n => n.success)
          .map(n => n.data);
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
        properties: ['hs_note_body', 'hs_timestamp', 'hs_createdate']
      };

      const result = await this.makeRequest('GET', '/crm/v3/objects/notes', null, params);
      
      if (result.success) {
        return result.data.results;
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
    const sinceTimestamp = new Date(since).getTime();
    
    try {
      // Buscar contactos modificados
      const contactsSearch = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_lastmodifieddate',
                operator: 'GTE',
                value: sinceTimestamp.toString()
              }
            ]
          }
        ],
        properties: ['firstname', 'lastname', 'email', 'phone', 'rut', 'total_debt'],
        limit: 100
      };

      const contactsResult = await this.makeRequest(
        'POST',
        '/crm/v3/objects/contacts/search',
        contactsSearch
      );

      // Buscar deals modificados
      const dealsSearch = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_lastmodifieddate',
                operator: 'GTE',
                value: sinceTimestamp.toString()
              }
            ]
          }
        ],
        properties: ['dealname', 'amount', 'dealstage'],
        limit: 100
      };

      const dealsResult = await this.makeRequest(
        'POST',
        '/crm/v3/objects/deals/search',
        dealsSearch
      );
      
      return {
        debtors: contactsResult.success ? contactsResult.data.results : [],
        debts: dealsResult.success ? dealsResult.data.results : [],
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
const hubspotService = new HubSpotService();
export default hubspotService;
