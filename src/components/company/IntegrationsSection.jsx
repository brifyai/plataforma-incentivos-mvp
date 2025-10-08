/**
 * Integrations Section
 *
 * Sección que agrupa todas las integraciones externas (CRM, WhatsApp, etc.)
 */

import { Card } from '../common';
import { Link2, Database, MessageCircle, Settings } from 'lucide-react';
import CRMConfiguration from './CRMConfiguration';
import CRMSyncDashboard from './CRMSyncDashboard';
import CRMCustomFields from './CRMCustomFields';
import MatchingConfidence from './MatchingConfidence';
import MatchingCriteria from './MatchingCriteria';

const IntegrationsSection = ({
  profile,
  crmConfig,
  onUpdate
}) => {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integraciones Externas</h2>
          <p className="text-gray-600">Conecta con sistemas externos para potenciar tu operación</p>
        </div>
      </div>

      {/* Dashboard de Sincronización CRM - First priority for monitoring */}
      <CRMSyncDashboard profile={profile} onUpdate={onUpdate} />

      {/* Estado de Integraciones - Shows current status */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Estado de Integraciones</h3>
            <p className="text-gray-600">Resumen del estado de tus conexiones externas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">CRM</h4>
                <p className="text-sm text-blue-700">
                  {crmConfig ? 'Configurado' : 'No configurado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">WhatsApp</h4>
                <p className="text-sm text-green-700">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Mercado Pago</h4>
                <p className="text-sm text-purple-700">Configurado</p>
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