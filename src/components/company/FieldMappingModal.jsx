/**
 * Field Mapping Modal Component
 * 
 * Modal de mapeo de campos usando SweetAlert2 para evitar problemas de z-index
 * 
 * @module FieldMappingModal
 */

import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { CheckCircle } from 'lucide-react';

const FieldMappingModal = ({
  isOpen,
  onClose,
  fieldMapping,
  setFieldMapping,
  requiredFields,
  parsedData
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const showFieldMappingModal = async () => {
      // Generar HTML para los campos de mapeo
      const fieldsHtml = requiredFields.map((field) => {
        const currentValue = fieldMapping[field.key] || '';
        const columns = Object.keys(parsedData[0] || {});
        
        const optionsHtml = [
          '<option value="">No mapear</option>',
          ...columns.map(col => 
            `<option value="${col}" ${currentValue === col ? 'selected' : ''}>${col}</option>`
          )
        ].join('');

        const iconHtml = field.icon 
          ? `<div class="flex items-center gap-2 mb-2">
               <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                       d="${getIconPath(field.icon)}"/>
               </svg>
               <label class="text-sm font-medium text-gray-700">
                 ${field.label}
                 ${field.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
               </label>
               <span class="ml-2 px-2 py-1 text-xs rounded-full ${
                 field.type === 'currency' 
                   ? 'bg-green-100 text-green-800' 
                   : 'bg-blue-100 text-blue-800'
               }">
                 ${field.type}
               </span>
             </div>`
          : `<label class="block text-sm font-medium text-gray-700 mb-2">
               ${field.label}
               ${field.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
             </label>`;

        return `
          <div class="mb-4">
            ${iconHtml}
            <select 
              id="field-${field.key}" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-field="${field.key}"
            >
              ${optionsHtml}
            </select>
          </div>
        `;
      }).join('');

      const result = await Swal.fire({
        title: '🔧 Mapeo de Campos',
        html: `
          <div class="text-left">
            <p class="text-sm text-gray-600 mb-4">
              Asocia las columnas de tu archivo con los campos del sistema.
            </p>
            
            <div class="space-y-2 max-h-96 overflow-y-auto">
              ${fieldsHtml}
            </div>

            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-blue-900 mb-1">Mapeo Inteligente</h4>
                  <p class="text-sm text-blue-700">
                    El sistema ha detectado automáticamente las columnas más probables.
                    Revisa y ajusta el mapeo según sea necesario.
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Aplicar Mapeo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        didOpen: () => {
          // Agregar event listeners a los selects
          requiredFields.forEach((field) => {
            const selectElement = document.getElementById(`field-${field.key}`);
            if (selectElement) {
              selectElement.addEventListener('change', (e) => {
                setFieldMapping(prev => ({
                  ...prev,
                  [field.key]: e.target.value
                }));
              });
            }
          });
        },
        preConfirm: () => {
          // Recopilar valores de todos los selects
          const newMapping = {};
          requiredFields.forEach((field) => {
            const selectElement = document.getElementById(`field-${field.key}`);
            if (selectElement) {
              newMapping[field.key] = selectElement.value;
            }
          });
          
          // Actualizar el estado con el nuevo mapeo
          setFieldMapping(newMapping);
          
          return newMapping;
        }
      });

      if (result.isConfirmed) {
        console.log('✅ Mapeo de campos aplicado:', result.value);
      } else {
        console.log('❌ Mapeo de campos cancelado');
      }
      
      onClose();
    };

    showFieldMappingModal();
  }, [isOpen, onClose, fieldMapping, setFieldMapping, requiredFields, parsedData]);

  // Función para obtener el path del icono de Lucide
  const getIconPath = (iconName) => {
    const iconPaths = {
      Shield: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
      Users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
      FileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8',
      TrendingUp: 'M3 17l6-6 4 4 8-8',
      Clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      Building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      Filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
      BarChart3: 'M3 3v18h18M9 17V9M13 17V5M17 17v-3'
    };
    
    return iconPaths[iconName] || iconPaths.FileText;
  };

  return null; // Este componente no renderiza nada, solo maneja el modal de SweetAlert
};

export default FieldMappingModal;