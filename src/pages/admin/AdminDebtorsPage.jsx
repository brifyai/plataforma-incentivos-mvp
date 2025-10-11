/**
 * Admin Debtors Management Page - Gestión de Deudores
 *
 * Página administrativa para gestionar todos los usuarios deudores
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, LoadingSpinner, DateFilter, Modal } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  getAllUsers,
  getUserDebts,
  getUserPayments,
  getWalletBalance,
  getAllCorporateClients
} from '../../services/databaseService';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  UserCheck,
  UserX,
  TrendingUp,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';

const AdminDebtorsPage = () => {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCorporateClient, setFilterCorporateClient] = useState('all');
  const [corporateClients, setCorporateClients] = useState([]);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDebtors();
    loadCorporateClients();
  }, []);

  const loadDebtors = async () => {
    try {
      setLoading(true);
      setError(null);

      const { users, error } = await getAllUsers();

      if (error) {
        console.error('Error loading debtors:', error);
        setError('Error al cargar deudores');
        return;
      }

      // Filtrar solo deudores
      const debtorsData = users.filter(user => user.role === 'debtor');

      // Obtener información detallada para cada deudor
      const debtorsWithDetails = await Promise.all(
        debtorsData.map(async (debtor) => {
          try {
            // Obtener deudas, pagos y balance en paralelo
            const [debtsResult, paymentsResult, walletResult] = await Promise.all([
              getUserDebts(debtor.id),
              getUserPayments(debtor.id),
              getWalletBalance(debtor.id)
            ]);

            // Calcular estadísticas
            const totalDebts = debtsResult.debts?.length || 0;
            const totalDebtAmount = debtsResult.debts?.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0) || 0;
            const completedPayments = paymentsResult.payments?.filter(p => p.status === 'completed').length || 0;
            const totalPaid = paymentsResult.payments?.filter(p => p.status === 'completed')
              .reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
            const walletBalance = walletResult.balance || 0;

            return {
              ...debtor,
              stats: {
                totalDebts,
                totalDebtAmount,
                completedPayments,
                totalPaid,
                walletBalance,
                recoveryRate: totalDebtAmount > 0 ? (totalPaid / totalDebtAmount) * 100 : 0
              }
            };
          } catch (detailError) {
            console.error(`Error loading details for debtor ${debtor.id}:`, detailError);
            // Retornar deudor sin estadísticas detalladas
            return {
              ...debtor,
              stats: {
                totalDebts: 0,
                totalDebtAmount: 0,
                completedPayments: 0,
                totalPaid: 0,
                walletBalance: 0,
                recoveryRate: 0
              }
            };
          }
        })
      );

      setDebtors(debtorsWithDetails);
    } catch (error) {
      console.error('Error in loadDebtors:', error);
      setError('Error al cargar la información de deudores');
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

  // Función para editar deudor
  const handleEditDebtor = async (debtorData) => {
    setIsSubmitting(true);
    try {
      const { updateUser } = await import('../../services/databaseService');
      const { error } = await updateUser(debtorData.id, debtorData);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar deudor',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setShowEditModal(false);
      setSelectedDebtor(null);
      loadDebtors(); // Recargar lista
    } catch (error) {
      console.error('Error updating debtor:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar deudor',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDebtors = debtors.filter(debtor => {
    const matchesSearch = debtor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          debtor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (debtor.rut && debtor.rut.includes(searchTerm));

    const matchesFilter = filterStatus === 'all' ||
                          (filterStatus === 'validated' && debtor.validation_status === 'validated') ||
                          (filterStatus === 'pending' && debtor.validation_status === 'pending');

    const matchesCorporateClient = filterCorporateClient === 'all' ||
                                 (filterCorporateClient === 'none' && (!debtor.corporate_client_id || debtor.corporate_client_id === null)) ||
                                 (filterCorporateClient !== 'none' && debtor.corporate_client_id === filterCorporateClient);

    // Filtrar por fecha de creación
    const matchesDate = !dateFilter.startDate && !dateFilter.endDate ||
                        (dateFilter.startDate && dateFilter.endDate &&
                         new Date(debtor.created_at).toISOString().split('T')[0] >= dateFilter.startDate &&
                         new Date(debtor.created_at).toISOString().split('T')[0] <= dateFilter.endDate) ||
                        (dateFilter.startDate && !dateFilter.endDate &&
                         new Date(debtor.created_at).toISOString().split('T')[0] >= dateFilter.startDate) ||
                        (!dateFilter.startDate && dateFilter.endDate &&
                         new Date(debtor.created_at).toISOString().split('T')[0] <= dateFilter.endDate);

    return matchesSearch && matchesFilter && matchesDate && matchesCorporateClient;
  });

  const stats = {
    total: debtors.length,
    validated: debtors.filter(d => d.validation_status === 'validated').length,
    pending: debtors.filter(d => d.validation_status === 'pending').length,
    activeThisMonth: debtors.filter(d => {
      const createdAt = new Date(d.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    // Estadísticas agregadas de todos los deudores
    totalDebts: debtors.reduce((sum, d) => sum + (d.stats?.totalDebts || 0), 0),
    totalDebtAmount: debtors.reduce((sum, d) => sum + (d.stats?.totalDebtAmount || 0), 0),
    totalPaid: debtors.reduce((sum, d) => sum + (d.stats?.totalPaid || 0), 0),
    totalWalletBalance: debtors.reduce((sum, d) => sum + (d.stats?.walletBalance || 0), 0),
    averageRecoveryRate: debtors.length > 0
      ? debtors.reduce((sum, d) => sum + (d.stats?.recoveryRate || 0), 0) / debtors.length
      : 0
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar deudores</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadDebtors()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Gestión de Deudores
              </h1>
              <p className="text-blue-100 text-lg">
                Administra todos los usuarios deudores de la plataforma
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Quick Filter Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-100">Filtrar por período:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => applyQuickFilter('today')}
                  className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                    quickFilter === 'today'
                      ? 'bg-blue-800 border-blue-700'
                      : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => applyQuickFilter('week')}
                  className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                    quickFilter === 'week'
                      ? 'bg-blue-800 border-blue-700'
                      : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => applyQuickFilter('month')}
                  className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                    quickFilter === 'month'
                      ? 'bg-blue-800 border-blue-700'
                      : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                  }`}
                >
                  Mes
                </button>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={clearFilters}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-xs sm:text-sm text-blue-200 whitespace-nowrap">Desde:</label>
                <input
                  id="startDate"
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => {
                    setDateFilter(prev => ({ ...prev, startDate: e.target.value }));
                    setQuickFilter(''); // Clear quick filter when manual date is selected
                  }}
                  className="px-2 sm:px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm w-full sm:w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-xs sm:text-sm text-blue-200 whitespace-nowrap">Hasta:</label>
                <input
                  id="endDate"
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => {
                    setDateFilter(prev => ({ ...prev, endDate: e.target.value }));
                    setQuickFilter(''); // Clear quick filter when manual date is selected
                  }}
                  className="px-2 sm:px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm w-full sm:w-auto"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mx-auto mb-2 shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-1">{stats.total}</h3>
            <p className="text-blue-700 font-medium text-sm">Total Deudores</p>
            <div className="flex items-center justify-center mt-1">
              <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">+{stats.activeThisMonth} este mes</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg mx-auto mb-2 shadow-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-1">{formatCurrency(stats.totalDebtAmount)}</h3>
            <p className="text-red-700 font-medium text-sm">Total Deuda</p>
            <div className="text-xs text-red-600 mt-1 font-medium">
              {stats.totalDebts} deudas activas
            </div>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mx-auto mb-2 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-1">{formatCurrency(stats.totalPaid)}</h3>
            <p className="text-green-700 font-medium text-sm">Total Recuperado</p>
            <div className="text-xs text-green-600 mt-1 font-medium">
              {stats.averageRecoveryRate.toFixed(1)}% tasa promedio
            </div>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mx-auto mb-2 shadow-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-1">{formatCurrency(stats.totalWalletBalance)}</h3>
            <p className="text-purple-700 font-medium text-sm">Balance en Wallets</p>
            <div className="text-xs text-purple-600 mt-1 font-medium">
              Incentivos acumulados
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mt-6">
        <div className="p-6">
          <div className="flex flex-row gap-4">
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
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos</option>
                <option value="validated">Validados</option>
                <option value="pending">Pendientes</option>
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

      {/* Debtors List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Lista de Deudores ({filteredDebtors.length})
            </h2>
            <Button
              variant="outline"
              onClick={loadDebtors}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando deudores...</p>
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No se encontraron deudores
              </h3>
              <p className="text-secondary-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay deudores registrados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDebtors.map((debtor) => (
                <div
                  key={debtor.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">
                            {debtor.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{debtor.full_name}</h3>
                          <p className="text-gray-600 text-sm mb-1">{debtor.email}</p>
                          {debtor.rut && (
                            <p className="text-gray-500 text-xs font-medium">RUT: {debtor.rut}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          variant={debtor.validation_status === 'validated' ? 'success' : 'warning'}
                          className="px-3 py-1"
                        >
                          {debtor.validation_status === 'validated' ? 'Validado' : 'Pendiente'}
                        </Badge>

                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(new Date(debtor.created_at))}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedDebtor(debtor);
                              setShowViewModal(true);
                            }}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedDebtor(debtor);
                              setShowEditModal(true);
                            }}
                            className="hover:bg-green-50 hover:border-green-300"
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas detalladas del deudor */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {debtor.stats?.totalDebts || 0}
                      </div>
                      <div className="text-xs text-secondary-600">Deudas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(debtor.stats?.totalDebtAmount || 0)}
                      </div>
                      <div className="text-xs text-secondary-600">Deuda Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(debtor.stats?.totalPaid || 0)}
                      </div>
                      <div className="text-xs text-secondary-600">Pagado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {formatCurrency(debtor.stats?.walletBalance || 0)}
                      </div>
                      <div className="text-xs text-secondary-600">Wallet</div>
                    </div>
                  </div>

                  {/* Barra de progreso de recuperación */}
                  {debtor.stats?.totalDebtAmount > 0 && (
                    <div className="px-6 pb-6">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-secondary-700">Progreso de Recuperación</span>
                        <span className="text-sm text-secondary-600">
                          {debtor.stats.recoveryRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(debtor.stats.recoveryRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* View Debtor Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedDebtor(null);
        }}
        title="Detalles del Deudor"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl inline-block mb-4">
              <Eye className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Información del Deudor
            </h3>
            <p className="text-secondary-600">
              Detalles completos del deudor seleccionado
            </p>
          </div>

          {selectedDebtor && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <p className="text-gray-900">{selectedDebtor.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedDebtor.email}</p>
                  </div>
                  {selectedDebtor.rut && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                      <p className="text-gray-900">{selectedDebtor.rut}</p>
                    </div>
                  )}
                  {selectedDebtor.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <p className="text-gray-900">{selectedDebtor.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Validación</label>
                    <Badge
                      variant={selectedDebtor.validation_status === 'validated' ? 'success' : 'warning'}
                      className="mt-1"
                    >
                      {selectedDebtor.validation_status === 'validated' ? 'Validado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro</label>
                    <p className="text-gray-900">{formatDate(new Date(selectedDebtor.created_at))}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {selectedDebtor.stats && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Estadísticas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedDebtor.stats.totalDebts || 0}</div>
                      <div className="text-sm text-blue-700">Deudas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedDebtor.stats.totalDebtAmount || 0)}</div>
                      <div className="text-sm text-red-700">Deuda Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedDebtor.stats.totalPaid || 0)}</div>
                      <div className="text-sm text-green-700">Pagado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(selectedDebtor.stats.walletBalance || 0)}</div>
                      <div className="text-sm text-purple-700">Wallet</div>
                    </div>
                  </div>
                  {selectedDebtor.stats.totalDebtAmount > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-blue-700">Progreso de Recuperación</span>
                        <span className="text-sm text-blue-600">{selectedDebtor.stats.recoveryRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(selectedDebtor.stats.recoveryRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false);
                setSelectedDebtor(null);
              }}
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Debtor Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDebtor(null);
        }}
        title="Editar Deudor"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
              <Edit className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Editar Deudor
            </h3>
            <p className="text-secondary-600">
              Modifique la información del deudor
            </p>
          </div>

          {selectedDebtor && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const debtorData = {
                id: selectedDebtor.id,
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                rut: formData.get('rut'),
                phone: formData.get('phone'),
                validation_status: formData.get('validation_status'),
              };
              handleEditDebtor(debtorData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nombre Completo *
                  </label>
                  <Input
                    name="full_name"
                    required
                    defaultValue={selectedDebtor.full_name}
                    placeholder="Ingrese el nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    defaultValue={selectedDebtor.email}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    RUT *
                  </label>
                  <Input
                    name="rut"
                    required
                    defaultValue={selectedDebtor.rut}
                    placeholder="12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    name="phone"
                    defaultValue={selectedDebtor.phone}
                    placeholder="+56912345678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Estado de Validación *
                  </label>
                  <select
                    name="validation_status"
                    required
                    defaultValue={selectedDebtor.validation_status}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="validated">Validado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDebtor(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  type="submit"
                  loading={isSubmitting}
                  className="flex-1"
                  leftIcon={<Edit className="w-4 h-4" />}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminDebtorsPage;