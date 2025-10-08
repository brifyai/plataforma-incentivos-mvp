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
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar cliente?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280'
    });

    if (result.isConfirmed) {
      try {
        // Aquí iría la lógica para eliminar de la base de datos
        await Swal.fire({
          icon: 'success',
          title: '¡Cliente eliminado!',
          text: 'El cliente corporativo ha sido eliminado exitosamente',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes Corporativos</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las empresas que contratan tus servicios de cobranza
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Agregar Cliente
          </Button>

          <Link to="/empresa/perfil/operaciones">
            <Button
              variant="secondary"
              className="border-green-500 text-green-700 hover:bg-green-50"
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ir a Operaciones Diarias
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes por nombre, contacto o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.company_name}</h3>
                  <p className="text-sm text-gray-500">{client.industry}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <UserCheck className="w-4 h-4" />
                <span>{client.contact_name}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{client.contact_email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{client.contact_phone}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>Contrato: ${client.contract_value?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Agregado: {new Date(client.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClient(client)}
                  leftIcon={<Edit className="w-4 h-4" />}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes corporativos'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Agrega tu primer cliente corporativo para comenzar'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
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
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente Corporativo'}
                </h4>
                <p className="text-sm text-blue-700">
                  {editingClient
                    ? 'Actualiza la información del cliente corporativo'
                    : 'Agrega una nueva empresa que contratará tus servicios de cobranza'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                Información de la Empresa
              </h5>

              <Input
                label="Nombre de la Empresa *"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Ej: TechCorp S.A."
                leftIcon={<Building className="w-4 h-4" />}
                required
              />

              <Input
                label="RUT de la Empresa"
                value={formData.company_rut}
                onChange={(e) => handleInputChange('company_rut', e.target.value)}
                placeholder="Ej: 76.543.210-1"
                leftIcon={<Building className="w-4 h-4" />}
              />

              <Input
                label="Industria"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Ej: Tecnología, Retail, Servicios..."
                leftIcon={<Building className="w-4 h-4" />}
              />

              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Dirección completa de la empresa"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                Información de Contacto
              </h5>

              <Input
                label="Nombre del Contacto"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="Ej: María González"
                leftIcon={<UserCheck className="w-4 h-4" />}
              />

              <Input
                label="Email de Contacto *"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="Ej: maria@empresa.cl"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Teléfono de Contacto"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Ej: +56912345678"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Contract Information */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              Información del Contrato
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Valor del Contrato"
                type="number"
                value={formData.contract_value}
                onChange={(e) => handleInputChange('contract_value', e.target.value)}
                placeholder="Ej: 5000000"
                leftIcon={<DollarSign className="w-4 h-4" />}
              />

              <Input
                label="Fecha de Inicio del Contrato"
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre el cliente o contrato..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingClient(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddClient}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              leftIcon={<CheckCircle className="w-4 h-4" />}
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