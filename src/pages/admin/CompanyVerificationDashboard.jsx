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
  XSquare
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
    search: ''
  });

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

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = !filters.search ||
      v.company?.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      v.company?.rut?.includes(filters.search);

    const matchesStatus = !filters.status || v.status === filters.status;

    return matchesSearch && matchesStatus;
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
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Verificación de Empresas
              </h1>
              <p className="text-purple-100 text-lg">
                Gestiona las verificaciones de empresas pendientes
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-300" />
                <div>
                  <p className="text-sm text-purple-100">Total Empresas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-purple-300" />
                <div>
                  <p className="text-sm text-purple-100">En Revisión</p>
                  <p className="text-2xl font-bold">{stats.underReview}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-6 h-6 text-purple-300" />
                <div>
                  <p className="text-sm text-purple-100">Aprobadas</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-purple-300" />
                <div>
                  <p className="text-sm text-purple-100">Tasa Aprobación</p>
                  <p className="text-2xl font-bold">{stats.approvalRate?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre de empresa o RUT..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Select
            value={filters.status}
            onChange={(value) => setFilters({...filters, status: value})}
            placeholder="Filtrar por estado"
            className="md:w-48"
          >
            <option value="">Todos los estados</option>
            <option value={VERIFICATION_STATUS.SUBMITTED}>Enviados</option>
            <option value={VERIFICATION_STATUS.UNDER_REVIEW}>En Revisión</option>
          </Select>
        </div>
      </Card>

      {/* Verifications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enviado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {verification.company?.company_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {verification.company?.rut}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(verification.status)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${verification.certificado_vigencia_url ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">Vigencia</span>
                      <CheckCircle className={`w-4 h-4 ml-2 ${verification.informe_equifax_url ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500">Equifax</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(verification.submitted_at)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification.assigned_to_user?.full_name || 'Sin asignar'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewModal(verification)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVerifications.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay verificaciones pendientes
              </h3>
              <p className="text-gray-500">
                Todas las verificaciones han sido procesadas
              </p>
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