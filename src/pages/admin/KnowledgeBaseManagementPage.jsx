/**
 * Knowledge Base Management Page - Administración
 * 
 * Página para administradores para gestionar la base de conocimiento
 * de todas las empresas corporativas
 */

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/common';
import { Brain, Settings, Users, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { initializeExistingCompaniesKnowledgeBase } from '../../services/knowledgeBaseService';
import { supabase } from '../../config/supabase';

const KnowledgeBaseManagementPage = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    companiesWithKB: 0,
    companiesWithoutKB: 0,
    lastSync: null
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadStats();
    loadCompanies();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, user_id, company_name, rut, created_at');

      if (companiesError) throw companiesError;

      const { data: kbData, error: kbError } = await supabase
        .from('company_ai_config')
        .select('company_id');

      if (kbError) throw kbError;

      const companiesWithKBSet = new Set(kbData?.map(kb => kb.company_id) || []);
      
      setStats({
        totalCompanies: companiesData?.length || 0,
        companiesWithKB: companiesWithKBSet.size,
        companiesWithoutKB: (companiesData?.length || 0) - companiesWithKBSet.size,
        lastSync: new Date().toLocaleString('es-CL')
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          user_id,
          company_name,
          rut,
          contact_email,
          created_at,
          company_ai_config!left (
            id,
            is_active,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  const handleInitializeAll = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      const result = await initializeExistingCompaniesKnowledgeBase();
      
      setSyncResult({
        success: true,
        processed: result.processed,
        errors: result.errors
      });

      // Recargar estadísticas y empresas
      await loadStats();
      await loadCompanies();

    } catch (error) {
      setSyncResult({
        success: false,
        error: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  const hasKnowledgeBase = (company) => {
    return company.company_ai_config && company.company_ai_config.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Gestión de Base de Conocimiento
          </h1>
          <p className="text-gray-600 mt-1">
            Administra la base de conocimiento IA para todas las empresas corporativas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadStats}
            loading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
          
          <Button
            variant="gradient"
            onClick={handleInitializeAll}
            loading={syncing}
            leftIcon={<Settings className="w-4 h-4" />}
            disabled={stats.companiesWithoutKB === 0}
          >
            {stats.companiesWithoutKB > 0 
              ? `Inicializar ${stats.companiesWithoutKB} empresas` 
              : 'Todo actualizado'
            }
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Base de Conocimiento</p>
              <p className="text-2xl font-bold text-green-600">{stats.companiesWithKB}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sin Base de Conocimiento</p>
              <p className="text-2xl font-bold text-orange-600">{stats.companiesWithoutKB}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Última Sincronización</p>
              <p className="text-sm font-medium text-gray-900">
                {stats.lastSync || 'Nunca'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Resultado de sincronización */}
      {syncResult && (
        <Card className={`p-4 ${syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {syncResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${syncResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {syncResult.success ? '✅ Sincronización completada' : '❌ Error en sincronización'}
              </h3>
              {syncResult.success ? (
                <p className="text-green-800 text-sm mt-1">
                  Se procesaron {syncResult.processed} empresas exitosamente.
                  {syncResult.errors.length > 0 && ` ${syncResult.errors.length} errores encontrados.`}
                </p>
              ) : (
                <p className="text-red-800 text-sm mt-1">{syncResult.error}</p>
              )}
              
              {syncResult.success && syncResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-green-800 text-sm cursor-pointer hover:underline">
                    Ver errores ({syncResult.errors.length})
                  </summary>
                  <ul className="mt-1 text-green-700 text-sm space-y-1">
                    {syncResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Lista de empresas */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Empresas Corporativas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Estado de la base de conocimiento por empresa
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Base de Conocimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.rut}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.contact_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasKnowledgeBase(company) ? (
                      <Badge variant="success" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Sin configurar
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {companies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron empresas corporativas</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default KnowledgeBaseManagementPage;