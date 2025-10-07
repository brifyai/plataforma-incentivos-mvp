/**
 * Panel de Configuración de Integraciones
 * 
 * Componente para administradores que muestra el estado de todas las integraciones
 * y permite realizar operaciones de sincronización.
 */

import React, { useState, useEffect } from 'react';
import { useCRM, useWhatsApp, useMercadoPago } from '../../hooks/integrations';
import whatsappService from '../../services/integrations/whatsapp.service';
import mercadoPagoService from '../../services/integrations/mercadopago.service';

const IntegrationsPanel = () => {
  const [integrationStatus, setIntegrationStatus] = useState({
    whatsapp: { configured: false, message: '' },
    crm: { configured: false, activeCRM: null, available: [] },
    mercadopago: { configured: false, message: '', mode: '' }
  });

  const { availableCRMs, activeCRM } = useCRM();

  useEffect(() => {
    // Verificar estado de integraciones
    const whatsappStatus = whatsappService.isConfigured();
    const mercadopagoStatus = mercadoPagoService.isConfigured();
    
    setIntegrationStatus({
      whatsapp: whatsappStatus,
      crm: {
        configured: availableCRMs.some(crm => crm.configured),
        activeCRM: activeCRM,
        available: availableCRMs
      },
      mercadopago: mercadopagoStatus
    });
  }, [availableCRMs, activeCRM]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Estado de Integraciones Externas
      </h2>

      {/* WhatsApp Business API */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              integrationStatus.whatsapp.configured ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-lg font-semibold text-gray-700">WhatsApp Business API</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            integrationStatus.whatsapp.configured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {integrationStatus.whatsapp.configured ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          {integrationStatus.whatsapp.message}
        </p>
        {!integrationStatus.whatsapp.configured && (
          <div className="ml-6 mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
            <p className="text-yellow-700">
              Configure las variables de entorno VITE_WHATSAPP_ACCESS_TOKEN y VITE_WHATSAPP_PHONE_NUMBER_ID
            </p>
          </div>
        )}
      </div>

      {/* CRM Integrations */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              integrationStatus.crm.configured ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-lg font-semibold text-gray-700">CRM Integración</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            integrationStatus.crm.configured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {integrationStatus.crm.configured ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        
        {integrationStatus.crm.configured ? (
          <div className="ml-6">
            <p className="text-sm text-gray-600 mb-3">
              CRM Activo: <span className="font-semibold text-blue-600">
                {integrationStatus.crm.activeCRM}
              </span>
            </p>
            
            <div className="space-y-2">
              {integrationStatus.crm.available.map(crm => (
                <div key={crm.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 capitalize">{crm.name}</span>
                    {crm.active && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        En uso
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center ${
                    crm.configured ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="text-sm">{crm.configured ? '✓ Configurado' : '✗ No configurado'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ml-6 mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
            <p className="text-yellow-700 mb-2">
              Configure al menos un CRM para habilitar la integración:
            </p>
            <ul className="list-disc list-inside text-yellow-600 space-y-1">
              <li>Salesforce: VITE_SALESFORCE_ACCESS_TOKEN, VITE_SALESFORCE_INSTANCE_URL</li>
              <li>HubSpot: VITE_HUBSPOT_ACCESS_TOKEN</li>
              <li>Zoho: VITE_ZOHO_ACCESS_TOKEN, VITE_ZOHO_API_DOMAIN</li>
            </ul>
          </div>
        )}
      </div>

      {/* Mercado Pago */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              integrationStatus.mercadopago.configured ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-lg font-semibold text-gray-700">Mercado Pago</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            integrationStatus.mercadopago.configured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {integrationStatus.mercadopago.configured ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          {integrationStatus.mercadopago.message}
        </p>
        {!integrationStatus.mercadopago.configured && (
          <div className="ml-6 mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
            <p className="text-yellow-700">
              Configure las variables VITE_MERCADOPAGO_ACCESS_TOKEN y VITE_MERCADOPAGO_PUBLIC_KEY
            </p>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      {integrationStatus.crm.configured && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Acciones Rápidas</h4>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Sincronizar con CRM
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Importar Deudas
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Exportar Datos
            </button>
          </div>
        </div>
      )}

      {/* Documentación */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Documentación</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a 
            href="/docs/parte2b/CONFIGURACION_WHATSAPP.md" 
            target="_blank"
            className="p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-blue-600">📱 Configurar WhatsApp</p>
            <p className="text-xs text-gray-600 mt-1">Guía de configuración completa</p>
          </a>
          <a 
            href="/docs/parte2b/CONFIGURACION_CRM.md" 
            target="_blank"
            className="p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-blue-600">🔗 Configurar CRM</p>
            <p className="text-xs text-gray-600 mt-1">Salesforce, HubSpot, Zoho</p>
          </a>
          <a 
            href="/docs/parte2b/CONFIGURACION_MERCADOPAGO.md" 
            target="_blank"
            className="p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-blue-600">💳 Configurar Mercado Pago</p>
            <p className="text-xs text-gray-600 mt-1">Procesamiento de pagos</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
