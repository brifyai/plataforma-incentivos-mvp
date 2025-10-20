/**
 * Componentes decorativos reutilizables para fondos
 * Separa la lógica visual compleja del componente principal
 */

export const AuthBackgroundDecorations = () => (
  <>
    {/* Elementos decorativos de fondo */}
    <div className="absolute inset-0 bg-black/10"></div>
    <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
  </>
);

export const AuthStatsCard = () => (
  <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
    <div className="grid grid-cols-2 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold">50%</div>
        <div className="text-sm text-blue-100">Comisión</div>
      </div>
      <div>
        <div className="text-2xl font-bold">24/7</div>
        <div className="text-sm text-blue-100">Disponible</div>
      </div>
    </div>
  </div>
);

export const AuthBenefitsList = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">
      ¡Bienvenido de vuelta!
    </h2>

    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-blue-200" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">100% Seguro</h3>
          <p className="text-blue-100 text-sm">
            Tus datos personales nunca se comparten con empresas de cobranza
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-blue-200" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">Proceso Rápido</h3>
          <p className="text-blue-100 text-sm">
            Acuerdos en minutos, pagos en tiempo real
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-blue-200" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">50% de Comisión</h3>
          <p className="text-blue-100 text-sm">
            Recibe el 50% del valor acordado cuando completes un pago
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Necesitamos importar los iconos que se usan
import { Shield, Zap, Heart } from 'lucide-react';