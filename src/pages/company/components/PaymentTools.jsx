/**
 * Payment Tools Component
 * Herramientas para generar links de pago y gestionar transferencias bancarias
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge, LoadingSpinner } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { getCompanyClients, getCompanyDebts } from '../../../services/databaseService';
import {
  Link as LinkIcon,
  Copy,
  Mail,
  MessageSquare,
  Banknote,
  CreditCard,
  Building,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Share2
} from 'lucide-react';

const PaymentTools = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [debts, setDebts] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDebt, setSelectedDebt] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientDebts();
    } else {
      setDebts([]);
      setSelectedDebt('');
    }
  }, [selectedClient]);

  const loadClients = async () => {
    if (!profile?.company?.id) return;

    try {
      const result = await getCompanyClients(profile.company.id);
      if (result.error) {
        console.error('Error loading clients:', result.error);
      } else {
        setClients(result.clients || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientDebts = async () => {
    if (!selectedClient) return;

    try {
      const result = await getCompanyDebts(profile.company.id, selectedClient);
      if (result.error) {
        console.error('Error loading debts:', result.error);
      } else {
        setDebts(result.debts || []);
      }
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  };

  const generatePaymentLink = async () => {
    if (!selectedDebt) {
      alert('Por favor selecciona una deuda');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la lógica para generar el link de pago
      // Por ahora simulamos la generación
      const debt = debts.find(d => d.id === selectedDebt);
      if (!debt) {
        alert('Deuda no encontrada');
        return;
      }

      // Generar link simulado
      const baseUrl = window.location.origin;
      const paymentLink = `${baseUrl}/pagar/${selectedDebt}?method=${paymentMethod}&company=${profile.company.id}`;

      setGeneratedLink(paymentLink);
      setShowLinkModal(true);
    } catch (error) {
      console.error('Error generating payment link:', error);
      alert('Error al generar el link de pago');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const debt = debts.find(d => d.id === selectedDebt);
    const subject = `Link de Pago - ${debt?.description || 'Deuda pendiente'}`;
    const body = `Estimado cliente,

Le enviamos el link para realizar el pago de su deuda:

${generatedLink}

Método de pago: ${paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria'}

Si tiene alguna duda, no dude en contactarnos.

Atentamente,
${profile.company.business_name}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const shareViaWhatsApp = () => {
    const debt = debts.find(d => d.id === selectedDebt);
    const message = `Hola! Te envío el link para pagar tu deuda *${debt?.description || 'pendiente'}*:

${generatedLink}

Método: ${paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}

Si tienes dudas, contáctanos.`;

    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink);
  };

  const showTransferInfo = () => {
    setShowTransferModal(true);
  };

  const selectedDebtInfo = debts.find(d => d.id === selectedDebt);

  return (
    <>
      <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Herramientas de Pago</h3>
            <p className="text-gray-600">Genera links de pago y gestiona transferencias bancarias</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="bg-white/60 rounded-xl p-4 border border-green-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Seleccionar Cliente
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
            >
              <option value="">Selecciona un cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.business_name} - {client.rut}
                </option>
              ))}
            </select>
          </div>

          {/* Debt Selection */}
          {selectedClient && (
            <div className="bg-white/60 rounded-xl p-4 border border-green-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Seleccionar Deuda
              </label>
              <select
                value={selectedDebt}
                onChange={(e) => setSelectedDebt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
              >
                <option value="">Selecciona una deuda...</option>
                {debts.map(debt => (
                  <option key={debt.id} value={debt.id}>
                    ${debt.current_amount?.toLocaleString('es-CL')} - {debt.description || 'Sin descripción'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method Selection */}
          {selectedDebt && (
            <div className="bg-white/60 rounded-xl p-4 border border-green-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Método de Pago
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'mercadopago'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="mercadopago"
                    checked={paymentMethod === 'mercadopago'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Mercado Pago</span>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="transferencia"
                    checked={paymentMethod === 'transferencia'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <Banknote className="w-5 h-5" />
                  <span className="font-medium">Transferencia Bancaria</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedDebt && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gradient"
                onClick={generatePaymentLink}
                loading={loading}
                className="flex-1"
                leftIcon={<LinkIcon className="w-4 h-4" />}
              >
                {loading ? 'Generando...' : 'Generar Link de Pago'}
              </Button>

              {paymentMethod === 'transferencia' && (
                <Button
                  variant="secondary"
                  onClick={showTransferInfo}
                  className="flex-1"
                  leftIcon={<Banknote className="w-4 h-4" />}
                >
                  Ver Datos de Transferencia
                </Button>
              )}
            </div>
          )}

          {/* Selected Debt Info */}
          {selectedDebtInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información de la Deuda Seleccionada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">Monto:</span>
                  <span className="font-semibold ml-2">${selectedDebtInfo.current_amount?.toLocaleString('es-CL')}</span>
                </div>
                <div>
                  <span className="text-blue-700">Deudor:</span>
                  <span className="font-semibold ml-2">{selectedDebtInfo.user?.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Fecha:</span>
                  <span className="font-semibold ml-2">
                    {new Date(selectedDebtInfo.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Estado:</span>
                  <Badge variant={selectedDebtInfo.status === 'active' ? 'danger' : 'secondary'} className="ml-2">
                    {selectedDebtInfo.status === 'active' ? 'Pendiente' : selectedDebtInfo.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Link de Pago Generado"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-2">¡Link Generado Exitosamente!</h3>
                <p className="text-green-700 mb-4">
                  Comparte este link con tu cliente para que pueda realizar el pago de manera segura.
                </p>
                <div className="bg-white p-3 rounded-lg border border-green-200 font-mono text-sm break-all">
                  {generatedLink}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="primary"
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              {linkCopied ? '¡Copiado!' : 'Copiar Link'}
            </Button>

            <Button
              variant="secondary"
              onClick={shareViaEmail}
              className="flex items-center justify-center gap-2"
              leftIcon={<Mail className="w-4 h-4" />}
            >
              Enviar por Email
            </Button>

            <Button
              variant="secondary"
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center gap-2"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Enviar por WhatsApp
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Información Importante</h4>
                <p className="text-sm text-blue-700">
                  Este link es único para esta deuda específica. Una vez que el cliente complete el pago,
                  el sistema lo registrará automáticamente y actualizará el estado de la deuda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Transfer Information Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Datos para Transferencia Bancaria"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Información para Transferencia</h3>
                <p className="text-blue-700 mb-4">
                  Comparte estos datos bancarios con tu cliente para que pueda realizar la transferencia.
                </p>

                <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Banco</label>
                      <p className="text-lg font-semibold text-gray-900">Banco Estado</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Cuenta</label>
                      <p className="text-lg font-semibold text-gray-900">Cuenta Corriente</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Número de Cuenta</label>
                      <p className="text-lg font-semibold text-gray-900 font-mono">123456789012</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">RUT</label>
                      <p className="text-lg font-semibold text-gray-900 font-mono">12.345.678-9</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre del Titular</label>
                    <p className="text-lg font-semibold text-gray-900">{profile.company?.business_name || 'Empresa S.A.'}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monto a Transferir</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedDebtInfo?.current_amount?.toLocaleString('es-CL') || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Instrucciones para el Cliente</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Realizar la transferencia por el monto exacto indicado</li>
                  <li>• Indicar el RUT del deudor como referencia</li>
                  <li>• Enviar el comprobante de transferencia por email</li>
                  <li>• El pago será validado en 24-48 horas hábiles</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              variant="gradient"
              onClick={copyToClipboard}
              className="flex-1"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copiar Datos Bancarios
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PaymentTools;