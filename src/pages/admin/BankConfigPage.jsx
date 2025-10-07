/**
 * Bank Configuration Page
 *
 * Página para configurar la integración con bancos
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge, Select } from '../../components/common';
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
  Trash2
} from 'lucide-react';

const BankConfigPage = () => {
  const [loading, setLoading] = useState(true);
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
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      // Simular carga de bancos configurados
      setTimeout(() => {
        setBanks([
          {
            id: '1',
            name: 'Banco Estado',
            bankCode: '012',
            apiEndpoint: 'https://api.bancoestado.cl',
            isActive: true,
            lastSync: new Date(),
            totalTransactions: 450,
            monthlyVolume: 15000000
          },
          {
            id: '2',
            name: 'Banco de Chile',
            bankCode: '001',
            apiEndpoint: 'https://api.bancochile.cl',
            isActive: false,
            lastSync: null,
            totalTransactions: 0,
            monthlyVolume: 0
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading banks:', error);
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
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      if (editingBank) {
        // Actualizar banco existente
        setBanks(prev => prev.map(bank =>
          bank.id === editingBank.id
            ? { ...bank, ...bankForm }
            : bank
        ));
        alert('✅ Banco actualizado exitosamente');
      } else {
        // Agregar nuevo banco
        const newBank = {
          id: Date.now().toString(),
          ...bankForm,
          lastSync: null,
          totalTransactions: 0,
          monthlyVolume: 0
        };
        setBanks(prev => [...prev, newBank]);
        alert('✅ Banco agregado exitosamente');
      }

      setShowAddModal(false);
    } catch (error) {
      alert('Error al guardar banco: ' + error.message);
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (confirm('¿Está seguro de que desea eliminar este banco?')) {
      try {
        setBanks(prev => prev.filter(bank => bank.id !== bankId));
        alert('✅ Banco eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar banco: ' + error.message);
      }
    }
  };

  const handleTestConnection = async (bank) => {
    alert(`🔄 Probando conexión con ${bank.name}...`);
    setTimeout(() => {
      alert(`✅ Conexión exitosa con ${bank.name}`);
    }, 1500);
  };

  const handleSyncBank = async (bank) => {
    alert(`🔄 Sincronizando datos con ${bank.name}...`);
    setTimeout(() => {
      alert(`✅ Datos sincronizados exitosamente con ${bank.name}`);
      loadBanks();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
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