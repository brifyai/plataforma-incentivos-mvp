/**
 * Componente de Estado de Sincronización CRM
 * 
 * Muestra el estado de la sincronización con el CRM y permite
 * ejecutar sincronizaciones manuales.
 */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../hooks/integrations';

const CRMSyncStatus = () => {
  const [lastSync, setLastSync] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  
  const { 
    activeCRM, 
    availableCRMs, 
    fullSync, 
    incrementalSync,
    changeCRM,
    loading 
  } = useCRM();

  useEffect(() => {
    // Cargar última sincronización del localStorage
    const lastSyncData = localStorage.getItem('lastCRMSync');
    if (lastSyncData) {
      setLastSync(JSON.parse(lastSyncData));
    }
  }, []);

  const handleFullSync = async () => {
    setSyncInProgress(true);
    
    try {
      const result = await fullSync({
        includeHistory: true
      });

      if (result.success) {
        const syncData = {
          timestamp: new Date().toISOString(),
          type: 'full',
          stats: result.summary
        };
        
        setLastSync(syncData);
        setSyncStats(result.summary);
        localStorage.setItem('lastCRMSync', JSON.stringify(syncData));
      }
    } catch (error) {
      console.error('Error en sincronización completa:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleIncrementalSync = async () => {
    setSyncInProgress(true);
    
    try {
      const since = lastSync?.timestamp 
        ? new Date(lastSync.timestamp)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Última semana
      
      const result = await incrementalSync(since);

      if (result.success) {
        const syncData = {
          timestamp: new Date().toISOString(),
          type: 'incremental',
          stats: result.summary
        };
        
        setLastSync(syncData);
        setSyncStats(result.summary);
        localStorage.setItem('lastCRMSync', JSON.stringify(syncData));
      }
    } catch (error) {
      console.error('Error en sincronización incremental:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceSync = () => {
    if (!lastSync?.timestamp) return null;
    
    const now = new Date();
    const syncDate = new Date(lastSync.timestamp);
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    return 'hace un momento';
  };

  if (!activeCRM) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay CRM configurado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure al menos un CRM para usar esta funcionalidad
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Sincronización CRM
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            CRM Activo: <span className="font-semibold text-blue-600">{activeCRM}</span>
          </p>
        </div>
        
        {/* Selector de CRM */}
        <select
          value={activeCRM}
          onChange={(e) => changeCRM(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {availableCRMs.filter(crm => crm.configured).map(crm => (
            <option key={crm.name} value={crm.name}>
              {crm.name.charAt(0).toUpperCase() + crm.name.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Estado de última sincronización */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Última Sincronización</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(lastSync?.timestamp)}
              {lastSync && (
                <span className="ml-2 text-gray-400">({getTimeSinceSync()})</span>
              )}
            </p>
            {lastSync?.type && (
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {lastSync.type === 'full' ? 'Completa' : 'Incremental'}
              </span>
            )}
          </div>
          
          {syncInProgress ? (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Sincronizando...</span>
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">Sincronizado</span>
            </div>
          )}
        </div>

        {/* Estadísticas de última sincronización */}
        {syncStats && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{syncStats.debtors || 0}</p>
              <p className="text-xs text-gray-600">Deudores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{syncStats.debts || 0}</p>
              <p className="text-xs text-gray-600">Deudas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{syncStats.activities || 0}</p>
              <p className="text-xs text-gray-600">Actividades</p>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        <button
          onClick={handleIncrementalSync}
          disabled={syncInProgress || loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            syncInProgress || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Sincronización Rápida
          </span>
        </button>

        <button
          onClick={handleFullSync}
          disabled={syncInProgress || loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            syncInProgress || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
            </svg>
            Sincronización Completa
          </span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 La sincronización rápida solo actualiza los cambios recientes. 
          Use la sincronización completa para importar todos los datos nuevamente.
        </p>
      </div>
    </div>
  );
};

export default CRMSyncStatus;
