/**
 * Admin Companies Management Page - Gestión de Empresas
 *
 * Página administrativa para gestionar todas las empresas de cobranza
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, LoadingSpinner, DateFilter } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  getAllCompanies,
  getCompanyDebts,
  getCompanyPayments,
  getCompanyAgreements,
  getAllCorporateClients
} from '../../services/databaseService';
import {
  Building,
  Search,
  Filter,
  Eye,
  Edit,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCorporateClient, setFilterCorporateClient] = useState('all');
  const [corporateClients, setCorporateClients] = useState([]);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'

  useEffect(() => {
    loadCompanies();
    loadCorporateClients();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { companies: companiesData, error } = await getAllCompanies();

      if (error) {
        console.error('Error loading companies:', error);
        setError('Error al cargar empresas');
        return;
      }

      // Obtener información detallada para cada empresa
      const companiesWithDetails = await Promise.all(
        (companiesData || []).map(async (company) => {
          try {
            // Obtener deudas, pagos y acuerdos en paralelo
            const [debtsResult, paymentsResult, agreementsResult] = await Promise.all([
              getCompanyDebts(company.id),
              getCompanyPayments(company.id),
              getCompanyAgreements(company.id)
            ]);

            // Calcular estadísticas
            const totalDebts = debtsResult.debts?.length || 0;
            const totalDebtAmount = debtsResult.debts?.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0) || 0;
            const completedPayments = paymentsResult.payments?.filter(p => p.status === 'completed').length || 0;
            const totalRecovered = paymentsResult.payments?.filter(p => p.status === 'completed')
              .reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
            const activeAgreements = agreementsResult.agreements?.filter(a => a.status === 'active').length || 0;
            const recoveryRate = totalDebtAmount > 0 ? (totalRecovered / totalDebtAmount) * 100 : 0;

            return {
              ...company,
              stats: {
                totalDebts,
                totalDebtAmount,
                completedPayments,
                totalRecovered,
                activeAgreements,
                recoveryRate
              }
            };
          } catch (detailError) {
            console.error(`Error loading details for company ${company.id}:`, detailError);
            // Retornar empresa sin estadísticas detalladas
            return {
              ...company,
              stats: {
                totalDebts: 0,
                totalDebtAmount: 0,
                completedPayments: 0,
                totalRecovered: 0,
                activeAgreements: 0,
                recoveryRate: 0
              }
            };
          }
        })
      );

      setCompanies(companiesWithDetails);
    } catch (error) {
      console.error('Error in loadCompanies:', error);
      setError('Error al cargar la información de empresas');
    } finally {
      setLoading(false);
    }
  };

  const loadCorporateClients = async () => {
    try {
      const { corporateClients, error } = await getAllCorporateClients();
      if (error) {
        console.error('Error loading corporate clients:', error);
      } else {
        setCorporateClients(corporateClients || []);
      }
    } catch (error) {
      console.error('Error in loadCorporateClients:', error);
    }
  };

  // Función para aplicar filtros rápidos
  const applyQuickFilter = (filterType) => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0]; // Hoy en formato YYYY-MM-DD

    switch (filterType) {
      case 'today':
        startDate = endDate; // Desde hoy hasta hoy
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      default:
        startDate = '';
        endDate = '';
    }

    setDateFilter({ startDate, endDate });
    setQuickFilter(filterType);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setQuickFilter('');
  };

  // Función helper para calcular rangos de fechas (igual que en empresas)
  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Función para aplicar rangos predefinidos (igual que en empresas)
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setDateFilter(dates);
    setQuickFilter(range);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.rut.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'validated' && company.validation_status === 'validated') ||
                          (filterStatus === 'pending' && company.validation_status === 'pending');

    const matchesType = filterType === 'all' ||
                       (filterType === 'collection_agency' && (!company.company_type || company.company_type === 'collection_agency')) ||
                       (filterType === 'direct_creditor' && company.company_type === 'direct_creditor');

    const matchesCorporateClient = filterCorporateClient === 'all' ||
                                 (filterCorporateClient === 'none' && (!company.corporate_client_id || company.corporate_client_id === null)) ||
                                 (filterCorporateClient !== 'none' && company.corporate_client_id === filterCorporateClient);

    // Filtrar por fecha de creación
    const matchesDate = !dateFilter.startDate && !dateFilter.endDate ||
                        (dateFilter.startDate && dateFilter.endDate &&
                         new Date(company.created_at).toISOString().split('T')[0] >= dateFilter.startDate &&
                         new Date(company.created_at).toISOString().split('T')[0] <= dateFilter.endDate) ||
                        (dateFilter.startDate && !dateFilter.endDate &&
                         new Date(company.created_at).toISOString().split('T')[0] >= dateFilter.startDate) ||
                        (!dateFilter.startDate && dateFilter.endDate &&
                         new Date(company.created_at).toISOString().split('T')[0] <= dateFilter.endDate);

    return matchesSearch && matchesStatus && matchesType && matchesDate && matchesCorporateClient;
  });

  const stats = {
    total: companies.length,
    validated: companies.filter(c => c.validation_status === 'validated').length,
    pending: companies.filter(c => c.validation_status === 'pending').length,
    activeThisMonth: companies.filter(c => {
      const createdAt = new Date(c.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    // Estadísticas agregadas de todas las empresas
    totalDebts: companies.reduce((sum, c) => sum + (c.stats?.totalDebts || 0), 0),
    totalDebtAmount: companies.reduce((sum, c) => sum + (c.stats?.totalDebtAmount || 0), 0),
    totalRecovered: companies.reduce((sum, c) => sum + (c.stats?.totalRecovered || 0), 0),
    totalActiveAgreements: companies.reduce((sum, c) => sum + (c.stats?.activeAgreements || 0), 0),
    averageRecoveryRate: companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.stats?.recoveryRate || 0), 0) / companies.length
      : 0
  };

  const getCompanyTypeLabel = (type) => {
    // Por ahora no hay campo company_type, mostrar tipo genérico
    return 'Empresa de Cobranza';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar empresas</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadCompanies()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Gestión de Empresas
                </h1>
                <p className="text-primary-100 text-sm">
                  Administra todas las empresas de cobranza registradas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('last7days')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('thisMonth')}
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-2">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Building className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {stats.total}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total</p>
            <div className="flex items-center justify-center mt-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              <span className="text-xs text-green-600 font-medium">+{stats.activeThisMonth}</span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-2">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {formatCurrency(stats.totalDebtAmount)}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Deuda Total</p>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">
              {stats.totalDebts} deudas
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-2">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {formatCurrency(stats.totalRecovered)}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Recuperado</p>
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              {stats.averageRecoveryRate.toFixed(1)}% promedio
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-2">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {stats.totalActiveAgreements}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Acuerdos</p>
            <div className="text-xs text-purple-600 mt-0.5 font-medium">
              Activos
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6">
          <div className="flex flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nombre, email o RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-secondary-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[160px]"
              >
                <option value="all">Todos los Estados</option>
                <option value="validated">Validadas</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-secondary-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[180px]"
              >
                <option value="all">Todos</option>
                <option value="collection_agency">Empresas de Cobranza</option>
                <option value="direct_creditor">Acreedor Directo</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-secondary-400" />
              <select
                value={filterCorporateClient}
                onChange={(e) => setFilterCorporateClient(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
              >
                <option value="all">Todos los Clientes</option>
                <option value="none">Sin Cliente Corporativo</option>
                {corporateClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Companies List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Lista de Empresas ({filteredCompanies.length})
            </h2>
            <Button
              variant="outline"
              onClick={loadCompanies}
              leftIcon={<Building className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando empresas...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No se encontraron empresas
              </h3>
              <p className="text-secondary-600">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay empresas registradas'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-success-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{company.company_name}</h3>
                        <p className="text-secondary-600 text-sm">{company.contact_email || 'Sin email'}</p>
                        <div className="flex items-center gap-4 text-xs text-secondary-500 mt-1">
                          <span>RUT: {company.rut}</span>
                          <span>•</span>
                          <span>{getCompanyTypeLabel(company.company_type)}</span>
                          {company.contact_phone && (
                            <>
                              <span>•</span>
                              <span>Tel: {company.contact_phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge
                        variant={company.validation_status === 'validated' ? 'success' : 'warning'}
                      >
                        {company.validation_status === 'validated' ? 'Validada' : 'Pendiente'}
                      </Badge>

                      <div className="text-right text-sm text-secondary-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(new Date(company.created_at))}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="w-4 h-4" />}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas detalladas de la empresa */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {company.stats?.totalDebts || 0}
                      </div>
                      <div className="text-xs text-secondary-600">Deudas Gestionadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(company.stats?.totalDebtAmount || 0)}
                      </div>
                      <div className="text-xs text-secondary-600">Monto Gestionado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(company.stats?.totalRecovered || 0)}
                      </div>
                      <div className="text-xs text-secondary-600">Recuperado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {company.stats?.activeAgreements || 0}
                      </div>
                      <div className="text-xs text-secondary-600">Acuerdos Activos</div>
                    </div>
                  </div>

                  {/* Barra de progreso de recuperación */}
                  {company.stats?.totalDebtAmount > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-secondary-700">Tasa de Recuperación</span>
                        <span className="text-sm text-secondary-600">
                          {company.stats.recoveryRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(company.stats.recoveryRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCompaniesPage;