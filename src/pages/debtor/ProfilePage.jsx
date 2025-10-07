/**
 * Profile Page
 *
 * Página para gestionar el perfil del deudor
 */

import { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/databaseService';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Mi Perfil</h1>
          <p className="text-secondary-600 mt-1">
            Gestiona tu información personal
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="p-4 bg-primary-100 rounded-full">
            <User className="w-12 h-12 text-primary-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Información Personal
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <Button
                variant={isEditing ? 'primary' : 'secondary'}
                size="sm"
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                loading={loading}
                disabled={loading}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Account Info */}
      <Card>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información de Cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            <Calendar className="w-5 h-5 text-secondary-500" />
            <div>
              <p className="text-sm text-secondary-500">Fecha de Registro</p>
              <p className="font-medium text-secondary-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
            <User className="w-5 h-5 text-secondary-500" />
            <div>
              <p className="text-sm text-secondary-500">Tipo de Usuario</p>
              <p className="font-medium text-secondary-900">Persona</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Seguridad</h3>
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => setShowPasswordModal(true)}
            leftIcon={<Key className="w-4 h-4" />}
          >
            Cambiar Contraseña
          </Button>

        </div>
      </Card>

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
              loading={loading}
              disabled={loading}
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