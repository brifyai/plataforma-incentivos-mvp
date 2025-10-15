import React from 'react';
import { Card } from '../common';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ isConnected, connectionType = 'websocket' }) => {
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        text: 'Conectado',
        subtext: connectionType === 'websocket' ? 'Conexión en tiempo real activa' : 'Conexión estable'
      };
    } else {
      return {
        icon: WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        text: 'Desconectado',
        subtext: connectionType === 'websocket' ? 'Intentando reconectar...' : 'Verificando conexión'
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <div className="flex items-center gap-3 p-3">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${config.color}`}>
              {config.text}
            </span>
            {!isConnected && (
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            )}
          </div>
          <p className="text-sm text-gray-600">{config.subtext}</p>
        </div>
      </div>
    </Card>
  );
};

export default ConnectionStatus;