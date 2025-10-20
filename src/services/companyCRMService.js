/**
 * Servicio de Configuración CRM por Empresa
 *
 * Maneja la configuración específica de CRM para cada empresa,
 * permitiendo que cada compañía conecte su propio sistema CRM.
 *
 * @module CompanyCRMService
 */

import { supabase } from '../config/supabase';

/**
 * Obtiene la configuración CRM de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<Object>} Configuración CRM
 */
export const getCompanyCRMConfig = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('crm_provider, crm_config, crm_connected, crm_last_sync, crm_sync_status')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error obteniendo configuración CRM:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      config: {
        provider: data.crm_provider,
        config: data.crm_config || {},
        connected: data.crm_connected,
        lastSync: data.crm_last_sync,
        syncStatus: data.crm_sync_status
      }
    };
  } catch (error) {
    console.error('Error en getCompanyCRMConfig:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Guarda la configuración CRM de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} crmConfig - Configuración CRM
 * @returns {Promise<Object>} Resultado de la operación
 */
export const saveCompanyCRMConfig = async (companyId, crmConfig) => {
  try {
    const updateData = {
      crm_provider: crmConfig.provider,
      crm_config: crmConfig.config,
      crm_connected: crmConfig.connected || false,
      crm_sync_status: crmConfig.connected ? 'connected' : 'disconnected',
      updated_at: new Date().toISOString()
    };

    // Si se está conectando, actualizar last_sync
    if (crmConfig.connected) {
      updateData.crm_last_sync = new Date().toISOString();
    }

    const { error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId);

    if (error) {
      console.error('Error guardando configuración CRM:', error);
      return { success: false, error: error.message };
    }

    // Registrar en historial de sincronización
    if (crmConfig.connected) {
      await logCRMSyncHistory(companyId, {
        crm_provider: crmConfig.provider,
        sync_type: 'configuration',
        status: 'success',
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        error_message: null
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error en saveCompanyCRMConfig:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Desconecta el CRM de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<Object>} Resultado de la operación
 */
export const disconnectCompanyCRM = async (companyId) => {
  try {
    const { error } = await supabase
      .from('companies')
      .update({
        crm_provider: null,
        crm_config: {},
        crm_connected: false,
        crm_sync_status: 'disconnected',
        crm_last_sync: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (error) {
      console.error('Error desconectando CRM:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en disconnectCompanyCRM:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prueba la conexión CRM de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<Object>} Resultado de la prueba
 */
export const testCompanyCRMConnection = async (companyId) => {
  try {
    // Obtener configuración actual
    const configResult = await getCompanyCRMConfig(companyId);
    if (!configResult.success) {
      return configResult;
    }

    const { provider, config } = configResult.config;

    if (!provider || !config) {
      return {
        success: false,
        error: 'CRM no configurado'
      };
    }

    // Importar servicio correspondiente dinámicamente
    let crmService;
    try {
      switch (provider) {
        case 'hubspot':
          crmService = (await import('./integrations/crm/hubspot.service.js')).default;
          break;
        case 'salesforce':
          crmService = (await import('./integrations/crm/salesforce.service.js')).default;
          break;
        case 'zoho':
          crmService = (await import('./integrations/crm/zoho.service.js')).default;
          break;
        default:
          return { success: false, error: 'Proveedor CRM no soportado' };
      }
    } catch (importError) {
      console.error('Error importando servicio CRM:', importError);
      return { success: false, error: 'Error interno del sistema' };
    }

    // Crear instancia temporal con credenciales de la empresa
    const tempService = new crmService.constructor();

    // Configurar credenciales específicas de la empresa
    switch (provider) {
      case 'hubspot':
        tempService.accessToken = config.accessToken;
        break;
      case 'salesforce':
        tempService.accessToken = config.accessToken;
        tempService.instanceUrl = config.instanceUrl;
        break;
      case 'zoho':
        tempService.accessToken = config.accessToken;
        tempService.apiDomain = config.apiDomain;
        break;
    }

    // Probar conexión
    const isConfigured = tempService.isConfigured();
    if (!isConfigured.configured) {
      return {
        success: false,
        error: isConfigured.message
      };
    }

    // Intentar una operación simple para verificar conectividad
    try {
      let testResult;
      switch (provider) {
        case 'hubspot':
          testResult = await tempService.getContacts({ limit: 1 });
          break;
        case 'salesforce':
          testResult = await tempService.getContacts({ limit: 1 });
          break;
        case 'zoho':
          testResult = await tempService.getContacts({ limit: 1 });
          break;
      }

      if (testResult && testResult.length >= 0) { // La operación fue exitosa
        return {
          success: true,
          message: 'Conexión exitosa',
          details: {
            contacts: testResult.length,
            lastSync: new Date(),
            version: 'API v3'
          }
        };
      } else {
        return {
          success: false,
          error: 'Error en la respuesta del CRM'
        };
      }
    } catch (apiError) {
      console.error('Error en API de CRM:', apiError);
      return {
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Error de conexión'
      };
    }

  } catch (error) {
    console.error('Error en testCompanyCRMConnection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Registra una entrada en el historial de sincronización CRM
 * @param {string} companyId - ID de la empresa
 * @param {Object} syncData - Datos de la sincronización
 * @returns {Promise<Object>} Resultado de la operación
 */
export const logCRMSyncHistory = async (companyId, syncData) => {
  try {
    const { error } = await supabase
      .from('crm_sync_history')
      .insert({
        company_id: companyId,
        crm_provider: syncData.crm_provider,
        sync_type: syncData.sync_type,
        status: syncData.status,
        records_processed: syncData.records_processed || 0,
        records_created: syncData.records_created || 0,
        records_updated: syncData.records_updated || 0,
        records_failed: syncData.records_failed || 0,
        error_message: syncData.error_message,
        started_at: new Date(),
        completed_at: new Date()
      });

    if (error) {
      console.error('Error registrando historial CRM:', error);
      // No fallar la operación principal por esto
    }

    return { success: true };
  } catch (error) {
    console.error('Error en logCRMSyncHistory:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene el historial de sincronización CRM de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} Historial de sincronización
 */
export const getCompanyCRMSyncHistory = async (companyId, filters = {}) => {
  try {
    let query = supabase
      .from('crm_sync_history')
      .select('*')
      .eq('company_id', companyId)
      .order('started_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.crm_provider) {
      query = query.eq('crm_provider', filters.crm_provider);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo historial CRM:', error);
      return { success: false, error: error.message, history: [] };
    }

    return { success: true, history: data || [] };
  } catch (error) {
    console.error('Error en getCompanyCRMSyncHistory:', error);
    return { success: false, error: error.message, history: [] };
  }
};

export default {
  getCompanyCRMConfig,
  saveCompanyCRMConfig,
  disconnectCompanyCRM,
  testCompanyCRMConnection,
  logCRMSyncHistory,
  getCompanyCRMSyncHistory
};