/**
 * Company Verification Dashboard
 *
 * Dashboard administrativo para revisar verificaciones de empresas
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge, Select } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  User,
  Building,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  CheckSquare,
  XSquare,
  Calendar
} from 'lucide-react';
import {
  getPendingVerifications,
  makeVerificationDecision,
  getVerificationStats,
  VERIFICATION_STATUS
} from '../../services/verificationService';
import Swal from 'sweetalert2';

const CompanyVerificationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [quickFilter, setQuickFilter] = useState(''); // 'today', 'week', 'month'

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [verificationsResult, statsResult] = await Promise.all([
        getPendingVerifications(filters),
        getVerificationStats()
      ]);

      if (verificationsResult.error) {
        console.error('Error loading verifications:', verificationsResult.error);
      } else {
        setVerifications(verificationsResult.verifications);
      }

      if (statsResult.error) {
        console.error('Error loading stats:', statsResult.error);
      } else {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      Swal.fire('Error', 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [VERIFICATION_STATUS.SUBMITTED]: { variant: 'info', text: 'Enviado', icon: Clock },
      [VERIFICATION_STATUS.UNDER_REVIEW]: { variant: 'warning', text: 'En Revisión', icon: RefreshCw },
      [VERIFICATION_STATUS.APPROVED]: { variant: 'success', text: 'Aprobado', icon: CheckCircle },
      [VERIFICATION_STATUS.REJECTED]: { variant: 'danger', text: 'Rechazado', icon: AlertCircle },
      [VERIFICATION_STATUS.NEEDS_CORRECTIONS]: { variant: 'warning', text: 'Correcciones', icon: AlertCircle }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const openReviewModal = (verification) => {
    setSelectedVerification(verification);
    setReviewDecision('');
    setReviewNotes('');
    setRejectionReason('');
    setShowReviewModal(true);
  };

  const handleDecision = async () => {
    if (!reviewDecision) {
      Swal.fire('Error', 'Debe seleccionar una decisión', 'error');
      return;
    }

    if (reviewDecision === 'reject' && !rejectionReason.trim()) {
      Swal.fire('Error', 'Debe especificar el motivo del rechazo', 'error');
      return;
    }

    try {
      setProcessingDecision(true);

      const decision = {
        type: reviewDecision,
        notes: reviewNotes,
        rejectionReason: rejectionReason,
        previousStatus: selectedVerification.status
      };

      const { success, error } = await makeVerificationDecision(
        selectedVerification.id,
        decision,
        'admin-user-id' // En implementación real, obtener del contexto
      );

      if (success) {
        Swal.fire('Éxito', 'Decisión registrada correctamente', 'success');
        setShowReviewModal(false);
        loadData(); // Recargar datos
      } else {
        Swal.fire('Error', error, 'error');
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      Swal.fire('Error', 'Error al procesar la decisión', 'error');
    } finally {
      setProcessingDecision(false);
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

    setFilters({...filters, startDate, endDate});
    setQuickFilter(filterType);
  };

  // Función helper para calcular rangos de fechas
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

  // Función para aplicar rangos predefinidos
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setFilters({...filters, startDate: dates.startDate, endDate: dates.endDate});
    setQuickFilter(range);
  };

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = !filters.search ||
      v.company?.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      v.company?.rut?.includes(filters.search);

    const matchesStatus = !filters.status || v.status === filters.status;

    // Filtrar por fecha de creación
    const matchesDate = !filters.startDate && !filters.endDate ||
                      (filters.startDate && filters.endDate &&
                       new Date(v.submitted_at).toISOString().split('T')[0] >= filters.startDate &&
                       new Date(v.submitted_at).toISOString().split('T')[0] <= filters.endDate) ||
                      (filters.startDate && !filters.endDate &&
                       new Date(v.submitted_at).toISOString().split('T')[0] >= filters.startDate) ||
                      (!filters.startDate && filters.endDate &&
                       new Date(v.submitted_at).toISOString().split('T')[0] <= filters.endDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Verificación de Empresas
                </h1>
                <p className="text-primary-100 text-sm">
                  Gestiona las verificaciones de empresas pendientes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-0.5">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.total}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total</p>
              <div className="text-xs text-green-600 mt-0.5 font-medium">
                Empresas
              </div>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-0.5">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.underReview}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">En Revisión</p>
              <div className="text-xs text-blue-600 mt-0.5 font-medium">
                Pendientes
              </div>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-0.5">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.approved}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Aprobadas</p>
              <div className="text-xs text-green-600 mt-0.5 font-medium">
                Verificadas
              </div>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-0.5">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.approvalRate?.toFixed(1)}%
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Tasa</p>
              <div className="text-xs text-purple-600 mt-0.5 font-medium">
                Aprobación
              </div>
            </div>
          </Card>
        </div>
      )}

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
                value={filters.startDate || ''}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
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

      {/* Filters and Search */}
      <Card>
        <div className="p-1">
          <div className="flex flex-row gap-4 items-start">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nombre de empresa o RUT..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-secondary-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[160px]"
              >
                <option value="">Todos los Estados</option>
                <option value={VERIFICATION_STATUS.SUBMITTED}>Enviados</option>
                <option value={VERIFICATION_STATUS.UNDER_REVIEW}>En Revisión</option>
                <option value={VERIFICATION_STATUS.APPROVED}>Aprobados</option>
                <option value={VERIFICATION_STATUS.REJECTED}>Rechazados</option>
                <option value={VERIFICATION_STATUS.NEEDS_CORRECTIONS}>Correcciones</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Verifications List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Lista de Verificaciones ({filteredVerifications.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando verificaciones...</p>
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No se encontraron verificaciones
              </h3>
              <p className="text-secondary-600">
                {filters.search || filters.status || filters.startDate || filters.endDate
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay verificaciones registradas'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-success-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">
                          {verification.company?.company_name}
                        </h3>
                        <p className="text-secondary-600 text-sm">{verification.company?.rut}</p>
                        <div className="flex items-center gap-4 text-xs text-secondary-500 mt-1">
                          <span>Enviado: {formatDate(verification.submitted_at)}</span>
                          <span>•</span>
                          <span>Analista: {verification.assigned_to_user?.full_name || 'Sin asignar'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(verification.status)}

                      <div className="text-right text-sm text-secondary-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(new Date(verification.submitted_at))}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => openReviewModal(verification)}
                        >
                          Revisar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${verification.certificado_vigencia_url ? 'text-green-600' : 'text-gray-400'}`}>
                        {verification.certificado_vigencia_url ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-secondary-600">Certificado Vigencia</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${verification.informe_equifax_url ? 'text-green-600' : 'text-gray-400'}`}>
                        {verification.informe_equifax_url ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-secondary-600">Informe Equifax</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {((verification.certificado_vigencia_url ? 1 : 0) + (verification.informe_equifax_url ? 1 : 0))}
                      </div>
                      <div className="text-xs text-secondary-600">Archivos Subidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {formatDate(verification.submitted_at, 'short')}
                      </div>
                      <div className="text-xs text-secondary-600">Fecha Envío</div>
                    </div>
                  </div>

                  {/* Barra de progreso de documentos */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-secondary-700">Documentación Completa</span>
                      <span className="text-sm text-secondary-600">
                        {((verification.certificado_vigencia_url ? 1 : 0) + (verification.informe_equifax_url ? 1 : 0)) / 2 * 100}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((verification.certificado_vigencia_url ? 1 : 0) + (verification.informe_equifax_url ? 1 : 0)) / 2 * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Revisar Verificación de Empresa"
        size="xl"
      >
        {selectedVerification && (
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Información de la Empresa</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Empresa:</span> {selectedVerification.company?.company_name}
                </div>
                <div>
                  <span className="font-medium">RUT:</span> {selectedVerification.company?.rut}
                </div>
                <div>
                  <span className="font-medium">Enviado:</span> {formatDate(selectedVerification.submitted_at)}
                </div>
                <div>
                  <span className="font-medium">Estado:</span> {getStatusBadge(selectedVerification.status).props.children[1]}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Documentos Subidos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Certificado de Vigencia</span>
                    <Badge variant={selectedVerification.certificado_vigencia_url ? "success" : "danger"}>
                      {selectedVerification.certificado_vigencia_url ? "Subido" : "Faltante"}
                    </Badge>
                  </div>
                  {selectedVerification.certificado_vigencia_url && (
                    <div className="text-sm text-gray-600">
                      <p>Archivo: {selectedVerification.certificado_vigencia_filename}</p>
                      <p>Subido: {formatDate(selectedVerification.certificado_vigencia_uploaded_at)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(selectedVerification.certificado_vigencia_url, '_blank')}
                      >
                        Ver Documento
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Informe Equifax</span>
                    <Badge variant={selectedVerification.informe_equifax_url ? "success" : "danger"}>
                      {selectedVerification.informe_equifax_url ? "Subido" : "Faltante"}
                    </Badge>
                  </div>
                  {selectedVerification.informe_equifax_url && (
                    <div className="text-sm text-gray-600">
                      <p>Archivo: {selectedVerification.informe_equifax_filename}</p>
                      <p>Subido: {formatDate(selectedVerification.informe_equifax_uploaded_at)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(selectedVerification.informe_equifax_url, '_blank')}
                      >
                        Ver Documento
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Form */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Tomar Decisión</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decisión *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="approve"
                        checked={reviewDecision === 'approve'}
                        onChange={(e) => setReviewDecision(e.target.value)}
                        className="mr-2"
                      />
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Aprobar verificación
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="reject"
                        checked={reviewDecision === 'reject'}
                        onChange={(e) => setReviewDecision(e.target.value)}
                        className="mr-2"
                      />
                      <XSquare className="w-4 h-4 text-red-600 mr-2" />
                      Rechazar verificación
                    </label>
                  </div>
                </div>

                {reviewDecision === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo del rechazo *
                    </label>
                    <Select
                      value={rejectionReason}
                      onChange={setRejectionReason}
                      placeholder="Seleccionar motivo"
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="documento_ilegible">Documento ilegible</option>
                      <option value="fecha_vencida">Fecha de emisión vencida</option>
                      <option value="empresa_no_coincide">Empresa no coincide con RUT</option>
                      <option value="score_insuficiente">Score Equifax insuficiente</option>
                      <option value="documentos_falsos">Documentos falsificados</option>
                      <option value="informacion_inconsistente">Información inconsistente</option>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del analista
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Agregar observaciones o comentarios adicionales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
                disabled={processingDecision}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleDecision}
                disabled={!reviewDecision || processingDecision || (reviewDecision === 'reject' && !rejectionReason)}
                leftIcon={processingDecision ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {processingDecision ? 'Procesando...' : 'Confirmar Decisión'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyVerificationDashboard;