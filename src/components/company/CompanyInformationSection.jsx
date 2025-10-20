/**
 * Company Information Section
 *
 * Sección que agrupa toda la información corporativa básica
 */

import { Card, Input, Button } from '../common';
import { Building, User, Mail, Phone, Edit, Save, X, CreditCard, DollarSign } from 'lucide-react';

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
                    <button
                      onClick={() => onEditToggle(false)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={onSave}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEditToggle(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap"
                  >
                    <Edit className="w-3 h-3 flex-shrink-0" />
                    <span>Editar</span>
                  </button>
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

          {/* Bank Account Information Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Datos Bancarios</h3>
                  <p className="text-xs text-gray-600">Cuenta para recibir transferencias</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Banco</label>
                {isEditing ? (
                  <select
                    value={formData.bankName || ''}
                    onChange={(e) => onFormDataChange({...formData, bankName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50"
                  >
                    <option value="">Selecciona un banco</option>
                    <option value="banco estado">Banco Estado</option>
                    <option value="banco de chile">Banco de Chile</option>
                    <option value="banco santander">Banco Santander</option>
                    <option value="banco bci">Banco BCI</option>
                    <option value="banco itau">Banco Itaú</option>
                    <option value="scotiabank">Scotiabank</option>
                    <option value="bbva">BBVA</option>
                    <option value="banco security">Banco Security</option>
                    <option value="banco falabella">Banco Falabella</option>
                    <option value="banco ripley">Banco Ripley</option>
                    <option value="banco consignación">Banco Consignación</option>
                    <option value="banco edwards citi">Banco Edwards Citi</option>
                    <option value="hsbc bank">HSBC Bank</option>
                    <option value="banco penta">Banco Penta</option>
                    <option value="banco paris">Banco Paris</option>
                    <option value="btg pactual">BTG Pactual</option>
                    <option value="corpbanca">Corpbanca</option>
                    <option value="banco del desarrollo">Banco del Desarrollo</option>
                    <option value="mercado pago">Mercado Pago</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">
                      {formData.bankName ? formData.bankName.charAt(0).toUpperCase() + formData.bankName.slice(1) : 'No configurado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Tipo de Cuenta</label>
                {isEditing ? (
                  <select
                    value={formData.accountType || ''}
                    onChange={(e) => onFormDataChange({...formData, accountType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50"
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="checking">Cuenta Corriente</option>
                    <option value="savings">Cuenta Ahorro</option>
                    <option value="vista">Cuenta Vista</option>
                    <option value="rut">Cuenta RUT</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">
                      {formData.accountType === 'checking' ? 'Cuenta Corriente' :
                       formData.accountType === 'savings' ? 'Cuenta Ahorro' :
                       formData.accountType === 'vista' ? 'Cuenta Vista' :
                       formData.accountType === 'rut' ? 'Cuenta RUT' :
                       'No configurado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Número de Cuenta</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => onFormDataChange({...formData, accountNumber: e.target.value})}
                    placeholder="Ej: 1234567890"
                    leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                    className="bg-white/50 text-xs py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">
                      {formData.accountNumber || 'No configurado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">Titular de la Cuenta</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.accountHolderName || ''}
                    onChange={(e) => onFormDataChange({...formData, accountHolderName: e.target.value})}
                    placeholder="Nombre completo del titular"
                    leftIcon={<User className="w-3.5 h-3.5" />}
                    className="bg-white/50 text-xs py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">
                      {formData.accountHolderName || 'No configurado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-0.5">
                <label className="block text-xs font-medium text-gray-700">RUT del Titular</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.accountHolderRut || ''}
                    onChange={(e) => onFormDataChange({...formData, accountHolderRut: e.target.value})}
                    placeholder="Ej: 12.345.678-9"
                    leftIcon={<User className="w-3.5 h-3.5" />}
                    className="bg-white/50 text-xs py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-900 font-medium">
                      {formData.accountHolderRut || 'No configurado'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Información Importante */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <CreditCard className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">Información Importante</p>
                  <p className="text-xs text-blue-700">
                    Los datos bancarios se utilizan para recibir las transferencias automáticas de los pagos de tus deudores.
                    Asegúrate que toda la información sea correcta antes de guardar.
                  </p>
                </div>
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