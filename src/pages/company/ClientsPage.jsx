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
import { getCompanyDebts, getCompanyPayments, getCorporateClients } from '../../services/databaseService';

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
      const { corporateClients, error } = await getCorporateClients(profile.company.id);
      if (error) {
        console.error('Error loading corporate clients:', error);
        setCorporateClients([]);
        return;
      }

      // Normalizar a estructura usada por el filtro local
      const normalized = (corporateClients || []).map((c) => ({
        id: c.id,
        company_name: c.name || c.business_name || 'Cliente',
        company_rut: c.rut || c.company_rut || '',
        industry: c.industry || '',
        contract_value: c.contract_value || null,
        status: c.is_active ? 'active' : 'inactive',
        created_at: c.created_at || null
      }));

      setCorporateClients(normalized);
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      setCorporateClients([]);
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);

      if (!profile?.company?.id) {
        setClients([]);
        setStats({
          totalClients: 0,
          activeClients: 0,
          totalDebt: 0,
          totalPaid: 0,
          totalPending: 0
        });
        return;
      }

      const companyId = profile.company.id;

      const [debtsRes, paymentsRes] = await Promise.all([
        getCompanyDebts(companyId),
        getCompanyPayments(companyId)
      ]);

      if (debtsRes.error) console.error('Error fetching company debts:', debtsRes.error);
      if (paymentsRes.error) console.error('Error fetching company payments:', paymentsRes.error);

      const debts = debtsRes.debts || [];
      const payments = (paymentsRes.payments || []).filter(p => p.status === 'completed');

      // Agrupar pagos por usuario
      const payByUser = {};
      for (const p of payments) {
        const uid = p.user?.id || p.user_id;
        if (!uid) continue;
        if (!payByUser[uid]) payByUser[uid] = { total: 0, last: null };
        const amt = parseFloat(p.amount) || 0;
        payByUser[uid].total += amt;
        const dt = new Date(p.transaction_date || p.date || p.created_at || Date.now());
        if (!payByUser[uid].last || dt > payByUser[uid].last) payByUser[uid].last = dt;
      }

      // Agregar deudas por usuario
      const mapByUser = new Map();
      for (const d of debts) {
        const uid = d.user?.id || d.user_id;
        if (!uid) continue;
        if (!mapByUser.has(uid)) {
          mapByUser.set(uid, {
            id: uid,
            name: d.user?.full_name || 'Usuario',
            email: d.user?.email || '',
            phone: d.user?.phone || '',
            rut: d.user?.rut || '',
            totalDebt: 0,
            paidAmount: 0,
            pendingAmount: 0,
            lastPayment: null,
            status: 'active',
            companyName: profile?.company?.business_name || profile?.company?.name || 'Empresa',
            corporateClientName: d.client?.business_name || null,
            corporateClientId: d.client?.id || null,
            firstDebtDate: d.created_at
          });
        }
        const item = mapByUser.get(uid);
        const current = parseFloat(d.current_amount ?? d.amount ?? d.original_amount ?? 0);
        item.totalDebt += isNaN(current) ? 0 : current;

        // status heurístico a partir de la deuda
        if (d.status === 'completed') {
          item.status = 'completed';
        }
        // Conservar primer registro de deuda para fallback en cálculos de atraso
        if (!item.firstDebtDate || new Date(d.created_at) < new Date(item.firstDebtDate)) {
          item.firstDebtDate = d.created_at;
        }
        // Si hay cliente asociado, mantener el último visto como etiqueta
        if (d.client?.business_name) item.corporateClientName = d.client.business_name;
        if (d.client?.id) item.corporateClientId = d.client.id;
      }

      // Aplicar pagos
      mapByUser.forEach((item, uid) => {
        const pay = payByUser[uid];
        item.paidAmount = pay ? pay.total : 0;
        item.lastPayment = pay && pay.last ? pay.last.toISOString() : null;
        item.pendingAmount = Math.max(item.totalDebt - item.paidAmount, 0);
        if (item.pendingAmount <= 0 && item.totalDebt > 0) {
          item.status = 'completed';
        }
      });

      const clientSummaries = Array.from(mapByUser.values()).sort((a, b) => b.pendingAmount - a.pendingAmount);

      setClients(clientSummaries);

      // Calcular estadísticas reales
      const totalClients = clientSummaries.length;
      const activeClients = clientSummaries.filter(c => c.status !== 'completed').length;
      const totalDebt = clientSummaries.reduce((sum, c) => sum + c.totalDebt, 0);
      const totalPaid = clientSummaries.reduce((sum, c) => sum + c.paidAmount, 0);
      const totalPending = clientSummaries.reduce((sum, c) => sum + c.pendingAmount, 0);

      setStats({
        totalClients,
        activeClients,
        totalDebt,
        totalPaid,
        totalPending
      });
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
      setStats({
        totalClients: 0,
        activeClients: 0,
        totalDebt: 0,
        totalPaid: 0,
        totalPending: 0
      });
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