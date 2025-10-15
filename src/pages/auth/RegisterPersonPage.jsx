/**
 * Register Person Page - Registro para Personas
 *
 * Página de registro específica para personas naturales
 * Rediseñada con el mismo estilo que el login
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/common';
import { Mail, Lock, User, Phone, CreditCard, CheckCircle, Chrome, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { validateRutInput, validatePassword, validatePhone, isValidEmail } from '../../utils/validators';
import { formatRut } from '../../utils/formatters';
import { USER_ROLES } from '../../config/constants';
import Swal from 'sweetalert2';
import debtorMatchingService from '../../services/debtorMatchingService';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      const { success, error, user } = await register(userData);

      if (success) {
        // Realizar matching automático después del registro
        try {
          const matchingResult = await debtorMatchingService.autoMatchAfterRegistration({
            id: user.id,
            full_name: userData.fullName,
            email: userData.email,
            rut: userData.rut,
            phone: userData.phone
          });

          if (matchingResult.matchesFound > 0) {
            console.log(`✅ Matching automático: ${matchingResult.matchesFound} matches encontrados`);
            
            // Mostrar mensaje de éxito con información de matches
            Swal.fire({
              title: '¡Registro exitoso!',
              html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
                <p style="margin-bottom: 10px;">Por favor, verifica tu email.</p>
                <div style="background: #f0f9ff; padding: 10px; border-radius: 5px; border-left: 4px solid #3b82f6; margin-top: 10px;">
                  <p style="margin: 0; font-weight: bold; color: #1e40af;">🎯 Hemos encontrado ${matchingResult.matchesFound} coincidencia(s) con clientes corporativos</p>
                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Tu perfil será asociado automáticamente para una mejor experiencia.</p>
                </div>
              </div>`,
              icon: 'success',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#3b82f6'
            });
          } else {
            Swal.fire('¡Registro exitoso!', 'Por favor, verifica tu email.', 'success');
          }
        } catch (matchingError) {
          console.error('❌ Error en matching automático:', matchingError);
          // El matching falla pero el registro fue exitoso
          Swal.fire('¡Registro exitoso!', 'Por favor, verifica tu email.', 'success');
        }
        
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
    // Validar campos opcionales para registro con Google
    const validationErrors = {};
    
    // Validar RUT solo si se proporcionó
    if (formData.rut) {
      const rutValidation = validateRutInput(formData.rut);
      if (!rutValidation.isValid) {
        validationErrors.rut = rutValidation.error;
      }
    }

    // Validar teléfono solo si se proporcionó
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        validationErrors.phone = phoneValidation.error;
      }
    }

    // Si hay errores de validación, mostrarlos
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.entries(validationErrors).map(([field, error]) => {
        const fieldNames = {
          fullName: 'nombre completo',
          rut: 'RUT',
          phone: 'teléfono'
        };
        return `• ${fieldNames[field] || field}: ${error}`;
      }).join('\n');

      Swal.fire({
        title: 'Datos inválidos',
        html: `<div style="text-align: left; font-size: 14px; line-height: 1.5;">
          <p style="margin-bottom: 10px; font-weight: bold;">Corrige los siguientes datos:</p>
          <div style="background: #fef2f2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444;">
            ${errorMessages.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 10px; color: #6b7280; font-size: 12px;">
            Los campos son opcionales. Puedes registrarte con Google sin completarlos.
          </p>
        </div>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setGoogleLoading(true);

    try {
      // Preparar datos de registro para OAuth (solo si se proporcionaron)
      const registrationData = {
        role: USER_ROLES.DEBTOR,
      };

      // Agregar campos opcionales solo si tienen valores
      if (formData.fullName) registrationData.fullName = formData.fullName;
      if (formData.rut) registrationData.rut = formData.rut;
      if (formData.phone) registrationData.phone = formData.phone;

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
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex min-h-screen">
        {/* Panel Izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-800/50 backdrop-blur-xl border-r border-gray-600/30 p-12 flex-col justify-center relative overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>

          <div className="relative z-10 text-white max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  NexuPay
                </h1>
                <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Registro para Personas</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Gestiona tus finanzas personales</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Recibe incentivos por pagos puntuales</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-300">Mejora tu historial crediticio</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-400">10K+</div>
                  <div className="text-sm text-gray-400">Usuarios Activos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">$2M</div>
                  <div className="text-sm text-gray-400">Deudas Gestionadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Contenido */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          
          <div className="w-full max-w-md relative z-10">
            {/* Logo móvil */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    NexuPay
                  </h1>
                  <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
                </div>
              </div>
            </div>

            <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Registro Personal
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Crea tu cuenta personal
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <div className="p-6 relative">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/30 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400/30 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/30 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400/30 rounded-br-xl"></div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Fila 1: Nombre y RUT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Nombre Completo
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
                          placeholder="Tu nombre"
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        RUT
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
                          disabled={loading}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                        />
                      </div>
                      {errors.rut && (
                        <p className="mt-1 text-xs text-red-400">{errors.rut}</p>
                      )}
                    </div>
                  </div>

                  {/* Campo Email */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Correo Electrónico
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
                        placeholder="tu@email.com"
                        required
                        disabled={loading}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Campo Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Teléfono
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
                        disabled={loading}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                    )}
                  </div>

                  {/* Fila 2: Contraseñas */}
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
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
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
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
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
                    {/* Botón principal */}
                    <Button
                      type="submit"
                      variant="gradient"
                      fullWidth
                      loading={loading}
                      disabled={googleLoading}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
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
                      required
                      className="mt-0.5 w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-300">
                      Acepto los{' '}
                      <Link to="/terminos-servicio" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Términos
                      </Link>{' '}
                      y{' '}
                      <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Privacidad
                      </Link>
                    </p>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-600/30 text-center backdrop-blur-sm">
                <p className="text-xs text-gray-300">
                  ¿Eres una empresa?{' '}
                  <Link
                    to="/registro/empresa"
                    className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    Regístrate aquí
                  </Link>
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
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

export default RegisterPersonPage;