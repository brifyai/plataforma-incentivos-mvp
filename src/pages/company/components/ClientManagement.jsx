/**
 * ClientManagement Component
 *
 * Client management section for company dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '../../../components/common';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  MessageSquare,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  UserPlus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const ClientManagement = ({ clients, loading, selectedCorporateClient, corporateClients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredClients, setFilteredClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedClientForContact, setSelectedClientForContact] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const itemsPerPage = 10;

  // Función para calcular el nivel de riesgo basado en datos del cliente
  const calculateRiskLevel = (client) => {
    let riskScore = 0;

    // Factor 1: Monto pendiente vs total (mayor porcentaje pendiente = mayor riesgo)
    const pendingPercentage = (client.pendingAmount / client.totalDebt) * 100;
    if (pendingPercentage > 70) riskScore += 3;
    else if (pendingPercentage > 50) riskScore += 2;
    else if (pendingPercentage > 30) riskScore += 1;

    // Factor 2: Días desde último pago (más días = mayor riesgo)
    const lastPaymentDate = new Date(client.lastPayment);
    const daysSinceLastPayment = (new Date() - lastPaymentDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPayment > 90) riskScore += 3;
    else if (daysSinceLastPayment > 60) riskScore += 2;
    else if (daysSinceLastPayment > 30) riskScore += 1;

    // Factor 3: Monto total de deuda (deudas más altas = mayor riesgo)
    if (client.totalDebt > 5000000) riskScore += 2;
    else if (client.totalDebt > 2000000) riskScore += 1;

    // Factor 4: Estado del cliente
    if (client.status === 'overdue') riskScore += 3;
    else if (client.status === 'inactive') riskScore += 2;

    // Factor 5: Progreso de pago (menos progreso = mayor riesgo)
    const paymentProgress = (client.paidAmount / client.totalDebt) * 100;
    if (paymentProgress < 20) riskScore += 2;
    else if (paymentProgress < 50) riskScore += 1;

    // Determinar nivel de riesgo basado en el score
    if (riskScore >= 7) return 'high';
    else if (riskScore >= 4) return 'medium';
    else return 'low';
  };

  // Mock data for demonstration
  const mockClients = [
    {
      id: 1,
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+56912345678',
      rut: '12.345.678-9',
      totalDebt: 2500000,
      paidAmount: 1800000,
      pendingAmount: 700000,
      lastPayment: '2024-10-05',
      status: 'active'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+56987654321',
      rut: '15.234.567-8',
      totalDebt: 1800000,
      paidAmount: 1200000,
      pendingAmount: 600000,
      lastPayment: '2024-10-03',
      status: 'active'
    },
    {
      id: 3,
      name: 'Ana López',
      email: 'ana.lopez@email.com',
      phone: '+56911223344',
      rut: '18.345.678-1',
      totalDebt: 3200000,
      paidAmount: 2800000,
      pendingAmount: 400000,
      lastPayment: '2024-10-01',
      status: 'inactive'
    },
    {
      id: 4,
      name: 'Pedro Martínez',
      email: 'pedro.martinez@email.com',
      phone: '+56944332211',
      rut: '11.456.789-2',
      totalDebt: 950000,
      paidAmount: 950000,
      pendingAmount: 0,
      lastPayment: '2024-09-28',
      status: 'completed'
    },
    {
      id: 5,
      name: 'Sofía Ramírez',
      email: 'sofia.ramirez@email.com',
      phone: '+56955667788',
      rut: '19.876.543-2',
      totalDebt: 1450000,
      paidAmount: 800000,
      pendingAmount: 650000,
      lastPayment: '2024-09-25',
      status: 'active'
    },
    {
      id: 6,
      name: 'Diego Silva',
      email: 'diego.silva@email.com',
      phone: '+56966778899',
      rut: '20.123.456-7',
      totalDebt: 2800000,
      paidAmount: 2800000,
      pendingAmount: 0,
      lastPayment: '2024-09-20',
      status: 'completed'
    },
    {
      id: 7,
      name: 'Valentina Torres',
      email: 'valentina.torres@email.com',
      phone: '+56977889900',
      rut: '21.234.567-8',
      totalDebt: 2100000,
      paidAmount: 1500000,
      pendingAmount: 600000,
      lastPayment: '2024-09-18',
      status: 'active'
    },
    {
      id: 8,
      name: 'Felipe Morales',
      email: 'felipe.morales@email.com',
      phone: '+56988990011',
      rut: '22.345.678-9',
      totalDebt: 3600000,
      paidAmount: 2400000,
      pendingAmount: 1200000,
      lastPayment: '2024-09-15',
      status: 'active'
    },
    {
      id: 9,
      name: 'Camila Herrera',
      email: 'camila.herrera@email.com',
      phone: '+56999001122',
      rut: '23.456.789-0',
      totalDebt: 1750000,
      paidAmount: 1750000,
      pendingAmount: 0,
      lastPayment: '2024-09-12',
      status: 'completed'
    },
    {
      id: 10,
      name: 'Matías Castro',
      email: 'matias.castro@email.com',
      phone: '+56910111213',
      rut: '24.567.890-1',
      totalDebt: 3200000,
      paidAmount: 2000000,
      pendingAmount: 1200000,
      lastPayment: '2024-09-10',
      status: 'active'
    },
    {
      id: 11,
      name: 'Isabella Vargas',
      email: 'isabella.vargas@email.com',
      phone: '+56911121314',
      rut: '25.678.901-2',
      totalDebt: 1900000,
      paidAmount: 1300000,
      pendingAmount: 600000,
      lastPayment: '2024-09-08',
      status: 'active'
    },
    {
      id: 12,
      name: 'Sebastián Reyes',
      email: 'sebastian.reyes@email.com',
      phone: '+56912131415',
      rut: '26.789.012-3',
      totalDebt: 2700000,
      paidAmount: 2700000,
      pendingAmount: 0,
      lastPayment: '2024-09-05',
      status: 'completed'
    }
  ];

  useEffect(() => {
    let filtered = clients && clients.length > 0 ? clients : mockClients;

    // Calcular nivel de riesgo para cada cliente si no lo tiene
    filtered = filtered.map(client => ({
      ...client,
      riskLevel: client.riskLevel || calculateRiskLevel(client)
    }));

    // Filter by corporate client
    if (selectedCorporateClient) {
      filtered = filtered.filter(client => client.corporateClientId === selectedCorporateClient);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.rut.includes(searchTerm)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    setFilteredClients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterStatus, selectedCorporateClient, clients]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  // Contact functions
  const handleContactClient = (client) => {
    setSelectedClientForContact(client);
    setContactMessage('');
    setShowContactModal(true);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) {
      alert('Por favor, escribe un mensaje antes de enviar.');
      return;
    }

    try {
      setSendingMessage(true);
      // Aquí iría la lógica para enviar el mensaje
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Mensaje enviado exitosamente');
      setShowContactModal(false);
      setSelectedClientForContact(null);
      setContactMessage('');
    } catch (error) {
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'green' },
      inactive: { label: 'Inactivo', color: 'yellow' },
      completed: { label: 'Completado', color: 'blue' },
      overdue: { label: 'Vencido', color: 'red' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <Badge variant={config.color} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel) => {
    const riskConfig = {
      low: { label: 'Bajo Riesgo', color: 'green' },
      medium: { label: 'Medio Riesgo', color: 'yellow' },
      high: { label: 'Alto Riesgo', color: 'red' }
    };

    const config = riskConfig[riskLevel] || riskConfig.low;
    return (
      <Badge variant={config.color} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h3>
          <p className="text-sm text-gray-600">Administra tus deudores y sus pagos</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Importar
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
          <Link to="/empresa/clientes/nuevo">
            <Button
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, email o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="completed">Completados</option>
            <option value="overdue">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {currentClients.map((client) => (
          <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{client.name}</h4>
                  <p className="text-sm text-gray-600">{client.rut}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-blue-600 font-medium">{client.companyName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-purple-600 font-medium">{client.corporateClientName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(client.status)}
                {getRiskBadge(client.riskLevel)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  ${client.pendingAmount.toLocaleString()} pendiente
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Último pago: {new Date(client.lastPayment).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progreso de pago</span>
                <span>{Math.round((client.paidAmount / client.totalDebt) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(client.paidAmount / client.totalDebt) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">${client.totalDebt.toLocaleString()}</span> total •
                <span className="font-medium text-green-600 ml-1">${client.paidAmount.toLocaleString()}</span> pagado
              </div>
              <div className="flex gap-2">
                <Link to={`/empresa/clientes/${client.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                    Ver Detalles
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => handleContactClient(client)}
                >
                  Contactar
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' || selectedCorporateClient
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer cliente'
              }
            </p>
            <Link to="/empresa/clientes/nuevo">
              <Button leftIcon={<UserPlus className="w-4 h-4" />}>
                Agregar Primer Cliente
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredClients.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
          </div>

          <div className="flex items-center gap-2">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-2"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNumber > totalPages) return null;

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNumber)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="p-2"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{filteredClients.length}</div>
            <div className="text-sm text-gray-600">Clientes mostrados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredClients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Clientes activos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              ${filteredClients.reduce((sum, c) => sum + c.paidAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total recaudado</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              ${filteredClients.reduce((sum, c) => sum + c.pendingAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Pendiente por cobrar</div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={`Contactar a ${selectedClientForContact?.name}`}
        size="md"
      >
        <div className="space-y-6">
          {selectedClientForContact && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Enviar Mensaje</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Contacta a {selectedClientForContact.name} sobre sus deudas pendientes
                  </p>
                  <div className="text-xs text-blue-600">
                    Email: {selectedClientForContact.email}<br />
                    Teléfono: {selectedClientForContact.phone}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Recomendaciones</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Sé claro y específico sobre las deudas</li>
                  <li>• Menciona opciones de negociación disponibles</li>
                  <li>• Incluye información de contacto para respuesta</li>
                  <li>• Mantén un tono profesional y respetuoso</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowContactModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendMessage}
              className="flex-1"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              loading={sendingMessage}
              disabled={sendingMessage || !contactMessage.trim()}
            >
              {sendingMessage ? 'Enviando...' : 'Enviar Mensaje'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ClientManagement;