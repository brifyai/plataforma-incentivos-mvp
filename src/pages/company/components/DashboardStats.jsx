/**
 * Dashboard Statistics Cards Component
 * Displays key metrics in card format
 */

import React from 'react';
import { Card, Badge } from '../../../components/common';
import { formatCurrency } from '../../../utils/formatters';
import {
  Building,
  Users,
  FileText,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const DashboardStats = ({ stats, analytics }) => {
  return (
    <>
      {/* Main Stats Cards - Mobile: 2 columns, Tablet: 3, Desktop: 5 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        {/* Total Clientes */}
        <Card padding={false} className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-purple-500 rounded-lg">
                <Building className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="p-1 bg-green-100 rounded-full">
                <ArrowUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-purple-700 mb-1">Total Clientes</p>
            <p className="text-lg md:text-2xl font-bold text-purple-800">
              {stats?.totalClients || 0}
            </p>
          </div>
        </Card>

        {/* Total Deudores */}
        <Card padding={false} className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-blue-500 rounded-lg">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="p-1 bg-blue-100 rounded-full">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-blue-700 mb-1">Total Deudores</p>
            <p className="text-lg md:text-2xl font-bold text-blue-800">
              {stats?.totalDebtors || 0}
            </p>
          </div>
        </Card>

        {/* Total Deudas */}
        <Card padding={false} className="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-red-500 rounded-lg">
                <FileText className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="p-1 bg-orange-100 rounded-full">
                <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-red-700 mb-1">Deudas Registradas</p>
            <p className="text-sm md:text-2xl font-bold text-red-800">
              {formatCurrency(stats?.totalDebtAmount || 0)}
            </p>
          </div>
        </Card>

        {/* Total Recuperado */}
        <Card padding={false} className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-emerald-500 rounded-lg">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="p-1 bg-green-100 rounded-full">
                <ArrowUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-emerald-700 mb-1">Total Recuperado</p>
            <p className="text-sm md:text-2xl font-bold text-emerald-800">
              {formatCurrency(stats?.totalRecovered || 0)}
            </p>
          </div>
        </Card>

        {/* Tasa de Recuperación */}
        <Card
          padding={false}
          className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border border-amber-300 shadow-sm hover:shadow-lg transition-all duration-300 col-span-2 md:col-span-3 lg:col-span-1"
        >
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-white bg-opacity-20 rounded-lg">
                <Target className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="p-1 bg-white bg-opacity-20 rounded-full">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
            </div>
            <p className="text-xs md:text-sm text-amber-100 mb-1">Tasa de Recuperación</p>
            <p className="text-lg md:text-2xl font-bold">
              {((stats?.recoveryRate || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Analytics Statistics Section */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Ingresos Totales</p>
                <p className="text-2xl font-bold">
                  ${analytics.totalRevenue?.toLocaleString('es-CL') || '0'}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Clientes Activos</p>
                <p className="text-2xl font-bold">{analytics.totalClients || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Deudores Gestionados</p>
                <p className="text-2xl font-bold">{analytics.totalDebtors || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Tasa de Recuperación</p>
                <p className="text-2xl font-bold">{analytics.recoveryRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default DashboardStats;