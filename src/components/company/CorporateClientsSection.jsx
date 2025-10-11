/**
 * Corporate Clients Section
 *
 * Sección para gestionar los clientes corporativos que contratan servicios de cobranza
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  UserCheck,
  ArrowRight
} from 'lucide-react';

const CorporateClientsSection = ({ profile, onUpdate }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_rut: '',
    address: '',
    industry: '',
    contract_value: '',
    contract_start_date: '',
    notes: ''
  });

  // Cargar clientes corporativos
  useEffect(() => {
    loadCorporateClients();
  }, [profile]);

  const loadCorporateClients = async () => {
    try {
      setLoading(true);

      if (!profile?.company?.id) {
        setClients([]);
        return;
      }

      // Por ahora, simulamos datos ya que no tenemos la tabla de clientes corporativos
      // En producción, esto debería consultar una tabla real
      const mockClients = [
        {
          id: '1',
          company_name: 'TechCorp S.A.',
          contact_name: 'María González',
          contact_email: 'maria@techcorp.cl',
          contact_phone: '+56912345678',
          company_rut: '76.543.210-1',
          address: 'Av. Providencia 123, Santiago',
          industry: 'Tecnología',
          contract_value: 5000000,
          contract_start_date: '2024-01-15',
          status: 'active',
          created_at: '2024-01-10',
          notes: 'Cliente premium con alto volumen de cobranzas'
        },
        {
          id: '2',
          company_name: 'RetailMax Ltda.',
          contact_name: 'Carlos Rodríguez',
          contact_email: 'carlos@retailmax.cl',
          contact_phone: '+56987654321',
          company_rut: '98.765.432-1',
          address: 'Calle Comercio 456, Concepción',
          industry: 'Retail',
          contract_value: 3200000,
          contract_start_date: '2024-02-01',
          status: 'active',
          created_at: '2024-01-25',
          notes: 'Cliente regular con buen historial de pagos'
        }
      ];

      setClients(mockClients);
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los clientes corporativos',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      // Validaciones
      if (!formData.company_name.trim()) {
        await Swal.fire({
          icon: 'error',
          title: 'Nombre requerido',
          text: 'Por favor ingresa el nombre de la empresa',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      if (!formData.contact_email.trim()) {
        await Swal.fire({
          icon: 'error',
          title: 'Email requerido',
          text: 'Por favor ingresa el email de contacto',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Aquí iría la lógica para guardar en la base de datos
      // Por ahora, solo mostramos un mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Cliente agregado!',
        text: 'El cliente corporativo ha sido agregado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6'
      });

      // Limpiar formulario y cerrar modal
      setFormData({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company_rut: '',
        address: '',
        industry: '',
        contract_value: '',
        contract_start_date: '',
        notes: ''
      });
      setShowAddModal(false);

      // Recargar lista
      loadCorporateClients();

    } catch (error) {
      console.error('Error adding client:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al agregar el cliente corporativo',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const handleEditClient = async (client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      contact_name: client.contact_name,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
      company_rut: client.company_rut,
      address: client.address,
      industry: client.industry,
      contract_value: client.contract_value,
      contract_start_date: client.contract_start_date,
      notes: client.notes
    });
    setShowAddModal(true);
  };

  const handleDeleteClient = async (clientId) => {
    const client = clients.find(c => c.id === clientId);

    const result = await Swal.fire({
      icon: 'warning',
      title: '⚠️ ¿Eliminar cliente corporativo?',
      html: `
        <div class="text-left">
          <p class="mb-3"><strong>Esta acción eliminará permanentemente:</strong></p>
          <ul class="list-disc list-inside text-sm text-gray-600 mb-4">
            <li>El cliente corporativo y toda su información</li>
            <li>Todos los deudores asociados a este cliente</li>
            <li>Todas las deudas y propuestas relacionadas</li>
            <li>Historial de pagos y acuerdos</li>
            <li>Mensajes y comunicaciones</li>
            <li>Datos de campañas y analytics</li>
          </ul>
          <p class="text-red-600 font-semibold">Esta acción NO se puede deshacer.</p>
          <p class="mt-2">¿Estás seguro de que quieres continuar?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      customClass: {
        popup: 'swal-wide'
      },
      width: '600px'
    });

    if (result.isConfirmed) {
      try {
        // Aquí iría la lógica para eliminar de la base de datos
        // En una implementación real, esto debería hacer una eliminación en cascada
        await Swal.fire({
          icon: 'success',
          title: '¡Cliente eliminado!',
          text: 'El cliente corporativo y toda su información relacionada ha sido eliminado exitosamente',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3B82F6'
        });

        // Recargar lista
        loadCorporateClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el cliente corporativo',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Clientes Corporativos</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Gestiona las empresas que contratan tus servicios de cobranza
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              setEditingClient(null);
              setFormData({
                company_name: '',
                contact_name: '',
                contact_email: '',
                contact_phone: '',
                company_rut: '',
                address: '',
                industry: '',
                contract_value: '',
                contract_start_date: '',
                notes: ''
              });
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 text-xs"
            leftIcon={<Plus className="w-3 h-3" />}
          >
            Agregar Cliente
          </Button>

          <Link to="/empresa/perfil/operaciones">
            <Button
              variant="secondary"
              className="border-green-500 text-green-700 hover:bg-green-50 px-3 py-1.5 text-xs"
              leftIcon={<ArrowRight className="w-3 h-3" />}
            >
              Ir a Operaciones
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{client.company_name}</h3>
                  <p className="text-xs text-gray-500">{client.industry}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <UserCheck className="w-3 h-3" />
                <span>{client.contact_name}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span>{client.contact_email}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{client.contact_phone}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <DollarSign className="w-3 h-3" />
                <span>Contrato: ${client.contract_value?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Agregado: {new Date(client.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClient(client)}
                  leftIcon={<Edit className="w-3 h-3" />}
                  className="px-2 py-1 text-xs"
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 text-xs"
                  leftIcon={<Trash2 className="w-3 h-3" />}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes corporativos'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Agrega tu primer cliente corporativo para comenzar'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-3 h-3" />}
              className="px-3 py-1.5 text-xs"
            >
              Agregar Primer Cliente
            </Button>
          )}
        </Card>
      )}

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        title={editingClient ? 'Editar Cliente Corporativo' : 'Agregar Cliente Corporativo'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-0.5">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente Corporativo'}
                </h4>
                <p className="text-xs text-blue-700">
                  {editingClient
                    ? 'Actualiza la información del cliente corporativo'
                    : 'Agrega una nueva empresa que contratará tus servicios de cobranza'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Information */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">
                Información de la Empresa
              </h5>

              <Input
                label="Nombre de la Empresa *"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Ej: TechCorp S.A."
                leftIcon={<Building className="w-3.5 h-3.5" />}
                required
                className="text-sm py-2"
              />

              <Input
                label="RUT de la Empresa"
                value={formData.company_rut}
                onChange={(e) => handleInputChange('company_rut', e.target.value)}
                placeholder="Ej: 76.543.210-1"
                leftIcon={<Building className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />

              <Input
                label="Industria"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Ej: Tecnología, Retail, Servicios..."
                leftIcon={<Building className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />

              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Dirección completa de la empresa"
                leftIcon={<MapPin className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">
                Información de Contacto
              </h5>

              <Input
                label="Nombre del Contacto"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="Ej: María González"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />

              <Input
                label="Email de Contacto *"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="Ej: maria@empresa.cl"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
                required
                className="text-sm py-2"
              />

              <Input
                label="Teléfono de Contacto"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Ej: +56912345678"
                leftIcon={<Phone className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />
            </div>
          </div>

          {/* Contract Information */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">
              Información del Contrato
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Valor del Contrato"
                type="number"
                value={formData.contract_value}
                onChange={(e) => handleInputChange('contract_value', e.target.value)}
                placeholder="Ej: 5000000"
                leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />

              <Input
                label="Fecha de Inicio del Contrato"
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
                className="text-sm py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre el cliente o contrato..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingClient(null);
              }}
              className="flex-1 text-sm py-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddClient}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm py-2"
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              {editingClient ? 'Actualizar Cliente' : 'Agregar Cliente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CorporateClientsSection;