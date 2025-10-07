/**
 * Client Details Page - Company
 *
 * Página para ver detalles completos de un cliente específico
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { getClientById, getClientDebts, getClientStats } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Building,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
} from 'lucide-react';

const ClientDetailsPage = () => {
  const { clientId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [debts, setDebts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId && profile?.company?.id) {
      loadClientData();
    }
  }, [clientId, profile]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientResult, debtsResult, statsResult] = await Promise.all([
        getClientById(clientId),
        getClientDebts(clientId),
        getClientStats(clientId)
      ]);

      if (clientResult.error) {
        console.error('Error loading client:', clientResult.error);
        navigate('/company/dashboard');
        return;
      }

      if (debtsResult.error) {
        console.error('Error loading client debts:', debtsResult.error);
      }

      if (statsResult.error) {
        console.error('Error loading client stats:', statsResult.error);
      }

      setClient(clientResult.client);
      setDebts(debtsResult.debts || []);
      setStats(statsResult.stats);
    } catch (error) {
      console.error('Error loading client data:', error);
      navigate('/company/dashboard');
    } finally {
      setLoading(false);
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

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando detalles del cliente..." />;
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/company/dashboard')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalles del Cliente</h1>
          <p className="text-gray-600">{client.business_name}</p>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card title="Información Básica" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Building className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{client.business_name}</h3>
                <p className="text-sm text-gray-600">Cliente registrado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">RUT:</span>
                  <span className="font-medium">{client.rut}</span>
                </div>

                {client.contact_name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Contacto:</span>
                    <span className="font-medium">{client.contact_name}</span>
                  </div>
                )}

                {client.industry && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Sector:</span>
                    <span className="font-medium">{client.industry}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {client.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <a href={`mailto:${client.contact_email}`} className="font-medium text-primary-600 hover:underline">
                      {client.contact_email}
                    </a>
                  </div>
                )}

                {client.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <a href={`tel:${client.contact_phone}`} className="font-medium text-primary-600 hover:underline">
                      {client.contact_phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Registrado:</span>
                  <span className="font-medium">{formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-sm text-gray-600">Dirección:</span>
                  <p className="font-medium mt-1">{client.address}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <Card title="Estadísticas">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Deudores</p>
                  <p className="font-semibold text-gray-900">{stats?.totalDebtors || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-danger-600" />
                <div>
                  <p className="text-sm text-gray-600">Deudas</p>
                  <p className="font-semibold text-gray-900">{stats?.totalDebts || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-success-600" />
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(stats?.totalDebtAmount || 0)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-warning-600" />
                <div>
                  <p className="text-sm text-gray-600">Recuperación</p>
                  <p className="font-semibold text-gray-900">{formatPercentage(stats?.recoveryRate || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Debts */}
      <Card
        title="Deudas del Cliente"
        subtitle={`${debts.length} deuda${debts.length !== 1 ? 's' : ''} registrada${debts.length !== 1 ? 's' : ''}`}
        headerAction={
          <Button
            variant="gradient"
            size="sm"
            onClick={() => navigate(`/company/clients/${clientId}/debts`)}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Gestionar Deudas
          </Button>
        }
      >
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600 mb-4">
              Este cliente no tiene deudas registradas
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/company/clients/${clientId}/debts`)}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Registrar Primera Deuda
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.slice(0, 5).map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-danger-100 rounded-lg">
                    <FileText className="w-6 h-6 text-danger-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{debt.user?.full_name || 'Usuario desconocido'}</span>
                      {getDebtStatusBadge(debt.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>RUT: {debt.user?.rut || 'N/A'}</span>
                      <span>•</span>
                      <span>Ref: {debt.debt_reference}</span>
                      <span>•</span>
                      <span>{formatDate(debt.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(debt.current_amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Monto actual
                  </div>
                </div>
              </div>
            ))}

            {debts.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/company/clients/${clientId}/debts`)}
                >
                  Ver todas las deudas ({debts.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          variant="primary"
          onClick={() => navigate(`/company/clients/${clientId}/debts`)}
          leftIcon={<FileText className="w-4 h-4" />}
        >
          Gestionar Deudas
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/company/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ClientDetailsPage;