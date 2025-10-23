/**
 * Security Configuration Page - Configuración de Seguridad Avanzada
 *
 * Página dedicada a la configuración de seguridad avanzada del sistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, Modal, ToggleSwitch } from '../../components/common';
import { Shield, Lock, Key, Eye, EyeOff, AlertTriangle, CheckCircle, Users, Clock, Ban, Smartphone, Mail, Settings, RefreshCw } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import Swal from 'sweetalert2';

const SecurityConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Configuración de seguridad
  const [securityConfig, setSecurityConfig] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiry: 90,
      preventReuse: 5,
      maxAttempts: 5,
      lockoutDuration: 30
    },
    twoFactorAuth: {
      enabled: false,
      requiredForAdmins: false,
      requiredForCompanies: false,
      methods: ['email', 'sms', 'app'],
      backupCodes: true
    },
    sessionManagement: {
      maxSessionDuration: 8,
      idleTimeout: 30,
      concurrentSessions: 3,
      rememberMeDuration: 30,
      forceReauth: false
    },
    ipWhitelist: {
      enabled: false,
      allowedIPs: [],
      adminOnly: false,
      autoBlockSuspicious: true,
      logAllAttempts: true
    },
    auditLogging: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 90,
      includePII: false,
      realTimeAlerts: true
    }
  });

  // Estado para modales
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [ipForm, setIpForm] = useState({
    ip: '',
    description: '',
    type: 'allow'
  });

  useEffect(() => {
    loadSecurityConfig();
  }, []);

  const loadSecurityConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
      } else {
        // Cargar configuración de seguridad desde la base de datos
        const config = result.config;
        
        setSecurityConfig(prev => ({
          ...prev,
          passwordPolicy: {
            ...prev.passwordPolicy,
            ...(config.password_policy || {})
          },
          twoFactorAuth: {
            ...prev.twoFactorAuth,
            ...(config.two_factor_auth || {})
          },
          sessionManagement: {
            ...prev.sessionManagement,
            ...(config.session_management || {})
          },
          ipWhitelist: {
            ...prev.ipWhitelist,
            ...(config.ip_whitelist || {})
          },
          auditLogging: {
            ...prev.auditLogging,
            ...(config.audit_logging || {})
          }
        }));
      }
    } catch (error) {
      console.error('Error loading security config:', error);
      setError('Error al cargar configuración de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        password_policy: securityConfig.passwordPolicy,
        two_factor_auth: securityConfig.twoFactorAuth,
        session_management: securityConfig.sessionManagement,
        ip_whitelist: securityConfig.ipWhitelist,
        audit_logging: securityConfig.auditLogging
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de seguridad ha sido actualizada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving security config:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        await Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        return;
      }

      if (passwordForm.newPassword.length < securityConfig.passwordPolicy.minLength) {
        await Swal.fire('Error', `La contraseña debe tener al menos ${securityConfig.passwordPolicy.minLength} caracteres`, 'error');
        return;
      }

      // Simular cambio de contraseña
      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Tu contraseña ha sido cambiada exitosamente',
        confirmButtonText: 'Aceptar'
      });

      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
      console.error('Error changing password:', error);
      await Swal.fire('Error', 'No se pudo cambiar la contraseña', 'error');
    }
  };

  const handleAddIP = async () => {
    try {
      if (!ipForm.ip || !ipForm.description) {
        await Swal.fire('Error', 'Completa todos los campos', 'error');
        return;
      }

      // Validar formato IP
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(ipForm.ip)) {
        await Swal.fire('Error', 'Formato de IP inválido', 'error');
        return;
      }

      setSecurityConfig(prev => ({
        ...prev,
        ipWhitelist: {
          ...prev.ipWhitelist,
          allowedIPs: [...prev.ipWhitelist.allowedIPs, {
            id: Date.now().toString(),
            ip: ipForm.ip,
            description: ipForm.description,
            type: ipForm.type,
            addedAt: new Date().toISOString()
          }]
        }
      }));

      setShowIPModal(false);
      setIpForm({ ip: '', description: '', type: 'allow' });

      await Swal.fire('Éxito', 'IP agregada correctamente', 'success');

    } catch (error) {
      console.error('Error adding IP:', error);
      await Swal.fire('Error', 'No se pudo agregar la IP', 'error');
    }
  };

  const handleRemoveIP = async (ipId) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar IP?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setSecurityConfig(prev => ({
          ...prev,
          ipWhitelist: {
            ...prev.ipWhitelist,
            allowedIPs: prev.ipWhitelist.allowedIPs.filter(ip => ip.id !== ipId)
          }
        }));

        await Swal.fire('Eliminada', 'IP eliminada correctamente', 'success');
      }
    } catch (error) {
      console.error('Error removing IP:', error);
      await Swal.fire('Error', 'No se pudo eliminar la IP', 'error');
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: 'Débil', color: 'red' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, text: 'Débil', color: 'red' },
      { score: 1, text: 'Débil', color: 'red' },
      { score: 2, text: 'Regular', color: 'yellow' },
      { score: 3, text: 'Buena', color: 'blue' },
      { score: 4, text: 'Fuerte', color: 'green' },
      { score: 5, text: 'Muy Fuerte', color: 'green' },
      { score: 6, text: 'Excelente', color: 'green' }
    ];

    return levels[score] || levels[0];
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
          <Button onClick={() => loadSecurityConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Seguridad Avanzada
                </h1>
                <p className="text-red-100 text-sm">
                  Configuración de políticas de seguridad y protección
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              85%
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Score Seguridad</p>
            <div className="flex items-center justify-center mt-0.5">
              <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              <span className="text-xs text-green-600 font-medium">
                Excelente
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {securityConfig.passwordPolicy.minLength}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Mínimo Contraseña</p>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">
              Caracteres
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {securityConfig.twoFactorAuth.enabled ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">2FA</p>
            <div className="flex items-center justify-center mt-0.5">
              {securityConfig.twoFactorAuth.enabled ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className={`text-xs font-medium ${securityConfig.twoFactorAuth.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {securityConfig.twoFactorAuth.enabled ? 'Protegido' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:shadow-glow-orange transition-all duration-300">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {securityConfig.sessionManagement.maxSessionDuration}h
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Sesión Máxima</p>
            <div className="text-xs text-orange-600 mt-0.5 font-medium">
              Duración
            </div>
          </div>
        </Card>
      </div>

      {/* Password Policy Configuration */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Política de Contraseñas</h3>
                <p className="text-secondary-600 text-sm">Configura los requisitos de seguridad para contraseñas</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Cambiar Contraseña
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud Mínima
              </label>
              <Input
                type="number"
                value={securityConfig.passwordPolicy.minLength}
                onChange={(e) => setSecurityConfig(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
                }))}
                min="6"
                max="32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiración (días)
              </label>
              <Input
                type="number"
                value={securityConfig.passwordPolicy.passwordExpiry}
                onChange={(e) => setSecurityConfig(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, passwordExpiry: parseInt(e.target.value) }
                }))}
                min="0"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intentos Máximos
              </label>
              <Input
                type="number"
                value={securityConfig.passwordPolicy.maxAttempts}
                onChange={(e) => setSecurityConfig(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, maxAttempts: parseInt(e.target.value) }
                }))}
                min="3"
                max="10"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={securityConfig.passwordPolicy.requireUppercase}
                    onChange={(e) => setSecurityConfig(prev => ({
                      ...prev,
                      passwordPolicy: { ...prev.passwordPolicy, requireUppercase: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requerir mayúsculas</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={securityConfig.passwordPolicy.requireLowercase}
                    onChange={(e) => setSecurityConfig(prev => ({
                      ...prev,
                      passwordPolicy: { ...prev.passwordPolicy, requireLowercase: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requerir minúsculas</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={securityConfig.passwordPolicy.requireNumbers}
                    onChange={(e) => setSecurityConfig(prev => ({
                      ...prev,
                      passwordPolicy: { ...prev.passwordPolicy, requireNumbers: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requerir números</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={securityConfig.passwordPolicy.requireSpecialChars}
                    onChange={(e) => setSecurityConfig(prev => ({
                      ...prev,
                      passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requerir caracteres especiales</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Autenticación de Dos Factores</h3>
                <p className="text-secondary-600 text-sm">Configura la autenticación de dos factores</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShow2FAModal(true)}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Configurar 2FA
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Estado del 2FA</h4>
                <p className="text-sm text-gray-600">Activar autenticación de dos factores</p>
              </div>
              <ToggleSwitch
                enabled={securityConfig.twoFactorAuth.enabled}
                onChange={(value) => setSecurityConfig(prev => ({
                  ...prev,
                  twoFactorAuth: { ...prev.twoFactorAuth, enabled: value }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Requerido para Administradores</h4>
                <p className="text-sm text-gray-600">Forzar 2FA para usuarios admin</p>
              </div>
              <ToggleSwitch
                enabled={securityConfig.twoFactorAuth.requiredForAdmins}
                onChange={(value) => setSecurityConfig(prev => ({
                  ...prev,
                  twoFactorAuth: { ...prev.twoFactorAuth, requiredForAdmins: value }
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Códigos de Respaldo</h4>
                <p className="text-sm text-gray-600">Generar códigos de respaldo</p>
              </div>
              <ToggleSwitch
                enabled={securityConfig.twoFactorAuth.backupCodes}
                onChange={(value) => setSecurityConfig(prev => ({
                  ...prev,
                  twoFactorAuth: { ...prev.twoFactorAuth, backupCodes: value }
                }))}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Ban className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Lista Blanca de IP</h3>
                <p className="text-secondary-600 text-sm">Restringe el acceso por direcciones IP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIPModal(true)}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Agregar IP
              </Button>
              <ToggleSwitch
                enabled={securityConfig.ipWhitelist.enabled}
                onChange={(value) => setSecurityConfig(prev => ({
                  ...prev,
                  ipWhitelist: { ...prev.ipWhitelist, enabled: value }
                }))}
              />
            </div>
          </div>

          {securityConfig.ipWhitelist.allowedIPs.length === 0 ? (
            <div className="text-center py-8">
              <Ban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay IPs configuradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityConfig.ipWhitelist.allowedIPs.map((ip) => (
                <div key={ip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{ip.ip}</span>
                    <span className="text-sm text-gray-600 ml-2">- {ip.description}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveIP(ip.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Save Configuration */}
      <div className="flex justify-end">
        <Button
          variant="gradient"
          onClick={handleSaveConfig}
          loading={saving}
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Guardar Configuración de Seguridad
        </Button>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              placeholder="Ingresa tu contraseña actual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              placeholder="Ingresa tu nueva contraseña"
            />
            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Fortaleza:</span>
                  <span className={`text-sm font-medium ${getPasswordStrength(passwordForm.newPassword).color}-600`}>
                    {getPasswordStrength(passwordForm.newPassword).text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${getPasswordStrength(passwordForm.newPassword).color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(getPasswordStrength(passwordForm.newPassword).score / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              placeholder="Confirma tu nueva contraseña"
            />
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
              onClick={handlePasswordChange}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Modal>

      {/* IP Add Modal */}
      <Modal
        isOpen={showIPModal}
        onClose={() => setShowIPModal(false)}
        title="Agregar IP a Lista Blanca"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección IP
            </label>
            <Input
              type="text"
              value={ipForm.ip}
              onChange={(e) => setIpForm({...ipForm, ip: e.target.value})}
              placeholder="192.168.1.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <Input
              type="text"
              value={ipForm.description}
              onChange={(e) => setIpForm({...ipForm, description: e.target.value})}
              placeholder="Oficina principal"
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowIPModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddIP}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Agregar IP
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SecurityConfigPage;