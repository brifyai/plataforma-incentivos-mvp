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
    <div className="space-y-4 mb-6">
      {!isGodMode && (
        <>
          {/* Company Information Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Datos de la Empresa</h3>
                  <p className="text-xs text-gray-600">Información legal y comercial</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onEditToggle(false)}
                      disabled={loading}
                      className="flex items-center gap-1 px-2 py-1 text-xs"
                    >
                      <X className="w-3 h-3" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </Button>
                    <Button
                      variant="primary"
                      onClick={onSave}
                      loading={loading}
                      disabled={loading}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Save className="w-3 h-3" />
                      <span className="hidden sm:inline">Guardar</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => onEditToggle(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Nombre de la Empresa</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">{formData.company_name || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">RUT de la Empresa</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">{formData.company_rut || 'No especificado'}</span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Tipo de Empresa</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">
                    {formData.company_type === 'direct_creditor' ? '🏢 Acreedor Directo' :
                     formData.company_type === 'collection_agency' ? '📊 Empresa de Cobranza' :
                     'No especificado'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Representative Information Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Representante Legal</h3>
                <p className="text-xs text-gray-600">Datos del representante autorizado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Nombre Completo</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">{formData.full_name || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">RUT del Representante</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">{formData.representative_rut || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Email Corporativo</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => onFormDataChange({...formData, contact_email: e.target.value})}
                    leftIcon={<Mail className="w-3.5 h-3.5" />}
                    placeholder="email@empresa.com"
                    className="bg-white/50 text-xs py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">{formData.contact_email || 'No especificado'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Teléfono de Contacto</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => onFormDataChange({...formData, contact_phone: e.target.value})}
                    leftIcon={<Phone className="w-3.5 h-3.5" />}
                    placeholder="+56 9 1234 5678"
                    className="bg-white/50 text-xs py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">{formData.contact_phone || 'No especificado'}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {isGodMode && (
        /* Admin Information Card */
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Información del Administrador</h3>
              <p className="text-xs text-gray-600">Detalles del administrador del sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <label className="block text-xs font-medium text-gray-700">Nombre Completo</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-900 font-medium">{formData.full_name || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-900 font-medium">{formData.contact_email || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-xs font-medium text-gray-700">Teléfono</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-900 font-medium">{formData.contact_phone || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-xs font-medium text-gray-700">RUT</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-900 font-medium">{formData.rut || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CompanyInformationSection;