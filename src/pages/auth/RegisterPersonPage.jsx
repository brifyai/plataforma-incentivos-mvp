/**
 * Register Person Page - Registro para Personas
 *
 * Página de registro específica para personas naturales
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/common';
import { Mail, Lock, User, Phone, CreditCard, CheckCircle, Chrome } from 'lucide-react';
import { validateRutInput, validatePassword, validatePhone, isValidEmail } from '../../utils/validators';
import { formatRut } from '../../utils/formatters';
import { USER_ROLES } from '../../config/constants';
import Swal from 'sweetalert2';

const RegisterPersonPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rut: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    // Email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Contraseña
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirmar contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Nombre completo
    if (!formData.fullName) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    // RUT
    const rutValidation = validateRutInput(formData.rut);
    if (!rutValidation.isValid) {
      newErrors.rut = rutValidation.error;
    }

    // Teléfono (requerido para personas)
    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar errores previos y validar nuevamente
    setErrors({});
    const { isValid, errors: validationErrors } = validate();

    if (!isValid) {
      const errorFields = Object.keys(validationErrors);
      const errorMessages = errorFields.map(field => {
        const fieldNames = {
          email: 'correo electrónico',
          password: 'contraseña',
          confirmPassword: 'confirmación de contraseña',
          fullName: 'nombre completo',
          rut: 'RUT',
          phone: 'teléfono'
        };
        return `• ${fieldNames[field] || field}: ${validationErrors[field]}`;
      }).join('\n');

      Swal.fire({
        title: 'Campos requeridos faltantes',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Por favor completa los siguientes campos:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            ${errorMessages.replace(/\n/g, '<br>')}
          </div>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        rut: formData.rut,
        phone: formData.phone,
        role: USER_ROLES.DEBTOR,
      };

      const { success, error } = await register(userData);

      if (success) {
        Swal.fire('¡Registro exitoso!', 'Por favor, verifica tu email.', 'success');
        navigate('/login');
      } else {
        Swal.fire('Error', error || 'Error al registrar usuario', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error al registrar usuario. Por favor, intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Validar campos requeridos para registro con Google
    const googleRequiredFields = ['fullName', 'rut', 'phone'];
    const missingFields = googleRequiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      const fieldNames = {
        fullName: 'nombre completo',
        rut: 'RUT',
        phone: 'teléfono'
      };

      const errorMessages = missingFields.map(field => {
        return `• ${fieldNames[field] || field}: Este campo es requerido`;
      }).join('\n');

      Swal.fire({
        title: 'Campos requeridos para Google',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Para registrarte con Google, completa estos campos:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            ${errorMessages.replace(/\n/g, '<br>')}
          </div>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validar RUT
    const rutValidation = validateRutInput(formData.rut);
    if (!rutValidation.isValid) {
      Swal.fire({
        title: 'RUT inválido',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Corrige el siguiente RUT:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            • RUT: ${rutValidation.error}
          </div>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validar teléfono
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      Swal.fire({
        title: 'Teléfono inválido',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Corrige el siguiente teléfono:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            • Teléfono: ${phoneValidation.error}
          </div>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setGoogleLoading(true);

    try {
      const { success, error } = await loginWithGoogle();

      if (!success) {
        Swal.fire('Error', error || 'Error al registrarse con Google', 'error');
      }
      // Si es exitoso, Google redirige automáticamente
    } catch (err) {
      Swal.fire('Error', 'Error al registrarse con Google. Por favor, intenta de nuevo.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              NexuPay
            </h1>
            <p className="text-gray-600 text-lg">
              Gestiona tus deudas y recibe beneficios
            </p>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header del formulario */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">
              Registro para Personas
            </h2>
            <p className="text-center text-blue-100">
              Crea tu cuenta personal y comienza a gestionar tus finanzas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Información Personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  leftIcon={<User className="w-5 h-5" />}
                  placeholder="Tu nombre completo"
                  error={errors.fullName}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />

                <Input
                  label="RUT"
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  placeholder="12.345.678-9"
                  error={errors.rut}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-5 h-5" />}
                placeholder="tu@email.com"
                error={errors.email}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />

              <Input
                label="Teléfono"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="w-5 h-5" />}
                placeholder="+56912345678"
                error={errors.phone}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Seguridad */}
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                Seguridad
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  leftIcon={<Lock className="w-5 h-5" />}
                  placeholder="••••••••"
                  error={errors.password}
                  helperText="Mínimo 6 caracteres"
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />

                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  leftIcon={<Lock className="w-5 h-5" />}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>


            {/* Beneficios */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Beneficios para Personas
                  </p>
                  <p className="text-sm text-blue-800">
                    Gestiona todas tus finanzas personales en un solo lugar y recibe incentivos por cumplir tus acuerdos de pago.
                  </p>
                </div>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600">
                Acepto los{' '}
                <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Términos de Servicio
                </Link>{' '}
                y la{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Política de Privacidad
                </Link>
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-4">
              {/* Botón de Google */}
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleGoogleRegister}
                loading={googleLoading}
                leftIcon={<Chrome className="w-5 h-5" />}
                className="border-gray-300 hover:bg-gray-50 py-3 rounded-xl"
                size="lg"
              >
                Continuar con Google
              </Button>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">O</span>
                </div>
              </div>

              {/* Botón principal */}
              <Button
                type="submit"
                variant="gradient"
                fullWidth
                loading={loading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? 'Creando Cuenta...' : 'Crear Cuenta Personal'}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿Eres una empresa?{' '}
              <Link
                to="/registro/empresa"
                className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Regístrate como empresa aquí
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPersonPage;