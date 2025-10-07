/**
 * Client Debts Page - Company
 *
 * Página para gestionar las deudas de un cliente específico
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input } from '../../components/common';
import { getClientById, getClientDebts, createDebt } from '../../services/databaseService';
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

  useEffect(() => {
    if (clientId && profile?.company?.id) {
      loadClientData();
    }
  }, [clientId, profile]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientResult, debtsResult] = await Promise.all([
        getClientById(clientId),
        getClientDebts(clientId)
      ]);

      if (clientResult.error) {
        console.error('Error loading client:', clientResult.error);
        navigate('/company/dashboard');
        return;
      }

      if (debtsResult.error) {
        console.error('Error loading client debts:', debtsResult.error);
      }

      setClient(clientResult.client);
      setDebts(debtsResult.debts || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      navigate('/company/dashboard');
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
          <Button onClick={() => navigate('/company/dashboard')}>
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
            onClick={() => navigate(`/company/clients/${clientId}`)}
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
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm">
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
    </div>
  );
};

export default ClientDebtsPage;