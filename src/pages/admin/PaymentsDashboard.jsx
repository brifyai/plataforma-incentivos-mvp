/**
 * Payments Dashboard - Modo Administrador
 *
 * Dashboard administrativo para gestión de pagos y transferencias
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import { getPaymentStats, getRecentPayments, getPendingPayments, getAllDebtors, getAllCompanies, createPayment, updatePayment } from '../../services/databaseService';
import {
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  BarChart3,
  DollarSign,
  Users,
  Building,
  PlusCircle,
  Search,
  Calendar,
} from 'lucide-react';

const PaymentsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    averagePayment: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    debtorId: '',
    companyId: '',
    amount: '',
    description: '',
    debtReference: ''
  });
  const [debtors, setDebtors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResult, recentResult, pendingResult] = await Promise.all([
          getPaymentStats(),
          getRecentPayments(),
          getPendingPayments()
        ]);

        if (statsResult.error) {
          setError(statsResult.error);
        } else {
          setPaymentStats(statsResult.stats);
        }

        if (recentResult.error) {
          console.error('Error fetching recent payments:', recentResult.error);
        } else {
          setRecentPayments(recentResult.payments);
        }

        if (pendingResult.error) {
          console.error('Error fetching pending payments:', pendingResult.error);
        } else {
          setPendingPayments(pendingResult.payments);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completado</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="danger">Fallido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const handleReportsClick = () => {
    setShowReportsModal(true);
  };

  const handleReconciliationClick = () => {
    setShowReconciliationModal(true);
  };

  const handleIntegrationsClick = () => {
    setShowIntegrationsModal(true);
  };

  const handleMercadoPagoClick = () => {
    navigate('/admin/mercadopago');
  };

  const handleBanksClick = () => {
    navigate('/admin/bancos');
  };

  const handleAnalyticsClick = () => {
    navigate('/admin/analytics');
  };

  const handleNotificationsClick = () => {
    navigate('/admin/notificaciones');
  };

  const handleCommissionsClick = () => {
    navigate('/admin/comisiones');
  };

  const generateReport = async (type) => {
    // Simular generación de reporte
    await Swal.fire({
      icon: 'info',
      title: 'Generando Reporte',
      text: `Generando reporte de ${type}...`,
      confirmButtonText: 'Aceptar'
    });
    setShowReportsModal(false);
  };

  const runReconciliation = async () => {
    // Simular proceso de conciliación
    await Swal.fire({
      icon: 'info',
      title: 'Ejecutando Conciliación',
      text: 'Ejecutando conciliación automática...',
      confirmButtonText: 'Aceptar'
    });
    setShowReconciliationModal(false);
  };

  const handlePaymentSelect = (paymentId) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === pendingPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(pendingPayments.map(p => p.id));
    }
  };

  const handleBulkApproval = async () => {
    if (selectedPayments.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selección requerida',
        text: 'Selecciona al menos un pago para aprobar',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    setShowBulkApprovalModal(true);
  };

  const handleViewAllPayments = () => {
    setShowAllPayments(!showAllPayments);
    // Recargar datos con el nuevo límite
    const fetchData = async () => {
      try {
        const [statsResult, recentResult, pendingResult] = await Promise.all([
          getPaymentStats(),
          getRecentPayments(!showAllPayments ? 50 : 10), // Toggle the limit
          getPendingPayments()
        ]);

        if (statsResult.error) {
          setError(statsResult.error);
        } else {
          setPaymentStats(statsResult.stats);
        }

        if (recentResult.error) {
          console.error('Error fetching recent payments:', recentResult.error);
        } else {
          setRecentPayments(recentResult.payments);
        }

        if (pendingResult.error) {
          console.error('Error fetching pending payments:', pendingResult.error);
        } else {
          setPendingPayments(pendingResult.payments);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard.');
      }
    };

    fetchData();
  };

  const handleCreatePayment = async () => {
    setShowCreatePaymentModal(true);
    setLoadingDebtors(true);
    setLoadingCompanies(true);

    // Cargar deudores y empresas reales
    try {
      const [debtorsResult, companiesResult] = await Promise.all([
        getAllDebtors(),
        getAllCompanies()
      ]);

      if (debtorsResult.error) {
        console.error('Error loading debtors:', debtorsResult.error);
        setDebtors([]);
      } else {
        const debtorOptions = (debtorsResult.debtors || []).map(debtor => ({
          value: debtor.id,
          label: `${debtor.full_name} (${debtor.rut})`
        }));
        setDebtors(debtorOptions);
      }

      if (companiesResult.error) {
        console.error('Error loading companies:', companiesResult.error);
        setCompanies([]);
      } else {
        const companyOptions = (companiesResult.companies || []).map(company => ({
          value: company.id,
          label: company.company_name
        }));
        setCompanies(companyOptions);
      }
    } catch (error) {
      console.error('Error loading debtors and companies:', error);
      setDebtors([]);
      setCompanies([]);
    } finally {
      setLoadingDebtors(false);
      setLoadingCompanies(false);
    }
  };

  const handleCreatePaymentSubmit = async () => {
    try {
      // Validar datos
      if (!newPaymentData.debtorId || !newPaymentData.companyId || !newPaymentData.amount || !newPaymentData.description) {
        await Swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Por favor, completa todos los campos obligatorios',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      const paymentAmount = parseFloat(newPaymentData.amount);
      if (paymentAmount <= 0) {
        await Swal.fire({
          icon: 'error',
          title: 'Monto inválido',
          text: 'El monto del pago debe ser mayor a 0',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      // Crear el pago en la base de datos
      const paymentData = {
        user_id: newPaymentData.debtorId,
        company_id: newPaymentData.companyId,
        amount: paymentAmount,
        status: 'awaiting_validation', // Los pagos creados por admin necesitan validación
        payment_method: 'admin_created',
        notes: newPaymentData.description,
        debt_reference: newPaymentData.debtReference || null
      };

      const { payment, error } = await createPayment(paymentData);

      if (error) {
        console.error('Error creating payment:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear el pago',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Pago creado exitosamente',
        html: `ID: ${payment.id}<br>Monto: $${paymentAmount.toLocaleString('es-CL')}<br>Estado: Esperando validación`,
        confirmButtonText: 'Aceptar'
      });

      // Resetear formulario
      setNewPaymentData({
        debtorId: '',
        companyId: '',
        amount: '',
        description: '',
        debtReference: ''
      });

      setShowCreatePaymentModal(false);

      // Recargar datos para mostrar el nuevo pago
      const fetchData = async () => {
        try {
          const [statsResult, recentResult, pendingResult] = await Promise.all([
            getPaymentStats(),
            getRecentPayments(showAllPayments ? 50 : 10), // Mostrar más cuando se active "ver todos"
            getPendingPayments()
          ]);

          if (statsResult.error) {
            setError(statsResult.error);
          } else {
            setPaymentStats(statsResult.stats);
          }

          if (recentResult.error) {
            console.error('Error fetching recent payments:', recentResult.error);
          } else {
            setRecentPayments(recentResult.payments);
          }

          if (pendingResult.error) {
            console.error('Error fetching pending payments:', pendingResult.error);
          } else {
            setPendingPayments(pendingResult.payments);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      };

      fetchData();
    } catch (error) {
      console.error('Error in handleCreatePaymentSubmit:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al crear el pago',
        text: error.message,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const confirmBulkApproval = async () => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Aprobando pagos',
        text: `Aprobando ${selectedPayments.length} pago(s)...`,
        confirmButtonText: 'Aceptar'
      });

      // Aprobar cada pago seleccionado
      const approvalPromises = selectedPayments.map(async (paymentId) => {
        const updateData = {
          status: 'completed',
          transaction_id: `ADMIN_APPROVED_${Date.now()}_${paymentId}`
        };

        const { error } = await updatePayment(paymentId, updateData);
        if (error) {
          console.error(`Error approving payment ${paymentId}:`, error);
          throw new Error(`Error al aprobar pago ${paymentId}: ${error}`);
        }

        return paymentId;
      });

      // Esperar a que todos los pagos sean aprobados
      await Promise.all(approvalPromises);

      // Remover pagos aprobados de la lista local
      setPendingPayments(prev =>
        prev.filter(p => !selectedPayments.includes(p.id))
      );

      setSelectedPayments([]);
      setShowBulkApprovalModal(false);

      await Swal.fire({
        icon: 'success',
        title: 'Pagos aprobados',
        text: `${selectedPayments.length} pago(s) aprobado(s) exitosamente. Los fondos han sido transferidos a las empresas.`,
        confirmButtonText: 'Aceptar'
      });

      // Recargar estadísticas para reflejar los cambios
      const statsResult = await getPaymentStats();
      if (!statsResult.error) {
        setPaymentStats(statsResult.stats);
      }

      // Recargar pagos recientes
      const recentResult = await getRecentPayments();
      if (!recentResult.error) {
        setRecentPayments(recentResult.payments);
      }

    } catch (error) {
      console.error('Error in confirmBulkApproval:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al aprobar pagos',
        text: error.message,
        confirmButtonText: 'Aceptar'
      });
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Dashboard de Pagos
              </h1>
              <p className="text-blue-100 text-lg">
                Gestión completa del sistema de pagos y transferencias
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            {/* Filters Section - 2 lines */}
            <div className="flex flex-col gap-3 ml-16">
              {/* First line: Quick filter buttons */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-300" />
                  <span className="text-sm font-medium text-blue-100">Filtrar por período:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => applyQuickFilter('today')}
                    className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                      quickFilter === 'today'
                        ? 'bg-blue-800 border-blue-700'
                        : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => applyQuickFilter('week')}
                    className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
                      quickFilter === 'week'
                        ? 'bg-blue-800 border-blue-700'
                        : 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => applyQuickFilter('month')}
                    className={`px-3 py-2 text-xs font-semibold text-white rounded-lg border transition-colors ${
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
                      className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Second line: Custom date range */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="startDate" className="text-sm text-blue-200">Desde:</label>
                  <input
                    id="startDate"
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => {
                      setDateFilter(prev => ({ ...prev, startDate: e.target.value }));
                      setQuickFilter(''); // Clear quick filter when manual date is selected
                    }}
                    className="px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="endDate" className="text-sm text-blue-200">Hasta:</label>
                  <input
                    id="endDate"
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => {
                      setDateFilter(prev => ({ ...prev, endDate: e.target.value }));
                      setQuickFilter(''); // Clear quick filter when manual date is selected
                    }}
                    className="px-3 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 focus:border-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Create Payment Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreatePayment}
              leftIcon={<PlusCircle className="w-5 h-5" />}
            >
              Crear Pago
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Total Pagos</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Monto Total</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(paymentStats.totalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Pendientes</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.pendingPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Completados</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.completedPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Fallidos</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.failedPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Promedio</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(paymentStats.averagePayment)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Recent Payments */}
      <Card
        title={showAllPayments ? "Todos los Pagos" : "Pagos Recientes"}
        subtitle={showAllPayments ? "Historial completo de transacciones" : "Últimas transacciones del sistema"}
        headerAction={
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleViewAllPayments}
          >
            {showAllPayments ? 'Ver menos' : 'Ver todos'}
          </Button>
        }
      >
        <div className="space-y-4">
          {recentPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(payment.status)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{payment.user}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium text-gray-700">{payment.company}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{payment.method}</span>
                    <span>•</span>
                    <span>{formatDate(payment.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
                {getStatusBadge(payment.status)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Payments Approval */}
      <Card
        title="Aprobación de Pagos Pendientes"
        subtitle={`${pendingPayments.length} pago(s) esperando aprobación`}
        headerAction={
          selectedPayments.length > 0 && (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleBulkApproval}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Aprobar {selectedPayments.length} Pago(s)
            </Button>
          )
        }
      >
        {pendingPayments.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-gray-500">No hay pagos pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedPayments.length === pendingPayments.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900">
                Seleccionar todos ({pendingPayments.length})
              </span>
            </div>

            {/* Payments List */}
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                    selectedPayments.includes(payment.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(payment.id)}
                    onChange={() => handlePaymentSelect(payment.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{payment.debtor}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium text-gray-700">{payment.company}</span>
                      <Badge variant="warning">Pendiente</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Ref: {payment.debt_reference}</span>
                      <span>•</span>
                      <span>{payment.payment_method}</span>
                      <span>•</span>
                      <span>{formatDate(payment.submitted_date)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Monto a transferir
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          padding={false}
          className="hover:shadow-medium hover:border-blue-300 transition-all cursor-pointer h-full"
          onClick={handleReportsClick}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Reportes</h3>
            </div>
            <p className="text-sm text-gray-600">
              Generar reportes financieros y estadísticas
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Generar Reporte
              </Button>
            </div>
          </div>
        </Card>

        <Card
          padding={false}
          className="hover:shadow-medium hover:border-green-300 transition-all cursor-pointer h-full"
          onClick={handleReconciliationClick}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Conciliación</h3>
            </div>
            <p className="text-sm text-gray-600">
              Conciliar pagos y transferencias automáticas
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Ejecutar Conciliación
              </Button>
            </div>
          </div>
        </Card>

        <Card
          padding={false}
          className="hover:shadow-medium hover:border-purple-300 transition-all cursor-pointer h-full"
          onClick={handleIntegrationsClick}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Integraciones</h3>
            </div>
            <p className="text-sm text-gray-600">
              Gestionar integraciones con bancos y pasarelas
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Configurar Integraciones
              </Button>
            </div>
          </div>
        </Card>

        <Card
          padding={false}
          className="hover:shadow-medium hover:border-green-300 transition-all cursor-pointer h-full"
          onClick={handleCommissionsClick}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Comisiones</h3>
            </div>
            <p className="text-sm text-gray-600">
              Gestionar comisiones por empresa y negociaciones
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Gestionar Comisiones
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Modal */}
      <Modal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        title="Generar Reportes"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer" onClick={() => generateReport('pagos')}>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Reporte de Pagos</h3>
              </div>
              <p className="text-sm text-gray-600">Análisis completo de todos los pagos procesados</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer" onClick={() => generateReport('financiero')}>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-900">Reporte Financiero</h3>
              </div>
              <p className="text-sm text-gray-600">Estados financieros y balances</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer" onClick={() => generateReport('empresas')}>
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Reporte por Empresa</h3>
              </div>
              <p className="text-sm text-gray-600">Análisis de rendimiento por empresa</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer" onClick={() => generateReport('tendencias')}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Tendencias</h3>
              </div>
              <p className="text-sm text-gray-600">Análisis de tendencias y patrones</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowReportsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reconciliation Modal */}
      <Modal
        isOpen={showReconciliationModal}
        onClose={() => setShowReconciliationModal(false)}
        title="Conciliación Automática"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
              <Users className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ejecutar Conciliación
            </h3>
            <p className="text-gray-600">
              Este proceso verificará automáticamente la consistencia entre los pagos registrados y las transacciones bancarias.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">¿Qué hace la conciliación?</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Verifica montos y fechas de transacciones</li>
              <li>• Identifica discrepancias entre sistemas</li>
              <li>• Actualiza estados de pagos automáticamente</li>
              <li>• Genera reportes de inconsistencias</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowReconciliationModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={runReconciliation}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Ejecutar Conciliación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Integrations Modal */}
      <Modal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        title="Gestión de Integraciones"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mercado Pago</h3>
                  <Badge variant="success" size="sm">Conectado</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Integración activa para pagos en línea</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMercadoPagoClick}
              >
                Configurar
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bancos</h3>
                  <Badge variant="warning" size="sm">Pendiente</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Conexión con sistemas bancarios</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBanksClick}
              >
                Configurar
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics</h3>
                  <Badge variant="secondary" size="sm">No configurado</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Herramientas de análisis avanzado</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyticsClick}
              >
                Configurar
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                  <Badge variant="success" size="sm">Activo</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Sistema de notificaciones push</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotificationsClick}
              >
                Configurar
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowIntegrationsModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Payment Modal */}
      <Modal
        isOpen={showCreatePaymentModal}
        onClose={() => setShowCreatePaymentModal(false)}
        title="Crear Nuevo Pago"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Seleccionar Deudor"
              value={newPaymentData.debtorId}
              onChange={(value) => setNewPaymentData(prev => ({ ...prev, debtorId: value }))}
              options={[
                { value: '', label: loadingDebtors ? 'Cargando deudores...' : 'Seleccionar deudor...' },
                ...debtors
              ]}
              required
              disabled={loadingDebtors}
            />

            <Select
              label="Seleccionar Empresa"
              value={newPaymentData.companyId}
              onChange={(value) => setNewPaymentData(prev => ({ ...prev, companyId: value }))}
              options={[
                { value: '', label: loadingCompanies ? 'Cargando empresas...' : 'Seleccionar empresa...' },
                ...companies
              ]}
              required
              disabled={loadingCompanies}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto del Pago"
              type="number"
              value={newPaymentData.amount}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Referencia de Deuda (Opcional)"
              value={newPaymentData.debtReference}
              onChange={(e) => setNewPaymentData(prev => ({ ...prev, debtReference: e.target.value }))}
              placeholder="REF-001"
            />
          </div>

          <Input
            label="Descripción del Pago"
            value={newPaymentData.description}
            onChange={(e) => setNewPaymentData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descripción del pago..."
            required
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Información del Incentivo</h4>
                <p className="text-sm text-blue-700">
                  Al procesar este pago, el deudor recibirá automáticamente un incentivo del 5% del monto pagado
                  en su billetera digital.
                </p>
                {newPaymentData.amount && (
                  <p className="text-sm font-semibold text-blue-800 mt-2">
                    Incentivo calculado: ${((parseFloat(newPaymentData.amount) || 0) * 0.05).toLocaleString('es-CL')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCreatePaymentModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreatePaymentSubmit}
              className="flex-1"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Crear y Procesar Pago
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Approval Modal */}
      <Modal
        isOpen={showBulkApprovalModal}
        onClose={() => setShowBulkApprovalModal(false)}
        title="Confirmar Aprobación Masiva"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aprobar {selectedPayments.length} Pago(s)
            </h3>
            <p className="text-gray-600">
              ¿Estás seguro de que quieres aprobar estos pagos? Una vez aprobados, las transferencias se procesarán automáticamente hacia las empresas de cobranza.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Resumen de la aprobación:</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Pagos seleccionados:</span>
                <span className="font-semibold">{selectedPayments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto total a transferir:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    pendingPayments
                      .filter(p => selectedPayments.includes(p.id))
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-yellow-100 rounded">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Esta acción procesará transferencias automáticas a las cuentas bancarias registradas de las empresas de cobranza. Asegúrate de que los fondos estén disponibles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkApprovalModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmBulkApproval}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Confirmar Aprobación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsDashboard;