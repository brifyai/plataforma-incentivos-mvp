/**
 * Company Agreements Page
 *
 * Página para que las empresas vean y gestionen los acuerdos activos con sus deudores
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import { getCompanyAgreements, updateAgreementStatus } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  User,
  Building,
  RefreshCw
} from 'lucide-react';

const CompanyAgreementsPage = () => {
  const { profile } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

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
    setDateFilter(dates);
  };

  useEffect(() => {
    loadAgreements();
  }, [profile]);

  const loadAgreements = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoading(true);
      const result = await getCompanyAgreements(profile.company.id);

      if (result.error) {
        console.error('Error loading agreements:', result.error);
        setAgreements([]);
      } else {
        setAgreements(result.agreements || []);
      }
    } catch (error) {
      console.error('Error loading agreements:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (agreement) => {
    setSelectedAgreement(agreement);
    setStatusUpdate({
      status: agreement.status,
      notes: ''
    });
    setShowStatusModal(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedAgreement) return;

    setUpdating(true);
    try {
      const result = await updateAgreementStatus(selectedAgreement.id, {
        status: statusUpdate.status,
        notes: statusUpdate.notes,
        updated_by: profile.id
      });

      if (result.error) {
        alert('Error al actualizar el acuerdo: ' + result.error);
      } else {
        // Update local state
        setAgreements(prev => prev.map(agreement =>
          agreement.id === selectedAgreement.id
            ? { ...agreement, status: statusUpdate.status, updated_at: new Date().toISOString() }
            : agreement
        ));
        setShowStatusModal(false);
        alert('Acuerdo actualizado exitosamente');
      }
    } catch (error) {
      alert('Error al actualizar el acuerdo: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'completed':
        return <Badge variant="primary">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelado</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getStatusOptions = () => [
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'pending', label: 'Pendiente' }
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-strong">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div>
              <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight">
                Gestión de Acuerdos
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Administra los acuerdos activos con tus deudores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="info" size="md">
              {agreements.length} Acuerdos
            </Badge>
            <Button
              variant="primary"
              onClick={loadAgreements}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="whitespace-nowrap"
            >
              Actualizar
            </Button>
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
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('today')}
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

      {/* Agreements List */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                </div>
                <Badge variant="primary">{agreements.filter(a => a.status === 'active').length}</Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Acuerdos Activos</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {agreements.filter(a => a.status === 'active').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                </div>
                <Badge variant="success">
                  {agreements.filter(a => a.status === 'completed').length}
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Acuerdos Completados</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {agreements.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Clock className="w-4 h-4 text-warning-600" />
                </div>
                <Badge variant="warning">
                  {agreements.filter(a => a.status === 'pending').length}
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Acuerdos Pendientes</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {agreements.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-info-600" />
                </div>
                <Badge variant="info">
                  {formatCurrency(agreements.reduce((sum, a) => sum + (a.amount || 0), 0))}
                </Badge>
              </div>
              <p className="text-xs text-secondary-600 mb-1">Monto Total</p>
              <p className="text-sm md:text-lg font-bold text-secondary-900">
                {formatCurrency(agreements.reduce((sum, a) => sum + (a.amount || 0), 0))}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Acuerdos Registrados"
        subtitle={`${agreements.length} acuerdo${agreements.length !== 1 ? 's' : ''} encontrado${agreements.length !== 1 ? 's' : ''}`}
      >
        {agreements.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No hay acuerdos registrados
            </h3>
            <p className="text-secondary-600 mb-6">
              Los acuerdos aparecerán aquí cuando tus deudores acepten las propuestas de pago.
            </p>
            <Link to="/empresa/propuestas">
              <Button variant="primary" className="whitespace-nowrap">
                Ver Propuestas
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-6">
                  {getStatusIcon(agreement.status)}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Acuerdo #{agreement.id.slice(-8)}
                      </h3>
                      {getStatusBadge(agreement.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{agreement.debtor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{agreement.client_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(new Date(agreement.created_at))}</span>
                      </div>
                    </div>

                    {agreement.description && (
                      <p className="text-sm text-secondary-600 mt-2">
                        {agreement.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-secondary-900">
                      {formatCurrency(agreement.amount)}
                    </p>
                    <p className="text-sm text-secondary-600">Monto acordado</p>
                  </div>

                  <div className="flex gap-2">
                    <Link to="/empresa/propuestas">
                      <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />} className="whitespace-nowrap">
                        Ver Propuesta
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit className="w-4 h-4" />}
                      onClick={() => handleStatusUpdate(agreement)}
                      className="whitespace-nowrap"
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`Actualizar Estado - Acuerdo #${selectedAgreement?.id.slice(-8)}`}
        size="md"
      >
        <div className="space-y-6">
          {selectedAgreement && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-secondary-900 mb-3">Detalles del Acuerdo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary-600">Deudor:</span>
                  <span className="font-semibold ml-2">{selectedAgreement.debtor_name}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Cliente:</span>
                  <span className="font-semibold ml-2">{selectedAgreement.client_name}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Monto:</span>
                  <span className="font-semibold ml-2">{formatCurrency(selectedAgreement.amount)}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Estado actual:</span>
                  <span className="ml-2">{getStatusBadge(selectedAgreement.status)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Select
              label="Nuevo Estado"
              value={statusUpdate.status}
              onChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}
              options={getStatusOptions()}
              required
            />

            <Input
              label="Notas (Opcional)"
              value={statusUpdate.notes}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Comentarios sobre el cambio de estado..."
              multiline
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Cambiar el estado del acuerdo puede afectar los procesos de cobranza y notificaciones.
                  Asegúrate de que el cambio sea correcto antes de guardar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveStatusUpdate}
              loading={updating}
              className="flex-1 whitespace-nowrap"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {updating ? 'Actualizando...' : 'Actualizar Estado'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyAgreementsPage;