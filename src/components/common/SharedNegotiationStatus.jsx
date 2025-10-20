/**
 * Shared Negotiation Status Component
 * 
 * Componente que muestra el estado de negociaciones compartidas entre portales
 * Proporciona visibilidad en tiempo real del progreso de negociaciones
 */

import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge } from './index';
import { useEcosystemSync } from '../../hooks/useEcosystemSync';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Building,
  MessageSquare,
  DollarSign,
  Calendar,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Pause,
  Play
} from 'lucide-react';

const SharedNegotiationStatus = ({ 
  userType = 'company',
  compact = false,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const {
    isConnected,
    syncStatus,
    sharedStates,
    crossNotifications,
    forceSync,
    getSyncStatus
  } = useEcosystemSync({
    userType,
    enableRealTime: true,
    autoConnect: true
  });

  const [negotiations, setNegotiations] = useState([]);
  const [filteredNegotiations, setFilteredNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_updated');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedNegotiations, setExpandedNegotiations] = useState(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Estados de negociación
  const NEGOTIATION_STATUS = {
    PENDING: { label: 'Pendiente', color: 'yellow', icon: Clock },
    ACTIVE: { label: 'Activa', color: 'blue', icon: Activity },
    IN_PROGRESS: { label: 'En Progreso', color: 'purple', icon: RefreshCw },
    PAUSED: { label: 'Pausada', color: 'orange', icon: Pause },
    COMPLETED: { label: 'Completada', color: 'green', icon: CheckCircle },
    FAILED: { label: 'Fallida', color: 'red', icon: XCircle },
    CANCELLED: { label: 'Cancelada', color: 'gray', icon: XCircle }
  };

  // Cargar negociaciones compartidas
  const loadSharedNegotiations = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      // Filtrar estados compartidos que son negociaciones
      const negotiationStates = Array.from(sharedStates.entries())
        .filter(([entityId, state]) => 
          state.entity_type === 'negotiation' || 
          state.entity_type === 'agreement' ||
          state.state_data?.negotiation_id
        )
        .map(([entityId, state]) => ({
          id: entityId,
          ...state.state_data,
          entity_type: state.entity_type,
          updated_at: state.updated_at,
          updated_by: state.updated_by
        }));

      setNegotiations(negotiationStates);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading shared negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar negociaciones
  useEffect(() => {
    let filtered = negotiations;

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(neg => 
        neg.debtor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(neg => neg.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'last_updated' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredNegotiations(filtered);
  }, [negotiations, searchTerm, statusFilter, sortBy, sortDirection]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSharedNegotiations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isConnected]);

  // Cargar datos iniciales
  useEffect(() => {
    loadSharedNegotiations();
  }, [isConnected, sharedStates]);

  // Toggle expansión
  const toggleExpansion = (negotiationId) => {
    const newExpanded = new Set(expandedNegotiations);
    if (newExpanded.has(negotiationId)) {
      newExpanded.delete(negotiationId);
    } else {
      newExpanded.add(negotiationId);
    }
    setExpandedNegotiations(newExpanded);
  };

  // Obtener estado visual
  const getStatusInfo = (status) => {
    return NEGOTIATION_STATUS[status] || NEGOTIATION_STATUS.PENDING;
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular progreso
  const calculateProgress = (negotiation) => {
    if (!negotiation.steps || negotiation.steps.length === 0) return 0;
    
    const completedSteps = negotiation.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / negotiation.steps.length) * 100);
  };

  if (!isConnected) {
    return (
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin Conexión al Ecosistema
            </h3>
            <p className="text-gray-600">
              No hay conexión con el ecosistema de sincronización
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`font-bold ${compact ? 'text-lg' : 'text-xl'} text-gray-900`}>
                Estado de Negociaciones Compartidas
              </h2>
              <p className="text-sm text-gray-600">
                Visibilidad en tiempo real del progreso de negociaciones
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Última actualización
              </p>
              <p className="text-xs text-gray-500">
                {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={loadSharedNegotiations}
              disabled={loading}
              className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar negociación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(NEGOTIATION_STATUS).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy(field);
                setSortDirection(direction);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last_updated-desc">Más reciente primero</option>
              <option value="last_updated-asc">Más antiguo primero</option>
              <option value="amount-desc">Monto mayor primero</option>
              <option value="amount-asc">Monto menor primero</option>
            </select>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {filteredNegotiations.length}
            </div>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {filteredNegotiations.filter(n => n.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredNegotiations.filter(n => ['ACTIVE', 'IN_PROGRESS'].includes(n.status)).length}
            </div>
            <p className="text-sm text-gray-600">Activas</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(filteredNegotiations.filter(n => n.status === 'COMPLETED').length / Math.max(filteredNegotiations.length, 1) * 100)}%
            </div>
            <p className="text-sm text-gray-600">Tasa éxito</p>
          </div>
        </div>
      </Card>

      {/* Lista de negociaciones */}
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Cargando negociaciones..." />
          </div>
        ) : filteredNegotiations.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay negociaciones compartidas
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No hay negociaciones que coincidan con los filtros'
                : 'No hay negociaciones activas en el ecosistema'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNegotiations.map((negotiation) => {
              const statusInfo = getStatusInfo(negotiation.status);
              const progress = calculateProgress(negotiation);
              const isExpanded = expandedNegotiations.has(negotiation.id);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={negotiation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                        <h3 className="font-semibold text-gray-900">
                          {negotiation.debtor_name || 'Deudor sin nombre'}
                        </h3>
                        <Badge variant={statusInfo.color} size="sm">
                          {statusInfo.label}
                        </Badge>
                        {negotiation.company_name && (
                          <Badge variant="secondary" size="sm">
                            <Building className="w-3 h-3 mr-1" />
                            {negotiation.company_name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Monto</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(negotiation.amount)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Última actualización</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(negotiation.updated_at)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Progreso</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {negotiation.last_message && (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {negotiation.last_message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {negotiation.last_message_time && formatDate(negotiation.last_message_time)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleExpansion(negotiation.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Detalles expandidos */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {negotiation.steps && negotiation.steps.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Pasos de la negociación</h4>
                            <div className="space-y-2">
                              {negotiation.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    step.completed 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {step.completed ? (
                                      <CheckCircle className="w-3 h-3" />
                                    ) : (
                                      <div className="w-2 h-2 bg-current rounded-full"></div>
                                    )}
                                  </div>
                                  <span className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {step.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {negotiation.next_action && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Próxima acción</h4>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-900">
                                {negotiation.next_action}
                              </p>
                              {negotiation.next_action_date && (
                                <p className="text-xs text-blue-700 mt-1">
                                  {formatDate(negotiation.next_action_date)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {negotiation.participants && negotiation.participants.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Participantes</h4>
                          <div className="flex flex-wrap gap-2">
                            {negotiation.participants.map((participant, index) => (
                              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                {participant.type === 'company' ? (
                                  <Building className="w-3 h-3 text-gray-600" />
                                ) : (
                                  <Users className="w-3 h-3 text-gray-600" />
                                )}
                                <span className="text-sm text-gray-700">
                                  {participant.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SharedNegotiationStatus;