/**
 * Integrations Section
 *
 * Sección que agrupa todas las integraciones externas (CRM, WhatsApp, etc.)
 */

import { Card } from '../common';
import { Link2, Database, Settings } from 'lucide-react';
import CRMConfiguration from './CRMConfiguration';
import CRMSyncDashboard from './CRMSyncDashboard';
import CRMCustomFields from './CRMCustomFields';
import MatchingConfidence from './MatchingConfidence';
import MatchingCriteria from './MatchingCriteria';
import mercadoPagoService from '../../services/integrations/mercadopago.service';

const IntegrationsSection = ({
  profile,
  crmConfig,
  onUpdate
}) => {
  // Check real integration statuses
  const mercadoPagoStatus = mercadoPagoService.isConfigured();

  return (
    <div className="space-y-4 mb-6">
      {/* Dashboard de Sincronización CRM - First priority for monitoring */}
      <CRMSyncDashboard profile={profile} onUpdate={onUpdate} />

      {/* Estado de Integraciones - Shows current status */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Estado de Integraciones</h3>
            <p className="text-xs text-gray-600">Resumen del estado de tus conexiones externas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Database className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">CRM</h4>
                <p className="text-xs text-blue-700">
                  {crmConfig?.provider && crmConfig?.connected ? 'Configurado' : 'No configurado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Settings className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Mercado Pago</h4>
                <p className="text-xs text-blue-700">
                  {mercadoPagoStatus.configured ? 'Configurado' : 'No configurado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración CRM - Setup and configuration */}
      <CRMConfiguration profile={profile} onUpdate={onUpdate} />

      {/* Campos Personalizados CRM - Advanced customization */}
      <CRMCustomFields profile={profile} crmConfig={crmConfig} onUpdate={onUpdate} />

      {/* Confianza de Matching - Matching confidence metrics */}
      <MatchingConfidence stats={null} />

      {/* Criterios de Matching Inteligente - Matching criteria explanation */}
      <MatchingCriteria />
    </div>
  );
};

export default IntegrationsSection;