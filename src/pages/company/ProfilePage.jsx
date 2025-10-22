/**
 * Company Profile Page
 *
 * Página para gestionar el perfil de la empresa
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { Card, Button, Input, Modal, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { updateCompanyProfile, updateUserProfile, getCompanyAnalytics } from '../../services/databaseService';
import {
  getCompanyVerification,
  upsertCompanyVerification,
  uploadVerificationDocument,
  submitVerificationForReview,
  VERIFICATION_STATUS
} from '../../services/verificationService';
import { getCompanyCRMConfig } from '../../services/companyCRMService';
import { initiateEmailChange, hashPassword } from '../../services/authService.js';
import Swal from 'sweetalert2';
import PaymentTools from './components/PaymentTools';
import VerificationProgress from '../../components/company/VerificationProgress';
import CRMConfiguration from '../../components/company/CRMConfiguration';
import CRMSyncDashboard from '../../components/company/CRMSyncDashboard';
import CRMCustomFields from '../../components/company/CRMCustomFields';
import BulkImportDebts from '../../components/company/BulkImportDebts';

// New organized section components
import CompanyMetricsDashboard from '../../components/company/CompanyMetricsDashboard';
import CompanyInformationSection from '../../components/company/CompanyInformationSection';
import OperationsSection from '../../components/company/OperationsSection';
import IntegrationsSection from '../../components/company/IntegrationsSection';
import ComplianceSection from '../../components/company/ComplianceSection';
import CorporateClientsSection from '../../components/company/CorporateClientsSection';
import ProfileTabs from '../../components/company/ProfileTabs';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Edit,
  User,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Shield,
  Key,
  Settings,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  Upload,
  Send,
  Eye,
  Clock,
  RefreshCw,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // CRM Configuration state
  const [crmConfig, setCrmConfig] = useState(null);
  const [crmLoading, setCrmLoading] = useState(false);

  // Verification state
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    company_rut: '',
    full_name: '',
    representative_rut: '',
    company_type: 'direct_creditor',
    // Campos bancarios
    bankName: '',
    accountType: '',
    accountNumber: '',
    accountHolderName: '',
    accountHolderRut: '',
  });

  const handleFormDataChange = (newFormData) => {
    setFormData(newFormData);
  };

  // Determinar si es modo administrador
  const isGodMode = profile?.role === 'god_mode';

  // Determinar qué sección mostrar basado en la ruta actual
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/empresa/perfil/operaciones') return 'operations';
    if (path === '/empresa/perfil/integraciones') return 'integrations';
    if (path === '/empresa/perfil/verificacion') return 'compliance';
    if (path === '/empresa/perfil/clientes') return 'clients';
    return 'info'; // default
  };

  const currentSection = getCurrentSection();

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };




  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setPageLoading(true);
      
      if (isGodMode) {
        // Para modo administrador, cargar datos del usuario
        setFormData({
          business_name: 'Administrador del Sistema',
          contact_email: user?.email || '',
          contact_phone: profile?.phone || '',
          rut: profile?.rut || 'GOD-MODE',
          full_name: profile?.full_name || '',
        });
      } else if (profile?.company) {
        // Para empresas normales, cargar datos de la empresa
        const bankAccountInfo = profile.company.bank_account_info || {};
        setFormData({
          company_name: profile.company.company_name || '',
          contact_email: user?.email || '',
          contact_phone: profile.company.contact_phone || '',
          company_rut: profile.company.rut || '',
          full_name: profile?.full_name || '',
          representative_rut: profile?.rut || '',
          company_type: profile.company.company_type || 'direct_creditor',
          // Cargar datos bancarios si existen
          bankName: bankAccountInfo.bankName || '',
          accountType: bankAccountInfo.accountType || '',
          accountNumber: bankAccountInfo.accountNumber || '',
          accountHolderName: bankAccountInfo.accountHolderName || '',
          accountHolderRut: bankAccountInfo.accountHolderRut || '',
        });
      }
      
      // Marcar que los datos iniciales se han cargado
      setInitialDataLoaded(true);
      
      // Pequeña espera para asegurar que todos los datos estén cargados
      setTimeout(() => {
        setPageLoading(false);
      }, 100);
    };

    loadInitialData();
  }, [profile, user, isGodMode]);

  // Cargar estadísticas de la empresa
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isGodMode && profile?.company?.id && initialDataLoaded) {
        try {
          setAnalyticsLoading(true);
          const result = await getCompanyAnalytics(profile.company.id);
          if (result.error) {
            console.error('Error loading analytics:', result.error);
          } else {
            setAnalytics(result.analytics);
          }
        } catch (error) {
          console.error('Error loading analytics:', error);
        } finally {
          setAnalyticsLoading(false);
        }
      } else {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [profile, isGodMode, initialDataLoaded]);

  // Load verification data for companies
  useEffect(() => {
    const loadVerification = async () => {
      if (!isGodMode && profile?.company?.id && initialDataLoaded) {
        try {
          setVerificationLoading(true);
          const { verification: data, error } = await getCompanyVerification(profile.company.id);

          if (error) {
            console.error('Error loading verification:', error);
          } else {
            setVerification(data);
          }
        } catch (error) {
          console.error('Error loading verification:', error);
        } finally {
          setVerificationLoading(false);
        }
      } else {
        setVerificationLoading(false);
      }
    };

    loadVerification();
  }, [profile, isGodMode, initialDataLoaded]);

  // Load CRM configuration for companies
  useEffect(() => {
    const loadCRMConfig = async () => {
      if (!isGodMode && profile?.company?.id && initialDataLoaded) {
        try {
          setCrmLoading(true);
          const result = await getCompanyCRMConfig(profile.company.id);

          if (result.success) {
            setCrmConfig(result.config);
          }
        } catch (error) {
          console.error('Error loading CRM config:', error);
        } finally {
          setCrmLoading(false);
        }
      } else {
        setCrmLoading(false);
      }
    };

    loadCRMConfig();
  }, [profile, isGodMode, initialDataLoaded]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isGodMode) {
        // Para modo administrador, actualizar perfil de usuario
        const updates = {
          full_name: formData.full_name,
          phone: formData.contact_phone,
          rut: formData.rut,
          updated_at: new Date().toISOString(),
        };

        const { error } = await updateUserProfile(user.id, updates);

        if (error) {
          setError(error);
          return;
        }
      } else {
        // Para empresas normales, actualizar perfil de empresa
        if (!profile?.company?.id) {
          setError('No se pudo encontrar la información de la empresa');
          return;
        }

        // Actualizar email del usuario si cambió
        if (formData.contact_email !== user.email) {
          console.log('🔄 Iniciando cambio de email de', user.email, 'a', formData.contact_email);
          try {
            const result = await initiateEmailChange(
              user.id,
              formData.contact_email,
              user.email,
              formData.full_name || user.user_metadata?.full_name || 'Usuario'
            );

            if (!result.success) {
              console.error('❌ Error iniciando cambio de email:', result.error);
              await Swal.fire({
                icon: 'error',
                title: 'Error al Cambiar Email',
                text: result.error,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#EF4444'
              });
              return;
            }

            console.log('✅ Email de cambio enviado exitosamente');

            // Mostrar mensaje informativo sobre el proceso de cambio
            const isSimulated = result.simulated;
            await Swal.fire({
              icon: isSimulated ? 'warning' : 'success',
              title: isSimulated ? 'Email Simulado (Desarrollo)' : 'Email de Confirmación Enviado',
              html: isSimulated ?
                `
                  <p><strong>MODO DESARROLLO:</strong> El email ha sido simulado para testing.</p>
                  <p>El cambio de email se procesó exitosamente en el sistema.</p>
                  <p>En producción, se enviaría un email real a <strong>${formData.contact_email}</strong></p>
                  <p><small>Para testing, puedes simular la confirmación manualmente.</small></p>
                ` :
                `
                  <p>Hemos enviado un email de confirmación a <strong>${formData.contact_email}</strong></p>
                  <p>Para completar el cambio, haz clic en el enlace del email.</p>
                  <p><small>El enlace expirará en 24 horas.</small></p>
                `,
              confirmButtonText: 'Entendido',
              confirmButtonColor: isSimulated ? '#F59E0B' : '#10B981'
            });
          } catch (emailChangeError) {
            console.error('❌ Error en proceso de cambio de email:', emailChangeError);
            await Swal.fire({
              icon: 'error',
              title: 'Error de Conexión',
              text: 'Error al procesar cambio de email. Por favor, verifica tu conexión e intenta de nuevo.',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#EF4444'
            });
            return;
          }
        }

        // Actualizar datos del usuario (representante) - excluyendo email que ya se actualizó
        const userUpdates = {
          full_name: formData.full_name,
          rut: formData.representative_rut,
          phone: formData.contact_phone,
          updated_at: new Date().toISOString(),
        };

        console.log('🔄 Actualizando perfil de usuario:', userUpdates);
        const { error: userError } = await updateUserProfile(user.id, userUpdates);

        if (userError) {
          console.error('❌ Error actualizando perfil de usuario:', userError);
          await Swal.fire({
            icon: 'error',
            title: 'Error al Actualizar Datos',
            text: 'Error al actualizar datos del representante. Por favor, intenta de nuevo.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#EF4444'
          });
          return;
        }
        console.log('✅ Perfil de usuario actualizado');

        // Actualizar datos de la empresa (todos los campos disponibles)
        const companyUpdates = {
          company_name: formData.company_name,
          contact_phone: formData.contact_phone,
          rut: formData.company_rut,
          updated_at: new Date().toISOString(),
        };

        // Intentar agregar company_type (si la columna existe)
        try {
          companyUpdates.company_type = formData.company_type;
        } catch (typeError) {
          console.warn('company_type column may not exist, skipping...');
        }

        // Agregar información bancaria si hay datos
        if (formData.bankName || formData.accountNumber || formData.accountHolderName) {
          companyUpdates.bank_account_info = {
            bankName: formData.bankName,
            accountType: formData.accountType,
            accountNumber: formData.accountNumber,
            accountHolderName: formData.accountHolderName,
            accountHolderRut: formData.accountHolderRut,
          };
        }

        console.log('🔄 Actualizando empresa:', companyUpdates);
        const { error: companyUpdateError } = await updateCompanyProfile(profile.company.id, companyUpdates);

        if (companyUpdateError) {
          console.error('❌ Error actualizando empresa:', companyUpdateError);
          await Swal.fire({
            icon: 'error',
            title: 'Error al Actualizar Empresa',
            text: 'Error al actualizar datos de la empresa. Por favor, intenta de nuevo.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#EF4444'
          });
          return;
        }
        console.log('✅ Empresa actualizada');
      }

      // Recargar el perfil desde la base de datos
      await refreshProfile();

      // Forzar actualización inmediata del formulario con los datos que acabamos de guardar
      // Esto asegura que el formulario refleje los cambios inmediatamente
      if (isGodMode) {
        setFormData(prev => ({
          ...prev,
          full_name: formData.full_name,
          contact_phone: formData.contact_phone,
          rut: formData.rut,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          company_name: formData.company_name,
          contact_phone: formData.contact_phone,
          company_rut: formData.company_rut,
          full_name: formData.full_name,
          representative_rut: formData.representative_rut,
          company_type: formData.company_type,
          bankName: formData.bankName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          accountHolderRut: formData.accountHolderRut,
        }));
      }

      // Salir del modo edición
      setIsEditing(false);

      // Mostrar mensaje de éxito con SweetAlert
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Información actualizada exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (err) {
      console.error('❌ Error general en handleSave:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error Inesperado',
        text: 'Error al guardar los cambios. Por favor, intenta de nuevo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validar que las contraseñas coincidan
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Las contraseñas nuevas no coinciden',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Validar longitud mínima
      if (passwordData.newPassword.length < 6) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La contraseña debe tener al menos 6 caracteres',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Validar que la nueva contraseña sea diferente a la actual
      if (passwordData.currentPassword === passwordData.newPassword) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La nueva contraseña debe ser diferente a la contraseña actual',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      setLoading(true);

      // Hashear la nueva contraseña antes de guardarla
      const hashedPassword = await hashPassword(passwordData.newPassword);

      // Actualizar la contraseña hasheada en la base de datos
      const { error } = await updateUserProfile(user.id, {
        password: hashedPassword,
        updated_at: new Date().toISOString()
      });

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cambiar la contraseña: ' + error,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Contraseña cambiada exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6',
        timer: 3000,
        timerProgressBar: true
      });

      // Resetear formulario y cerrar modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al Cambiar Contraseña',
        text: 'Error al cambiar la contraseña: ' + err.message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Verification functions
  const handleDocumentUpload = async (documentType, file) => {
    try {
      setUploading(true);

      if (!profile?.company?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo encontrar la información de la empresa',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      const { url, error } = await uploadVerificationDocument(profile.company.id, documentType, file);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al subir documento',
          text: error,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Update verification data
      const updatedVerification = {
        ...verification,
        [documentType === 'certificado_vigencia' ? 'certificado_vigencia_url' : 'informe_equifax_url']: url,
        status: verification?.status || VERIFICATION_STATUS.PENDING,
        updated_at: new Date().toISOString()
      };

      const { verification: savedVerification, error: saveError } = await upsertCompanyVerification(profile.company.id, updatedVerification);

      if (saveError) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: 'El documento se subió pero no se pudo guardar la información',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      setVerification(savedVerification);

      await Swal.fire({
        icon: 'success',
        title: '¡Documento subido!',
        text: `El ${documentType === 'certificado_vigencia' ? 'Certificado de Vigencia' : 'Informe Equifax'} se ha subido exitosamente`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6',
        timer: 3000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al subir el documento. Por favor, intenta de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (documentUrl, documentName) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Documento no disponible',
        text: `El ${documentName} aún no ha sido subido`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  const handleSubmitVerification = async () => {
    try {
      if (!profile?.company?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo encontrar la información de la empresa',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      const { success, error } = await submitVerificationForReview(profile.company.id);

      if (!success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al enviar',
          text: error,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Reload verification data
      const { verification: updatedVerification, error: loadError } = await getCompanyVerification(profile.company.id);

      if (!loadError && updatedVerification) {
        setVerification(updatedVerification);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Verificación enviada!',
        text: 'Tu solicitud de verificación ha sido enviada para revisión. Te notificaremos cuando sea aprobada.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6',
        timer: 5000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Error submitting verification:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al enviar la verificación. Por favor, intenta de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const getVerificationStatusInfo = (status) => {
    switch (status) {
      case VERIFICATION_STATUS.APPROVED:
        return { color: 'green', text: 'Aprobado', icon: CheckCircle };
      case VERIFICATION_STATUS.REJECTED:
        return { color: 'red', text: 'Rechazado', icon: AlertCircle };
      case VERIFICATION_STATUS.UNDER_REVIEW:
        return { color: 'yellow', text: 'En Revisión', icon: Clock };
      case VERIFICATION_STATUS.SUBMITTED:
        return { color: 'blue', text: 'Enviado', icon: Send };
      default:
        return { color: 'gray', text: 'Pendiente', icon: Clock };
    }
  };

  // Mostrar pantalla de carga completa solo al inicio
  if (pageLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-2xl mx-4 mt-6 p-3 md:p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10"></div>
          <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight mb-1 truncate">
                {isGodMode ? 'Panel de Administrador' : 'Perfil Corporativo'}
              </h1>
              <p className="text-indigo-100 text-xs md:text-sm max-w-md line-clamp-2">
                {isGodMode
                  ? 'Gestiona la configuración global del sistema y supervisa todas las operaciones'
                  : 'Administra la información de tu empresa y accede a métricas clave de rendimiento'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-white/20 flex-1 lg:flex-initial">
              <div className="flex items-center gap-2 md:gap-3">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-indigo-200 truncate">Estado del Sistema</p>
                  <p className="font-semibold text-white text-xs md:text-sm">Activo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Dashboard Ejecutivo - Only for Companies */}
        {!isGodMode && !!profile?.company && (
          <CompanyMetricsDashboard
            analytics={analytics}
            loading={analyticsLoading}
          />
        )}

        {/* Navigation Tabs - Only for Companies */}
        {!isGodMode && !!profile?.company && (
          <ProfileTabs />
        )}

        {/* Tab Content */}
        {!isGodMode && !!profile?.company && (
          <>
            {/* Información Corporativa */}
            {currentSection === 'info' && (
              <CompanyInformationSection
                formData={formData}
                isEditing={isEditing}
                onFormDataChange={handleFormDataChange}
                onEditToggle={setIsEditing}
                onSave={handleSave}
                loading={loading}
                isGodMode={isGodMode}
              />
            )}

            {/* Operaciones Diarias */}
            {currentSection === 'operations' && (
              <OperationsSection
                profile={profile}
              />
            )}

            {/* Integraciones Externas */}
            {currentSection === 'integrations' && (
              <IntegrationsSection
                profile={profile}
                crmConfig={crmConfig}
                onUpdate={refreshProfile}
              />
            )}

            {/* Verificación y Cumplimiento */}
            {currentSection === 'compliance' && (
              <ComplianceSection
                profile={profile}
                verification={verification}
                verificationLoading={verificationLoading}
                uploading={uploading}
                onDocumentUpload={handleDocumentUpload}
                onViewDocument={handleViewDocument}
                onSubmitVerification={handleSubmitVerification}
              />
            )}

            {/* Clientes Corporativos */}
            {currentSection === 'clients' && (
              <CorporateClientsSection
                profile={profile}
                onUpdate={refreshProfile}
              />
            )}
          </>
        )}


        {/* Sidebar Informativo - Layout Horizontal - Solo mostrar en secciones que no sean operaciones, integraciones, verificación ni clientes */}
        {currentSection !== 'operations' && currentSection !== 'integrations' && currentSection !== 'compliance' && currentSection !== 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Status Card - Izquierda */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Estado de la Cuenta
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Registro</p>
                      <p className="text-xs font-medium text-gray-900">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-CL') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Award className="w-3 h-3 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Tipo de Usuario</p>
                      <p className="text-xs font-medium text-gray-900">
                        {isGodMode ? 'Administrador GOD MODE' : 'Empresa'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <p className="text-xs font-medium text-green-600">Activo</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Card - Derecha */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3 text-red-500" />
                Seguridad
              </h3>

              <div className="space-y-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full justify-start bg-white/50 hover:bg-white border-0 whitespace-nowrap text-xs py-2"
                  leftIcon={<Key className="w-3 h-3" />}
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Cambiar Contraseña</h4>
                <p className="text-sm text-blue-700">
                  Establece una nueva contraseña segura para proteger tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Contraseña Actual"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              placeholder="Ingresa tu contraseña actual"
              leftIcon={<Key className="w-4 h-4" />}
            />

            <Input
              label="Nueva Contraseña"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              placeholder="Mínimo 6 caracteres"
              leftIcon={<Shield className="w-4 h-4" />}
            />

            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              placeholder="Repite la nueva contraseña"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Redirigir a la página de recuperación de contraseña
                window.location.href = '/recuperar-contrasena';
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Recomendaciones de Seguridad</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Usa al menos 8 caracteres</li>
                  <li>• Incluye letras mayúsculas y minúsculas</li>
                  <li>• Agrega números y símbolos</li>
                  <li>• Evita usar información personal</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleChangePassword}
              className="flex-1 whitespace-nowrap"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Actualizar Contraseña
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Volver arriba"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ProfilePage;