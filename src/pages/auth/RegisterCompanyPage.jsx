/**
 * Register Company Page - Registro para Empresas
 *
 * Página de registro específica para empresas
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/common';
import { Mail, Lock, User, Phone, CreditCard, Building, CheckCircle, Chrome } from 'lucide-react';
import { validateRutInput, validatePassword, validatePhone, isValidEmail } from '../../utils/validators';
import { formatRut } from '../../utils/formatters';
import { USER_ROLES } from '../../config/constants';
import Swal from 'sweetalert2';

const RegisterCompanyPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rut: '',
    phone: '',
    // Campos adicionales para empresa
    businessName: '',
    companyRut: '',
    companyType: 'direct_creditor',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Función para normalizar nombre de empresa a dominio base
  const normalizeCompanyNameToDomain = (companyName) => {
    return companyName
      .toLowerCase()
      .trim()
      // Reemplazar caracteres especiales y espacios
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
      .replace(/\s+/g, '') // Quitar espacios
      .replace(/empresa|sa|sas|spa|limitada|eirl|spu/gi, '') // Quitar términos comunes
      .trim();
  };

  // Función para extraer el dominio base de un email (sin TLD)
  const extractDomainBase = (email) => {
    const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase();
    return domain || '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Formatear RUT automáticamente
    if (name === 'rut' || name === 'companyRut') {
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
    } else {
      // Validar que el dominio base del email coincida con el nombre de la empresa
      const emailDomainBase = extractDomainBase(formData.email);
      const expectedDomainBase = normalizeCompanyNameToDomain(formData.businessName);

      if (emailDomainBase !== expectedDomainBase) {
        newErrors.email = `El dominio del email debe coincidir con el nombre de la empresa. Para "${formData.businessName}" se espera un dominio como "@${expectedDomainBase}.com" o "@${expectedDomainBase}.cl"`;
      }
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

    // Nombre completo del representante
    if (!formData.fullName) {
      newErrors.fullName = 'El nombre del representante es requerido';
    }

    // RUT del representante
    const rutValidation = validateRutInput(formData.rut);
    if (!rutValidation.isValid) {
      newErrors.rut = rutValidation.error;
    }

    // Campos adicionales para empresa
    if (!formData.businessName) {
      newErrors.businessName = 'El nombre de la empresa es requerido';
    }

    const companyRutValidation = validateRutInput(formData.companyRut);
    if (!companyRutValidation.isValid) {
      newErrors.companyRut = companyRutValidation.error;
    }

    // Teléfono (requerido para empresas)
    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
      }
    }


    // Términos y condiciones
    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
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
          fullName: 'nombre del representante',
          rut: 'RUT del representante',
          phone: 'teléfono de contacto',
          businessName: 'nombre de la empresa',
          companyRut: 'RUT de la empresa',
          terms: 'términos y condiciones'
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
        confirmButtonColor: '#7c3aed'
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
        role: USER_ROLES.COMPANY,
        companyData: {
          businessName: formData.businessName,
          companyRut: formData.companyRut,
          rut: formData.rut, // RUT del representante
          phone: formData.phone,
          companyType: formData.companyType,
        },
      };

      const { success, error } = await register(userData);

      if (success) {
        Swal.fire('¡Registro exitoso!', 'Por favor, verifica tu email.', 'success');
        navigate('/login');
      } else {
        Swal.fire('Error', error || 'Error al registrar empresa', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error al registrar empresa. Por favor, intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Validar términos y condiciones
    if (!acceptTerms) {
      Swal.fire({
        title: 'Términos y condiciones requeridos',
        text: 'Debes aceptar los términos y condiciones para continuar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    // Validar campos requeridos para registro con Google
    const googleRequiredFields = ['fullName', 'rut', 'phone', 'businessName', 'companyRut'];
    const missingFields = googleRequiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      const fieldNames = {
        fullName: 'nombre del representante',
        rut: 'RUT del representante',
        phone: 'teléfono de contacto',
        businessName: 'nombre de la empresa',
        companyRut: 'RUT de la empresa'
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
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    // Validar RUTs y teléfono
    const rutValidation = validateRutInput(formData.rut);
    const companyRutValidation = validateRutInput(formData.companyRut);
    const phoneValidation = validatePhone(formData.phone);

    const validationErrors = [];
    if (!rutValidation.isValid) validationErrors.push(`• RUT del representante: ${rutValidation.error}`);
    if (!companyRutValidation.isValid) validationErrors.push(`• RUT de la empresa: ${companyRutValidation.error}`);
    if (!phoneValidation.isValid) validationErrors.push(`• Teléfono: ${phoneValidation.error}`);

    // Validar dominio del email
    const emailDomainBase = extractDomainBase(formData.email);
    const expectedDomainBase = normalizeCompanyNameToDomain(formData.businessName);
    if (emailDomainBase !== expectedDomainBase) {
      validationErrors.push(`• Email: El dominio debe coincidir con el nombre de la empresa. Para "${formData.businessName}" se espera un dominio como "@${expectedDomainBase}.com"`);
    }

    if (validationErrors.length > 0) {
      Swal.fire({
        title: 'Datos inválidos',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Corrige los siguientes campos:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            ${validationErrors.join('<br>')}
          </div>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    setGoogleLoading(true);

    try {
      // Preparar datos de registro para pasar a OAuth
      const registrationData = {
        fullName: formData.fullName,
        rut: formData.rut,
        phone: formData.phone,
        businessName: formData.businessName,
        companyRut: formData.companyRut,
        companyType: formData.companyType,
        role: USER_ROLES.COMPANY
      };

      const { success, error } = await loginWithGoogle(registrationData);

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
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">
              Registro para Empresas
            </h2>
            <p className="text-center text-purple-100">
              Crea tu cuenta empresarial y gestiona tu cartera de deudas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información del Representante */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Información del Representante Legal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo del Representante"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  leftIcon={<User className="w-5 h-5" />}
                  placeholder="Nombre del representante legal"
                  error={errors.fullName}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />

                <Input
                  label="RUT del Representante"
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
                label="Correo Electrónico Corporativo"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-5 h-5" />}
                placeholder="contacto@empresa.com"
                error={errors.email}
                helperText={formData.businessName ? `El dominio debe coincidir con el nombre de la empresa: @${normalizeCompanyNameToDomain(formData.businessName)}.[com/net/org/etc]` : 'Ingresa el nombre de la empresa primero'}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 focus:bg-white"
              />

              <Input
                label="Teléfono de Contacto"
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

            {/* Información de la Empresa */}
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-500" />
                Información de la Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la Empresa"
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  leftIcon={<Building className="w-5 h-5" />}
                  placeholder="Empresa S.A."
                  error={errors.businessName}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />

                <Input
                  label="RUT de la Empresa"
                  type="text"
                  name="companyRut"
                  value={formData.companyRut}
                  onChange={handleChange}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  placeholder="76.123.456-7"
                  error={errors.companyRut}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Empresa
                </label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 hover:bg-white transition-colors"
                  disabled={loading}
                >
                  <option value="direct_creditor">🏢 Acreedor Directo</option>
                  <option value="collection_agency">📊 Empresa de Cobranza</option>
                </select>
              </div>
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
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">
                    Beneficios para Empresas
                  </p>
                  <p className="text-sm text-purple-800">
                    Accede a una plataforma completa para gestionar tu cartera de deudas y optimizar tus procesos de cobranza.
                  </p>
                </div>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <p className="text-sm text-gray-600">
                  Acepto los{' '}
                  <Link to="/terminos-servicio" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                    Términos de Servicio
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                    Política de Privacidad
                  </Link>
                </p>
                {errors.terms && (
                  <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
                )}
              </div>
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? 'Creando Cuenta...' : 'Crear Cuenta Empresarial'}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿Eres una persona?{' '}
              <Link
                to="/registro/persona"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Regístrate como persona aquí
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
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

export default RegisterCompanyPage;