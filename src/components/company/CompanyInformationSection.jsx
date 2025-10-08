/**
 * Company Information Section
 *
 * Sección que agrupa toda la información corporativa básica
 */

import { Card, Input, Button } from '../common';
import { Building, User, Mail, Phone, Edit, Save, X } from 'lucide-react';

const CompanyInformationSection = ({
  formData,
  isEditing,
  onFormDataChange,
  onEditToggle,
  onSave,
  loading,
  isGodMode
}) => {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Información Corporativa</h2>
            <p className="text-gray-600">Datos básicos de tu empresa y representante legal</p>
          </div>
        </div>

        {!isGodMode && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => onEditToggle(false)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={onSave}
                  loading={loading}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => onEditToggle(true)}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {!isGodMode && (
        <>
          {/* Company Information Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Datos de la Empresa</h3>
                <p className="text-gray-600">Información legal y comercial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.company_name || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">RUT de la Empresa</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.company_rut || 'No especificado'}</span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Tipo de Empresa</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">
                    {formData.company_type === 'direct_creditor' ? '🏢 Acreedor Directo' :
                     formData.company_type === 'collection_agency' ? '📊 Empresa de Cobranza' :
                     'No especificado'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Representative Information Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Representante Legal</h3>
                <p className="text-gray-600">Datos del representante autorizado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.full_name || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">RUT del Representante</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.representative_rut || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email Corporativo</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => onFormDataChange({...formData, contact_email: e.target.value})}
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder="email@empresa.com"
                    className="bg-white/50"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.contact_email || 'No especificado'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Teléfono de Contacto</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => onFormDataChange({...formData, contact_phone: e.target.value})}
                    leftIcon={<Phone className="w-4 h-4" />}
                    placeholder="+56 9 1234 5678"
                    className="bg-white/50"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.contact_phone || 'No especificado'}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {isGodMode && (
        /* Admin Information Card */
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Información del Administrador</h3>
              <p className="text-gray-600">Detalles del administrador del sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{formData.full_name || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{formData.contact_email || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{formData.contact_phone || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">RUT</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{formData.rut || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CompanyInformationSection;