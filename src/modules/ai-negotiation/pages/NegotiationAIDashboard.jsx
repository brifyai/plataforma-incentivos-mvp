import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../../../components/common';

/**
 * Dashboard de IA para Negociación
 * 
 * Componente seguro que muestra métricas y control del sistema de IA
 */
const NegotiationAIDashboard = () => {
  const [stats, setStats] = useState({
    activeNegotiations: 0,
    aiSuccessRate: 0,
    escalations: 0,
    avgResolutionTime: 0
  });
  
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadDashboardData = async () => {
      try {
        // Aquí iría la lógica real de carga de datos
        setStats({
          activeNegotiations: 12,
          aiSuccessRate: 85,
          escalations: 3,
          avgResolutionTime: 2.5
        });
        
        setNegotiations([
          {
            id: 1,
            debtorName: 'Juan Pérez',
            proposalId: 'PROP-001',
            status: 'active',
            aiActive: true,
            lastMessage: 'Hace 5 minutos',
            progress: 65
          },
          {
            id: 2,
            debtorName: 'María García',
            proposalId: 'PROP-002',
            status: 'escalated',
            aiActive: false,
            lastMessage: 'Hace 15 minutos',
            progress: 40
          }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negociaciones Activas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeNegotiations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Éxito IA</p>
              <p className="text-2xl font-bold text-green-600">{stats.aiSuccessRate}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Escaladas a Humano</p>
              <p className="text-2xl font-bold text-orange-600">{stats.escalations}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgResolutionTime}h</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Negociaciones */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conversaciones de Negociación Activas</h3>
          
          <div className="space-y-4">
            {negotiations.map(negotiation => (
              <div key={negotiation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{negotiation.debtorName}</h4>
                      <Badge 
                        variant={negotiation.aiActive ? 'success' : 'warning'}
                      >
                        {negotiation.aiActive ? 'IA Activa' : 'Escalado'}
                      </Badge>
                      <span className="text-sm text-gray-500">{negotiation.proposalId}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Último mensaje: {negotiation.lastMessage}</span>
                      <div className="flex items-center gap-2">
                        <span>Progreso:</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${negotiation.progress}%` }}
                          ></div>
                        </div>
                        <span>{negotiation.progress}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    {negotiation.aiActive && (
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Pausar IA
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {negotiations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay negociaciones activas en este momento
            </div>
          )}
        </div>
      </Card>

      {/* Controles Rápidos */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Controles Rápidos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reiniciar Sistema IA
            </Button>
            
            <Button variant="outline" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Analytics
            </Button>
            
            <Button variant="outline" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NegotiationAIDashboard;