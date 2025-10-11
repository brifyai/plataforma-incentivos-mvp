/**
 * Admin Users Management Page - Gestión de Usuarios
 *
 * Página administrativa para gestionar todos los usuarios del sistema
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, LoadingSpinner, Modal } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import { getAllUsers, createUserWithInvitation, updateUser, deleteUser, getAllCorporateClients } from '../../services/databaseService';
import { validateUserManually, rejectUser, sendPasswordResetForUser } from '../../services/authService';
import { sendAdminInvitationEmail } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserCheck,
  UserX,
  Building,
  Shield,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key
} from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCorporateClient, setFilterCorporateClient] = useState('all');
  const [corporateClients, setCorporateClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersPerPage = 10;

  useEffect(() => {
    loadUsers();
    loadCorporateClients();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { users: usersData, error } = await getAllUsers();

      if (error) {
        console.error('Error loading users:', error);
        setError('Error al cargar usuarios');
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error in loadUsers:', error);
      setError('Error al cargar la información de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadCorporateClients = async () => {
    try {
      const { corporateClients, error } = await getAllCorporateClients();
      if (error) {
        console.error('Error loading corporate clients:', error);
      } else {
        setCorporateClients(corporateClients || []);
      }
    } catch (error) {
      console.error('Error in loadCorporateClients:', error);
    }
  };

  // Función para obtener el icono del rol
  const getRoleIcon = (role) => {
    switch (role) {
      case 'god_mode':
        return <Shield className="w-4 h-4" />;
      case 'company':
        return <Building className="w-4 h-4" />;
      case 'debtor':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Función para obtener el color del badge del rol
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'god_mode':
        return 'danger';
      case 'company':
        return 'primary';
      case 'debtor':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Función para obtener el texto del rol
  const getRoleText = (role) => {
    switch (role) {
      case 'god_mode':
        return 'Administrador';
      case 'company':
        return 'Empresa';
      case 'debtor':
        return 'Deudor';
      default:
        return 'Usuario';
    }
  };

  // Función para obtener el color del badge del estado
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'validated':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'validated':
        return 'Validado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.rut && user.rut.includes(searchTerm));

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.validation_status === filterStatus;
    const matchesCorporateClient = filterCorporateClient === 'all' ||
                                 (filterCorporateClient === 'none' && (!user.corporate_client_id || user.corporate_client_id === null)) ||
                                 (filterCorporateClient !== 'none' && user.corporate_client_id === filterCorporateClient);

    return matchesSearch && matchesRole && matchesStatus && matchesCorporateClient;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Estadísticas
  const stats = {
    total: users.length,
    godMode: users.filter(u => u.role === 'god_mode').length,
    companies: users.filter(u => u.role === 'company').length,
    debtors: users.filter(u => u.role === 'debtor').length,
    validated: users.filter(u => u.validation_status === 'validated').length,
    pending: users.filter(u => u.validation_status === 'pending').length,
    rejected: users.filter(u => u.validation_status === 'rejected').length,
  };

  // Funciones CRUD
  const handleCreateUser = async (userData) => {
    setIsSubmitting(true);
    try {
      // Obtener nombre del administrador actual
      const adminName = currentProfile?.full_name || currentUser?.user_metadata?.full_name || 'Administrador';

      const { user, invitationToken, error } = await createUserWithInvitation(userData, adminName);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear usuario',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      // Enviar email de invitación
      try {
        // Usar URL base configurable para el enlace de invitación
        const baseUrl = process.env.VITE_APP_URL || window.location.origin;
        const completeUrl = `${baseUrl}/complete-registration?token=${invitationToken}`;

        console.log('📧 Generated invitation URL:', completeUrl);

        const emailResult = await sendAdminInvitationEmail({
          fullName: userData.full_name,
          email: userData.email,
          invitationToken: invitationToken,
          adminName: adminName,
          completeUrl: completeUrl
        });

        if (!emailResult.success) {
          console.warn('Error sending invitation email:', emailResult.error);
          // No fallar la creación del usuario por error de email
        }
      } catch (emailError) {
        console.warn('Error sending invitation email:', emailError);
        // No fallar la creación del usuario por error de email
      }

      await Swal.fire({
        icon: 'success',
        title: 'Usuario creado exitosamente',
        text: 'Se ha enviado un email de invitación al usuario para que complete su registro.',
        confirmButtonText: 'Aceptar'
      });

      setShowCreateModal(false);
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error('Error creating user:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al crear usuario',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (userData) => {
    setIsSubmitting(true);
    try {
      const { error } = await updateUser(userData.id, userData);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar usuario',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error('Error updating user:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar usuario',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setIsSubmitting(true);
    try {
      const { error } = await deleteUser(userId);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar usuario',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error('Error deleting user:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar usuario',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setIsSubmitting(true);
    try {
      const { error } = await validateUserManually(userId);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al aprobar usuario',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setShowApproveModal(false);
      setSelectedUser(null);
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error('Error approving user:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al aprobar usuario',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectUser = async (userId) => {
    setIsSubmitting(true);
    try {
      const { error } = await rejectUser(userId);

      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al rechazar usuario',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      setShowRejectModal(false);
      setSelectedUser(null);
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error('Error rejecting user:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al rechazar usuario',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId) => {
    setIsSubmitting(true);
    try {
      const { success, error } = await sendPasswordResetForUser(userId);

      if (!success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al enviar email de reset',
          text: error,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Email enviado exitosamente',
        text: 'Se ha enviado el email de reset de contraseña',
        confirmButtonText: 'Aceptar'
      });
      setShowResetModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar email de reset',
        text: 'Ha ocurrido un error inesperado',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar usuarios</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadUsers()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Gestión de Usuarios
              </h1>
              <p className="text-purple-100 text-lg">
                Administra todos los usuarios de la plataforma
              </p>
            </div>
          </div>

          <Button
            variant="gradient"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
          >
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mx-auto mb-2 shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-1">{stats.total}</h3>
            <p className="text-blue-700 font-medium text-sm">Total Usuarios</p>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg mx-auto mb-2 shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-1">{stats.godMode}</h3>
            <p className="text-red-700 font-medium text-sm">Administradores</p>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mx-auto mb-2 shadow-lg">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-1">{stats.companies}</h3>
            <p className="text-green-700 font-medium text-sm">Empresas</p>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mx-auto mb-2 shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-1">{stats.debtors}</h3>
            <p className="text-purple-700 font-medium text-sm">Deudores</p>
          </div>
        </Card>

        <Card className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
          <div className="p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg mx-auto mb-2 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-yellow-900 mb-1">{stats.pending}</h3>
            <p className="text-yellow-700 font-medium text-sm">Pendientes</p>
            {stats.pending > 0 && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Requieren aprobación
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6">
          <div className="flex flex-row flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0 relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5 z-10" />
              <Input
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-5 h-5 text-secondary-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
              >
                <option value="all">Todos los roles</option>
                <option value="god_mode">Administradores</option>
                <option value="company">Empresas</option>
                <option value="debtor">Deudores</option>
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
              >
                <option value="all">Todos los estados</option>
                <option value="validated">Validados</option>
                <option value="pending">Pendientes</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Building className="w-5 h-5 text-secondary-400" />
              <select
                value={filterCorporateClient}
                onChange={(e) => setFilterCorporateClient(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
              >
                <option value="all">Todos los Clientes</option>
                <option value="none">Sin Cliente Corporativo</option>
                {corporateClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            {stats.pending > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                  className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 whitespace-nowrap"
                  leftIcon={<AlertTriangle className="w-4 h-4" />}
                >
                  Ver Pendientes ({stats.pending})
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Lista de Usuarios ({filteredUsers.length})
            </h2>
            <Button
              variant="outline"
              onClick={loadUsers}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando usuarios...</p>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-secondary-600">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay usuarios registrados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.rut && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">RUT: {user.rut}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={getRoleBadgeColor(user.role)}
                            className="px-3 py-1 flex items-center gap-1"
                          >
                            {getRoleIcon(user.role)}
                            {getRoleText(user.role)}
                          </Badge>
                          <Badge
                            variant={getStatusBadgeColor(user.validation_status)}
                            className="px-3 py-1"
                          >
                            {getStatusText(user.validation_status)}
                          </Badge>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(new Date(user.created_at))}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {user.validation_status === 'pending' ? (
                            // Botones para usuarios pendientes
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<CheckCircle className="w-4 h-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowApproveModal(true);
                                }}
                                className="hover:bg-green-50 hover:border-green-300 text-green-600"
                              >
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<XCircle className="w-4 h-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRejectModal(true);
                                }}
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
                              >
                                Rechazar
                              </Button>
                            </>
                          ) : (
                            // Botones para usuarios validados/rechazados
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Key className="w-4 h-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowResetModal(true);
                                }}
                                className="hover:bg-purple-50 hover:border-purple-300 text-purple-600"
                                title="Reiniciar contraseña"
                              >
                                Reset
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                                className="hover:bg-green-50 hover:border-green-300"
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-4 h-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                }}
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl inline-block mb-4">
              <UserPlus className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Crear Nuevo Usuario
            </h3>
            <p className="text-secondary-600">
              Complete la información del nuevo usuario
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = {
              full_name: formData.get('full_name'),
              email: formData.get('email'),
              rut: formData.get('rut'),
              phone: formData.get('phone'),
              role: formData.get('role'),
            };
            handleCreateUser(userData);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Nombre Completo *
                </label>
                <Input
                  name="full_name"
                  required
                  placeholder="Ingrese el nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email *
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  RUT *
                </label>
                <Input
                  name="rut"
                  required
                  placeholder="12345678-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Teléfono
                </label>
                <Input
                  name="phone"
                  placeholder="+56912345678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rol *
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Seleccionar rol</option>
                  <option value="debtor">Deudor</option>
                  <option value="company">Empresa</option>
                  <option value="god_mode">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                type="submit"
                loading={isSubmitting}
                className="flex-1"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Crear Usuario
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title="Editar Usuario"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
              <Edit className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Editar Usuario
            </h3>
            <p className="text-secondary-600">
              Modifique la información del usuario
            </p>
          </div>

          {selectedUser && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userData = {
                id: selectedUser.id,
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                rut: formData.get('rut'),
                phone: formData.get('phone'),
                role: formData.get('role'),
                validation_status: formData.get('validation_status'),
              };
              handleEditUser(userData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nombre Completo *
                  </label>
                  <Input
                    name="full_name"
                    required
                    defaultValue={selectedUser.full_name}
                    placeholder="Ingrese el nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    defaultValue={selectedUser.email}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    RUT *
                  </label>
                  <Input
                    name="rut"
                    required
                    defaultValue={selectedUser.rut}
                    placeholder="12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    name="phone"
                    defaultValue={selectedUser.phone}
                    placeholder="+56912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Rol *
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue={selectedUser.role}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="debtor">Deudor</option>
                    <option value="company">Empresa</option>
                    <option value="god_mode">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Estado de Validación *
                  </label>
                  <select
                    name="validation_status"
                    required
                    defaultValue={selectedUser.validation_status}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="validated">Validado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  type="submit"
                  loading={isSubmitting}
                  className="flex-1"
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Eliminar Usuario"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl inline-block mb-4">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              ¿Eliminar Usuario?
            </h3>
            <p className="text-secondary-600">
              Esta acción no se puede deshacer. Se eliminará permanentemente:
            </p>
          </div>

          {selectedUser && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <span className="text-red-700 font-bold">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-red-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-red-700">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteUser(selectedUser?.id)}
              loading={isSubmitting}
              className="flex-1"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Eliminar Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve User Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedUser(null);
        }}
        title="Aprobar Usuario"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              ¿Aprobar Usuario?
            </h3>
            <p className="text-secondary-600">
              El usuario podrá acceder completamente a la plataforma:
            </p>
          </div>

          {selectedUser && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 font-bold">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-green-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-green-700">{selectedUser.email}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Rol: {getRoleText(selectedUser.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedUser(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={() => handleApproveUser(selectedUser?.id)}
              loading={isSubmitting}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Aprobar Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject User Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedUser(null);
        }}
        title="Rechazar Usuario"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl inline-block mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              ¿Rechazar Usuario?
            </h3>
            <p className="text-secondary-600">
              El usuario no podrá acceder a la plataforma:
            </p>
          </div>

          {selectedUser && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <span className="text-red-700 font-bold">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-red-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-red-700">{selectedUser.email}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Rol: {getRoleText(selectedUser.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedUser(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleRejectUser(selectedUser?.id)}
              loading={isSubmitting}
              className="flex-1"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Rechazar Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }}
        title="Reiniciar Contraseña"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-2xl inline-block mb-4">
              <Key className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              ¿Enviar Email de Reset?
            </h3>
            <p className="text-secondary-600">
              Se enviará un email al usuario con instrucciones para crear una nueva contraseña:
            </p>
          </div>

          {selectedUser && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                  <span className="text-purple-700 font-bold">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-purple-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-purple-700">{selectedUser.email}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    Rol: {getRoleText(selectedUser.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">¿Qué sucede después?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Se envía un email seguro con enlace de reset</li>
                  <li>• El enlace expira en 1 hora por seguridad</li>
                  <li>• El usuario podrá crear una nueva contraseña</li>
                  <li>• La contraseña anterior quedará invalidada</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetModal(false);
                setSelectedUser(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={() => handleResetPassword(selectedUser?.id)}
              loading={isSubmitting}
              className="flex-1"
              leftIcon={<Key className="w-4 h-4" />}
            >
              Enviar Email de Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;