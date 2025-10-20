/**
 * Admin Commissions Page - Gestión de Comisiones
 *
 * Página administrativa para gestionar comisiones por empresa:
 * - Ver comisiones pagadas a NexuPay y personas
 * - Modificar porcentajes de comisión por empresa
 * - Negociaciones diferenciadas
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getAllCompanies, updateCompanyProfile, getCommissionStats, getCompanyCommissionDetails } from '../../services/databaseService';
import {
  DollarSign,
  TrendingUp,
  Building,
  Users,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Percent,
  CheckCircle2
} from 'lucide-react';

const AdminCommissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [commissionStats, setCommissionStats] = useState({
    totalPaidToNexuPay: 0,
    totalPaidToUsers: 0,
    totalCommissions: 0,
    averageCommissionRate: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editData, setEditData] = useState({
    nexupayCommissionType: 'percentage', // 'percentage' or 'fixed'
    nexupayCommission: 0,
    userIncentiveType: 'percentage', // 'percentage' or 'fixed'
    userIncentivePercentage: 0
  });
  const [saving, setSaving] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas reales de comisiones y empresas en paralelo
      const [commissionStatsResult, companiesResult] = await Promise.all([
        getCommissionStats(),
        getAllCompanies()
      ]);

      // Procesar estadísticas de comisiones
      if (commissionStatsResult.error) {
        console.error('Error fetching commission stats:', commissionStatsResult.error);
        setCommissionStats({
          totalPaidToNexuPay: 0,
          totalPaidToUsers: 0,
          totalCommissions: 0,
          averageCommissionRate: 0
        });
      } else {
        setCommissionStats(commissionStatsResult.commissionStats);
      }

      // Procesar empresas
      if (companiesResult.error) {
        console.error('Error fetching companies:', companiesResult.error);
        setCompanies([]);
      } else {
        setCompanies(companiesResult.companies || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setCompanies([]);
      setCommissionStats({
        totalPaidToNexuPay: 0,
        totalPaidToUsers: 0,
        totalCommissions: 0,
        averageCommissionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };


  const handleEditCommission = (company) => {
    setSelectedCompany(company);
    setEditData({
      nexupayCommissionType: company.nexupay_commission_type || 'percentage',
      nexupayCommission: company.nexupay_commission || 15,
      userIncentiveType: company.user_incentive_type || 'percentage',
      userIncentivePercentage: company.user_incentive_percentage || 5
    });
    setShowEditModal(true);
  };

  const handleSaveCommission = async () => {
    if (!selectedCompany) return;

    setSaving(true);
    try {
      const updateData = {
        nexupay_commission_type: editData.nexupayCommissionType,
        nexupay_commission: parseFloat(editData.nexupayCommission),
        user_incentive_type: editData.userIncentiveType,
        user_incentive_percentage: parseFloat(editData.userIncentivePercentage),
        updated_at: new Date().toISOString()
      };

      const result = await updateCompanyProfile(selectedCompany.id, updateData);

      if (result.error) {
        console.error('Error updating commission:', result.error);
        alert('Error al actualizar comisión: ' + result.error);
      } else {
        // Update local state
        setCompanies(prev =>
          prev.map(company =>
            company.id === selectedCompany.id
              ? { ...company, ...updateData }
              : company
          )
        );

        // Recargar estadísticas reales desde la base de datos
        const statsResult = await getCommissionStats();
        if (!statsResult.error) {
          setCommissionStats(statsResult.commissionStats);
        }

        setShowEditModal(false);
        setSelectedCompany(null);
        alert('Comisión actualizada exitosamente');
      }
    } catch (error) {
      console.error('Error saving commission:', error);
      alert('Error al guardar comisión');
    } finally {
      setSaving(false);
    }
  };

  const getCommissionStatus = (rate) => {
    if (rate < 10) return { label: 'Baja', variant: 'success' };
    if (rate <= 20) return { label: 'Estándar', variant: 'warning' };
    return { label: 'Alta', variant: 'danger' };
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Gestión de Comisiones
              </h1>
              <p className="text-green-100 text-lg">
                Datos reales de comisiones pagadas - Configura términos diferenciados por empresa
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600"
          >
            Actualizar
          </Button>
        </div>

        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Comisión NexuPay</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(commissionStats.totalPaidToNexuPay)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Incentivos Usuarios</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(commissionStats.totalPaidToUsers)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Total Comisiones</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(commissionStats.totalCommissions)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Percent className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Comisión Promedio</p>
                <p className="text-2xl font-bold whitespace-nowrap">{commissionStats.averageCommissionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300" />
              <div>
                <p className="text-sm text-green-100">Negocios Cerrados</p>
                <p className="text-2xl font-bold whitespace-nowrap">{commissionStats.totalClosedBusinesses || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Commission Table */}
      <Card
        title="Configuración de Comisiones por Empresa"
        subtitle={`${companies.length} empresas configuradas • ${commissionStats.totalClosedBusinesses || 0} negocios cerrados`}
      >
        <div className="space-y-4">
          {companies.map((company) => {
            const nexupayType = company.nexupay_commission_type || 'percentage';
            const nexupayValue = company.nexupay_commission || 15;
            const userType = company.user_incentive_type || 'percentage';
            const userValue = company.user_incentive_percentage || 5;

            // For status badge, use percentage value if available, otherwise assume standard
            const nexupayStatus = nexupayType === 'percentage'
              ? getCommissionStatus(nexupayValue)
              : { label: 'Fijo', variant: 'secondary' };

            return (
              <div
                key={company.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{company.company_name}</h3>
                      <Badge variant={nexupayStatus.variant} size="sm">
                        {nexupayStatus.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>RUT: {company.rut}</span>
                      <span>•</span>
                      <span>Email: {company.contact_email}</span>
                      <span>•</span>
                      <span>Última actualización: {company.updated_at ? formatDate(new Date(company.updated_at)) : 'Nunca'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Comisión NexuPay</p>
                        <p className="text-lg font-bold text-gray-900">
                          {nexupayType === 'percentage'
                            ? `${nexupayValue}%`
                            : formatCurrency(nexupayValue)
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Incentivo Usuario</p>
                        <p className="text-lg font-bold text-green-600">
                          {userType === 'percentage'
                            ? `${userValue}%`
                            : formatCurrency(userValue)
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCommission(company)}
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    Configurar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Edit Commission Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Configurar Comisiones - ${selectedCompany?.company_name}`}
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Configuración de Comisiones</h4>
                <p className="text-sm text-blue-700">
                  Define las comisiones que esta empresa pagará a NexuPay y los incentivos que recibirán sus usuarios por cada negocio cerrado.
                  Puedes elegir entre porcentaje del monto o monto fijo por negocio cerrado.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* NexuPay Commission Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Comisión NexuPay</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Comisión
                  </label>
                  <Select
                    value={editData.nexupayCommissionType}
                    onChange={(value) => setEditData(prev => ({ ...prev, nexupayCommissionType: value }))}
                    options={[
                      { value: 'percentage', label: 'Porcentaje (%)' },
                      { value: 'fixed', label: 'Monto Fijo ($)' }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {editData.nexupayCommissionType === 'percentage' ? 'Comisión (%)' : 'Monto Fijo ($)'}
                  </label>
                  <Input
                    type="number"
                    value={editData.nexupayCommission}
                    onChange={(e) => setEditData(prev => ({ ...prev, nexupayCommission: e.target.value }))}
                    min="0"
                    max={editData.nexupayCommissionType === 'percentage' ? "50" : undefined}
                    step="0.1"
                    placeholder={editData.nexupayCommissionType === 'percentage' ? "15.0" : "5000"}
                  />
                  <p className="text-xs text-gray-500">
                    {editData.nexupayCommissionType === 'percentage'
                      ? 'Porcentaje que la empresa paga a NexuPay por cada negocio cerrado'
                      : 'Monto fijo que la empresa paga a NexuPay por cada negocio cerrado'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* User Incentive Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Incentivo Usuario</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Incentivo
                  </label>
                  <Select
                    value={editData.userIncentiveType}
                    onChange={(value) => setEditData(prev => ({ ...prev, userIncentiveType: value }))}
                    options={[
                      { value: 'percentage', label: 'Porcentaje (%)' },
                      { value: 'fixed', label: 'Monto Fijo ($)' }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {editData.userIncentiveType === 'percentage' ? 'Incentivo (%)' : 'Monto Fijo ($)'}
                  </label>
                  <Input
                    type="number"
                    value={editData.userIncentivePercentage}
                    onChange={(e) => setEditData(prev => ({ ...prev, userIncentivePercentage: e.target.value }))}
                    min="0"
                    max={editData.userIncentiveType === 'percentage' ? "20" : undefined}
                    step="0.1"
                    placeholder={editData.userIncentiveType === 'percentage' ? "5.0" : "1000"}
                  />
                  <p className="text-xs text-gray-500">
                    {editData.userIncentiveType === 'percentage'
                      ? 'Porcentaje de incentivo que reciben los usuarios por cada negocio cerrado'
                      : 'Monto fijo de incentivo que reciben los usuarios por cada negocio cerrado'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Vista Previa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Comisión NexuPay:</span>
                <span className="font-semibold ml-2">
                  {editData.nexupayCommissionType === 'percentage'
                    ? `${editData.nexupayCommission}%`
                    : formatCurrency(editData.nexupayCommission)
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-600">Incentivo Usuario:</span>
                <span className="font-semibold ml-2 text-green-600">
                  {editData.userIncentiveType === 'percentage'
                    ? `${editData.userIncentivePercentage}%`
                    : formatCurrency(editData.userIncentivePercentage)
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Los cambios en las comisiones afectarán todos los pagos futuros de esta empresa.
                  Los pagos ya procesados mantendrán sus comisiones originales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveCommission}
              loading={saving}
              className="flex-1"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCommissionsPage;