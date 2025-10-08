/**
 * Verification Progress Component
 *
 * Componente que muestra el progreso de verificación de la empresa
 * en 3 pasos: cuenta bancaria, certificado de vigencia e informe equifax
 */

import { CheckCircle, Circle, CreditCard, FileText, TrendingUp } from 'lucide-react';

const VerificationProgress = ({ profile, verification }) => {
  // Verificar estado de cada paso
  const steps = [
    {
      id: 'bank_account',
      title: 'Cuenta Bancaria',
      description: 'Configurar cuenta corriente o vista',
      icon: CreditCard,
      completed: !!(profile?.company?.bank_account_info && profile?.company?.mercadopago_beneficiary_id),
      required: true
    },
    {
      id: 'certificado_vigencia',
      title: 'Certificado de Vigencia',
      description: 'Documento que certifica existencia legal',
      icon: FileText,
      completed: !!verification?.certificado_vigencia_url,
      required: true
    },
    {
      id: 'informe_equifax',
      title: 'Informe Equifax',
      description: 'Análisis crediticio empresarial',
      icon: TrendingUp,
      completed: !!verification?.informe_equifax_url,
      required: true
    }
  ];

  // Calcular progreso
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Determinar estado general
  const getOverallStatus = () => {
    if (completedSteps === 0) return { text: 'Sin iniciar', color: 'gray' };
    if (completedSteps === totalSteps) return { text: 'Completado', color: 'green' };
    return { text: 'En progreso', color: 'blue' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Progreso de Verificación
          </h3>
          <p className="text-gray-600">
            Completa los 3 pasos para verificar tu empresa
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {completedSteps}/{totalSteps}
          </div>
          <div className={`text-sm font-semibold text-${overallStatus.color}-600`}>
            {overallStatus.text}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0%</span>
          <span>{Math.round(progressPercentage)}% completado</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              overallStatus.color === 'green'
                ? 'bg-green-500'
                : overallStatus.color === 'blue'
                ? 'bg-blue-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Pasos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isCompleted = step.completed;
          const isCurrent = !isCompleted && (
            index === 0 ||
            (index > 0 && steps[index - 1].completed)
          );

          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Conector entre pasos (solo en desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-300 transform -translate-y-1/2 z-0" />
              )}

              <div className="flex items-start gap-3 relative z-10">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  isCompleted
                    ? 'bg-green-100'
                    : isCurrent
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <IconComponent className={`w-5 h-5 ${
                      isCurrent ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm mb-1 ${
                    isCompleted
                      ? 'text-green-900'
                      : isCurrent
                      ? 'text-blue-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                      ? 'text-blue-700'
                      : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>

                  {isCompleted && (
                    <div className="mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        Completado
                      </span>
                    </div>
                  )}

                  {isCurrent && !isCompleted && (
                    <div className="mt-2 flex items-center gap-1">
                      <Circle className="w-3 h-3 text-blue-500 fill-current" />
                      <span className="text-xs font-medium text-blue-600">
                        Pendiente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje motivacional */}
      {completedSteps === totalSteps && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">¡Felicitaciones!</p>
              <p className="text-sm text-green-700">
                Has completado todos los pasos de verificación. Tu empresa está lista para operar.
              </p>
            </div>
          </div>
        </div>
      )}

      {completedSteps === 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Circle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Comienza tu verificación</p>
              <p className="text-sm text-blue-700">
                El primer paso es configurar tu cuenta bancaria para recibir transferencias automáticas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationProgress;