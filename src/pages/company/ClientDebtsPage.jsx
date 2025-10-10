/**
 * Client Debts Page - Company
 *
 * Página para gestionar las deudas de un cliente específico
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input } from '../../components/common';
import { getClientById, getClientDebts, createDebt, getDebtById, updateDebt } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  FileText,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const ClientDebtsPage = () => {
  const { clientId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false);
  const [createDebtForm, setCreateDebtForm] = useState({
    user_id: '',
    original_amount: '',
    debt_type: 'credit_card',
    debt_reference: '',
    description: '',
  });
  const [createDebtLoading, setCreateDebtLoading] = useState(false);
  const [createDebtError, setCreateDebtError] = useState(null);
  const [showDebtDetailsModal, setShowDebtDetailsModal] = useState(false);
  const [showEditDebtModal, setShowEditDebtModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editDebtForm, setEditDebtForm] = useState({
    current_amount: '',
    debt_type: 'credit_card',
    debt_reference: '',
    description: '',
    status: 'active',
  });
  const [editDebtLoading, setEditDebtLoading] = useState(false);
  const [editDebtError, setEditDebtError] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  // Función para obtener cliente de ejemplo por ID
  const getMockClientById = (id) => {
    const mockClients = [
      {
        id: '1',
        business_name: 'María González',
        rut: '12.345.678-9',
        contact_name: 'María González',
        contact_email: 'maria.gonzalez@email.com',
        contact_phone: '+56912345678',
        industry: 'Servicios',
        address: 'Santiago, Chile',
        created_at: '2024-10-01T00:00:00Z'
      },
      {
        id: '2',
        business_name: 'Carlos Rodríguez',
        rut: '15.234.567-8',
        contact_name: 'Carlos Rodríguez',
        contact_email: 'carlos.rodriguez@email.com',
        contact_phone: '+56987654321',
        industry: 'Comercio',
        address: 'Concepción, Chile',
        created_at: '2024-09-15T00:00:00Z'
      },
      {
        id: '3',
        business_name: 'Ana López',
        rut: '18.345.678-1',
        contact_name: 'Ana López',
        contact_email: 'ana.lopez@email.com',
        contact_phone: '+56911223344',
        industry: 'Tecnología',
        address: 'Viña del Mar, Chile',
        created_at: '2024-08-20T00:00:00Z'
      },
      {
        id: '4',
        business_name: 'Pedro Martínez',
        rut: '11.456.789-2',
        contact_name: 'Pedro Martínez',
        contact_email: 'pedro.martinez@email.com',
        contact_phone: '+56944332211',
        industry: 'Construcción',
        address: 'Antofagasta, Chile',
        created_at: '2024-07-10T00:00:00Z'
      }
    ];

    return mockClients.find(client => client.id === id.toString());
  };

  // Función para obtener deudas de ejemplo por cliente
  const getMockClientDebts = (clientId) => {
    const mockDebts = {
      '1': [
        {
          id: 'd1',
          debt_reference: 'DEBT-001',
          current_amount: 2500000,
          original_amount: 2500000,
          status: 'active',
          debt_type: 'credit_card',
          description: 'Deuda de tarjeta de crédito acumulada',
          created_at: '2024-10-01T00:00:00Z',
          user: { full_name: 'María González', rut: '12.345.678-9' }
        }
      ],
      '2': [
        {
          id: 'd2',
          debt_reference: 'DEBT-002',
          current_amount: 1800000,
          original_amount: 1800000,
          status: 'active',
          debt_type: 'loan',
          description: 'Préstamo personal',
          created_at: '2024-09-15T00:00:00Z',
          user: { full_name: 'Carlos Rodríguez', rut: '15.234.567-8' }
        }
      ],
      '3': [
        {
          id: 'd3',
          debt_reference: 'DEBT-003',
          current_amount: 3200000,
          original_amount: 3200000,
          status: 'in_negotiation',
          debt_type: 'service',
          description: 'Servicio de consultoría pendiente',
          created_at: '2024-08-20T00:00:00Z',
          user: { full_name: 'Ana López', rut: '18.345.678-1' }
        }
      ],
      '4': [
        {
          id: 'd4',
          debt_reference: 'DEBT-004',
          current_amount: 950000,
          original_amount: 950000,
          status: 'paid',
          debt_type: 'other',
          description: 'Deuda saldada completamente',
          created_at: '2024-07-10T00:00:00Z',
          user: { full_name: 'Pedro Martínez', rut: '11.456.789-2' }
        }
      ]
    };

    return mockDebts[clientId] || [];
  };

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientResult, debtsResult] = await Promise.all([
        getClientById(clientId),
        getClientDebts(clientId)
      ]);

      if (clientResult.error || !clientResult.client) {
        console.error('Error loading client:', clientResult.error);
        // Si no se encuentra en la base de datos, usar datos de ejemplo
        const mockClient = getMockClientById(clientId);
        if (mockClient) {
          setClient(mockClient);
          setDebts(getMockClientDebts(clientId));
        } else {
          navigate('/empresa/dashboard');
        }
        return;
      }

      if (debtsResult.error) {
        console.error('Error loading client debts:', debtsResult.error);
        // Usar datos de ejemplo si falla la carga
        setDebts(getMockClientDebts(clientId));
      } else {
        setDebts(debtsResult.debts || []);
      }

      setClient(clientResult.client);
    } catch (error) {
      console.error('Error loading client data:', error);
      // En caso de error, intentar con datos de ejemplo
      const mockClient = getMockClientById(clientId);
      if (mockClient) {
        setClient(mockClient);
        setDebts(getMockClientDebts(clientId));
      } else {
        navigate('/empresa/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebt = async () => {
    try {
      setCreateDebtLoading(true);
      setCreateDebtError(null);

      const debtData = {
        user_id: createDebtForm.user_id,
        company_id: profile.company.id,
        client_id: clientId,
        original_amount: parseFloat(createDebtForm.original_amount),
        current_amount: parseFloat(createDebtForm.original_amount),
        debt_type: createDebtForm.debt_type,
        debt_reference: createDebtForm.debt_reference,
        description: createDebtForm.description,
        status: 'active',
      };

      const { debt, error } = await createDebt(debtData);

      if (error) {
        setCreateDebtError(error);
        return;
      }

      // Reset form and close modal
      setCreateDebtForm({
        user_id: '',
        original_amount: '',
        debt_type: 'credit_card',
        debt_reference: '',
        description: '',
      });
      setShowCreateDebtModal(false);

      // Reload data
      loadClientData();
    } catch (error) {
      setCreateDebtError('Error al crear deuda. Por favor, intenta de nuevo.');
    } finally {
      setCreateDebtLoading(false);
    }
  };

  const handleViewDebtDetails = async (debt) => {
    try {
      // For mock data, use the debt directly. For real data, try to fetch from DB
      if (debt.id.startsWith('d') && debt.id.length <= 3) {
        // This is mock data, use it directly
        setSelectedDebt(debt);
        setShowDebtDetailsModal(true);
      } else {
        // This is real data, fetch from database
        const { debt: debtDetails, error } = await getDebtById(debt.id);
        if (error) {
          console.error('Error loading debt details:', error);
          return;
        }
        setSelectedDebt(debtDetails);
        setShowDebtDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading debt details:', error);
    }
  };

  const handleEditDebt = (debt) => {
    setSelectedDebt(debt);
    setEditDebtForm({
      current_amount: debt.current_amount,
      debt_type: debt.debt_type,
      debt_reference: debt.debt_reference,
      description: debt.description || '',
      status: debt.status,
    });
    setShowEditDebtModal(true);
  };

  const handleUpdateDebt = async () => {
    try {
      setEditDebtLoading(true);
      setEditDebtError(null);

      const updates = {
        current_amount: parseFloat(editDebtForm.current_amount),
        debt_type: editDebtForm.debt_type,
        debt_reference: editDebtForm.debt_reference,
        description: editDebtForm.description,
        status: editDebtForm.status,
      };

      // For mock data, we can't update the database, so we simulate success
      if (selectedDebt.id.startsWith('d') && selectedDebt.id.length <= 3) {
        // This is mock data, simulate update success
        console.log('Mock data update simulated:', updates);
      } else {
        // This is real data, update in database
        const { error } = await updateDebt(selectedDebt.id, updates);

        if (error) {
          setEditDebtError(error);
          return;
        }
      }

      // Reset form and close modal
      setEditDebtForm({
        current_amount: '',
        debt_type: 'credit_card',
        debt_reference: '',
        description: '',
        status: 'active',
      });
      setShowEditDebtModal(false);
      setSelectedDebt(null);

      // Reload data
      loadClientData();
    } catch (error) {
      setEditDebtError('Error al actualizar deuda. Por favor, intenta de nuevo.');
    } finally {
      setEditDebtLoading(false);
    }
  };

  const getDebtStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="danger">Activa</Badge>;
      case 'in_negotiation':
        return <Badge variant="warning">En Negociación</Badge>;
      case 'paid':
        return <Badge variant="success">Pagada</Badge>;
      case 'defaulted':
        return <Badge variant="secondary">Morosa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDebtTypeLabel = (type) => {
    switch (type) {
      case 'credit_card':
        return 'Tarjeta de Crédito';
      case 'loan':
        return 'Préstamo';
      case 'service':
        return 'Servicio';
      case 'mortgage':
        return 'Hipoteca';
      case 'other':
        return 'Otro';
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando deudas del cliente..." />;
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente No Encontrado</h2>
          <p className="text-gray-600 mb-4">
            El cliente solicitado no existe o no tienes acceso a él.
          </p>
          <Button onClick={() => navigate('/empresa/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/empresa/clientes/${clientId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deudas del Cliente</h1>
            <p className="text-gray-600">{client.business_name}</p>
          </div>
        </div>
        <Button
          variant="gradient"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateDebtModal(true)}
        >
          Nueva Deuda
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-danger-100 rounded-lg">
                <FileText className="w-6 h-6 text-danger-600" />
              </div>
              <Badge variant="danger">{debts.length}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Total Deudas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {debts.length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <Badge variant="warning">
                {debts.filter(d => d.status === 'active').length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Deudas Activas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {debts.filter(d => d.status === 'active').length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <Badge variant="success">
                {debts.filter(d => d.status === 'paid').length}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Deudas Pagadas</p>
            <p className="text-2xl font-bold text-secondary-900">
              {debts.filter(d => d.status === 'paid').length}
            </p>
          </div>
        </Card>

        <Card padding={false} className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-info-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-info-600" />
              </div>
              <Badge variant="info">
                {formatCurrency(debts.reduce((sum, d) => sum + parseFloat(d.current_amount), 0))}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Monto Total</p>
            <p className="text-2xl font-bold text-secondary-900">
              {formatCurrency(debts.reduce((sum, d) => sum + parseFloat(d.current_amount), 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Debts List */}
      <Card
        title="Deudas Registradas"
        subtitle={`${debts.length} deuda${debts.length !== 1 ? 's' : ''} para este cliente`}
      >
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600 mb-4">
              Este cliente no tiene deudas registradas
            </p>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateDebtModal(true)}
            >
              Registrar Primera Deuda
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-danger-100 rounded-lg">
                    <FileText className="w-6 h-6 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{debt.user?.full_name || 'Usuario desconocido'}</h3>
                      {getDebtStatusBadge(debt.status)}
                      <Badge variant="outline">{getDebtTypeLabel(debt.debt_type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>RUT: {debt.user?.rut || 'N/A'}</span>
                      <span>•</span>
                      <span>Ref: {debt.debt_reference}</span>
                      <span>•</span>
                      <span>Original: {formatCurrency(debt.original_amount)}</span>
                      <span>•</span>
                      <span>{formatDate(debt.created_at)}</span>
                    </div>
                    {debt.description && (
                      <p className="text-sm text-gray-600 mt-2">{debt.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(debt.current_amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Monto actual
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDebtDetails(debt)}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDebt(debt)}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Debt Modal */}
      <Modal
        isOpen={showCreateDebtModal}
        onClose={() => setShowCreateDebtModal(false)}
        title="Registrar Nueva Deuda"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Cliente: {client.business_name}</h3>
                <p className="text-sm text-blue-700">RUT: {client.rut}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ID del Usuario Deudor"
              value={createDebtForm.user_id}
              onChange={(e) => setCreateDebtForm(prev => ({ ...prev, user_id: e.target.value }))}
              placeholder="UUID del usuario deudor"
              required
            />
            <Input
              label="Monto Original"
              value={createDebtForm.original_amount}
              onChange={(e) => setCreateDebtForm(prev => ({ ...prev, original_amount: e.target.value }))}
              placeholder="Ej: 150000"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tipo de Deuda
              </label>
              <select
                value={createDebtForm.debt_type}
                onChange={(e) => setCreateDebtForm(prev => ({ ...prev, debt_type: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="loan">Préstamo</option>
                <option value="service">Servicio</option>
                <option value="mortgage">Hipoteca</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <Input
              label="Referencia de Deuda"
              value={createDebtForm.debt_reference}
              onChange={(e) => setCreateDebtForm(prev => ({ ...prev, debt_reference: e.target.value }))}
              placeholder="Ej: DEBT-001"
              required
            />
          </div>

          <Input
            label="Descripción (Opcional)"
            value={createDebtForm.description}
            onChange={(e) => setCreateDebtForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detalles adicionales de la deuda"
          />

          {createDebtError && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{createDebtError}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDebtModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateDebt}
              className="flex-1 shadow-soft hover:shadow-glow"
              loading={createDebtLoading}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Registrar Deuda
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debt Details Modal */}
      <Modal
        isOpen={showDebtDetailsModal}
        onClose={() => setShowDebtDetailsModal(false)}
        title="Detalles de la Deuda"
        size="lg"
      >
        {selectedDebt && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Cliente: {client.business_name}</h3>
                  <p className="text-sm text-blue-700">RUT: {client.rut}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Información del Deudor</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium">{selectedDebt.user?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RUT:</span>
                      <span className="font-medium">{selectedDebt.user?.rut || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detalles de la Deuda</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referencia:</span>
                      <span className="font-medium">{selectedDebt.debt_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{getDebtTypeLabel(selectedDebt.debt_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      {getDebtStatusBadge(selectedDebt.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Montos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Original:</span>
                      <span className="font-medium">{formatCurrency(selectedDebt.original_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Actual:</span>
                      <span className="font-medium">{formatCurrency(selectedDebt.current_amount)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fechas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Creada:</span>
                      <span className="font-medium">{formatDate(selectedDebt.created_at)}</span>
                    </div>
                    {selectedDebt.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actualizada:</span>
                        <span className="font-medium">{formatDate(selectedDebt.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedDebt.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDebt.description}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDebtDetailsModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Debt Modal */}
      <Modal
        isOpen={showEditDebtModal}
        onClose={() => setShowEditDebtModal(false)}
        title="Editar Deuda"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Cliente: {client.business_name}</h3>
                <p className="text-sm text-blue-700">RUT: {client.rut}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto Actual"
              value={editDebtForm.current_amount}
              onChange={(e) => setEditDebtForm(prev => ({ ...prev, current_amount: e.target.value }))}
              placeholder="Ej: 150000"
              required
            />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Estado de la Deuda
              </label>
              <select
                value={editDebtForm.status}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Activa</option>
                <option value="in_negotiation">En Negociación</option>
                <option value="paid">Pagada</option>
                <option value="defaulted">Morosa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tipo de Deuda
              </label>
              <select
                value={editDebtForm.debt_type}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, debt_type: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="loan">Préstamo</option>
                <option value="service">Servicio</option>
                <option value="mortgage">Hipoteca</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <Input
              label="Referencia de Deuda"
              value={editDebtForm.debt_reference}
              onChange={(e) => setEditDebtForm(prev => ({ ...prev, debt_reference: e.target.value }))}
              placeholder="Ej: DEBT-001"
              required
            />
          </div>

          <Input
            label="Descripción (Opcional)"
            value={editDebtForm.description}
            onChange={(e) => setEditDebtForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detalles adicionales de la deuda"
          />

          {editDebtError && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{editDebtError}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDebtModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleUpdateDebt}
              className="flex-1 shadow-soft hover:shadow-glow"
              loading={editDebtLoading}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Actualizar Deuda
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDebtsPage;