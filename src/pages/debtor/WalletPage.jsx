/**
 * Wallet Page
 *
 * Página para gestionar la billetera virtual del deudor
 */

import { useState } from 'react';
import { Card, Button, Modal, Input } from '../../components/common';
import { useWallet } from '../../hooks';
import { formatCurrency } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Gift,
  Download,
  Eye,
  CreditCard,
  Check,
} from 'lucide-react';

const WalletPage = () => {
  const { balance, transactions, getStats } = useWallet();
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');

  const stats = getStats();

  const handleAddFunds = () => {
    setShowAddFundsModal(true);
  };

  const handleWithdrawFunds = () => {
    setShowWithdrawModal(true);
  };

  const handleRedeemGiftCard = () => {
    setShowGiftCardModal(true);
  };

  const confirmAddFunds = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire('Error', 'Por favor ingresa un monto válido', 'error');
      return;
    }
    if (numAmount > 500000) {
      Swal.fire('Error', 'El monto máximo para agregar fondos es $500.000', 'error');
      return;
    }

    // Simular procesamiento
    setShowAddFundsModal(false);
    setAmount('');
    Swal.fire('¡Fondos Agregados!', `Fondos por ${formatCurrency(numAmount)} agregados exitosamente`, 'success');
  };

  const confirmWithdrawFunds = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire('Error', 'Por favor ingresa un monto válido', 'error');
      return;
    }
    if (numAmount > balance) {
      Swal.fire('Error', 'No tienes suficiente saldo para retirar esa cantidad', 'error');
      return;
    }
    if (numAmount < 10000) {
      Swal.fire('Error', 'El monto mínimo para retirar es $10.000', 'error');
      return;
    }

    // Simular procesamiento
    setShowWithdrawModal(false);
    setAmount('');
    Swal.fire('¡Retiro Procesado!', `Retiro de ${formatCurrency(numAmount)} procesado exitosamente`, 'success');
  };

  const confirmRedeemGiftCard = () => {
    if (!giftCardCode.trim()) {
      Swal.fire('Error', 'Por favor ingresa el código de la gift card', 'error');
      return;
    }

    // Simular canje
    setShowGiftCardModal(false);
    setGiftCardCode('');
    Swal.fire('¡Gift Card Canjeada!', 'Gift card canjeada exitosamente', 'success');
  };

  const handleExportTransactions = () => {
    const csvContent = [
      ['Fecha', 'Concepto', 'Tipo', 'Monto'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.concept.replace(/_/g, ' '),
        t.transaction_type,
        t.amount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_wallet_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('¡Exportado!', 'Transacciones exportadas exitosamente', 'success');
  };

  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const handleViewAllTransactions = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-warning-50 via-warning-100 to-warning-200 rounded-3xl p-8 shadow-strong animate-fade-in border border-warning-200/50">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning-200 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning-300 rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warning-500 rounded-2xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-secondary-900">
                Mi Billetera
              </h1>
              <p className="text-secondary-600 text-lg">
                Gestiona tus incentivos y fondos para pagar deudas
              </p>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-soft">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-success-500" />
                <div>
                  <p className="text-sm text-secondary-600 font-medium">Total Créditos</p>
                  <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalCredits)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-soft">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-danger-500" />
                <div>
                  <p className="text-sm text-secondary-600 font-medium">Total Débitos</p>
                  <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalDebits)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-soft">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-primary-500" />
                <div>
                  <p className="text-sm text-secondary-600 font-medium">Transacciones</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-soft">
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-secondary-500" />
                <div>
                  <p className="text-sm text-secondary-600 font-medium">Exportar</p>
                  <Button
                    variant="warning"
                    size="sm"
                    className="mt-2 hover:scale-105 transition-all"
                    onClick={handleExportTransactions}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <Card
        variant="elevated"
        className="group cursor-pointer hover:scale-[1.01] transition-all duration-300 animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl p-6 text-white shadow-soft">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-warning-100 text-sm font-medium uppercase tracking-wide">Saldo Disponible</p>
                  <p className="text-3xl font-display font-bold">{formatCurrency(balance)}</p>
                </div>
              </div>
              <p className="text-warning-200 text-sm">Disponible para pagar deudas registradas</p>
            </div>
            <div className="ml-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Wallet className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          variant="elevated"
          className="group cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '300ms' }}
          onClick={handleAddFunds}
        >
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl group-hover:shadow-glow-success transition-all duration-300">
                <Plus className="w-8 h-8 text-success-600" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-secondary-900 mb-2">Agregar Fondos</h3>
            <p className="text-secondary-600 text-sm">Solo para pagar deudas registradas</p>
          </div>
        </Card>

        <Card
          variant="elevated"
          className="group cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '400ms' }}
          onClick={handleWithdrawFunds}
        >
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-danger-100 to-danger-200 rounded-2xl group-hover:shadow-glow-danger transition-all duration-300">
                <Minus className="w-8 h-8 text-danger-600" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-secondary-900 mb-2">Retirar Fondos</h3>
            <p className="text-secondary-600 text-sm">Transfiere dinero a tu cuenta</p>
          </div>
        </Card>

        <Card
          variant="elevated"
          className="group cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '500ms' }}
          onClick={handleRedeemGiftCard}
        >
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:shadow-glow-purple transition-all duration-300">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-secondary-900 mb-2">Canjear Gift Card</h3>
            <p className="text-secondary-600 text-sm">Utiliza códigos promocionales</p>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card
        variant="elevated"
        className="animate-slide-up"
        style={{ animationDelay: '600ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-secondary-900">
                {showAllTransactions ? 'Todas las Transacciones' : 'Transacciones Recientes'}
              </h3>
              <p className="text-sm text-secondary-600">
                {showAllTransactions
                  ? `Todas las operaciones realizadas (${transactions.length})`
                  : 'Últimas 5 operaciones realizadas'
                }
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hover:scale-105 transition-all"
            onClick={handleViewAllTransactions}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {showAllTransactions ? 'Ver Menos' : 'Ver Todas'}
          </Button>
        </div>

        <div className="space-y-4">
          {transactions.slice(0, showAllTransactions ? transactions.length : 5).map((transaction, index) => (
            <div
              key={transaction.id}
              className="group flex items-center justify-between py-4 px-5 bg-gradient-to-r from-white to-secondary-50/50 border border-secondary-200/60 rounded-2xl hover:shadow-medium hover:border-primary-300/60 transition-all duration-300 cursor-pointer hover:scale-[1.01] animate-fade-in"
              style={{ animationDelay: `${700 + index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl group-hover:shadow-soft transition-all duration-300 ${
                  transaction.transaction_type === 'credit'
                    ? 'bg-gradient-to-br from-success-100 to-success-200'
                    : 'bg-gradient-to-br from-danger-100 to-danger-200'
                }`}>
                  {transaction.transaction_type === 'credit' ? (
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-danger-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-secondary-900 text-lg capitalize">
                    {transaction.concept.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-secondary-500 font-medium">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-display font-bold text-xl ${
                  transaction.transaction_type === 'credit'
                    ? 'text-success-600'
                    : 'text-danger-600'
                }`}>
                  {transaction.transaction_type === 'credit' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">
                  {transaction.transaction_type === 'credit' ? 'Crédito' : 'Débito'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl inline-block mb-6">
              <CreditCard className="w-16 h-16 text-secondary-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              No hay transacciones
            </h3>
            <p className="text-secondary-600 text-lg">
              Aún no has realizado ninguna transacción en tu billetera
            </p>
          </div>
        )}
      </Card>

      {/* Modal Agregar Fondos */}
      <Modal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        title="Agregar Fondos"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl">
              <Plus className="w-8 h-8 text-success-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-display font-bold text-secondary-900">
                Agregar fondos para pagar deudas
              </h3>
              <p className="text-secondary-600 mt-2 text-lg">
                Estos fondos serán utilizados exclusivamente para pagar las deudas que registres en la plataforma.
              </p>
            </div>
          </div>

          <Input
            label="Monto a agregar"
            type="number"
            placeholder="Ej: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<DollarSign className="w-5 h-5" />}
            className="text-lg"
          />

          <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
            <h4 className="font-bold text-info-900 mb-4 font-display text-lg">Información importante</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">💰 <strong>Uso exclusivo:</strong> Solo para pagar deudas registradas en la plataforma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">Monto máximo: $500.000 por transacción</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">Los fondos estarán disponibles inmediatamente</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                <span className="text-info-800 font-medium">Se aplicarán las comisiones correspondientes</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddFundsModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmAddFunds}
              className="flex-1 shadow-soft hover:shadow-glow"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Agregar Fondos
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Retirar Fondos */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Retirar Fondos"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-danger-100 to-danger-200 rounded-2xl">
              <Minus className="w-8 h-8 text-danger-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-display font-bold text-secondary-900">
                Retirar fondos de tu billetera
              </h3>
              <p className="text-secondary-600 mt-2 text-lg">
                Ingresa el monto que deseas retirar de tu saldo disponible.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-5 border border-secondary-200/50">
            <div className="flex justify-between items-center">
              <span className="text-secondary-600 font-bold text-lg">Saldo disponible:</span>
              <span className="font-display font-bold text-secondary-900 text-2xl">{formatCurrency(balance)}</span>
            </div>
          </div>

          <Input
            label="Monto a retirar"
            type="number"
            placeholder="Ej: 25000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<DollarSign className="w-5 h-5" />}
            className="text-lg"
          />

          <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 border-2 border-warning-200 rounded-2xl p-6">
            <h4 className="font-bold text-warning-900 mb-4 font-display text-lg">Información importante</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-warning-800 font-medium">Monto mínimo: $10.000 por retiro</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-warning-800 font-medium">El retiro puede tardar 1-3 días hábiles</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-warning-800 font-medium">Se aplicarán las comisiones correspondientes</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowWithdrawModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmWithdrawFunds}
              className="flex-1 shadow-soft hover:shadow-glow"
              leftIcon={<Minus className="w-4 h-4" />}
            >
              Retirar Fondos
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Canjear Gift Card */}
      <Modal
        isOpen={showGiftCardModal}
        onClose={() => setShowGiftCardModal(false)}
        title="Canjear Gift Card"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-display font-bold text-secondary-900">
                Canjear Gift Card
              </h3>
              <p className="text-secondary-600 mt-2 text-lg">
                Ingresa el código de tu gift card para agregarlo a tu billetera.
              </p>
            </div>
          </div>

          <Input
            label="Código de Gift Card"
            placeholder="Ej: GIFT-123456-ABCDEF"
            value={giftCardCode}
            onChange={(e) => setGiftCardCode(e.target.value)}
            leftIcon={<Gift className="w-5 h-5" />}
            className="text-lg"
          />

          <div className="bg-gradient-to-r from-success-50 to-success-100/50 border-2 border-success-200 rounded-2xl p-6">
            <h4 className="font-bold text-success-900 mb-4 font-display text-lg">Beneficios</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-800 font-medium">Monto agregado inmediatamente a tu saldo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-800 font-medium">Sin comisiones por canje</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-800 font-medium">Válido para cualquier uso en la plataforma</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowGiftCardModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmRedeemGiftCard}
              className="flex-1 shadow-soft hover:shadow-glow"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Canjear Gift Card
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WalletPage;