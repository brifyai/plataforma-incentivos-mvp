/**
 * Client Management Component
 * Handles client listing and creation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Modal } from '../../../components/common';
import { FormField, FormSection, ActionButtons } from '../../../components/common';
import { useClientManagement } from '../../../hooks/useClientManagement';
import { Building } from 'lucide-react';

const ClientManagement = ({ clients, onClientCreated }) => {
  const {
    showCreateModal,
    createForm,
    loading,
    error,
    setCreateForm,
    handleCreate,
    openModal,
    closeModal
  } = useClientManagement(onClientCreated);

  return (
    <>
      <Card
        title="Gestión de Clientes"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
        headerAction={
          <Button
            variant="gradient"
            size="sm"
            onClick={openModal}
            leftIcon={<Building className="w-4 h-4" />}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            Nuevo Cliente
          </Button>
        }
      >
        {clients.length === 0 ? (
          <div className="text-center py-6 md:py-8">
            <Building className="w-10 h-10 md:w-12 md:h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600 text-sm md:text-base mb-4">
              No tienes clientes registrados todavía
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="p-2 md:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <Building className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">{client.business_name}</span>
                      <Badge variant={client.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                        {client.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="truncate">RUT: {client.rut}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">{client.contact_email}</span>
                      {client.industry && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{client.industry}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/empresa/clientes/${client.id}`}>
                    <Button variant="outline" size="sm" className="whitespace-nowrap text-xs md:text-sm">
                      Ver Detalles
                    </Button>
                  </Link>
                  <Link to={`/empresa/clientes/${client.id}/deudas`}>
                    <Button variant="outline" size="sm" className="whitespace-nowrap text-xs md:text-sm">
                      Gestionar Deudas
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeModal}
        title=""
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4 md:space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-4 md:p-6 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl md:rounded-3xl inline-block mb-4 md:mb-6">
              <Building className="w-12 h-12 md:w-16 md:h-16 text-purple-600" />
            </div>
            <h2 className="text-xl md:text-3xl font-display font-bold text-secondary-900 mb-2">
              Registrar Nuevo Cliente
            </h2>
            <p className="text-secondary-600 text-sm md:text-lg px-4 md:px-0">
              Agrega un nuevo cliente a tu cartera de cobranza
            </p>
          </div>

          {/* Progress Indicator - Hidden on mobile for space */}
          <div className="hidden md:flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-purple-700">Información Básica</span>
            </div>
            <div className="w-12 h-0.5 bg-purple-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">2</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Contacto</span>
            </div>
            <div className="w-12 h-0.5 bg-purple-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">3</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Finalizar</span>
            </div>
          </div>

          {/* Información Básica */}
          <FormSection
            title="Información de la Empresa"
            gradient="purple"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField
                label="Nombre de Empresa *"
                value={createForm.business_name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Empresa S.A."
                required
              />

              <FormField
                label="RUT de Empresa *"
                value={createForm.rut}
                onChange={(e) => setCreateForm(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
                required
              />

              <FormField
                label="Sector/Industria"
                value={createForm.industry}
                onChange={(e) => setCreateForm(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Tecnología, Retail, Servicios..."
              />

              <FormField
                label="Dirección"
                value={createForm.address}
                onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>
          </FormSection>

          {/* Información de Contacto */}
          <FormSection
            title="Información de Contacto"
            gradient="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField
                label="Nombre del Contacto"
                value={createForm.contact_name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Juan Pérez"
              />

              <FormField
                label="Email de Contacto *"
                type="email"
                value={createForm.contact_email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contacto@empresa.cl"
                required
              />

              <FormField
                label="Teléfono de Contacto"
                type="tel"
                value={createForm.contact_phone}
                onChange={(e) => setCreateForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+56912345678"
                className="md:col-span-2"
              />
            </div>
          </FormSection>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
                  <span className="text-white font-bold text-sm">⚠️</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-red-900 font-display text-sm md:text-base">Error al registrar cliente</h4>
                  <p className="text-red-700 mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Tips */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg flex-shrink-0">
                <span className="text-white font-bold text-sm">💡</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-emerald-900 mb-2 md:mb-3 font-display text-sm md:text-base">¿Sabías que?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Podrás gestionar todas las deudas de este cliente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Recibirás reportes automáticos de cobranza</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Podrás crear ofertas específicas para este cliente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>Acceso completo a métricas de rendimiento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons
            onCancel={closeModal}
            onConfirm={handleCreate}
            confirmText="Registrar Cliente"
            confirmLoading={loading}
            cancelText="Cancelar"
          />
        </div>
      </Modal>
    </>
  );
};

export default ClientManagement;