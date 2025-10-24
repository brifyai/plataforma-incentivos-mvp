/**
 * Corporate Clients Page
 *
 * Página para gestión de clientes corporativos
 */

import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CorporateClientManager from './components/CorporateClientManager';
import { useAuth } from '../../context/AuthContext';

const CorporateClientsPage = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <CorporateClientManager companyId={profile?.company?.id} />
      </div>
    </DashboardLayout>
  );
};

export default CorporateClientsPage;