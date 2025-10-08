/**
 * Clients Page
 *
 * Página principal para gestión de clientes de la empresa
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Select } from '../../components/common';
import ClientManagement from './components/ClientManagement';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  DollarSign,
  Building
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ClientsPage = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState('');
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalDebt: 0,
    totalPaid: 0,
    totalPending: 0
  });

  // Función para formatear números grandes de manera compacta
  const formatCompactNumber = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  useEffect(() => {
    loadCorporateClients();
    loadClients();
  }, []);

  const loadCorporateClients = async () => {
    if (!profile?.company?.id) return;

    try {
      // Por ahora simulamos los datos de clientes corporativos
      // En producción, esto debería consultar una tabla real de clientes corporativos
      const mockCorporateClients = [
        {
          id: '1',
          company_name: 'TechCorp S.A.',
          contact_name: 'María González',
          contact_email: 'maria@techcorp.cl',
          contact_phone: '+56912345678',
          company_rut: '76.543.210-1',
          address: 'Av. Providencia 123, Santiago',
          industry: 'Tecnología',
          contract_value: 5000000,
          contract_start_date: '2024-01-15',
          status: 'active',
          created_at: '2024-01-10'
        },
        {
          id: '2',
          company_name: 'RetailMax Ltda.',
          contact_name: 'Carlos Rodríguez',
          contact_email: 'carlos@retailmax.cl',
          contact_phone: '+56987654321',
          company_rut: '98.765.432-1',
          address: 'Calle Comercio 456, Concepción',
          industry: 'Retail',
          contract_value: 3200000,
          contract_start_date: '2024-02-01',
          status: 'active',
          created_at: '2024-01-25'
        }
      ];

      setCorporateClients(mockCorporateClients);
    } catch (error) {
      console.error('Error loading corporate clients:', error);
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      // Aquí iría la lógica para cargar clientes desde la base de datos
      // Por ahora simulamos datos

      const mockClients = [
        {
          id: 1,
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+56912345678',
          rut: '12.345.678-9',
          totalDebt: 2500000,
          paidAmount: 1800000,
          pendingAmount: 700000,
          lastPayment: '2024-10-05',
          status: 'active',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 2,
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@email.com',
          phone: '+56987654321',
          rut: '15.234.567-8',
          totalDebt: 1800000,
          paidAmount: 1200000,
          pendingAmount: 600000,
          lastPayment: '2024-10-03',
          status: 'active',
          riskLevel: 'medium',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        },
        {
          id: 3,
          name: 'Ana López',
          email: 'ana.lopez@email.com',
          phone: '+56911223344',
          rut: '18.345.678-1',
          totalDebt: 3200000,
          paidAmount: 2800000,
          pendingAmount: 400000,
          lastPayment: '2024-10-01',
          status: 'inactive',
          riskLevel: 'high',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 4,
          name: 'Pedro Martínez',
          email: 'pedro.martinez@email.com',
          phone: '+56944332211',
          rut: '11.456.789-2',
          totalDebt: 950000,
          paidAmount: 950000,
          pendingAmount: 0,
          lastPayment: '2024-09-28',
          status: 'completed',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        },
        {
          id: 5,
          name: 'Sofía Ramírez',
          email: 'sofia.ramirez@email.com',
          phone: '+56955667788',
          rut: '19.876.543-2',
          totalDebt: 1450000,
          paidAmount: 800000,
          pendingAmount: 650000,
          lastPayment: '2024-09-25',
          status: 'active',
          riskLevel: 'medium',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 6,
          name: 'Diego Silva',
          email: 'diego.silva@email.com',
          phone: '+56966778899',
          rut: '20.123.456-7',
          totalDebt: 2800000,
          paidAmount: 2800000,
          pendingAmount: 0,
          lastPayment: '2024-09-20',
          status: 'completed',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        },
        {
          id: 7,
          name: 'Valentina Torres',
          email: 'valentina.torres@email.com',
          phone: '+56977889900',
          rut: '21.234.567-8',
          totalDebt: 2100000,
          paidAmount: 1500000,
          pendingAmount: 600000,
          lastPayment: '2024-09-18',
          status: 'active',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 8,
          name: 'Felipe Morales',
          email: 'felipe.morales@email.com',
          phone: '+56988990011',
          rut: '22.345.678-9',
          totalDebt: 3600000,
          paidAmount: 2400000,
          pendingAmount: 1200000,
          lastPayment: '2024-09-15',
          status: 'active',
          riskLevel: 'high',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        },
        {
          id: 9,
          name: 'Camila Herrera',
          email: 'camila.herrera@email.com',
          phone: '+56999001122',
          rut: '23.456.789-0',
          totalDebt: 1750000,
          paidAmount: 1750000,
          pendingAmount: 0,
          lastPayment: '2024-09-12',
          status: 'completed',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 10,
          name: 'Matías Castro',
          email: 'matias.castro@email.com',
          phone: '+56910111213',
          rut: '24.567.890-1',
          totalDebt: 3200000,
          paidAmount: 2000000,
          pendingAmount: 1200000,
          lastPayment: '2024-09-10',
          status: 'active',
          riskLevel: 'high',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        },
        {
          id: 11,
          name: 'Isabella Vargas',
          email: 'isabella.vargas@email.com',
          phone: '+56911121314',
          rut: '25.678.901-2',
          totalDebt: 1900000,
          paidAmount: 1300000,
          pendingAmount: 600000,
          lastPayment: '2024-09-08',
          status: 'active',
          riskLevel: 'medium',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'TechCorp S.A.',
          corporateClientId: '1'
        },
        {
          id: 12,
          name: 'Sebastián Reyes',
          email: 'sebastian.reyes@email.com',
          phone: '+56912131415',
          rut: '26.789.012-3',
          totalDebt: 2700000,
          paidAmount: 2700000,
          pendingAmount: 0,
          lastPayment: '2024-09-05',
          status: 'completed',
          riskLevel: 'low',
          companyName: profile?.company?.name || 'Mi Empresa de Cobranza',
          corporateClientName: 'RetailMax Ltda.',
          corporateClientId: '2'
        }
      ];

      setClients(mockClients);

      // Calcular estadísticas
      const totalClients = mockClients.length;
      const activeClients = mockClients.filter(c => c.status === 'active').length;
      const totalDebt = mockClients.reduce((sum, c) => sum + c.totalDebt, 0);
      const totalPaid = mockClients.reduce((sum, c) => sum + c.paidAmount, 0);
      const totalPending = mockClients.reduce((sum, c) => sum + c.pendingAmount, 0);

      setStats({
        totalClients,
        activeClients,
        totalDebt,
        totalPaid,
        totalPending
      });

    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600 mt-1">
              Administra tus deudores, pagos y acuerdos de manera eficiente
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Importar
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
          <Link to="/empresa/clientes/nuevo">
            <Button
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Corporate Client Filter */}
      {corporateClients.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Filtrar por Cliente Corporativo
              </h3>
              <p className="text-sm text-blue-700">
                Muestra solo los clientes asociados a un cliente corporativo específico
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente Corporativo
              </label>
              <select
                value={selectedCorporateClient}
                onChange={(e) => setSelectedCorporateClient(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="">Mostrar todos los clientes corporativos</option>
                {corporateClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name} - {client.company_rut}
                  </option>
                ))}
              </select>
            </div>

            {selectedCorporateClient && (
              <div className="bg-white p-4 rounded-lg border border-blue-200 min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {corporateClients.find(c => c.id === selectedCorporateClient)?.company_name}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>RUT: {corporateClients.find(c => c.id === selectedCorporateClient)?.company_rut}</div>
                  <div>Industria: {corporateClients.find(c => c.id === selectedCorporateClient)?.industry}</div>
                  <div>Valor Contrato: ${corporateClients.find(c => c.id === selectedCorporateClient)?.contract_value?.toLocaleString('es-CL')}</div>
                  <div>Estado: <span className="text-green-600 font-medium">Activo</span></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-blue-900 truncate">{stats.totalClients}</div>
              <div className="text-xs text-blue-700 truncate">Total Clientes</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-green-900 truncate">{stats.activeClients}</div>
              <div className="text-xs text-green-700 truncate">Clientes Activos</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-purple-900 truncate">{formatCompactNumber(stats.totalDebt)}</div>
              <div className="text-xs text-purple-700 truncate">Deuda Total</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-emerald-900 truncate">{formatCompactNumber(stats.totalPaid)}</div>
              <div className="text-xs text-emerald-700 truncate">Total Recaudado</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-orange-900 truncate">{formatCompactNumber(stats.totalPending)}</div>
              <div className="text-xs text-orange-700 truncate">Pendiente</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Management Component */}
      <ClientManagement
        clients={clients}
        loading={loading}
        selectedCorporateClient={selectedCorporateClient}
        corporateClients={corporateClients}
      />
    </div>
  );
};

export default ClientsPage;