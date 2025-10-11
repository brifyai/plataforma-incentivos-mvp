/**
 * Profile Page
 *
 * Página para gestionar el perfil del deudor
 */

import { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/databaseService';
import { hashPassword } from '../../services/authService.js';
import Swal from 'sweetalert2';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Edit,
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    rut: profile?.rut || '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar el perfil del usuario
      const updates = {
        full_name: formData.full_name,
        phone: formData.phone,
        rut: formData.rut,
        updated_at: new Date().toISOString(),
      };

      // Solo actualizar email si cambió
      if (formData.email !== user?.email) {
        updates.email = formData.email;
      }

      const { error } = await updateUserProfile(user.id, updates);

      if (error) {
        setError(error);
        return;
      }

      // Recargar el perfil desde la base de datos
      await refreshProfile();

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
      alert('Error al cambiar la contraseña: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Mi Perfil
                </h1>
                <p className="text-primary-100 text-sm">
                  Gestiona tu información personal
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowPasswordModal(true)}
                className="hover:scale-105 transition-all shadow-glow"
                leftIcon={<Key className="w-4 h-4" />}
              >
                Cambiar Contraseña
              </Button>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-300" />
                <div>
                  <p className="text-xs text-primary-100">Fecha de Registro</p>
                  <p className="text-lg font-bold">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-300" />
                <div>
                  <p className="text-xs text-primary-100">Tipo de Usuario</p>
                  <p className="text-lg font-bold">Persona</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-300" />
                <div>
                  <p className="text-xs text-primary-100">Estado</p>
                  <p className="text-lg font-bold">Verificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-full">
            <User className="w-8 h-8 text-primary-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-secondary-900">
                Información Personal
              </h2>
              {isEditing ? (
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={loading}
                  disabled={loading}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="px-3 py-2 text-sm"
                >
                  Guardar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit className="w-4 h-4" />}
                  className="px-3 py-2 text-sm"
                >
                  Editar
                </Button>
              )}
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nombre Completo"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                leftIcon={<User className="w-4 h-4" />}
                disabled={!isEditing}
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                leftIcon={<Mail className="w-4 h-4" />}
                disabled={!isEditing}
              />

              <Input
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                leftIcon={<Phone className="w-4 h-4" />}
                disabled={!isEditing}
              />

              <Input
                label="RUT"
                value={formData.rut}
                onChange={(e) => setFormData({...formData, rut: e.target.value})}
                leftIcon={<User className="w-4 h-4" />}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Cambiar Contraseña</h4>
                <p className="text-xs text-blue-700">
                  Establece una nueva contraseña segura para proteger tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
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

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 text-sm mb-1">Recomendaciones de Seguridad</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Usa al menos 8 caracteres</li>
                  <li>• Incluye letras mayúsculas y minúsculas</li>
                  <li>• Agrega números y símbolos</li>
                  <li>• Evita usar información personal</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
              size="md"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleChangePassword}
              className="flex-1 whitespace-nowrap"
              leftIcon={<Save className="w-4 h-4" />}
              loading={loading}
              disabled={loading}
              size="md"
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