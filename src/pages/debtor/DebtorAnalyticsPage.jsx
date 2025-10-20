/**
 * Debtor Analytics Page
 *
 * Página dedicada para analytics avanzados del deudor
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, Button } from '../../components/common';
import { useDebtorAnalytics } from '../../hooks/useDebtorAnalytics';
import FinancialMetricsCard from '../../components/debtor/FinancialMetricsCard';
import PaymentPredictionsCard from '../../components/debtor/PaymentPredictionsCard';
import ProgressGoalsCard from '../../components/debtor/ProgressGoalsCard';
import InteractiveChartsCard from '../../components/debtor/InteractiveChartsCard';
import DebtorNavigationMenu from '../../components/debtor/DebtorNavigationMenu';
import {
  Brain,
  ArrowLeft,
  Settings,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

const DebtorAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Analytics avanzados
  const {
    financialMetrics,
    paymentPredictions,
    behavioralAnalysis,
    progressMetrics,
    visualizationData,
    loading: analyticsLoading,
    error: analyticsError,
    lastUpdated: analyticsLastUpdated,
    derivedMetrics,
    loadAllData,
    refreshData
  } = useDebtorAnalytics(user?.id, {
    enableRealTime: true,
    autoRefresh: true,
    refreshInterval: 30000
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  if (!user) {
    return <LoadingSpinner fullScreen text="Cargando..." />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Menu */}
      <DebtorNavigationMenu />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              🧠 Analytics Avanzados
            </h1>
            <p className="text-secondary-600 text-sm">
              Análisis predictivo e inteligencia financiera personalizada
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analyticsLastUpdated && (
            <span className="text-xs text-gray-500">
              Actualizado: {analyticsLastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadAllData()}
            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
            disabled={analyticsLoading}
          >
            <Settings className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Metrics */}
        <FinancialMetricsCard
          financialMetrics={financialMetrics}
          loading={analyticsLoading.financial}
          onRefresh={() => refreshData('financial')}
          lastUpdated={analyticsLastUpdated}
        />

        {/* Payment Predictions */}
        <PaymentPredictionsCard
          paymentPredictions={paymentPredictions}
          loading={analyticsLoading.predictions}
          onRefresh={() => refreshData('predictions')}
          behavioralAnalysis={behavioralAnalysis}
        />

        {/* Progress Goals */}
        <ProgressGoalsCard
          progressMetrics={progressMetrics}
          loading={analyticsLoading.progress}
          onRefresh={() => refreshData('progress')}
          onMilestoneComplete={(milestone) => {
            console.log('Milestone completed:', milestone);
          }}
        />

        {/* Interactive Charts */}
        <InteractiveChartsCard
          visualizationData={visualizationData}
          loading={analyticsLoading.visualization}
          onRefresh={() => refreshData('visualization')}
          onExport={(chartType, data, timeRange) => {
            console.log('Exporting chart:', chartType, data, timeRange);
          }}
          userId={user?.id}
        />
      </div>

      {/* Analytics Error */}
      {analyticsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Error en Analytics</h3>
              <p className="text-red-700 text-sm">{analyticsError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorAnalyticsPage;