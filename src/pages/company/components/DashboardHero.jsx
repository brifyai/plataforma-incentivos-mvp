/**
 * Dashboard Hero Section Component
 * Displays the main header with company info and date filter
 */

import React from 'react';
import { Card, DateFilter } from '../../../components/common';
import {
  BarChart3,
} from 'lucide-react';

const DashboardHero = ({ profile, dateFilter, onDateFilterChange }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-strong border border-slate-200">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32" />
        <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 md:translate-y-24 -translate-x-12 md:-translate-x-24" />
      </div>

      <div className="relative">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-4 lg:mb-6">
          {/* Left side - Title and description */}
          <div className="flex items-center gap-3 md:gap-6">
            <div className="p-3 md:p-4 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/30">
              <BarChart3 className="w-6 h-6 md:w-10 md:h-10 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight text-white mb-1 md:mb-2">
                Panel de Control
              </h1>
              {profile?.company?.business_name && (
                <p className="text-purple-200 font-semibold text-sm md:text-lg mt-1 truncate">
                  {profile.company.business_name}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Date Filter */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm w-full lg:min-w-fit">
            <DateFilter
              onFilterChange={onDateFilterChange}
              className="mb-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;