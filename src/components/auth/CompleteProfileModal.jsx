/**
 * Complete Profile Modal
 * 
 * Modal para que los usuarios completen su perfil después de registrarse con Google
 */

import { useState } from 'react';
import { Button, Input, Modal } from '../common';
import { User, CreditCard, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { validateRutInput, validatePhone } from '../../utils/validators';
import { formatRut } from '../../utils/formatters';
import Swal from 'sweetalert2';

const CompleteProfileModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    rut: profile?.rut || '',
    phone: profile?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Formatear RUT automáticamente
    if (name === 'rut') {
      setFormData({
        ...formData,
        [name]: formatRut(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Limpiar error del campo
    setErrors({
      ...errors,
      [name]: '',
    });
  };

  const validate = () => {
    const newErrors = {};

    // Validar RUT solo si se proporcionó
    if (formData.rut) {
      const rutValidation = validateRutInput(formData.rut);
      if (!rutValidation.isValid) {
        newErrors.rut = rutValidation.error;
      }
    }

    // Validar teléfono solo si se proporcionó
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar solo los campos que se llenaron
    const { isValid, errors: validationErrors } = validate();

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
      
      Swal.fire({
        icon: 'success',
        title: '¡Perfil actualizado!',
        text: 'Tu información ha sido guardada exitosamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar tu perfil. Por favor, intenta de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Swal.fire({
      title: '¿Omitir completar perfil?',
      html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
        <p style="margin-bottom: 10px;">Puedes completar tu perfil más tarde en la sección de perfil.</p>
        <div style="background: #fef3c7; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Recomendación:</p>
          <p style="margin: 5px 0 0 0; color: #78350f; font-size: 12px;">
            Completar tu perfil te ayudará a tener una mejor experiencia en la plataforma.
          </p>
        </div>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Omitir por ahora',
      cancelButtonText: 'Completar perfil',
      confirmButtonColor: '#6b7280',
      cancelButtonColor: '#3b82f6',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        onClose();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Completa tu perfil"
      size="lg"
    >
      <div className="space-y-6">
        {/* Mensaje de bienvenida */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">¡Bienvenido a NexuPay!</h3>
              <p className="text-sm text-blue-700">
                Para una mejor experiencia, completa tu información personal. 
                Todos los campos son opcionales, pero recomendamos llenarlos.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div>
            <Input
              label="Nombre Completo"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              leftIcon={<User className="w-5 h-5" />}
              placeholder="Tu nombre completo"
              error={errors.fullName}
              disabled={loading}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* RUT */}
          <div>
            <Input
              label="RUT (opcional)"
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              leftIcon={<CreditCard className="w-5 h-5" />}
              placeholder="12.345.678-9"
              error={errors.rut}
              disabled={loading}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Teléfono */}
          <div>
            <Input
              label="Teléfono (opcional)"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-5 h-5" />}
              placeholder="+56912345678"
              error={errors.phone}
              disabled={loading}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={loading}
            >
              Omitir por ahora
            </Button>
            <Button
              type="submit"
              variant="gradient"
              loading={loading}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar información
            </Button>
          </div>
        </form>

        {/* Información adicional */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">¿Por qué completar tu perfil?</p>
              <ul className="space-y-1 text-xs">
                <li>• Mejora la personalización de tu experiencia</li>
                <li>• Facilita el proceso de verificación</li>
                <li>• Permite mejores coincidencias con empresas</li>
                <li>• Ayuda a identificar tu cuenta de forma única</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CompleteProfileModal;