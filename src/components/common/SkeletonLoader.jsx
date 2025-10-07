/**
 * Skeleton Loader Components
 *
 * Componentes de carga que simulan el contenido real
 */

import React from 'react';

export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white rounded-lg shadow-soft p-6 animate-pulse ${className}`}>
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-secondary-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
        <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
        <div className="h-3 bg-secondary-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-soft overflow-hidden animate-pulse">
    {/* Header */}
    <div className="border-b border-secondary-100 p-4">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-secondary-200 rounded flex-1"></div>
        ))}
      </div>
    </div>

    {/* Rows */}
    <div className="divide-y divide-secondary-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-3 bg-secondary-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-3 bg-secondary-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-secondary-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonForm = () => (
  <div className="bg-white rounded-lg shadow-soft p-6 animate-pulse space-y-6">
    <div>
      <div className="h-4 bg-secondary-200 rounded w-24 mb-2"></div>
      <div className="h-10 bg-secondary-200 rounded"></div>
    </div>

    <div>
      <div className="h-4 bg-secondary-200 rounded w-32 mb-2"></div>
      <div className="h-10 bg-secondary-200 rounded"></div>
    </div>

    <div>
      <div className="h-4 bg-secondary-200 rounded w-28 mb-2"></div>
      <div className="h-24 bg-secondary-200 rounded"></div>
    </div>

    <div className="flex gap-3">
      <div className="h-10 bg-secondary-200 rounded flex-1"></div>
      <div className="h-10 bg-secondary-200 rounded w-24"></div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 3 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-soft p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-secondary-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
            <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-secondary-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

// Skeleton específico para dashboard
export const SkeletonDashboard = () => (
  <div className="space-y-6 animate-pulse">
    {/* Welcome section */}
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
      <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
      <div className="h-4 bg-white/20 rounded w-96"></div>
    </div>

    {/* Stats */}
    <SkeletonStats count={4} />

    {/* Recent activity */}
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="h-6 bg-secondary-200 rounded w-48 mb-4"></div>
      <SkeletonList items={4} />
    </div>
  </div>
);

export default {
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonForm,
  SkeletonList,
  SkeletonDashboard,
};