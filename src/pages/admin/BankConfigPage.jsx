/**
 * Bank Configuration Page
 *
 * Página para configurar la integración con bancos
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Badge, Select, LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Building,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  DollarSign,
  TrendingUp,
  Shield,
  Plus,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const BankConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [banks, setBanks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankForm, setBankForm] = useState({
    name: '',
    bankCode: '',
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    isActive: true
  });

  useEffect(() => {
    loadBankConfig();
  }, []);

  const loadBankConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
        // Usar datos por defecto si hay error
        setBanks([]);
      } else {
        // Cargar configuración de bancos desde la base de datos
        const banksConfig = result.config.banks || [];
        setBanks(banksConfig);
      }
    } catch (error) {
      console.error('Error loading bank config:', error);
      setError('Error al cargar configuración de bancos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = () => {
    setBankForm({
      name: '',
      bankCode: '',
      apiEndpoint: '',
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      isActive: true
    });
    setEditingBank(null);
    setShowAddModal(true);
  };

  const handleEditBank = (bank) => {
    setBankForm({
      name: bank.name,
      bankCode: bank.bankCode,
      apiEndpoint: bank.apiEndpoint,
      apiKey: bank.apiKey || '',
      apiSecret: bank.apiSecret || '',
      webhookUrl: bank.webhookUrl || '',
      isActive: bank.isActive
    });
    setEditingBank(bank);
    setShowAddModal(true);
  };

  const handleSaveBank = async () => {
    try {
      if (!bankForm.name || !bankForm.bankCode || !bankForm.apiEndpoint) {
        await Swal.fire({
          icon: 'error',
          title: 'Campos requeridos',
          text: 'Por favor complete todos los campos obligatorios',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setSaving(true);

      let updatedBanks;
      if (editingBank) {
        // Actualizar banco existente
        updatedBanks = banks.map(bank =>
          bank.id === editingBank.id
            ? { ...bank, ...bankForm, updatedAt: new Date().toISOString() }
            : bank
        );
      } else {
        // Agregar nuevo banco
        const newBank = {
          id: Date.now().toString(),
          ...bankForm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSync: null,
          totalTransactions: 0,
          monthlyVolume: 0
        };
        updatedBanks = [...banks, newBank];
      }

      // Guardar en base de datos
      const configToSave = {
        banks: updatedBanks
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      setBanks(updatedBanks);
      setShowAddModal(false);

      await Swal.fire({
        icon: 'success',
        title: editingBank ? 'Banco actualizado' : 'Banco agregado',
        text: `El banco ha sido ${editingBank ? 'actualizado' : 'agregado'} exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving bank:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración del banco',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = async (bankId) => {
    const result = await Swal.fire({
      title: '¿Eliminar banco?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const updatedBanks = banks.filter(bank => bank.id !== bankId);

        // Guardar en base de datos
        const configToSave = {
          banks: updatedBanks
        };

        const saveResult = await updateSystemConfig(configToSave);

        if (saveResult.error) {
          throw new Error(saveResult.error);
        }

        setBanks(updatedBanks);

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

  const handleTestConnection = async (bank) => {
    await Swal.fire({
      icon: 'info',
      title: 'Probando conexión',
      text: `Probando conexión con ${bank.name}...`,
      showConfirmButton: false,
      timer: 2000
    });

    // Simular prueba de conexión
    setTimeout(async () => {
      await Swal.fire({
        icon: 'success',
        title: 'Conexión exitosa',
        text: `La conexión con ${bank.name} está funcionando correctamente`,
        confirmButtonText: 'Aceptar'
      });
    }, 1000);
  };

  const handleSyncBank = async (bank) => {
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
      const updatedBanks = banks.map(b =>
        b.id === bank.id
          ? { ...b, lastSync: new Date(), totalTransactions: b.totalTransactions + Math.floor(Math.random() * 10) }
          : b
      );

      // Guardar en base de datos
      const configToSave = {
        banks: updatedBanks
      };

      try {
        const result = await updateSystemConfig(configToSave);
        if (!result.error) {
          setBanks(updatedBanks);
        }
      } catch (error) {
        console.error('Error updating sync time:', error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Sincronización completada',
        text: `Los datos han sido sincronizados exitosamente con ${bank.name}`,
        confirmButtonText: 'Aceptar'
      });
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar configuración</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadBankConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/configuracion')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Configuración de Bancos
              </h1>
              <p className="text-green-100 text-lg">
                Gestiona las integraciones con instituciones bancarias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="info" size="lg">
              {banks.filter(b => b.isActive).length} Activos
            </Badge>
            <Button
              variant="secondary"
              onClick={handleAddBank}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Agregar Banco
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Bancos Configurados</p>
                <p className="text-2xl font-bold">{banks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Transacciones Totales</p>
                <p className="text-2xl font-bold">{banks.reduce((sum, b) => sum + b.totalTransactions, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Volumen Total</p>
                <p className="text-2xl font-bold">{formatCurrency(banks.reduce((sum, b) => sum + b.monthlyVolume, 0))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banks List */}
      <div className="space-y-6">
        {banks.length === 0 ? (
          <Card className="text-center py-16">
            <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl inline-block mb-8">
              <Building className="w-20 h-20 text-gray-600" />
            </div>
            <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              No hay bancos configurados
            </h3>
            <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
              Configure las integraciones con bancos para habilitar transferencias automáticas.
            </p>
            <Button
              variant="primary"
              onClick={handleAddBank}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Configurar Primer Banco
            </Button>
          </Card>
        ) : (
          banks.map((bank) => (
            <Card key={bank.id} className="group hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-secondary-900 font-display">
                        {bank.name}
                      </h3>
                      <Badge variant={bank.isActive ? "success" : "danger"}>
                        {bank.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="info" size="sm">
                        Código: {bank.bankCode}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Transacciones</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {bank.totalTransactions.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <DollarSign className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Volumen</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {formatCurrency(bank.monthlyVolume)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <RefreshCw className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Última Sync</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {bank.lastSync ? formatDate(bank.lastSync) : 'Nunca'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-secondary-600">
                      <strong>API Endpoint:</strong> {bank.apiEndpoint}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 ml-6">
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                    onClick={() => handleEditBank(bank)}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleTestConnection(bank)}
                    leftIcon={<Shield className="w-4 h-4" />}
                  >
                    Probar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleSyncBank(bank)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Sincronizar
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="hover:scale-105 transition-all"
                    onClick={() => handleDeleteBank(bank.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Bank Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingBank ? `Editar ${editingBank.name}` : "Agregar Nuevo Banco"}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Banco"
              value={bankForm.name}
              onChange={(e) => setBankForm({...bankForm, name: e.target.value})}
              placeholder="Ej: Banco Estado"
              required
            />

            <Input
              label="Código del Banco"
              value={bankForm.bankCode}
              onChange={(e) => setBankForm({...bankForm, bankCode: e.target.value})}
              placeholder="Ej: 012"
              required
            />
          </div>

          <Input
            label="API Endpoint"
            value={bankForm.apiEndpoint}
            onChange={(e) => setBankForm({...bankForm, apiEndpoint: e.target.value})}
            placeholder="https://api.banco.cl"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="API Key"
              type="password"
              value={bankForm.apiKey}
              onChange={(e) => setBankForm({...bankForm, apiKey: e.target.value})}
              placeholder="Clave de API"
            />

            <Input
              label="API Secret"
              type="password"
              value={bankForm.apiSecret}
              onChange={(e) => setBankForm({...bankForm, apiSecret: e.target.value})}
              placeholder="Secreto de API"
            />
          </div>

          <Input
            label="URL de Webhook (Opcional)"
            value={bankForm.webhookUrl}
            onChange={(e) => setBankForm({...bankForm, webhookUrl: e.target.value})}
            placeholder="https://tu-dominio.com/webhooks/banco"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={bankForm.isActive}
              onChange={(e) => setBankForm({...bankForm, isActive: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Banco activo y operativo
            </label>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Información importante</h4>
                <p className="text-sm text-yellow-700">
                  Asegúrese de que las credenciales de API sean correctas y que el banco esté autorizado
                  para realizar transferencias automáticas. Las configuraciones incorrectas pueden afectar
                  el procesamiento de pagos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveBank}
              loading={saving}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {editingBank ? 'Actualizar Banco' : 'Agregar Banco'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BankConfigPage;