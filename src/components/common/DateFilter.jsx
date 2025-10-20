/**
 * DateFilter Component - Filtros de fecha reutilizables
 *
 * Componente reutilizable para filtros de fecha con botones rápidos
 */

import React, { useState } from 'react';
import Button from './Button';
import { Calendar } from 'lucide-react';

const DateFilter = ({ onFilterChange, className = '' }) => {
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [quickFilter, setQuickFilter] = useState('');

  // Función para aplicar filtros rápidos
  const applyQuickFilter = (filterType) => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0]; // Hoy en formato YYYY-MM-DD

    switch (filterType) {
      case 'today':
        startDate = endDate; // Desde hoy hasta hoy
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      default:
        startDate = '';
        endDate = '';
    }

    const newFilter = { startDate, endDate };
    setDateFilter(newFilter);
    setQuickFilter(filterType);
    onFilterChange(newFilter);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    const emptyFilter = { startDate: '', endDate: '' };
    setDateFilter(emptyFilter);
    setQuickFilter('');
    onFilterChange(emptyFilter);
  };

  // Función para manejar cambios manuales en fechas
  const handleManualDateChange = (field, value) => {
    const newFilter = { ...dateFilter, [field]: value };
    setDateFilter(newFilter);
    setQuickFilter(''); // Clear quick filter when manual date is selected
    onFilterChange(newFilter);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Single Line Filter - Everything inline */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary-500 flex-shrink-0" />
          <span className="text-sm font-medium text-secondary-700 whitespace-nowrap">Filtrar:</span>
        </div>

        {/* Quick Filter Buttons */}
        <Button
          variant={quickFilter === 'today' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => applyQuickFilter('today')}
          className="text-xs px-3 py-1"
        >
          Hoy
        </Button>
        <Button
          variant={quickFilter === 'week' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => applyQuickFilter('week')}
          className="text-xs px-3 py-1"
        >
          Semana
        </Button>
        <Button
          variant={quickFilter === 'month' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => applyQuickFilter('month')}
          className="text-xs px-3 py-1"
        >
          Mes
        </Button>

        {/* Custom Date Range - All inline */}
        <span className="text-sm font-medium text-secondary-700 whitespace-nowrap">Rango:</span>

        <div className="flex items-center gap-2">
          <label htmlFor="startDate" className="text-sm text-secondary-600 whitespace-nowrap">Desde:</label>
          <input
            id="startDate"
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => handleManualDateChange('startDate', e.target.value)}
            className="px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm min-w-[120px] text-black"
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="endDate" className="text-sm text-secondary-600 whitespace-nowrap">Hasta:</label>
          <input
            id="endDate"
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => handleManualDateChange('endDate', e.target.value)}
            className="px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm min-w-[120px] text-black"
            placeholder="dd/mm/aaaa"
          />
        </div>

        {/* Clear button */}
        {(dateFilter.startDate || dateFilter.endDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-secondary-600 hover:text-secondary-800 text-xs px-3 py-1"
          >
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateFilter;