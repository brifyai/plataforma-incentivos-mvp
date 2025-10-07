/**
 * Company Profile Page
 *
 * Página para gestionar el perfil de la empresa
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Modal, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { updateCompanyProfile, updateUserProfile, getCompanyAnalytics } from '../../services/databaseService';
import Swal from 'sweetalert2';
import PaymentTools from './components/PaymentTools';
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
} from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    company_rut: '',
    full_name: '',
    representative_rut: '',
    company_type: 'direct_creditor',
  });

  // Determinar si es modo administrador
  const isGodMode = profile?.role === 'god_mode';

  // Cargar datos iniciales
  useEffect(() => {
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
      setFormData({
        company_name: profile.company.company_name || '',
        contact_email: user?.email || '',
        contact_phone: profile.company.contact_phone || '',
        company_rut: profile.company.rut || '',
        full_name: profile?.full_name || '',
        representative_rut: profile?.rut || '',
        company_type: profile.company.company_type || 'direct_creditor',
      });
    }
  }, [profile, user, isGodMode]);

  // Cargar estadísticas de la empresa
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isGodMode && profile?.company?.id) {
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
  }, [profile, isGodMode]);

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

        // Actualizar datos del usuario (representante)
        const userUpdates = {
          full_name: formData.full_name,
          rut: formData.representative_rut,
          phone: formData.contact_phone,
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await updateUserProfile(user.id, userUpdates);

        if (userError) {
          setError('Error al actualizar datos del representante: ' + userError);
          return;
        }

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

        const { error: companyError } = await updateCompanyProfile(profile.company.id, companyUpdates);

        if (companyError) {
          setError('Error al actualizar datos de la empresa: ' + companyError);
          return;
        }
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
      setError('Error al guardar los cambios. Por favor, intenta de nuevo.');
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

      // Actualizar la contraseña en la base de datos
      const { error } = await updateUserProfile(user.id, {
        password: passwordData.newPassword,
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
      alert('Error al cambiar la contraseña: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (analyticsLoading && !isGodMode) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl mx-4 mt-6 p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10"></div>
          <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
              {isGodMode ? (
                <Shield className="w-10 h-10" />
              ) : (
                <Building className="w-10 h-10" />
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight mb-2">
                {isGodMode ? 'Panel de Administrador' : 'Perfil Corporativo'}
              </h1>
              <p className="text-indigo-100 text-lg max-w-md">
                {isGodMode
                  ? 'Gestiona la configuración global del sistema y supervisa todas las operaciones'
                  : 'Administra la información de tu empresa y accede a métricas clave de rendimiento'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-green-300" />
                <div>
                  <p className="text-sm text-indigo-200">Estado del Sistema</p>
                  <p className="font-semibold text-white">Activo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Profile Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            {/* Payment Tools Section */}
            {!isGodMode && (
              <div className="mb-8">
                <PaymentTools />
              </div>
            )}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                    {isGodMode ? <Shield className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isGodMode ? 'Información del Administrador' : 'Información Corporativa'}
                    </h2>
                    <p className="text-gray-600">
                      {isGodMode ? 'Detalles del administrador del sistema' : 'Datos principales de tu empresa'}
                    </p>
                  </div>
                </div>

                <Button
                  variant={isEditing ? 'primary' : 'secondary'}
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  loading={loading}
                  disabled={loading}
                  className="shadow-lg whitespace-nowrap flex-shrink-0 min-w-fit inline-flex"
                  style={{ width: 'auto' }}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Guardar Cambios</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Editar Perfil</span>
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-12">
                {isGodMode ? (
                  /* Admin Profile Form */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Nombre Completo"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      leftIcon={<User className="w-4 h-4" />}
                      disabled={!isEditing}
                      className="bg-gray-50/50"
                    />

                    <Input
                      label="Email Corporativo"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      leftIcon={<Mail className="w-4 h-4" />}
                      disabled={!isEditing}
                      className="bg-gray-50/50"
                    />

                    <Input
                      label="Teléfono de Contacto"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      leftIcon={<Phone className="w-4 h-4" />}
                      disabled={!isEditing}
                      className="bg-gray-50/50"
                    />

                    <Input
                      label="RUT Administrador"
                      value={formData.rut}
                      onChange={(e) => setFormData({...formData, rut: e.target.value})}
                      leftIcon={<Shield className="w-4 h-4" />}
                      disabled={!isEditing}
                      className="bg-gray-50/50"
                    />
                  </div>
                ) : (
                  /* Company Profile Form */
                  <>
                    {/* Legal Representative Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Representante Legal</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nombre Completo"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          leftIcon={<User className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />

                        <Input
                          label="RUT del Representante"
                          value={formData.representative_rut}
                          onChange={(e) => setFormData({...formData, representative_rut: e.target.value})}
                          leftIcon={<User className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />

                        <Input
                          label="Email Corporativo"
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                          leftIcon={<Mail className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />

                        <Input
                          label="Teléfono de Contacto"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                          leftIcon={<Phone className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />
                      </div>
                    </div>

                    {/* Company Information Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Nombre de la Empresa"
                          value={formData.company_name}
                          onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                          leftIcon={<Building className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />

                        <Input
                          label="RUT de la Empresa"
                          value={formData.company_rut}
                          onChange={(e) => setFormData({...formData, company_rut: e.target.value})}
                          leftIcon={<Building className="w-4 h-4" />}
                          disabled={!isEditing}
                          className="bg-white/50"
                        />

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Empresa
                          </label>
                          <select
                            value={formData.company_type}
                            onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                            disabled={!isEditing}
                          >
                            <option value="direct_creditor">🏢 Acreedor Directo</option>
                            <option value="collection_agency">📊 Empresa de Cobranza</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Estado de la Cuenta
              </h3>

              <div className="space-y-8">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Registro</p>
                      <p className="font-medium text-gray-900">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-CL') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Usuario</p>
                      <p className="font-medium text-gray-900">
                        {isGodMode ? 'Administrador GOD MODE' : 'Empresa'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="font-medium text-green-600">Activo</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Seguridad
              </h3>

              <div className="space-y-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full justify-start bg-white/50 hover:bg-white border-0 whitespace-nowrap"
                  leftIcon={<Key className="w-4 h-4" />}
                >
                  Cambiar Contraseña
                </Button>

              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                Acciones Rápidas
              </h3>

              <div className="space-y-4">
                <Link to="/empresa/mensajes">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white/50 hover:bg-white whitespace-nowrap"
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    Enviar Mensaje
                  </Button>
                </Link>

                <Link to="/empresa/analiticas">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white/50 hover:bg-white whitespace-nowrap"
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    Ver Reportes
                  </Button>
                </Link>

                <Link to="/empresa/clientes">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white/50 hover:bg-white whitespace-nowrap"
                    leftIcon={<Users className="w-4 h-4" />}
                  >
                    Gestionar Clientes
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
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
    </div>
  );
};

export default ProfilePage;