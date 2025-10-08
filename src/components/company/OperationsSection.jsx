/**
 * Operations Section
 *
 * Sección que agrupa todas las herramientas y operaciones diarias
 */

import { Card } from '../common';
import { Settings, Upload, CreditCard, Users, MessageSquare, FileText } from 'lucide-react';
import PaymentTools from '../../pages/company/components/PaymentTools';
import BulkImportDebts from './BulkImportDebts';
import { Link } from 'react-router-dom';

const OperationsSection = ({ profile, onImportComplete }) => {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operaciones Diarias</h2>
          <p className="text-gray-600">Herramientas para gestionar deudas y pagos</p>
        </div>
      </div>

      {/* Payment Tools */}
      <div className="mb-6">
        <PaymentTools />
      </div>

      {/* Bulk Import */}
      <div className="mb-6">
        <BulkImportDebts profile={profile} onImportComplete={onImportComplete} />
      </div>

    </div>
  );
};

export default OperationsSection;