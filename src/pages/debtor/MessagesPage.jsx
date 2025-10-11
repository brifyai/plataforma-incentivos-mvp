/**
 * Messages Page
 *
 * Página para mostrar mensajes y conversaciones del deudor
 */

import { useState, useRef } from 'react';
import { Card, Badge, Button, EmptyState, Modal, Input } from '../../components/common';
import { useMessages } from '../../hooks';
import { formatCurrency } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Clock,
  Eye,
  Plus,
  Mail,
  Paperclip,
  X,
  File,
  Image,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageCircle,
} from 'lucide-react';

const MessagesPage = () => {
  const { conversations, loading } = useMessages();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [paymentProofFiles, setPaymentProofFiles] = useState([]);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProposalMessage, setSelectedProposalMessage] = useState(null);
  const fileInputRef = useRef(null);
  const conversationFileInputRef = useRef(null);
  const paymentProofInputRef = useRef(null);

  // Lista de empresas disponibles - TODO: Obtener de BD
  const companies = [];

  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    setAttachedFiles([]); // Limpiar archivos previos
  };

  const handleNewMessage = () => {
    setShowNewMessageModal(true);
  };

  const handleViewUnreadMessages = () => {
    const unreadConversations = conversations.filter(c => c.unread_count > 0);
    if (unreadConversations.length === 0) {
      Swal.fire('¡Sin mensajes nuevos!', '¡No tienes mensajes sin leer!', 'success');
    } else {
      Swal.fire('Mensajes sin leer', `Tienes ${unreadConversations.length} conversación(es) con mensajes sin leer`, 'info');
    }
  };

  const handleSendMessage = () => {
    if (companies.length === 0) {
      Swal.fire('Error', 'No hay empresas disponibles para enviar mensajes', 'error');
      return;
    }
    if (!selectedCompany || !newMessage.trim()) {
      Swal.fire('Error', 'Por favor selecciona una empresa e ingresa un mensaje', 'error');
      return;
    }

    // Simular envío
    const messageData = {
      message: newMessage,
      files: attachedFiles.length > 0 ? `${attachedFiles.length} archivo(s) adjunto(s)` : null
    };

    Swal.fire('¡Mensaje Enviado!', 'Mensaje enviado exitosamente', 'success');

    setShowNewMessageModal(false);
    setSelectedCompany('');
    setNewMessage('');
    setAttachedFiles([]);
  };

  const handleUploadPaymentProof = () => {
    setShowPaymentProofModal(true);
  };

  const handlePaymentProofFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: Archivo demasiado grande (máx. 10MB)`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Solo se permiten imágenes y PDF`);
      } else {
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        });
      }
    });

    if (errors.length > 0) {
      Swal.fire('Errores en archivos', errors.join('\n'), 'error');
    }

    if (validFiles.length > 0) {
      setPaymentProofFiles(prev => [...prev, ...validFiles].slice(0, 3)); // Máximo 3 archivos
      Swal.fire('¡Archivos Adjuntados!', `${validFiles.length} archivo(s) de comprobante adjuntado(s)`, 'success');
    }

    event.target.value = '';
  };

  const removePaymentProofFile = (fileId) => {
    setPaymentProofFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
  };

  const handleSubmitPaymentProof = () => {
    if (!paymentAmount || !paymentMethod || paymentProofFiles.length === 0) {
      Swal.fire('Error', 'Por favor completa todos los campos y adjunta al menos un comprobante', 'error');
      return;
    }

    const numAmount = parseFloat(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire('Error', 'Por favor ingresa un monto válido', 'error');
      return;
    }

    // Simular envío del comprobante
    Swal.fire('¡Comprobante Enviado!', `Comprobante de pago por ${formatCurrency(numAmount)} enviado exitosamente. La empresa lo validará en las próximas 24-48 horas.`, 'success');

    setShowPaymentProofModal(false);
    setPaymentAmount('');
    setPaymentMethod('');
    setPaymentProofFiles([]);
  };

  // Manejar respuesta a propuesta
  const handleProposalResponse = async (message, response) => {
    if (response === 'accept') {
      await Swal.fire({
        icon: 'success',
        title: '¡Propuesta Aceptada!',
        text: 'La propuesta ha sido aceptada. La empresa será notificada automáticamente.',
        confirmButtonText: 'Continuar',
        customClass: { popup: 'swal-wide' }
      });

      // Aquí iría la lógica para actualizar el estado de la propuesta en la BD
      console.log('Propuesta aceptada:', message.id);

    } else if (response === 'reject') {
      setSelectedProposalMessage(message);
      setShowRejectionReason(true);

    } else if (response === 'negotiate') {
      // Abrir modal de negociación o simplemente mostrar input
      const { value: negotiationMessage } = await Swal.fire({
        title: 'Negociar Propuesta',
        input: 'textarea',
        inputLabel: 'Describe tu contrapropuesta',
        inputPlaceholder: 'Ej: ¿Podrían reducir el descuento al 10%?',
        inputValidator: (value) => {
          if (!value) {
            return 'Por favor escribe tu contrapropuesta';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Enviar Negociación',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'swal-wide' }
      });

      if (negotiationMessage) {
        await Swal.fire({
          icon: 'info',
          title: 'Negociación Enviada',
          text: 'Tu contrapropuesta ha sido enviada a la empresa.',
          confirmButtonText: 'Ok',
          customClass: { popup: 'swal-wide' }
        });

        // Aquí iría la lógica para enviar la negociación
        console.log('Negociación enviada:', message.id, negotiationMessage);
      }
    }
  };

  // Enviar motivo de rechazo
  const handleSendRejectionReason = async () => {
    if (!rejectionReason.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Motivo requerido',
        text: 'Por favor explica por qué rechazas la propuesta.',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal-wide' }
      });
      return;
    }

    await Swal.fire({
      icon: 'info',
      title: 'Rechazo Enviado',
      text: 'Tu motivo de rechazo ha sido enviado a la empresa.',
      confirmButtonText: 'Continuar',
      customClass: { popup: 'swal-wide' }
    });

    // Aquí iría la lógica para enviar el rechazo con motivo
    console.log('Rechazo enviado:', selectedProposalMessage.id, rejectionReason);

    setShowRejectionReason(false);
    setRejectionReason('');
    setSelectedProposalMessage(null);
  };

  // Verificar si un mensaje es una propuesta
  const isProposalMessage = (message) => {
    // Por ahora, detectar por contenido. En el futuro, usar un campo específico
    const proposalKeywords = ['propuesta', 'oferta', 'descuento', 'acuerdo', 'negociación'];
    const content = message.content?.toLowerCase() || '';
    return proposalKeywords.some(keyword => content.includes(keyword));
  };

  const handleFileSelect = (event, isConversation = false) => {
    const files = Array.from(event.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: Archivo demasiado grande (máx. 10MB)`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de archivo no permitido`);
      } else {
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        });
      }
    });

    if (errors.length > 0) {
      Swal.fire('Errores en archivos', errors.join('\n'), 'error');
    }

    if (validFiles.length > 0) {
      if (isConversation) {
        // Para conversación, solo permitir un archivo por mensaje
        setAttachedFiles([validFiles[0]]);
      } else {
        setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Máximo 5 archivos
      }

      Swal.fire('¡Archivos Adjuntados!', `${validFiles.length} archivo(s) adjuntado(s)`, 'success');
    }

    // Limpiar input
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Limpiar URL del objeto para liberar memoria
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100/30 to-accent-50/20">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold tracking-tight">
                    Centro de Mensajes
                  </h1>
                  <p className="text-primary-100 text-sm">
                    Comunícate con las empresas acreedoras
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white">En línea</span>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  className="shadow-glow hover:scale-105 transition-all"
                  onClick={handleNewMessage}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Nuevo Mensaje
                </Button>
              </div>
            </div>
          </div>
        </div>
  
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conversations Sidebar */}
            <div className="lg:col-span-1">
              <Card variant="elevated" className="h-fit shadow-soft border-primary-200/50">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-primary-600" />
                      </div>
                      <h2 className="text-lg font-display font-bold text-secondary-900">Conversaciones</h2>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-xl border border-primary-200/50">
                      <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary-700">{conversations.length} activas</span>
                    </div>
                  </div>
  
                  {/* Conversations List */}
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl inline-block mb-4">
                        <MessageSquare className="w-12 h-12 text-secondary-400" />
                      </div>
                      <p className="text-secondary-600 text-sm font-medium">No hay conversaciones activas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((conversation, index) => (
                        <div
                          key={conversation.id}
                          className="group p-4 rounded-2xl border border-secondary-200 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-accent-50/30 cursor-pointer transition-all duration-300 hover:shadow-medium hover:scale-[1.02]"
                          onClick={() => handleViewConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300 shadow-soft">
                              <Building className="w-4 h-4 text-primary-600 group-hover:text-primary-700" />
                            </div>
  
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-secondary-900 truncate text-sm">
                                  {conversation.company_name}
                                </h3>
                                <span className="text-xs text-secondary-500 font-medium">
                                  {new Date(conversation.timestamp).toLocaleDateString()}
                                </span>
                              </div>
  
                              <p className="text-secondary-600 text-sm line-clamp-2 mb-2 leading-relaxed">
                                {conversation.last_message}
                              </p>
  
                              {conversation.unread_count > 0 && (
                                <div className="flex items-center justify-between">
                                  <Badge variant="primary" className="text-xs px-3 py-1 animate-pulse font-bold bg-primary-500 hover:bg-primary-600">
                                    {conversation.unread_count} nuevo{conversation.unread_count !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
  
                  {/* Quick Actions */}
                  <div className="mt-6 pt-6 border-t border-secondary-200">
                    <h3 className="text-sm font-bold text-secondary-900 mb-4 font-display">Acciones Rápidas</h3>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-warning-50 hover:text-warning-700 hover:border-warning-200 transition-all"
                        onClick={handleViewUnreadMessages}
                        leftIcon={<Mail className="w-4 h-4 text-warning-500" />}
                      >
                        Mensajes no leídos
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-success-50 hover:text-success-700 hover:border-success-200 transition-all"
                        onClick={handleUploadPaymentProof}
                        leftIcon={<FileText className="w-4 h-4 text-success-500" />}
                      >
                        Subir Comprobante
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
  
            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              <Card variant="elevated" className="h-[600px] flex flex-col shadow-soft border-primary-200/50">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-primary-200 bg-gradient-to-r from-primary-50 via-primary-100/50 to-accent-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-secondary-900 font-display">{selectedConversation.company_name}</h3>
                          <p className="text-sm text-secondary-600 font-medium">Empresa acreedora</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-success-50 rounded-xl border border-success-200/50">
                          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-success-700">En línea</span>
                        </div>
                      </div>
                    </div>
  
                    {/* Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-secondary-50/30 to-white">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-soft ${
                                message.sender === 'user'
                                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                                  : 'bg-white text-secondary-900 rounded-bl-md border border-secondary-200 hover:shadow-medium transition-all'
                              }`}
                            >
                              <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                              <p className={`text-xs mt-2 font-medium ${
                                message.sender === 'user' ? 'text-primary-100' : 'text-secondary-500'
                              }`}>
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                            </div>

                            {/* Botones de respuesta rápida para propuestas */}
                            {message.sender === 'company' && isProposalMessage(message) && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="gradient"
                                  size="sm"
                                  onClick={() => handleProposalResponse(message, 'accept')}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-soft hover:shadow-glow transition-all"
                                  leftIcon={<CheckCircle className="w-4 h-4" />}
                                >
                                  Sí Acepto
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProposalResponse(message, 'reject')}
                                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-4 py-2 rounded-xl transition-all"
                                  leftIcon={<XCircle className="w-4 h-4" />}
                                >
                                  No Acepto
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProposalResponse(message, 'negotiate')}
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 px-4 py-2 rounded-xl transition-all"
                                  leftIcon={<MessageCircle className="w-4 h-4" />}
                                >
                                  Negociar
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
  
                    {/* Message Input */}
                    <div className="p-6 border-t border-secondary-200 bg-gradient-to-r from-white to-secondary-50/50">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Input
                            placeholder="Escribe tu mensaje..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="rounded-2xl border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20 text-lg"
                          />
                        </div>
  
                        <input
                          type="file"
                          ref={conversationFileInputRef}
                          onChange={(e) => handleFileSelect(e, true)}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                          multiple={false}
                        />
  
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-3 hover:bg-primary-50 hover:border-primary-300 hover:scale-105 transition-all"
                          onClick={() => conversationFileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4 text-primary-500" />
                        </Button>
  
                        <Button
                          variant="gradient"
                          className="px-6 py-3 rounded-2xl shadow-soft hover:shadow-glow transition-all"
                          onClick={() => {
                            if (newMessage.trim() || attachedFiles.length > 0) {
                              Swal.fire('¡Mensaje enviado!', 'Tu mensaje ha sido enviado exitosamente', 'success');
                              setNewMessage('');
                              setAttachedFiles([]);
                            }
                          }}
                          disabled={!newMessage.trim() && attachedFiles.length === 0}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
  
                      {/* File Preview */}
                      {attachedFiles.length > 0 && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-warning-50 to-warning-100/50 rounded-2xl border-2 border-warning-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getFileIcon(attachedFiles[0].type)}
                              <div>
                                <span className="text-sm font-bold text-warning-900">{attachedFiles[0].name}</span>
                                <p className="text-xs text-warning-700 font-medium">{formatFileSize(attachedFiles[0].size)}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(attachedFiles[0].id)}
                              className="text-danger-600 hover:text-danger-700 hover:scale-110 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Empty State */
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="p-8 bg-gradient-to-br from-primary-100 via-primary-200 to-accent-100 rounded-3xl inline-block mb-6 shadow-soft">
                        <MessageSquare className="w-16 h-16 text-primary-600" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
                        Selecciona una conversación
                      </h3>
                      <p className="text-secondary-600 text-lg max-w-md font-medium">
                        Elige una conversación del panel lateral para ver los mensajes y responder.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>


      {/* Modal Nuevo Mensaje */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title="Nuevo Mensaje"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-8 bg-gradient-to-br from-primary-100 via-primary-200 to-accent-100 rounded-3xl inline-block mb-6 shadow-soft">
              <Send className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              Iniciar Nueva Conversación
            </h3>
            <p className="text-secondary-600 font-medium">
              Selecciona una empresa y envía tu primer mensaje
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
                Empresa Destinataria
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg disabled:bg-secondary-100 disabled:cursor-not-allowed"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={companies.length === 0}
              >
                <option value="">
                  {companies.length === 0 ? 'No hay empresas disponibles' : 'Seleccionar empresa...'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
                Mensaje
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white text-lg"
                rows={4}
                placeholder="Escribe tu mensaje aquí..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>

            {/* Adjuntar archivos */}
            <div>
              <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
                Adjuntar Archivos (opcional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e, false)}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                  multiple
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:bg-primary-50 hover:border-primary-300 hover:scale-105 transition-all"
                  leftIcon={<Paperclip className="w-4 h-4 text-primary-500" />}
                >
                  Adjuntar Archivos
                </Button>
                {attachedFiles.length > 0 && (
                  <span className="text-sm text-secondary-600 font-medium">
                    {attachedFiles.length} archivo(s) adjunto(s)
                  </span>
                )}
              </div>
            </div>

            {/* Vista previa de archivos adjuntos */}
            {attachedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-secondary-900 font-display">Archivos Adjuntos</h4>
                {attachedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-gradient-to-r from-warning-50 to-warning-100/50 p-4 rounded-xl border-2 border-warning-200/50">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-bold text-warning-900">{file.name}</p>
                        <p className="text-xs text-warning-700 font-medium">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-danger-600 hover:text-danger-700 hover:scale-110 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 border-2 border-warning-200 rounded-2xl p-6">
              <h4 className="font-bold text-warning-900 mb-4 font-display text-lg">Información Importante</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <span className="text-warning-800 font-medium">Las empresas responderán dentro de 24-48 horas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <span className="text-warning-800 font-medium">Mantén un tono respetuoso y profesional</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <span className="text-warning-800 font-medium">Incluye detalles específicos sobre tu consulta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <span className="text-warning-800 font-medium">Máximo 5 archivos por mensaje, 10MB cada uno</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSelectedCompany('');
                  setNewMessage('');
                  setAttachedFiles([]);
                  attachedFiles.forEach(file => URL.revokeObjectURL(file.url));
                }}
                className="flex-1 hover:scale-105 transition-all"
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSendMessage}
                className="flex-1 shadow-soft hover:shadow-glow"
                leftIcon={<Send className="w-4 h-4" />}
                disabled={companies.length === 0}
              >
                {companies.length === 0 ? 'No hay empresas disponibles' : 'Enviar Mensaje'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Motivo de Rechazo */}
      <Modal
        isOpen={showRejectionReason}
        onClose={() => {
          setShowRejectionReason(false);
          setRejectionReason('');
          setSelectedProposalMessage(null);
        }}
        title="¿Por qué rechazas la propuesta?"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-red-100 via-red-200 to-pink-100 rounded-3xl inline-block mb-4 shadow-soft">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <p className="text-secondary-600 font-medium">
              Ayúdanos a entender tu decisión para mejorar nuestras propuestas futuras.
            </p>
          </div>

          <div>
            <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
              Motivo del Rechazo
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white text-lg"
              rows={4}
              placeholder="Ej: El descuento no es suficiente, prefiero pagar en más cuotas, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-4">
            <p className="text-red-800 font-medium text-sm">
              💡 <strong>Importante:</strong> Tu respuesta será enviada automáticamente a la empresa para que puedan ajustar su oferta.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectionReason(false);
                setRejectionReason('');
                setSelectedProposalMessage(null);
              }}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendRejectionReason}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-soft hover:shadow-glow"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Motivo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Subir Comprobante de Pago */}
      <Modal
        isOpen={showPaymentProofModal}
        onClose={() => setShowPaymentProofModal(false)}
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-8 bg-gradient-to-br from-success-100 via-success-200 to-emerald-100 rounded-3xl inline-block mb-6 shadow-soft">
              <FileText className="w-12 h-12 text-success-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              Subir Comprobante de Pago
            </h3>
            <p className="text-secondary-600 font-medium">
              Adjunta el comprobante de tu transferencia bancaria o pago con tarjeta de crédito
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
                Monto Pagado
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="number"
                  className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg"
                  placeholder="Ej: 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
                Método de Pago
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-lg"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Seleccionar método...</option>
                <option value="bank_transfer">Transferencia bancaria</option>
                <option value="credit_card">Tarjeta de crédito</option>
                <option value="debit_card">Tarjeta de débito</option>
                <option value="other">Otro método</option>
              </select>
            </div>
          </div>

          {/* Adjuntar comprobantes */}
          <div>
            <label className="block text-lg font-bold text-secondary-900 mb-3 font-display">
              Adjuntar Comprobantes
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={paymentProofInputRef}
                onChange={handlePaymentProofFileSelect}
                className="hidden"
                accept="image/*,.pdf"
                multiple
              />
              <Button
                variant="outline"
                onClick={() => paymentProofInputRef.current?.click()}
                className="hover:bg-success-50 hover:border-success-300 hover:scale-105 transition-all"
                leftIcon={<Paperclip className="w-4 h-4 text-success-500" />}
              >
                Adjuntar Archivos
              </Button>
              {paymentProofFiles.length > 0 && (
                <span className="text-sm text-secondary-600 font-medium">
                  {paymentProofFiles.length} archivo(s) adjunto(s)
                </span>
              )}
            </div>
          </div>

          {/* Vista previa de archivos adjuntos */}
          {paymentProofFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-secondary-900 font-display">Comprobantes Adjuntos</h4>
              {paymentProofFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gradient-to-r from-info-50 to-info-100/50 p-4 rounded-xl border-2 border-info-200/50">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-bold text-info-900">{file.name}</p>
                      <p className="text-xs text-info-700 font-medium">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentProofFile(file.id)}
                    className="text-danger-600 hover:text-danger-700 hover:scale-110 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
            <h4 className="font-bold text-info-900 mb-4 font-display text-lg">Proceso de Validación</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">El comprobante será enviado automáticamente a la empresa</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">La empresa validará el pago en 24-48 horas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">Una vez validado, aparecerá como "Completado" en tu historial</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">Recibirás una notificación cuando sea aprobado</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentProofModal(false);
                setPaymentAmount('');
                setPaymentMethod('');
                setPaymentProofFiles([]);
                paymentProofFiles.forEach(file => URL.revokeObjectURL(file.url));
              }}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSubmitPaymentProof}
              className="flex-1 shadow-soft hover:shadow-glow-success"
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Enviar Comprobante
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessagesPage;