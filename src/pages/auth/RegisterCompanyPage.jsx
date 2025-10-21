/**
 * Register Company Page - Registro para Empresas
 *
 * Página de registro específica para empresas
 * Rediseñada con el mismo estilo que el login y diseño compacto
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../../components/common';
import { Mail, Lock, User, Phone, CreditCard, Building, CheckCircle, Chrome, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { validateRutInput, validatePassword, validatePhone, isValidEmail } from '../../utils/validators';
import { formatRut } from '../../utils/formatters';
import { USER_ROLES } from '../../config/constants';
import { checkCompanyRutExists, checkCompanyNameExists, checkCorporateDomainExists } from '../../services/authService';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validate = async () => {
    const newErrors = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    } else {
      // Validar dominio corporativo (prioridad 3)
      const { exists: domainExists, error: domainError } = await checkCorporateDomainExists(formData.email);
      if (domainError) {
        newErrors.email = 'Error verificando dominio corporativo';
      } else if (domainExists) {
        newErrors.email = 'El dominio corporativo ya está registrado. Usa un email corporativo único (@nombredeempresa.cl)';
      } else {
        // Validar que el dominio base del email coincida con el nombre de la empresa
        const emailDomainBase = extractDomainBase(formData.email);
        const expectedDomainBase = normalizeCompanyNameToDomain(formData.businessName);

        if (emailDomainBase !== expectedDomainBase) {
          newErrors.email = `El dominio debe coincidir con: @${expectedDomainBase}.cl`;
        }
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
    } else {
      // Validar Razón Social (prioridad 2)
      const { exists: nameExists, error: nameError } = await checkCompanyNameExists(formData.businessName);
      if (nameError) {
        newErrors.businessName = 'Error verificando razón social';
      } else if (nameExists) {
        newErrors.businessName = 'La razón social ya está registrada. Verifica los datos e intenta con otra razón social.';
      }
    }

    const companyRutValidation = validateRutInput(formData.companyRut);
    if (!companyRutValidation.isValid) {
      newErrors.companyRut = companyRutValidation.error;
    } else {
      // Validar RUT de empresa (prioridad 1)
      const { exists: rutExists, error: rutError } = await checkCompanyRutExists(formData.companyRut);
      if (rutError) {
        newErrors.companyRut = 'Error verificando RUT de empresa';
      } else if (rutExists) {
        newErrors.companyRut = 'El RUT de empresa ya está registrado. Cada empresa debe tener un RUT único.';
      }
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
    const { isValid, errors: validationErrors } = await validate();

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
        title: 'Validación de Registro Empresarial',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Por favor corrige los siguientes campos:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            ${errorMessages.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
            <strong>Nota:</strong> Las validaciones siguen este orden de prioridad:<br>
            1️⃣ RUT de empresa (único)<br>
            2️⃣ Razón Social (única)<br>
            3️⃣ Dominio corporativo (@empresa.cl)
          </p>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Corregir campos',
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
        Swal.fire({
          title: '¡Registro Empresarial Exitoso!',
          html: `<div style="text-align: center; font-size: 14px; line-height: 1.5;">
            <p style="margin-bottom: 10px;">Tu empresa ha sido registrada correctamente.</p>
            <p style="color: #6b7280;">Hemos enviado un email de confirmación a <strong>${formData.email}</strong></p>
            <p style="color: #6b7280;">Por favor, verifica tu email para activar tu cuenta.</p>
          </div>`,
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#7c3aed'
        });
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

    setGoogleLoading(true);

    try {
      // Para registro con Google, los campos son opcionales
      // El usuario completará los datos después del registro
      const registrationData = {
        role: USER_ROLES.COMPANY,
        // Campos opcionales - si se proporcionan, se usan
        ...(formData.fullName && { fullName: formData.fullName }),
        ...(formData.rut && { rut: formData.rut }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.businessName && { businessName: formData.businessName }),
        ...(formData.companyRut && { companyRut: formData.companyRut }),
        ...(formData.companyType && { companyType: formData.companyType }),
        needsProfileCompletion: true, // Marcar que necesita completar perfil
        redirectToProfile: true // Indicar que debe redirigir al perfil
      };

      // Guardar datos de registro en localStorage para usarlos después del OAuth
      localStorage.setItem('pending_oauth_registration', JSON.stringify(registrationData));

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
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Modern Dark Background - igual que AuthLayout */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex min-h-screen">
        {/* Panel Izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-800/50 backdrop-blur-xl border-r border-gray-600/30 p-12 flex-col justify-center relative overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>

          <div className="relative z-10 text-white max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  NexuPay
                </h1>
                <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Registro para Empresas</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Gestiona tu cartera de deudas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Optimiza procesos de cobranza</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-300">Accede a analytics avanzados</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-400">500+</div>
                  <div className="text-sm text-gray-400">Empresas Activas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">$10M</div>
                  <div className="text-sm text-gray-400">Cartera Gestionada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Contenido */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          
          <div className="w-full max-w-md relative z-10">
            {/* Logo móvil */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    NexuPay
                  </h1>
                  <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
                </div>
              </div>
            </div>

            <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    Registro Empresarial
                  </h2>
                  <p className="text-purple-100 text-lg">
                    Crea tu cuenta empresarial
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <div className="p-6 relative">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400/30 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400/30 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400/30 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400/30 rounded-br-xl"></div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Fila 1: Representante - Nombre y RUT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Nombre Representante
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Nombre del representante"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        RUT Representante
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="rut"
                          value={formData.rut}
                          onChange={handleChange}
                          placeholder="12.345.678-9"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.rut && (
                        <p className="mt-1 text-xs text-red-400">{errors.rut}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Empresa - Nombre y RUT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Nombre Empresa
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="Empresa S.A."
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.businessName && (
                        <p className="mt-1 text-xs text-red-400">{errors.businessName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        RUT Empresa
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="companyRut"
                          value={formData.companyRut}
                          onChange={handleChange}
                          placeholder="76.123.456-7"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.companyRut && (
                        <p className="mt-1 text-xs text-red-400">{errors.companyRut}</p>
                      )}
                    </div>
                  </div>

                  {/* Campo Email */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Correo Corporativo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contacto@empresa.com"
                        required
                        disabled={loading}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Campo Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Teléfono Contacto
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+56912345678"
                        required
                        disabled={loading}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                    )}
                  </div>

                  {/* Tipo de Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Tipo de Empresa
                    </label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                      disabled={loading}
                    >
                      <option value="direct_creditor">🏢 Acreedor Directo</option>
                      <option value="collection_agency">📊 Empresa de Cobranza</option>
                    </select>
                  </div>

                  {/* Fila 3: Contraseñas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Error general */}
                  {Object.keys(errors).length > 0 && (
                    <div className="p-3 bg-red-900/50 border border-red-500/30 rounded-lg flex items-start gap-2 backdrop-blur-sm">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-200">Por favor completa los campos requeridos correctamente.</p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      variant="gradient"
                      fullWidth
                      loading={loading}
                      disabled={googleLoading}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {loading ? 'Creando Cuenta...' : 'Crear Cuenta'}
                    </Button>

                    {/* Separador */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600/30" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-gray-800/50 text-gray-400 font-medium backdrop-blur-sm">O</span>
                      </div>
                    </div>

                    {/* Botón de Google */}
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={handleGoogleRegister}
                      loading={googleLoading}
                      leftIcon={<Chrome className="w-5 h-5" />}
                      className="border-gray-600/30 bg-gray-700/50 text-white hover:bg-gray-700/70 py-2.5 rounded-lg font-medium backdrop-blur-sm transition-all duration-300 text-sm"
                      disabled={loading}
                    >
                      Continuar con Google
                    </Button>
                  </div>

                  {/* Términos y condiciones */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-300">
                      Acepto los{' '}
                      <Link to="/terminos-servicio" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                        Términos
                      </Link>{' '}
                      y{' '}
                      <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                        Privacidad
                      </Link>
                    </p>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-600/30 text-center backdrop-blur-sm">
                <p className="text-xs text-gray-300">
                  ¿Eres una persona?{' '}
                  <Link
                    to="/registro/persona"
                    className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Regístrate aquí
                  </Link>
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompanyPage;