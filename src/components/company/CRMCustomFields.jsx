/**
 * CRM Custom Fields Management Component
 *
 * Componente para gestionar campos personalizados del CRM
 * Permite mapear campos específicos del CRM a campos de la plataforma
 *
 * @module CRMCustomFields
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, Badge } from '../common';
import Swal from 'sweetalert2';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
  Database
} from 'lucide-react';

const CRMCustomFields = ({ profile, crmConfig, onUpdate }) => {
  const [customFields, setCustomFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(false);

  // Campos disponibles en la plataforma
  const platformFields = [
    { key: 'debt_amount', label: 'Monto de Deuda', type: 'currency', required: true },
    { key: 'due_date', label: 'Fecha de Vencimiento', type: 'date', required: true },
    { key: 'creditor_name', label: 'Nombre del Acreedor', type: 'text', required: true },
    { key: 'debt_description', label: 'Descripción de Deuda', type: 'text', required: false },
    { key: 'interest_rate', label: 'Tasa de Interés', type: 'percentage', required: false },
    { key: 'penalty_amount', label: 'Monto de Penalización', type: 'currency', required: false },
    { key: 'payment_terms', label: 'Términos de Pago', type: 'text', required: false },
    { key: 'collection_status', label: 'Estado de Cobranza', type: 'select', required: false },
    { key: 'last_payment_date', label: 'Último Pago', type: 'date', required: false },
    { key: 'contact_frequency', label: 'Frecuencia de Contacto', type: 'select', required: false },
    { key: 'risk_level', label: 'Nivel de Riesgo', type: 'select', required: false },
    { key: 'assigned_agent', label: 'Agente Asignado', type: 'text', required: false },
    { key: 'collection_strategy', label: 'Estrategia de Cobranza', type: 'text', required: false }
  ];

  // Cargar campos personalizados al montar
  useEffect(() => {
    if (profile?.company?.id && crmConfig?.provider) {
      loadCustomFields();
    }
  }, [profile?.company?.id, crmConfig?.provider]);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      // Aquí iría la lógica para cargar campos personalizados desde la base de datos
      // Por ahora usamos datos de ejemplo
      setCustomFields([
        {
          id: '1',
          platformField: 'debt_amount',
          crmField: 'custom_debt_total',
          fieldType: 'currency',
          isRequired: true,
          transformation: 'multiply:1.15', // Agregar 15% por intereses
          description: 'Monto total incluyendo intereses'
        },
        {
          id: '2',
          platformField: 'collection_status',
          crmField: 'debt_status_custom',
          fieldType: 'select',
          isRequired: false,
          transformation: 'map:activo=active,inactivo=inactive,moroso=overdue',
          description: 'Estado personalizado de cobranza'
        }
      ]);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setEditingField({
      platformField: '',
      crmField: '',
      fieldType: 'text',
      isRequired: false,
      transformation: '',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEditField = (field) => {
    setEditingField({ ...field });
    setShowAddModal(true);
  };

  const handleDeleteField = async (fieldId) => {
    const result = await Swal.fire({
      title: '¿Eliminar Campo?',
      text: '¿Estás seguro de que deseas eliminar este mapeo de campo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      // Aquí iría la lógica para eliminar el campo de la base de datos
      setCustomFields(prev => prev.filter(f => f.id !== fieldId));
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Campo personalizado eliminado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10B981',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al eliminar el campo personalizado',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const handleSaveField = async () => {
    try {
      if (!editingField.platformField || !editingField.crmField) {
        await Swal.fire({
          icon: 'error',
          title: 'Campos Requeridos',
          text: 'Debes seleccionar un campo de plataforma y especificar el campo del CRM',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      const fieldData = {
        ...editingField,
        id: editingField.id || Date.now().toString(),
        companyId: profile.company.id,
        crmProvider: crmConfig.provider
      };

      // Aquí iría la lógica para guardar en la base de datos
      if (editingField.id) {
        // Actualizar campo existente
        setCustomFields(prev => prev.map(f =>
          f.id === editingField.id ? fieldData : f
        ));
      } else {
        // Agregar nuevo campo
        setCustomFields(prev => [...prev, fieldData]);
      }

      setShowAddModal(false);
      setEditingField(null);
      await Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Campo personalizado guardado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10B981',
        timer: 2000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Error saving custom field:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al guardar el campo personalizado',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case 'currency': return '💰';
      case 'date': return '📅';
      case 'percentage': return '%';
      case 'select': return '📋';
      default: return '📝';
    }
  };

  const getPlatformFieldLabel = (key) => {
    const field = platformFields.find(f => f.key === key);
    return field ? field.label : key;
  };

  if (!crmConfig?.provider) {
    return (
      <div className="mb-8">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl inline-block mb-4">
              <Database className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Campos Personalizados
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Configura primero tu integración CRM para gestionar campos personalizados.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Campos Personalizados CRM
              </h2>
              <p className="text-gray-600">
                Mapea campos específicos de {crmConfig.provider} a campos de la plataforma
              </p>
            </div>
          </div>

          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={isEditing ? <CheckCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          >
            {isEditing ? 'Finalizar' : 'Gestionar'}
          </Button>
        </div>

        {/* Lista de campos personalizados */}
        <div className="space-y-4 mb-6">
          {customFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl inline-block mb-6">
                <MapPin className="w-16 h-16 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No hay campos personalizados
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Agrega mapeos de campos para personalizar cómo se importan los datos de tu CRM.
              </p>
              {isEditing && (
                <Button
                  variant="primary"
                  onClick={handleAddField}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar Primer Campo
                </Button>
              )}
            </div>
          ) : (
            customFields.map((field) => (
              <div key={field.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getFieldTypeIcon(field.fieldType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {getPlatformFieldLabel(field.platformField)}
                        </h3>
                        {field.isRequired && (
                          <Badge variant="danger" size="sm">Requerido</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Campo CRM: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{field.crmField}</code>
                      </p>
                      {field.description && (
                        <p className="text-sm text-gray-700">{field.description}</p>
                      )}
                      {field.transformation && (
                        <p className="text-xs text-blue-600 mt-1">
                          Transformación: {field.transformation}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditField(field)}
                        leftIcon={<Edit className="w-4 h-4" />}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteField(field.id)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón para agregar campo */}
        {isEditing && customFields.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleAddField}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Agregar Campo Personalizado
            </Button>
          </div>
        )}

        {/* Información sobre campos estándar */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Campos Estándar Automáticamente Mapeados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                <div>• RUT → rut</div>
                <div>• Email → email</div>
                <div>• Nombre → full_name</div>
                <div>• Teléfono → phone</div>
                <div>• Dirección → address</div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Estos campos se mapean automáticamente. Los campos personalizados son para datos específicos de tu CRM.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal para agregar/editar campo */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingField(null);
        }}
        title={editingField?.id ? 'Editar Campo Personalizado' : 'Agregar Campo Personalizado'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campo de Plataforma
              </label>
              <Select
                value={editingField?.platformField || ''}
                onChange={(value) => setEditingField(prev => ({ ...prev, platformField: value }))}
                options={[
                  { value: '', label: 'Seleccionar campo...' },
                  ...platformFields.map(field => ({
                    value: field.key,
                    label: `${getFieldTypeIcon(field.type)} ${field.label}${field.required ? ' *' : ''}`
                  }))
                ]}
              />
            </div>

            <Input
              label="Campo del CRM"
              value={editingField?.crmField || ''}
              onChange={(e) => setEditingField(prev => ({ ...prev, crmField: e.target.value }))}
              placeholder="Ej: custom_debt_field"
              helperText="Nombre exacto del campo en tu CRM"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Dato
              </label>
              <Select
                value={editingField?.fieldType || 'text'}
                onChange={(value) => setEditingField(prev => ({ ...prev, fieldType: value }))}
                options={[
                  { value: 'text', label: '📝 Texto' },
                  { value: 'currency', label: '💰 Moneda' },
                  { value: 'date', label: '📅 Fecha' },
                  { value: 'percentage', label: '% Porcentaje' },
                  { value: 'select', label: '📋 Selección' },
                  { value: 'number', label: '🔢 Número' }
                ]}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="isRequired"
                checked={editingField?.isRequired || false}
                onChange={(e) => setEditingField(prev => ({ ...prev, isRequired: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
                Campo requerido
              </label>
            </div>
          </div>

          <Input
            label="Transformación (Opcional)"
            value={editingField?.transformation || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev, transformation: e.target.value }))}
            placeholder="Ej: multiply:1.15 o map:activo=active"
            helperText="Reglas para transformar los datos (multiply:X, add:X, map:value1=newvalue1,value2=newvalue2)"
          />

          <Input
            label="Descripción"
            value={editingField?.description || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe para qué se usa este campo"
            helperText="Ayuda a otros usuarios a entender el propósito de este mapeo"
          />

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Transformaciones Disponibles</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><code>multiply:X</code> - Multiplica por X (ej: multiply:1.15)</div>
                  <div><code>add:X</code> - Suma X (ej: add:1000)</div>
                  <div><code>map:value1=newvalue1,value2=newvalue2</code> - Mapea valores</div>
                  <div><code>date:format</code> - Convierte formato de fecha</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingField(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveField}
              className="flex-1"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {editingField?.id ? 'Actualizar Campo' : 'Guardar Campo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CRMCustomFields;