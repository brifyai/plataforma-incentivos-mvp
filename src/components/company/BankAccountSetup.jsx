/**
 * Bank Account Setup Component
 *
 * Componente para configurar información bancaria después del primer login
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Select } from '../common';
import { formatCurrency } from '../../utils/formatters';
import { validateRutInput } from '../../utils/validators';
import { setupCompanyBankAccount } from '../../services/authService';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import {
  CreditCard,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield
} from 'lucide-react';

const BankAccountSetup = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();

  // Lista de bancos y plataformas fintech de Chile
  const chileanBanks = [
    // Bancos tradicionales
    'Banco de Chile',
    'Banco Estado',
    'Banco Santander',
    'Banco BCI',
    'Banco Itaú',
    'Banco Security',
    'Banco Falabella',
    'Banco Ripley',
    'Banco Consorcio',
    'Banco Internacional',
    'Scotiabank',
    'BBVA',
    'Banco Edwards Citi',
    'HSBC Bank',
    'Rabobank',
    'Banco Penta',
    'Banco Paris',
    'BTG Pactual',
    'Corpbanca',
    'Banco del Desarrollo',
    // Plataformas fintech
    'Mercado Pago',
    'Mach',
    'Tenpo',
    'Copec Pay',
    'Caja Los Andes',
    'Prepago Los Héroes',
    'BCI Prepago',
    'Itaú Prepago',
    'Santander Light'
  ];

  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'checking_account',
    accountNumber: '',
    accountHolderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Obtener el nombre de la empresa del usuario actual
  useEffect(() => {
    const getCompanyInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: company } = await supabase
            .from('companies')
            .select('company_name')
            .eq('user_id', user.id)
            .single();

          if (company) {
            setCompanyName(company.company_name);
          }
        }
      } catch (error) {
        console.error('Error obteniendo información de la empresa:', error);
      }
    };

    getCompanyInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Limpiar error del campo
    setErrors({
      ...errors,
      [name]: '',
    });
  };

  // Función para normalizar nombres para comparación
  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.bankName || formData.bankName === '') {
      newErrors.bankName = 'Debe seleccionar un banco de la lista';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'El número de cuenta es requerido';
    } else if (formData.accountNumber.length < 8) {
      newErrors.accountNumber = 'El número de cuenta debe tener al menos 8 dígitos';
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'El número de cuenta debe contener solo números';
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'El nombre del titular es requerido';
    } else if (companyName) {
      // Validar que el nombre del titular coincida con la razón social de la empresa
      const normalizedAccountHolder = normalizeName(formData.accountHolderName);
      const normalizedCompanyName = normalizeName(companyName);

      // Verificar si el nombre del titular contiene el nombre de la empresa o viceversa
      const accountHolderContainsCompany = normalizedAccountHolder.includes(normalizedCompanyName) ||
                                          normalizedCompanyName.includes(normalizedAccountHolder);

      if (!accountHolderContainsCompany) {
        newErrors.accountHolderName = `El nombre del titular debe coincidir con la razón social de la empresa "${companyName}". Solo se permiten cuentas corrientes chilenas a nombre de la empresa.`;
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar errores previos y validar
    setErrors({});
    const { isValid, errors: validationErrors } = validate();

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSetup = async () => {
    setLoading(true);

    try {
      // Usar el servicio para configurar la cuenta bancaria
      const result = await setupCompanyBankAccount(formData);

      if (result.success) {
        console.log('✅ Cuenta bancaria configurada exitosamente');

        // Mostrar mensaje de éxito al usuario
        await Swal.fire({
          icon: 'success',
          title: '¡Cuenta Bancaria Configurada!',
          html: '✅ ¡Cuenta bancaria configurada exitosamente!<br><br>Ahora podrás recibir transferencias automáticas cuando los deudores realicen pagos.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#10B981',
          timer: 4000,
          timerProgressBar: true
        });

        // Llamar al callback de completado
        if (onComplete) {
          await onComplete(formData);
        }

        setShowConfirmModal(false);
      } else {
        console.error('❌ Error configurando cuenta bancaria:', result.error);
        await Swal.fire({
          icon: 'error',
          title: 'Error de Configuración',
          text: 'Error al configurar la cuenta bancaria. Por favor, intenta de nuevo.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
      }

    } catch (error) {
      console.error('Error configurando cuenta bancaria:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error al configurar la cuenta bancaria. Por favor, intenta de nuevo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigate('/empresa/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Configura tu Cuenta Bancaria
          </h1>
          <p className="text-gray-600 text-lg">
            Para recibir transferencias automáticas de pagos procesados
          </p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header del formulario */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">
              Información Bancaria
            </h2>
            <p className="text-center text-green-100">
              Esta información es necesaria para procesar transferencias automáticas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información bancaria */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Banco
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 hover:bg-white transition-colors ${errors.bankName ? 'border-red-500' : 'border-gray-200'}`}
                    disabled={loading}
                    required
                  >
                    <option value="">Seleccionar banco...</option>
                    {chileanBanks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 hover:bg-white transition-colors"
                    disabled={loading}
                  >
                    <option value="checking_account">Cuenta Corriente</option>
                    <option value="sight_account">Cuenta Vista</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Número de Cuenta"
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  placeholder="123456789"
                  error={errors.accountNumber}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />

                <Input
                  label="Nombre del Titular"
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  leftIcon={<User className="w-5 h-5" />}
                  placeholder="Nombre completo del titular"
                  error={errors.accountHolderName}
                  helperText={companyName ? `Debe coincidir con la razón social: "${companyName}". Solo se permiten cuentas corrientes chilenas a nombre de la empresa.` : 'Cargando información de la empresa...'}
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Beneficios */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    ¿Por qué configurar mi cuenta bancaria?
                  </p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Recibe transferencias automáticas cuando los deudores pagan</li>
                    <li>• Procesamiento seguro a través de Mercado Pago</li>
                    <li>• Seguimiento completo de todas las transacciones</li>
                    <li>• Reportes detallados de ingresos y comisiones</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    Seguridad de la Información
                  </p>
                  <p className="text-sm text-yellow-800">
                    Tu información bancaria está encriptada y protegida. Solo se utiliza para procesar
                    transferencias automáticas a través de Mercado Pago.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-4">
              <Button
                type="submit"
                variant="gradient"
                fullWidth
                loading={loading}
                size="lg"
                leftIcon={!loading ? <ArrowRight className="w-5 h-5" /> : null}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? 'Configurando...' : 'Configurar Cuenta Bancaria'}
              </Button>

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleSkip}
                disabled={loading}
                className="py-3 rounded-xl border-gray-300 hover:bg-gray-50"
              >
                Configurar Más Tarde
              </Button>
            </div>
          </form>
        </Card>

        {/* Modal de confirmación */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => !loading && setShowConfirmModal(false)}
          title="Confirmar Configuración"
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Confirmar configuración bancaria?
              </h3>
              <p className="text-gray-600 mb-4">
                Una vez configurada, podrás recibir transferencias automáticas.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banco:</span>
                    <span className="font-semibold">{formData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de cuenta:</span>
                    <span className="font-semibold">
                      {formData.accountType === 'checking_account' ? 'Cuenta Corriente' :
                       formData.accountType === 'sight_account' ? 'Cuenta Vista' : 'Otro'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número de cuenta:</span>
                    <span className="font-semibold">{formData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Titular:</span>
                    <span className="font-semibold">{formData.accountHolderName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="flex-1"
              >
                Revisar
              </Button>
              <Button
                variant="gradient"
                onClick={handleConfirmSetup}
                loading={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BankAccountSetup;