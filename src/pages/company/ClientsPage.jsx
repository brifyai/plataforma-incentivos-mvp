/**
 * Clients Page
 *
 * Página principal para gestión de clientes de la empresa
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Select } from '../../components/common';
import ClientManagement from './components/ClientManagement';
import AdvancedImportSystem from '../../components/company/AdvancedImportSystem';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  DollarSign,
  Building,
  Calendar,
  Activity,
  TrendingDown,
  AlertTriangle,
  Lock,
  FileText,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { getCompanyDebts, getCompanyPayments, getCorporateClients } from '../../services/databaseService';
import { getCompanyVerification, VERIFICATION_STATUS } from '../../services/verificationService';

const ClientsPage = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalDebt: 0,
    totalPaid: 0,
    totalPending: 0
  });
  
  // Estados para verificación y bloqueo
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [showImportSection, setShowImportSection] = useState(false);

  // Función para formatear números grandes de manera compacta
  const formatCompactNumber = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  // Función helper para calcular rangos de fechas
  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Función para aplicar rangos predefinidos
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setDateFilter(dates);
  };

  useEffect(() => {
    loadCorporateClients();
    loadClients();
    loadVerificationStatus();
  }, []);

  // Cargar estado de verificación
  const loadVerificationStatus = async () => {
    if (!profile?.company?.id) {
      setVerificationLoading(false);
      return;
    }

    try {
      console.log('🔍 Cargando estado de verificación para ClientsPage...');
      const { verification, error } = await getCompanyVerification(profile.company.id);
      
      if (error) {
        console.error('❌ Error cargando verificación:', error);
        setVerificationStatus(null);
      } else {
        console.log('✅ Estado de verificación cargado:', verification?.status);
        setVerificationStatus(verification);
      }
    } catch (error) {
      console.error('💥 Error en loadVerificationStatus:', error);
      setVerificationStatus(null);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Función para determinar si la página está bloqueada
  const isPageBlocked = () => {
    if (!profile?.company?.id) return false;
    
    // Si no hay estado de verificación, la empresa no ha iniciado el proceso
    if (!verificationStatus) {
      return {
        blocked: true,
        title: 'Verificación Requerida',
        message: 'Debes completar el proceso de verificación de tu empresa antes de poder gestionar clientes.',
        action: 'Iniciar Verificación',
        actionLink: '/empresa/verificacion'
      };
    }

    // Si está pendiente de documentos
    if (verificationStatus.status === VERIFICATION_STATUS.PENDING) {
      return {
        blocked: true,
        title: 'Documentos Requeridos',
        message: 'Debes subir los documentos de verificación de tu empresa antes de poder gestionar clientes.',
        action: 'Subir Documentos',
        actionLink: '/empresa/verificacion'
      };
    }

    // Si está en revisión o ya fue aprobada, no está bloqueada
    return { blocked: false };
  };

  // Función para manejar completado de importación
  const handleImportComplete = () => {
    console.log('✅ Importación completada, recargando clientes...');
    loadClients();
  };

  const loadCorporateClients = async () => {
    try {
      let corporateClients;
      
      // Para usuarios con god_mode, mostrar TODOS los clientes corporativos del sistema
      if (profile?.role === 'god_mode') {
        console.log('🔑 God Mode: Cargando todos los clientes corporativos para página de clientes');
        const { data: allClients, error } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('Error loading all corporate clients:', error);
          setCorporateClients([]);
          return;
        }
        corporateClients = allClients;
      } else {
        // Para usuarios normales, usar su company_id
        if (!profile?.company?.id) {
          console.warn('No company ID found for normal user');
          setCorporateClients([]);
          return;
        }

        const { corporateClients: companyClients, error } = await getCorporateClients(profile.company.id);
        if (error) {
          console.error('Error loading corporate clients:', error);
          setCorporateClients([]);
          return;
        }
        corporateClients = companyClients;
      }

      // Normalizar a estructura usada por el filtro local
      const normalized = (corporateClients || []).map((c) => ({
        id: c.id,
        company_name: c.name || c.business_name || 'Cliente',
        company_rut: c.rut || c.company_rut || '',
        industry: c.industry || '',
        contract_value: c.contract_value || null,
        status: c.is_active ? 'active' : 'inactive',
        created_at: c.created_at || null
      }));

      console.log(`📊 Clientes corporativos cargados en ClientsPage: ${normalized.length}`);
      setCorporateClients(normalized);
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      setCorporateClients([]);
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);

      if (!profile?.company?.id) {
        setClients([]);
        setStats({
          totalClients: 0,
          activeClients: 0,
          totalDebt: 0,
          totalPaid: 0,
          totalPending: 0
        });
        return;
      }

      const companyId = profile.company.id;

      // Obtener solo deudas asociadas a clientes corporativos
      const [debtsRes, paymentsRes] = await Promise.all([
        getCompanyDebts(companyId),
        getCompanyPayments(companyId)
      ]);

      if (debtsRes.error) console.error('Error fetching company debts:', debtsRes.error);
      if (paymentsRes.error) console.error('Error fetching company payments:', paymentsRes.error);

      // FILTRAR SOLO DEUDAS DE CLIENTES CORPORATIVOS
      // Solo incluir deudas que tengan un client_id asociado (clientes corporativos)
      const debts = (debtsRes.debts || []).filter(debt => {
        // Solo incluir deudas que estén asociadas a un cliente corporativo
        return debt.client_id !== null && debt.client_id !== undefined;
      });
      
      const payments = (paymentsRes.payments || []).filter(p => p.status === 'completed');

      // Agrupar pagos por usuario
      const payByUser = {};
      for (const p of payments) {
        const uid = p.user?.id || p.user_id;
        if (!uid) continue;
        if (!payByUser[uid]) payByUser[uid] = { total: 0, last: null };
        const amt = parseFloat(p.amount) || 0;
        payByUser[uid].total += amt;
        const dt = new Date(p.transaction_date || p.date || p.created_at || Date.now());
        if (!payByUser[uid].last || dt > payByUser[uid].last) payByUser[uid].last = dt;
      }

      // Agregar deudas por usuario
      const mapByUser = new Map();
      for (const d of debts) {
        const uid = d.user?.id || d.user_id;
        if (!uid) continue;
        if (!mapByUser.has(uid)) {
          mapByUser.set(uid, {
            id: uid,
            name: d.user?.full_name || 'Usuario',
            email: d.user?.email || '',
            phone: d.user?.phone || '',
            rut: d.user?.rut || '',
            totalDebt: 0,
            paidAmount: 0,
            pendingAmount: 0,
            lastPayment: null,
            status: 'active',
            companyName: profile?.company?.business_name || profile?.company?.name || 'Empresa',
            corporateClientName: d.client?.business_name || null,
            corporateClientId: d.client?.id || null,
            firstDebtDate: d.created_at
          });
        }
        const item = mapByUser.get(uid);
        const current = parseFloat(d.current_amount ?? d.amount ?? d.original_amount ?? 0);
        item.totalDebt += isNaN(current) ? 0 : current;

        // status heurístico a partir de la deuda
        if (d.status === 'completed') {
          item.status = 'completed';
        }
        // Conservar primer registro de deuda para fallback en cálculos de atraso
        if (!item.firstDebtDate || new Date(d.created_at) < new Date(item.firstDebtDate)) {
          item.firstDebtDate = d.created_at;
        }
        // Si hay cliente asociado, mantener el último visto como etiqueta
        if (d.client?.business_name) item.corporateClientName = d.client.business_name;
        if (d.client?.id) item.corporateClientId = d.client.id;
      }

      // Aplicar pagos
      mapByUser.forEach((item, uid) => {
        const pay = payByUser[uid];
        item.paidAmount = pay ? pay.total : 0;
        item.lastPayment = pay && pay.last ? pay.last.toISOString() : null;
        item.pendingAmount = Math.max(item.totalDebt - item.paidAmount, 0);
        if (item.pendingAmount <= 0 && item.totalDebt > 0) {
          item.status = 'completed';
        }
      });

      const clientSummaries = Array.from(mapByUser.values()).sort((a, b) => b.pendingAmount - a.pendingAmount);

      setClients(clientSummaries);

      // Calcular estadísticas reales
      const totalClients = clientSummaries.length;
      const activeClients = clientSummaries.filter(c => c.status !== 'completed').length;
      const totalDebt = clientSummaries.reduce((sum, c) => sum + c.totalDebt, 0);
      const totalPaid = clientSummaries.reduce((sum, c) => sum + c.paidAmount, 0);
      const totalPending = clientSummaries.reduce((sum, c) => sum + c.pendingAmount, 0);

      setStats({
        totalClients,
        activeClients,
        totalDebt,
        totalPaid,
        totalPending
      });
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
      setStats({
        totalClients: 0,
        activeClients: 0,
        totalDebt: 0,
        totalPaid: 0,
        totalPending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si la página está bloqueada
  const blockStatus = isPageBlocked();
  
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Hero Section - Modern Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-3xl p-4 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Gestión de Clientes/Deudores Corporativos
              </h1>
              <p className="text-blue-100 text-base">
                Administra los deudores de tus clientes corporativos, pagos y acuerdos de manera eficiente
              </p>
            </div>
            <div className="hidden md:block">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                <Users className="w-3 h-3 mr-1" />
                {stats.totalClients} Clientes
              </Badge>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-blue-100">Total Clientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{stats.activeClients}</p>
                  <p className="text-xs text-blue-100">Clientes Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{formatCompactNumber(stats.totalDebt)}</p>
                  <p className="text-xs text-blue-100">Deuda Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <BarChart3 className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{formatCompactNumber(stats.totalPaid)}</p>
                  <p className="text-xs text-blue-100">Total Recaudado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Blocking Message */}
      {!verificationLoading && blockStatus?.blocked && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-amber-100 rounded-full">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                {blockStatus.title}
              </h3>
              <p className="text-amber-700 mb-3">
                {blockStatus.message}
              </p>
              <Link to={blockStatus.actionLink}>
                <Button
                  variant="gradient"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  leftIcon={<Shield className="w-4 h-4" />}
                >
                  {blockStatus.action}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Import Section - Solo visible si no está bloqueado */}
      {!verificationLoading && !blockStatus?.blocked && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900">
                  Sistema Avanzado de Importación
                </h3>
                <p className="text-xs text-green-700">
                  Importa y normaliza deudores con asistencia de IA
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowImportSection(!showImportSection)}
              className="text-green-600 border-green-300 hover:bg-green-100"
              leftIcon={showImportSection ? <AlertTriangle className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
            >
              {showImportSection ? 'Ocultar' : 'Mostrar Importación'}
            </Button>
          </div>

          {showImportSection && (
            <div className="border-t border-green-200 pt-4">
              <AdvancedImportSystem
                profile={profile}
                onImportComplete={handleImportComplete}
              />
            </div>
          )}
        </Card>
      )}

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('last7days')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('thisMonth')}
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Corporate Client Filter */}
      {corporateClients.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Filtrar por Cliente Corporativo
              </h3>
              <p className="text-sm text-blue-700">
                Muestra solo los clientes asociados a un cliente corporativo específico
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente Corporativo
              </label>
              <select
                value={selectedCorporateClient}
                onChange={(e) => setSelectedCorporateClient(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="">Mostrar todos los clientes corporativos</option>
                {corporateClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name} - {client.company_rut}
                  </option>
                ))}
              </select>
            </div>

            {selectedCorporateClient && (
              <div className="bg-white p-4 rounded-lg border border-blue-200 min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {corporateClients.find(c => c.id === selectedCorporateClient)?.company_name}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>RUT: {corporateClients.find(c => c.id === selectedCorporateClient)?.company_rut}</div>
                  <div>Industria: {corporateClients.find(c => c.id === selectedCorporateClient)?.industry}</div>
                  <div>Valor Contrato: ${corporateClients.find(c => c.id === selectedCorporateClient)?.contract_value?.toLocaleString('es-CL')}</div>
                  <div>Estado: <span className="text-green-600 font-medium">Activo</span></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                <TrendingUp className="w-3 h-3" />
                +12.5%
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900">{stats.totalClients}</h3>
              <p className="text-xs font-medium text-gray-600">Total Clientes</p>
              <p className="text-xs text-gray-500">{stats.activeClients} activos</p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                <TrendingUp className="w-3 h-3" />
                +8.3%
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900">{stats.activeClients}</h3>
              <p className="text-xs font-medium text-gray-600">Clientes Activos</p>
              <p className="text-xs text-gray-500">Con deudas pendientes</p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <DollarSign className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50">
                <TrendingDown className="w-3 h-3" />
                -2.1%
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900">{formatCompactNumber(stats.totalDebt)}</h3>
              <p className="text-xs font-medium text-gray-600">Deuda Total</p>
              <p className="text-xs text-gray-500">Monto por cobrar</p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <BarChart3 className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                <TrendingUp className="w-3 h-3" />
                +15.7%
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900">{formatCompactNumber(stats.totalPaid)}</h3>
              <p className="text-xs font-medium text-gray-600">Total Recaudado</p>
              <p className="text-xs text-gray-500">Pagos recibidos</p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <DollarSign className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium text-yellow-600 bg-yellow-50">
                <Activity className="w-3 h-3" />
                0.0%
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900">{formatCompactNumber(stats.totalPending)}</h3>
              <p className="text-xs font-medium text-gray-600">Pendiente</p>
              <p className="text-xs text-gray-500">Por procesar</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Management Component */}
      <ClientManagement
        clients={clients}
        loading={loading}
        selectedCorporateClient={selectedCorporateClient}
        corporateClients={corporateClients}
      />
    </div>
  );
};

export default ClientsPage;