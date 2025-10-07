/**
 * useAdvancedSearch Hook
 *
 * Hook personalizado para búsqueda y filtros avanzados
 * Soporta búsqueda por texto, filtros múltiples y ordenamiento
 */

import { useState, useMemo } from 'react';

export const useAdvancedSearch = (items = [], searchConfig = {}) => {
  const {
    searchFields = [], // Campos donde buscar texto
    filterFields = [], // Campos que se pueden filtrar
    sortFields = [],   // Campos que se pueden ordenar
    defaultSort = { field: 'created_at', order: 'desc' }
  } = searchConfig;

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(defaultSort.field);
  const [sortOrder, setSortOrder] = useState(defaultSort.order);

  // Función para actualizar filtros
  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  // Función para cambiar ordenamiento
  const toggleSort = (field) => {
    if (sortBy === field) {
      // Cambiar dirección si es el mismo campo
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, usar ordenamiento por defecto
      setSortBy(field);
      setSortOrder(defaultSort.order);
    }
  };

  // Items filtrados y ordenados
  const processedItems = useMemo(() => {
    let result = [...items];

    // Aplicar búsqueda de texto
    if (searchTerm && searchFields.length > 0) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Aplicar filtros
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = item[field];

          // Manejar diferentes tipos de filtros
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }

          if (typeof value === 'object' && value !== null) {
            // Rango de fechas o números
            if (value.min !== undefined && itemValue < value.min) return false;
            if (value.max !== undefined && itemValue > value.max) return false;
            return true;
          }

          // Comparación exacta o parcial
          if (typeof itemValue === 'string' && typeof value === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }

          return itemValue === value;
        });
      }
    });

    // Aplicar ordenamiento
    if (sortBy && sortFields.includes(sortBy)) {
      result.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        // Manejar valores null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortOrder === 'asc' ? -1 : 1;
        if (bVal == null) return sortOrder === 'asc' ? 1 : -1;

        // Convertir strings a lowercase para comparación
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        // Comparación
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, filters, sortBy, sortOrder, searchFields, filterFields, sortFields]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: items.length,
    filtered: processedItems.length,
    hasFilters: Object.keys(filters).length > 0 || searchTerm.length > 0
  }), [items.length, processedItems.length, filters, searchTerm]);

  return {
    // Datos
    items: processedItems,
    stats,

    // Controles de búsqueda
    searchTerm,
    setSearchTerm,

    // Controles de filtros
    filters,
    updateFilter,
    clearFilters,

    // Controles de ordenamiento
    sortBy,
    sortOrder,
    toggleSort,
    setSortBy,
    setSortOrder,
  };
};

export default useAdvancedSearch;