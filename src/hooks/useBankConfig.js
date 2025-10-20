/**
 * Custom Hook para gestión de configuración de bancos
 *
 * Extrae toda la lógica de configuración de bancos
 * para mantener los componentes más limpios y reutilizables
 */

import { useState, useEffect } from 'react';
import { updateSystemConfig } from '../services/databaseService';
import Swal from 'sweetalert2';

export const useBankConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banks, setBanks] = useState([]);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    loadBankConfig();
  }, []);

  const loadBankConfig = async () => {
    try {
      setLoading(true);

      const { getSystemConfig } = await import('../services/databaseService');
      const result = await getSystemConfig();

      if (result.error) {
        console.error('Config error:', result.error);
        setBanks([]);
      } else {
        const banksConfig = result.config.banks || [];
        setBanks(banksConfig);
      }
    } catch (error) {
      console.error('Error loading bank config:', error);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nuevo banco
  const addBank = (bankData) => {
    const newBank = {
      id: Date.now().toString(),
      ...bankData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSync: null,
      totalTransactions: 0,
      monthlyVolume: 0
    };

    setBanks(prev => [...prev, newBank]);
    return newBank;
  };

  // Actualizar banco existente
  const updateBank = (bankId, updates) => {
    setBanks(prev => prev.map(bank =>
      bank.id === bankId
        ? { ...bank, ...updates, updatedAt: new Date().toISOString() }
        : bank
    ));
  };

  // Eliminar banco
  const removeBank = (bankId) => {
    setBanks(prev => prev.filter(bank => bank.id !== bankId));
  };

  // Guardar configuración en base de datos
  const saveBankConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        banks: banks
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Configuración de bancos guardada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving bank config:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración de bancos',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  // Probar conexión con banco
  const testBankConnection = async (bank) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando conexión',
        text: `Probando conexión con ${bank.name}...`,
        showConfirmButton: false,
        timer: 2000
      });

      // Simular éxito
      setTimeout(async () => {
        await Swal.fire({
          icon: 'success',
          title: 'Conexión exitosa',
          text: `La conexión con ${bank.name} está funcionando correctamente`,
          confirmButtonText: 'Aceptar'
        });
      }, 1000);

    } catch (error) {
      console.error(`Error testing connection for ${bank.name}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la conexión',
        text: `No se pudo conectar con ${bank.name}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Sincronizar datos con banco
  const syncBankData = async (bank) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Sincronizando',
        text: `Sincronizando datos con ${bank.name}...`,
        showConfirmButton: false,
        timer: 2000
      });

      // Simular sincronización
      setTimeout(async () => {
        // Actualizar última sincronización
        updateBank(bank.id, {
          lastSync: new Date(),
          totalTransactions: bank.totalTransactions + Math.floor(Math.random() * 10)
        });

        await Swal.fire({
          icon: 'success',
          title: 'Sincronización completada',
          text: `Los datos han sido sincronizados exitosamente con ${bank.name}`,
          confirmButtonText: 'Aceptar'
        });
      }, 1500);

    } catch (error) {
      console.error(`Error syncing data for ${bank.name}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en sincronización',
        text: `No se pudieron sincronizar los datos con ${bank.name}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Eliminar banco con confirmación
  const deleteBank = async (bankId, bankName) => {
    const result = await Swal.fire({
      title: '¿Eliminar banco?',
      text: `¿Estás seguro de que quieres eliminar ${bankName}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        removeBank(bankId);
        await saveBankConfig();

        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El banco ha sido eliminado exitosamente',
          timer: 2000
        });
      } catch (error) {
        console.error('Error deleting bank:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar el banco',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  return {
    // Estados
    banks,
    loading,
    saving,

    // Acciones
    loadBankConfig,
    addBank,
    updateBank,
    removeBank,
    saveBankConfig,
    testBankConnection,
    syncBankData,
    deleteBank
  };
};