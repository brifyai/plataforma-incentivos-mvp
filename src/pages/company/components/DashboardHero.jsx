/**
 * DashboardHero Component
 *
 * Hero section for company dashboard with key metrics and welcome message
 */

import React from 'react';
import { Card, Badge } from '../../../components/common';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react';

const DashboardHero = ({ profile, dateFilter, onDateFilterChange, stats, analytics }) => {
  const company = profile?.company;

  // Use real data from props, with fallbacks
  const realStats = stats || {};
  const realAnalytics = analytics || {};

  // Calculate derived metrics from real data
  const heroStats = {
    totalClients: realStats.totalClients || 0,
    activeDebts: realStats.totalDebts || 0,
    totalRevenue: realStats.totalRecovered || 0,
    monthlyGrowth: realAnalytics.monthlyGrowth || 0,
    pendingPayments: realStats.pendingPayments || 0,
    successRate: realStats.recoveryRate || 0
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                ¡Bienvenido, {company?.business_name || profile?.full_name}!
              </h1>
              <p className="text-blue-100 text-base">
                Gestiona tus deudas y maximiza tus ingresos con NexuPay
              </p>
            </div>
            <div className="hidden md:block">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Award className="w-4 h-4 mr-1" />
                Empresa Verificada
              </Badge>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">{heroStats.totalClients}</p>
                  <p className="text-xs text-blue-100">Clientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">{heroStats.activeDebts}</p>
                  <p className="text-xs text-blue-100">Deudas Activas</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">${heroStats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-blue-100">Ingresos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">+{heroStats.monthlyGrowth}%</p>
                  <p className="text-xs text-blue-100">Crecimiento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => onDateFilterChange({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => onDateFilterChange({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;