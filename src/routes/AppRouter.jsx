/**
 * Router Principal de la Aplicación
 *
 * Maneja todas las rutas y navegación de la plataforma
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


// Landing Page
import LandingPage from '../pages/LandingPage';

// Páginas de autenticación
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import RegisterPersonPage from '../pages/auth/RegisterPersonPage';
import RegisterCompanyPage from '../pages/auth/RegisterCompanyPage';
import ConfirmEmailPage from '../pages/auth/ConfirmEmailPage';
import AuthCallbackPage from '../pages/auth/AuthCallbackPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import CompleteRegistrationPage from '../pages/auth/CompleteRegistrationPage';
import TerminosServicioPage from '../pages/auth/TerminosServicioPage';
import PrivacyPolicyPage from '../pages/auth/PrivacyPolicyPage';
import SecurityPage from '../pages/SecurityPage';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Páginas de personas
import DebtorDashboard from '../pages/debtor/DebtorDashboard';
import SimulatorPage from '../pages/debtor/SimulatorPage';

// Páginas completas para el flujo de personas
import DebtsPage from '../pages/debtor/DebtsPage';
import OffersPage from '../pages/debtor/OffersPage';
import AgreementsPage from '../pages/debtor/AgreementsPage';
import PaymentsPage from '../pages/debtor/PaymentsPage';
import WalletPage from '../pages/debtor/WalletPage';
import MessagesPage from '../pages/debtor/MessagesPage';
import HelpPage from '../pages/debtor/HelpPage';
import ProfilePage from '../pages/debtor/ProfilePage';
import NotificationsPage from '../pages/debtor/NotificationsPage';
import SecureOfferPage from '../pages/debtor/SecureOfferPage';

// Página de prueba
import TestPage from '../pages/TestPage';
import TestGodMode from '../pages/TestGodMode';
import TestSimple from '../pages/TestSimple';

// Webhook Handler
import WebhookHandler from '../pages/WebhookHandler';

// Payment Page
import PaymentPage from '../pages/PaymentPage';

// Páginas de empresa
import CompanyDashboard from '../pages/company/CompanyDashboard';
import CompanyVerificationPage from '../pages/company/CompanyVerificationPage';
import ProposalsPage from '../pages/company/ProposalsPage';
import TransferDashboard from '../pages/company/TransferDashboard';
import CompanyProfilePage from '../pages/company/ProfilePage';
import CompanyOffersPage from '../pages/company/OffersPage';
import CampaignsPage from '../pages/company/CampaignsPage';
import ClientDetailsPage from '../pages/company/ClientDetailsPage';
import ClientDebtsPage from '../pages/company/ClientDebtsPage';
import AgreementDetailsPage from '../pages/company/AgreementDetailsPage';
import CompanyAgreementsPage from '../pages/company/AgreementsPage';
import CompanyAnalyticsPage from '../pages/company/CompanyAnalyticsPage';
import CompanyMessagesPage from '../pages/company/CompanyMessagesPage';
import NewMessagePage from '../pages/company/NewMessagePage';
import CompanyNotificationsPage from '../pages/company/CompanyNotificationsPage';
import BulkImportPage from '../pages/company/BulkImportPage';
import NewDebtorPage from '../pages/company/NewDebtorPage';
import ClientsPage from '../pages/company/ClientsPage';

// Páginas de administrador
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminDebtorsPage from '../pages/admin/AdminDebtorsPage';
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage';
import AdminConfigPage from '../pages/admin/AdminConfigPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminDatabasePage from '../pages/admin/AdminDatabasePage';
import PaymentsDashboard from '../pages/admin/PaymentsDashboard';
import AdminCommissionsPage from '../pages/admin/AdminCommissionsPage';
import CompanyVerificationDashboard from '../pages/admin/CompanyVerificationDashboard';
import MercadoPagoConfigPage from '../pages/admin/MercadoPagoConfigPage';
import BankConfigPage from '../pages/admin/BankConfigPage';
import AnalyticsConfigPage from '../pages/admin/AnalyticsConfigPage';
import NotificationsConfigPage from '../pages/admin/NotificationsConfigPage';
import GeneralConfigPage from '../pages/admin/GeneralConfigPage';
import AIConfigPage from '../pages/admin/AIConfigPage';
import MessagingAIConfigPage from '../pages/company/MessagingAIConfigPage';
import KnowledgeBasePage from '../pages/company/KnowledgeBasePage';
import CorporatePromptConfigPage from '../pages/company/CorporatePromptConfigPage';

// Componente de ruta protegida
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading, initializing } = useAuth();

  // Wait for both loading and initializing to complete
  if (loading || initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usar profile si está disponible, sino user_metadata
  const role = profile?.role || user?.user_metadata?.role;

  // If we have a user but no role yet, wait for profile to load
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check allowed roles (god_mode can access everything)
  const isAllowed = !allowedRoles ||
    allowedRoles.includes(role) ||
    role === 'god_mode';

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente de redirección según rol
const RoleBasedRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Usar profile si está disponible, sino user_metadata
  const role = profile?.role || user?.user_metadata?.role;

  // Redirigir según el rol del usuario
  if (role === 'debtor') {
    return <Navigate to="/personas/dashboard" replace />;
  } else if (role === 'company') {
    return <Navigate to="/empresa/dashboard" replace />;
  } else if (role === 'god_mode') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

// Componente interno que puede usar useLocation
const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/landing';

  return (
    <>
      <Routes>
        {/* Ruta raíz - mostrar landing page directamente para testing */}
        <Route path="/" element={<LandingPage />} />

        {/* Landing Page */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Rutas de autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/registro/persona" element={<RegisterPersonPage />} />
        <Route path="/registro/empresa" element={<RegisterCompanyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Rutas legales - accesibles sin autenticación */}
        <Route path="/terminos-servicio" element={<TerminosServicioPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* Página de pago - accesible sin autenticación */}
        <Route path="/pagar/:debtId" element={<PaymentPage />} />

        {/* Página de oferta segura - accesible sin autenticación completa */}
        <Route path="/oferta-segura/:token" element={<SecureOfferPage />} />

        {/* Rutas de personas */}
        <Route
          path="/personas/dashboard"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <DebtorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/deudas"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <DebtsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/ofertas"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <OffersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/acuerdos"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <AgreementsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/pagos"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <PaymentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/billetera"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <WalletPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/mensajes"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <MessagesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/ayuda"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <HelpPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/notificaciones"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/perfil"
          element={
            <ProtectedRoute allowedRoles={['debtor']}>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personas/simulador"
          element={
            <DashboardLayout>
              <SimulatorPage />
            </DashboardLayout>
          }
        />

        {/* Rutas de empresa */}
        <Route
          path="/empresa/dashboard"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/verification"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyVerificationPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/propuestas"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <ProposalsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/transferencias"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <TransferDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/perfil"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/perfil/operaciones"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/perfil/integraciones"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/perfil/verificacion"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/perfil/clientes"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/ofertas"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyOffersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/campanas"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CampaignsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/clientes/:clientId"
          element={
            <DashboardLayout>
              <ClientDetailsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/empresa/clientes/:clientId/deudas"
          element={
            <DashboardLayout>
              <ClientDebtsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/empresa/acuerdos"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyAgreementsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/acuerdos/:agreementId"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <AgreementDetailsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/analytics"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyAnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/mensajes"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyMessagesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/mensajes/nuevo"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <NewMessagePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/notificaciones"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CompanyNotificationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/importar"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <BulkImportPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/clientes"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <ClientsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/clientes/nuevo"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <NewDebtorPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/configuracion-ia"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <MessagingAIConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/base-conocimiento"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <KnowledgeBasePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empresa/configuracion-prompts"
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <DashboardLayout>
                <CorporatePromptConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Rutas de administrador */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminUsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deudores"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminDebtorsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/empresas"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminCompaniesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pagos"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <PaymentsDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comisiones"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminCommissionsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verificaciones"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <CompanyVerificationDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminAnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/base-datos"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AdminDatabasePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mercadopago"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <MercadoPagoConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bancos"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <BankConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AnalyticsConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notificaciones"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <NotificationsConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion/general"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <GeneralConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ia"
          element={
            <ProtectedRoute allowedRoles={['god_mode']}>
              <DashboardLayout>
                <AIConfigPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Nota: La funcionalidad de IA de negociación está integrada en /empresa/mensajes */}

        {/* Página de prueba GOD MODE */}
        <Route path="/test-god-mode" element={<TestGodMode />} />
        <Route path="/test-simple" element={<TestSimple />} />

        {/* Webhook Handler */}
        <Route path="/api/webhooks/mercadopago" element={<WebhookHandler />} />

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Branding - exclude from landing page */}
      {!isLandingPage && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-soft border border-secondary-200/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary-600 font-medium">Proyecto desarrollado por</span>
            <a
              href="https://www.aintelligence.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="https://www.aintelligence.cl/wp-content/uploads/2025/05/logo_ai.png"
                alt="AIntelligence Logo"
                className="h-6 w-auto"
                onError={(e) => {
                  // Fallback si la imagen no carga
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-xs text-primary-600 font-semibold hidden">AIntelligence</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default AppRouter;
