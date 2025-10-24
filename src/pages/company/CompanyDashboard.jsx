/**
 * Company Dashboard Page - Refactored
 *
 * Dashboard principal para empresas usando componentes modulares
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, LoadingSpinner, Modal, Input, Badge, ErrorBoundary } from '../../components/common';
import { createCompany } from '../../services/databaseService';
import { useCompanyStats } from '../../hooks/useCompanyStats';
import { setupCompanyBankAccount } from '../../services/authService';
import { getCompanyVerification, VERIFICATION_STATUS } from '../../services/verificationService';
import DashboardHero from './components/DashboardHero';
import DashboardStats from './components/DashboardStats';
import SystemStatus from './components/SystemStatus';
import MobileNavigation from './components/MobileNavigation';
import BankAccountSetup from '../../components/company/BankAccountSetup';
import { FormField, FormSection, ActionButtons } from '../../components/common';
import UnifiedDashboard from '../../components/common/UnifiedDashboard';
import SharedNegotiationStatus from '../../components/common/SharedNegotiationStatus';
import ConsolidatedFinancialProgress from '../../components/common/ConsolidatedFinancialProgress';
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building,
  Shield,
  Clock,
  Send,
  RefreshCw
} from 'lucide-react';

const CompanyDashboard = () => {
  const { profile, loadUserProfile } = useAuth();
  const { stats, clients, analytics, loading, analyticsLoading, error, loadStats } = useCompanyStats();

  // Verification state
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Company creation state
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [createCompanyForm, setCreateCompanyForm] = useState({
    business_name: '',
    rut: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [showEcosystemView, setShowEcosystemView] = useState(false); // Temporalmente desactivado
  const [ecosystemViewMode, setEcosystemViewMode] = useState('unified'); // unified, negotiations, financial

  // Load verification status con manejo robusto de errores
  useEffect(() => {
    if (profile?.company?.id) {
      loadVerificationStatus();
    }
  }, [profile?.company?.id]);

  const loadVerificationStatus = async () => {
    try {
      setVerificationLoading(true);
      
      // Agregar timeout para evitar que la página se quede colgada
      const result = await Promise.race([
        getCompanyVerification(profile.company.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading verification status')), 10000))
      ]);
      
      if (!result.error) {
        setVerification(result.verification);
      } else {
        console.warn('Error loading verification status:', result.error);
        setVerification(null);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      setVerification(null);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Bank account setup handlers con manejo robusto de errores
  const handleBankAccountSetupComplete = async (bankAccountData) => {
    try {
      const result = await Promise.race([
        setupCompanyBankAccount(bankAccountData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout configuring bank account')), 15000))
      ]);
      
      if (result.success) {
        // Refresh user profile to include the new bank account data
        await loadUserProfile(profile.id);
        // Reload stats
        loadStats();
      } else {
        console.error('Error configurando cuenta bancaria:', result.error);
        // Could show an error message here
      }
    } catch (error) {
      console.error('Error en configuración bancaria:', error);
      // Mostrar mensaje de error al usuario pero no dejar la página en blanco
    }
  };

  const handleBankAccountSetupSkip = () => {
    // User chose to skip, just continue to dashboard
    // Could show a reminder later
  };

  const handleCreateCompany = async () => {
    try {
      setCreateCompanyLoading(true);
      setCreateCompanyError(null);

      const companyData = {
        user_id: profile.id,
        ...createCompanyForm,
        company_type: 'collection_agency',
      };

      const { company, error } = await createCompany(companyData);

      if (error) {
        setCreateCompanyError(error);
        return;
      }

      // Reset form and close modal
      setCreateCompanyForm({
        business_name: '',
        rut: '',
        contact_email: '',
        contact_phone: '',
        address: '',
      });
      setShowCreateCompanyModal(false);

      // Refresh user profile to include the new company data
      await loadUserProfile(profile.id);

      // Reload data - ahora debería cargar la empresa recién creada
      loadStats();
    } catch (error) {
      setCreateCompanyError('Error al crear empresa. Por favor, intenta de nuevo.');
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  // Manejo robusto de loading states
  const isLoading = loading || analyticsLoading;
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard..." />;
  }
  
  // Verificación de datos mínimos requeridos
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil no encontrado</h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del perfil. Por favor, inicia sesión nuevamente.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // If no company profile, show different interfaces based on user role
  if (!profile?.company?.id) {
    console.log('No company profile found. User role:', profile?.role, 'User ID:', profile?.id);

    if (profile?.role === 'god_mode') {
      console.log('Showing create company interface for god_mode user');

      // Para usuarios god_mode, mostrar interfaz para crear empresa
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-blue-500 text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crear Empresa Global</h2>
            <p className="text-gray-600 mb-6">
              Como administrador, puedes crear tu propia empresa global de cobranza para gestionar clientes y deudas.
            </p>
            <Button onClick={() => setShowCreateCompanyModal(true)}>
              Crear Empresa Global
            </Button>
          </div>
        </div>
      );
    } else {
      // Para usuarios normales sin empresa, verificar si es un usuario OAuth que necesita completar perfil
      if (profile?.needs_profile_completion || profile?.oauth_signup) {
        console.log('User needs to complete company profile, showing completion interface');
        
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center max-w-lg p-8">
              <div className="text-purple-500 text-6xl mb-4">🏢</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Completa tu Perfil de Empresa Global</h2>
              <p className="text-gray-600 mb-6">
                Bienvenido a NexuPay. Para comenzar a usar tu cuenta empresarial, necesitas completar la información de tu empresa.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Importante</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Una vez que completes tu perfil, podrás iniciar el proceso de verificación para acceder a todas las funciones.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/empresa/perfil'}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                Completar Perfil Ahora
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                ¿Necesitas ayuda? Contacta a soporte@nexpay.cl
              </p>
            </div>
          </div>
        );
      } else {
        // Para usuarios normales sin empresa, mostrar error
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil de Empresa Global No Encontrado</h2>
              <p className="text-gray-600 mb-4">
                No se pudo cargar el perfil de empresa global. Esto puede deberse a que el usuario no tiene un perfil de empresa global configurado.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Rol actual: {profile?.role}<br/>
                ID de usuario: {profile?.id}
              </p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        );
      }
    }
  }

  // Check if company has bank account configured
  // Consider it configured if bank_account_info exists (MP registration may fail due to CORS in dev)
  const hasBankAccount = profile?.company?.bank_account_info;

  if (!hasBankAccount) {
    console.log('Company exists but no bank account configured. Showing setup flow.');

    return (
      <BankAccountSetup
        onComplete={handleBankAccountSetupComplete}
        onSkip={handleBankAccountSetupSkip}
      />
    );
  }
  
  // Manejo seguro de datos con fallbacks
  const safeStats = stats || {};
  const safeAnalytics = analytics || {};
  const safeVerification = verification || {};

  // Helper function to get verification badge
  const getVerificationBadge = () => {
    if (!verification) return null;

    const statusConfig = {
      [VERIFICATION_STATUS.PENDING]: { variant: 'secondary', text: 'Pendiente', icon: Clock },
      [VERIFICATION_STATUS.SUBMITTED]: { variant: 'info', text: 'Enviado', icon: Send },
      [VERIFICATION_STATUS.UNDER_REVIEW]: { variant: 'warning', text: 'En Revisión', icon: RefreshCw },
      [VERIFICATION_STATUS.APPROVED]: { variant: 'success', text: 'Verificado', icon: CheckCircle },
      [VERIFICATION_STATUS.REJECTED]: { variant: 'danger', text: 'Rechazado', icon: AlertCircle },
      [VERIFICATION_STATUS.NEEDS_CORRECTIONS]: { variant: 'warning', text: 'Correcciones Requeridas', icon: AlertCircle }
    };

    const config = statusConfig[verification.status] || statusConfig[VERIFICATION_STATUS.PENDING];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Section */}
      <DashboardHero
        profile={profile}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        stats={safeStats}
        analytics={safeAnalytics}
      />

      {/* Verification Status Banner */}
      {safeVerification && safeVerification.status !== VERIFICATION_STATUS.APPROVED && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">
                  Verificación de Empresa Global
                </h3>
                <p className="text-amber-700">
                  {safeVerification.status === VERIFICATION_STATUS.PENDING && "Complete su verificación para acceder a todas las funciones"}
                  {safeVerification.status === VERIFICATION_STATUS.SUBMITTED && "Sus documentos están siendo revisados"}
                  {safeVerification.status === VERIFICATION_STATUS.UNDER_REVIEW && "Sus documentos están en proceso de revisión"}
                  {safeVerification.status === VERIFICATION_STATUS.REJECTED && "Su verificación fue rechazada"}
                  {safeVerification.status === VERIFICATION_STATUS.NEEDS_CORRECTIONS && "Se requieren correcciones en sus documentos"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getVerificationBadge()}
              <Link to="/empresa/verification">
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                  {safeVerification.status === VERIFICATION_STATUS.PENDING ? 'Comenzar Verificación' : 'Ver Estado'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <DashboardStats stats={safeStats} analytics={safeAnalytics} />

      {/* System Status */}
      <SystemStatus />

      {/* Ecosystem Integration Section - Temporalmente desactivado */}
      {false && showEcosystemView && (
        <div className="space-y-6 animate-slide-up">
          {/* Ecosystem Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  🌐 Vista del Ecosistema
                </h2>
                <p className="text-secondary-600 text-sm">
                  Sincronización en tiempo real entre portales empresas-personas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ecosystemViewMode}
                onChange={(e) => setEcosystemViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="unified">Dashboard Unificado</option>
                <option value="negotiations">Negociaciones Compartidas</option>
                <option value="financial">Progreso Financiero</option>
              </select>
              <button
                onClick={() => setShowEcosystemView(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Ecosystem Content */}
          {ecosystemViewMode === 'unified' && (
            <UnifiedDashboard
              userType="company"
              timeRange="30d"
              showNotifications={true}
              showRealTimeStatus={true}
              compact={false}
            />
          )}

          {ecosystemViewMode === 'negotiations' && (
            <SharedNegotiationStatus
              userType="company"
              compact={false}
              showFilters={true}
              autoRefresh={true}
              refreshInterval={30000}
            />
          )}

          {ecosystemViewMode === 'financial' && (
            <ConsolidatedFinancialProgress
              userType="company"
              timeRange="30d"
              compact={false}
              showCharts={true}
              showPredictions={true}
            />
          )}
        </div>
      )}

      {/* Ecosystem Toggle Button - Temporalmente desactivado */}
      {false && !showEcosystemView && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setShowEcosystemView(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
          >
            <TrendingUp className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              🌐 Vista del Ecosistema
            </span>
          </button>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Create Company Modal */}
      <Modal
        isOpen={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        title=""
        size="lg"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-4 md:p-6 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-3xl inline-block mb-4 md:mb-6">
              <Building className="w-12 h-12 md:w-16 md:h-16 text-indigo-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-secondary-900 mb-2">
              Crear Nueva Empresa Global
            </h2>
            <p className="text-secondary-600 text-base md:text-lg">
              Establece tu empresa de cobranza y comienza a gestionar deudas
            </p>
          </div>

          {/* Company Information */}
          <FormSection
            title="Información de la Empresa Global"
            icon={<Building className="w-5 h-5 text-white" />}
            gradient="indigo"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Nombre de Empresa Global *"
                icon="🏢"
                value={createCompanyForm.business_name}
                onChange={(e) => setCreateCompanyForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Empresa de Cobranzas S.A."
                required
              />

              <FormField
                label="RUT Empresa Global *"
                icon="📄"
                value={createCompanyForm.rut}
                onChange={(e) => setCreateCompanyForm(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
                required
              />

              <FormField
                label="Email de Contacto *"
                icon="✉️"
                type="email"
                value={createCompanyForm.contact_email}
                onChange={(e) => setCreateCompanyForm(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contacto@empresa.cl"
                required
              />

              <FormField
                label="Teléfono de Contacto"
                icon="📞"
                type="tel"
                value={createCompanyForm.contact_phone}
                onChange={(e) => setCreateCompanyForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+56912345678"
              />

              <FormField
                label="Dirección"
                icon="📍"
                value={createCompanyForm.address}
                onChange={(e) => setCreateCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa de la empresa"
                className="md:col-span-2"
              />
            </div>
          </FormSection>

          {/* Error Message */}
          {createCompanyError && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <span className="text-white font-bold">⚠️</span>
                </div>
                <div>
                  <h4 className="font-bold text-red-900 font-display">Error al crear empresa global</h4>
                  <p className="text-red-700 mt-1">{createCompanyError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Tips */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">💡</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-emerald-900 mb-3 font-display text-lg md:text-xl">¿Qué podrás hacer?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm md:text-base text-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Gestionar clientes y sus deudas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Crear ofertas personalizadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Acceder a métricas detalladas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Procesar pagos automáticamente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons
            onCancel={() => setShowCreateCompanyModal(false)}
            onConfirm={handleCreateCompany}
            confirmText="Crear Empresa Global"
            confirmLoading={createCompanyLoading}
            cancelText="Cancelar"
          />
        </div>
      </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default CompanyDashboard;
