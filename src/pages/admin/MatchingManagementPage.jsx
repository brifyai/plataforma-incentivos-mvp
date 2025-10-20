/**
 * Matching Management Page
 * 
 * Página de administración para gestionar los matches entre deudores y clientes corporativos
 */

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/common';
import { 
  Users, 
  Target, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Eye,
  Trash2
} from 'lucide-react';
import debtorMatchingService from '../../services/debtorMatchingService';
import Swal from 'sweetalert2';

const MatchingManagementPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    perfectMatches: 0,
    highMatches: 0,
    mediumMatches: 0,
    lowMatches: 0
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      // Obtener todos los matches
      const { data, error } = await debtorMatchingService.supabase
        .from('debtor_corporate_matches')
        .select(`
          *,
          debtor:users!debtor_corporate_matches_debtor_id_fkey(
            id,
            full_name,
            email,
            rut,
            phone
          ),
          corporate_client:corporate_clients(
            id,
            name,
            contact_email,
            contact_phone,
            display_category
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando matches:', error);
        Swal.fire('Error', 'No se pudieron cargar los matches', 'error');
        return;
      }

      const matchesData = data || [];
      setMatches(matchesData);

      // Calcular estadísticas
      const newStats = {
        totalMatches: matchesData.length,
        perfectMatches: matchesData.filter(m => m.match_type === 'perfect').length,
        highMatches: matchesData.filter(m => m.match_type === 'high').length,
        mediumMatches: matchesData.filter(m => m.match_type === 'medium').length,
        lowMatches: matchesData.filter(m => m.match_type === 'low').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('❌ Error en loadMatches:', error);
      Swal.fire('Error', 'Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleDeleteMatch = async (matchId) => {
    const result = await Swal.fire({
      title: '¿Eliminar match?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await debtorMatchingService.supabase
        .from('debtor_corporate_matches')
        .update({ status: 'deleted' })
        .eq('id', matchId);

      if (error) {
        console.error('❌ Error eliminando match:', error);
        Swal.fire('Error', 'No se pudo eliminar el match', 'error');
        return;
      }

      Swal.fire('Eliminado', 'Match eliminado correctamente', 'success');
      await loadMatches();

    } catch (error) {
      console.error('❌ Error en handleDeleteMatch:', error);
      Swal.fire('Error', 'Error al eliminar el match', 'error');
    }
  };

  const getMatchTypeBadge = (matchType) => {
    const variants = {
      perfect: { color: 'green', icon: CheckCircle, text: 'Perfecto' },
      high: { color: 'blue', icon: TrendingUp, text: 'Alto' },
      medium: { color: 'yellow', icon: AlertCircle, text: 'Medio' },
      low: { color: 'gray', icon: AlertCircle, text: 'Bajo' }
    };

    const config = variants[matchType] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Gestión de Matches
          </h1>
          <p className="text-gray-600">
            Administra las coincidencias automáticas entre deudores y clientes corporativos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perfectos</p>
                <p className="text-2xl font-bold text-green-600">{stats.perfectMatches}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Altos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.highMatches}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medios</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.mediumMatches}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bajos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.lowMatches}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
          </Card>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Matches Activos ({matches.length})
            </h2>
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={refreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>

        {/* Lista de Matches */}
        {matches.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay matches activos
            </h3>
            <p className="text-gray-600">
              Los matches aparecerán aquí cuando los deudores se registren y encuentren coincidencias
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Encabezado */}
                    <div className="flex items-center gap-4 mb-4">
                      {getMatchTypeBadge(match.match_type)}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Score:</span>
                        <span className={`font-semibold ${getMatchScoreColor(match.match_score)}`}>
                          {(match.match_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(match.created_at)}
                      </div>
                    </div>

                    {/* Información del Deudor */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Deudor
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900">{match.debtor?.full_name}</p>
                        <p className="text-sm text-gray-600">{match.debtor?.email}</p>
                        <p className="text-sm text-gray-600">RUT: {match.debtor?.rut}</p>
                        {match.debtor?.phone && (
                          <p className="text-sm text-gray-600">Tel: {match.debtor.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Información del Cliente Corporativo */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Cliente Corporativo
                      </h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900">{match.corporate_client?.name}</p>
                        <p className="text-sm text-blue-700">{match.corporate_client?.contact_email}</p>
                        {match.corporate_client?.contact_phone && (
                          <p className="text-sm text-blue-700">Tel: {match.corporate_client.contact_phone}</p>
                        )}
                        <p className="text-sm text-blue-600">
                          Categoría: {match.corporate_client?.display_category}
                        </p>
                      </div>
                    </div>

                    {/* Detalles del Matching */}
                    {match.match_details && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalles del Matching</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {match.match_details.nameMatch !== undefined && (
                            <div>
                              <span className="text-gray-600">Nombre:</span>
                              <span className="ml-2 font-medium">
                                {(match.match_details.nameMatch * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          {match.match_details.emailMatch !== undefined && (
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2 font-medium">
                                {match.match_details.emailMatch ? '100%' : '0%'}
                              </span>
                            </div>
                          )}
                          {match.match_details.domainMatch !== undefined && (
                            <div>
                              <span className="text-gray-600">Dominio:</span>
                              <span className="ml-2 font-medium">
                                {match.match_details.domainMatch ? '100%' : '0%'}
                              </span>
                            </div>
                          )}
                          {match.match_details.rutMatch !== undefined && (
                            <div>
                              <span className="text-gray-600">RUT:</span>
                              <span className="ml-2 font-medium">
                                {match.match_details.rutMatch ? '100%' : '0%'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => setSelectedMatch(match)}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteMatch(match.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Detalles */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Detalles del Match</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMatch(null)}
                  >
                    Cerrar
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Información completa del match */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Información General</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedMatch.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Score:</span>
                        <span className={`ml-2 font-semibold ${getMatchScoreColor(selectedMatch.match_score)}`}>
                          {(selectedMatch.match_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <span className="ml-2">{getMatchTypeBadge(selectedMatch.match_type)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha:</span>
                        <span className="ml-2">{formatDate(selectedMatch.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Details en formato JSON */}
                  {selectedMatch.match_details && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Match Details (JSON)</h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(selectedMatch.match_details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingManagementPage;