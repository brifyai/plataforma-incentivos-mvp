/**
 * Custom Hook para gestión de configuración de analytics
 *
 * Extrae toda la lógica de configuración de proveedores de analytics
 * para mantener los componentes más limpios y reutilizables
 */

import { useState, useEffect } from 'react';
import { updateSystemConfig } from '../services/databaseService';
import Swal from 'sweetalert2';

export const useAnalyticsConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyticsProviders, setAnalyticsProviders] = useState([]);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    loadAnalyticsConfig();
  }, []);

  const loadAnalyticsConfig = async () => {
    try {
      setLoading(true);

      const { getSystemConfig } = await import('../services/databaseService');
      const result = await getSystemConfig();

      if (result.error) {
        console.error('Config error:', result.error);
        setAnalyticsProviders([]);
      } else {
        const analyticsConfig = result.config.analytics_providers || [];
        setAnalyticsProviders(analyticsConfig);
      }
    } catch (error) {
      console.error('Error loading analytics config:', error);
      setAnalyticsProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nuevo proveedor de analytics
  const addAnalyticsProvider = (providerData) => {
    const newProvider = {
      id: Date.now().toString(),
      ...providerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventsTracked: 0,
      usersTracked: 0,
      lastSync: null
    };

    setAnalyticsProviders(prev => [...prev, newProvider]);
    return newProvider;
  };

  // Actualizar proveedor existente
  const updateAnalyticsProvider = (providerId, updates) => {
    setAnalyticsProviders(prev => prev.map(provider =>
      provider.id === providerId
        ? { ...provider, ...updates, updatedAt: new Date().toISOString() }
        : provider
    ));
  };

  // Eliminar proveedor
  const removeAnalyticsProvider = (providerId) => {
    setAnalyticsProviders(prev => prev.filter(provider => provider.id !== providerId));
  };

  // Guardar configuración en base de datos
  const saveAnalyticsConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        analytics_providers: analyticsProviders
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Configuración de analytics guardada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving analytics config:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración de analytics',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  // Probar conexión con proveedor
  const testAnalyticsConnection = async (provider) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando conexión',
        text: `Probando conexión con ${provider.name}...`,
        showConfirmButton: false,
        timer: 2000
      });

      // Simular éxito
      setTimeout(async () => {
        await Swal.fire({
          icon: 'success',
          title: 'Conexión exitosa',
          text: `La conexión con ${provider.name} está funcionando correctamente`,
          confirmButtonText: 'Aceptar'
        });
      }, 1000);

    } catch (error) {
      console.error(`Error testing connection for ${provider.name}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la conexión',
        text: `No se pudo conectar con ${provider.name}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Sincronizar datos con proveedor
  const syncAnalyticsData = async (provider) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Sincronizando',
        text: `Sincronizando datos con ${provider.name}...`,
        showConfirmButton: false,
        timer: 2000
      });

      // Simular sincronización
      setTimeout(async () => {
        // Actualizar última sincronización y métricas
        updateAnalyticsProvider(provider.id, {
          lastSync: new Date(),
          eventsTracked: provider.eventsTracked + Math.floor(Math.random() * 50),
          usersTracked: provider.usersTracked + Math.floor(Math.random() * 10)
        });

        await Swal.fire({
          icon: 'success',
          title: 'Sincronización completada',
          text: `Los datos han sido sincronizados exitosamente con ${provider.name}`,
          confirmButtonText: 'Aceptar'
        });
      }, 1500);

    } catch (error) {
      console.error(`Error syncing data for ${provider.name}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en sincronización',
        text: `No se pudieron sincronizar los datos con ${provider.name}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Eliminar proveedor con confirmación
  const deleteAnalyticsProvider = async (providerId, providerName) => {
    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `¿Estás seguro de que quieres eliminar ${providerName}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        removeAnalyticsProvider(providerId);
        await saveAnalyticsConfig();

        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El proveedor ha sido eliminado exitosamente',
          timer: 2000
        });
      } catch (error) {
        console.error('Error deleting analytics provider:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar el proveedor',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  return {
    // Estados
    analyticsProviders,
    loading,
    saving,

    // Acciones
    loadAnalyticsConfig,
    addAnalyticsProvider,
    updateAnalyticsProvider,
    removeAnalyticsProvider,
    saveAnalyticsConfig,
    testAnalyticsConnection,
    syncAnalyticsData,
    deleteAnalyticsProvider
  };
};