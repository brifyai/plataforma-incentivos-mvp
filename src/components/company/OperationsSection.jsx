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
    <div className="space-y-4 mb-6">
      {/* Payment Tools */}
      <div className="mb-4">
        <PaymentTools />
      </div>

      {/* Bulk Import */}
      <div className="mb-4">
        <BulkImportDebts profile={profile} onImportComplete={onImportComplete} />
      </div>

    </div>
  );
};

export default OperationsSection;