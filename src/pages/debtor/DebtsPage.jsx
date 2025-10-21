/**
 * Debts Page
 *
 * Página para mostrar las deudas del deudor
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, Button, Input, Modal } from '../../components/common';
import { useDebts } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Plus,
  CreditCard,
  TrendingUp,
  Calculator,
} from 'lucide-react';

const DebtsPage = () => {
  const { debts, loading } = useDebts();
  const [filter, setFilter] = useState('all'); // all, active, in_negotiation, paid
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [debtForm, setDebtForm] = useState({
    companyName: '',
    totalDebt: '',
    installmentAmount: '',
    paidInstallments: '',
    pendingInstallments: '',
    dueDate: '',
    lastPaymentDate: '',
    debtType: 'credit_card'
  });
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando deudas..." />;
  }

  const filteredDebts = debts.filter(debt => {
    if (filter === 'all') return true;
    return debt.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="w-5 h-5 text-danger-600" />;
      case 'in_negotiation':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <FileText className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="danger">Activa</Badge>;
      case 'in_negotiation':
        return <Badge variant="warning">En Negociación</Badge>;
      case 'paid':
        return <Badge variant="success">Pagada</Badge>;
      case 'condoned':
        return <Badge variant="success">Condonada</Badge>;
      case 'defaulted':
        return <Badge variant="danger">Morosa</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const handleDebtFormChange = (e) => {
    const { name, value } = e.target;
    setDebtForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDaysOverdue = (dueDate, lastPaymentDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const lastPayment = lastPaymentDate ? new Date(lastPaymentDate) : new Date();
    const diffTime = lastPayment - due;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();

    if (!debtForm.companyName || !debtForm.totalDebt || !debtForm.dueDate) {
      Swal.fire('Error', 'Por favor, completa todos los campos obligatorios', 'error');
      return;
    }

    setSaving(true);

    try {
      const daysOverdue = calculateDaysOverdue(debtForm.dueDate, debtForm.lastPaymentDate);

      // En producción, esto sería una llamada a la API para crear la deuda
      // const newDebt = await createDebt({
      //   original_amount: parseFloat(debtForm.totalDebt),
      //   current_amount: parseFloat(debtForm.totalDebt),
      //   interest_rate: 0,
      //   origin_date: debtForm.lastPaymentDate || new Date().toISOString().split('T')[0],
      //   due_date: debtForm.dueDate,
      //   debt_type: debtForm.debtType,
      //   company_name: debtForm.companyName,
      //   days_overdue: daysOverdue,
      //   installment_amount: debtForm.installmentAmount ? parseFloat(debtForm.installmentAmount) : null,
      //   paid_installments: debtForm.paidInstallments ? parseInt(debtForm.paidInstallments) : null,
      //   pending_installments: debtForm.pendingInstallments ? parseInt(debtForm.pendingInstallments) : null
      // });

      // Por ahora, solo mostrar éxito
      Swal.fire({
        title: '¡Deuda Registrada!',
        text: `Deuda con ${debtForm.companyName} registrada exitosamente${daysOverdue > 0 ? ` (${daysOverdue} días de mora)` : ''}`,
        icon: 'success',
        confirmButtonText: 'Ver Calculador de Ganancias'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/debtor/simulator';
        }
      });

      setShowAddDebtModal(false);
      setDebtForm({
        companyName: '',
        totalDebt: '',
        installmentAmount: '',
        paidInstallments: '',
        pendingInstallments: '',
        dueDate: '',
        lastPaymentDate: '',
        debtType: 'credit_card'
      });

    } catch (error) {
      Swal.fire('Error', 'Error al registrar la deuda', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = (debt) => {
    Swal.fire({
      title: 'Detalles de la Deuda',
      html: `
        <div class="text-left">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2">Deuda #${debt.debt_reference || debt.id.slice(-8)}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Empresa:</p>
                <p class="font-semibold">${debt.company?.business_name || 'Empresa'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Estado:</p>
                <p class="font-semibold">${debt.status === 'active' ? 'Activa' : debt.status === 'in_negotiation' ? 'En Negociación' : debt.status === 'paid' ? 'Pagada' : debt.status}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Monto Original:</p>
                <p class="font-semibold">${formatCurrency(debt.original_amount)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Monto Actual:</p>
                <p class="font-semibold">${formatCurrency(debt.current_amount)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Fecha de Origen:</p>
                <p class="font-semibold">${formatDate(debt.origin_date)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Fecha de Vencimiento:</p>
                <p class="font-semibold">${formatDate(debt.due_date)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Tipo de Deuda:</p>
                <p class="font-semibold capitalize">${debt.debt_type || 'No especificado'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Días de Mora:</p>
                <p class="font-semibold">${calculateDaysOverdue(debt.due_date, debt.last_payment_date)} días</p>
              </div>
            </div>
          </div>
          ${debt.description ? `
          <div class="mb-4">
            <p class="text-sm text-gray-600">Descripción:</p>
            <p class="text-sm">${debt.description}</p>
          </div>
          ` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6',
      width: '600px'
    });
  };

  const handleNegotiate = (debt) => {
    Swal.fire({
      title: 'Iniciar Negociación',
      html: `
        <div class="text-left">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Estás a punto de iniciar la negociación para:</p>
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="font-semibold">Deuda #${debt.debt_reference || debt.id.slice(-8)}</p>
              <p class="text-sm">Empresa: ${debt.company?.business_name || 'Empresa'}</p>
              <p class="text-sm">Monto: ${formatCurrency(debt.current_amount)}</p>
            </div>
          </div>
          <div class="mb-4">
            <p class="text-sm text-blue-600">
              <strong>💰 Comisión potencial:</strong> ${formatCurrency(36000)}
            </p>
            <p class="text-xs text-gray-500">
              Si logras un acuerdo exitoso, recibirás $36.000 de comisión
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Propuesta de pago (opcional)
            </label>
            <textarea
              id="negotiationProposal"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe tu propuesta de pago..."
            ></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar Negociación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        const proposal = document.getElementById('negotiationProposal')?.value || '';
        
        // En producción, aquí iría la lógica para iniciar la negociación
        console.log('Iniciando negociación para deuda:', debt.id, 'con propuesta:', proposal);
        
        Swal.fire({
          title: 'Negociación Iniciada',
          html: `
            <div class="text-left">
              <p class="text-green-600 mb-2">✅ Tu solicitud de negociación ha sido enviada</p>
              <p class="text-sm text-gray-600">La empresa ${debt.company?.business_name || 'Empresa'} revisará tu propuesta y te responderá pronto.</p>
              ${proposal ? `<p class="text-sm text-gray-600 mt-2"><strong>Tu propuesta:</strong> ${proposal}</p>` : ''}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#10b981'
        });
      }
    });
  };

  const handleViewCompleteDetails = () => {
    const totalDebts = debts.length;
    const activeDebts = debts.filter(d => d.status === 'active').length;
    const negotiatingDebts = debts.filter(d => d.status === 'in_negotiation').length;
    const paidDebts = debts.filter(d => d.status === 'paid').length;
    const totalAmount = debts.reduce((sum, debt) => sum + debt.current_amount, 0);
    const overdueDebts = debts.filter(debt => {
      if (!debt.due_date) return false;
      const dueDate = new Date(debt.due_date);
      return dueDate < new Date() && debt.status === 'active';
    });
    const totalOverdueAmount = overdueDebts.reduce((sum, debt) => sum + parseFloat(debt.current_amount || 0), 0);
    const potentialCommission = overdueDebts.length * 36000;

    Swal.fire({
      title: '📊 Detalles Completos de Mis Deudas',
      html: `
        <div class="text-left">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3">Resumen General</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Total Deudas:</p>
                <p class="text-xl font-bold text-blue-600">${totalDebts}</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Monto Total:</p>
                <p class="text-xl font-bold text-green-600">${formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3">Estado de Deudas</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-red-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Activas:</p>
                <p class="text-xl font-bold text-red-600">${activeDebts}</p>
              </div>
              <div class="bg-yellow-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">En Negociación:</p>
                <p class="text-xl font-bold text-yellow-600">${negotiatingDebts}</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Pagadas:</p>
                <p class="text-xl font-bold text-green-600">${paidDebts}</p>
              </div>
              <div class="bg-orange-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Morosas:</p>
                <p class="text-xl font-bold text-orange-600">${overdueDebts.length}</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3">💰 Potencial de Ganancias</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-purple-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Monto Moroso:</p>
                <p class="text-xl font-bold text-purple-600">${formatCurrency(totalOverdueAmount)}</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Comisión Potencial:</p>
                <p class="text-xl font-bold text-green-600">${formatCurrency(potentialCommission)}</p>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="font-semibold text-blue-900 mb-2">🎯 Recomendaciones</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Prioriza las deudas morosas para maximizar tus ganancias</li>
              <li>• Cada acuerdo exitoso te genera $36.000 de comisión</li>
              <li>• Usa el simulador para calcular tus ganancias potenciales</li>
            </ul>
          </div>

          <div class="mt-4 text-center">
            <button onclick="window.location.href='/debtor/simulator'" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              🚀 Ir al Simulador de Ganancias
            </button>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6',
      width: '700px'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Modernizado */}
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
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Mis Deudas
                </h1>
                <p className="text-primary-100 text-sm">
                  Gestiona y visualiza todas tus deudas activas
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="glass"
                size="md"
                onClick={() => setShowAddDebtModal(true)}
                className="hover:scale-105 transition-all"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Registrar Nueva Deuda
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Modernizadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-0.5">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-red-100 to-red-200 rounded-lg group-hover:shadow-glow-red transition-all duration-300">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {debts.filter(d => d.status === 'active').length}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Activas</p>
            <div className="text-xs text-red-600 mt-0.5 font-medium">
              Pendientes
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-0.5">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg group-hover:shadow-glow-yellow transition-all duration-300">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {debts.filter(d => d.status === 'in_negotiation').length}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Negociación</p>
            <div className="text-xs text-yellow-600 mt-0.5 font-medium">
              En proceso
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-0.5">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {debts.filter(d => d.status === 'paid').length}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Pagadas</p>
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              Saldados
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-0.5">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {formatCurrency(debts.reduce((sum, debt) => sum + debt.current_amount, 0))}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total</p>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">
              Adeudado
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card
        variant="glass"
        className="animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900">Filtrar Deudas</h3>
            <p className="text-sm text-secondary-600">Selecciona el tipo de deudas que quieres ver</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilter('all')}
            className="hover:scale-105 transition-all"
          >
            Todas ({debts.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilter('active')}
            className="hover:scale-105 transition-all"
            leftIcon={<AlertCircle className="w-4 h-4" />}
          >
            Activas ({debts.filter(d => d.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'in_negotiation' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilter('in_negotiation')}
            className="hover:scale-105 transition-all"
            leftIcon={<Clock className="w-4 h-4" />}
          >
            En Negociación ({debts.filter(d => d.status === 'in_negotiation').length})
          </Button>
          <Button
            variant={filter === 'paid' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilter('paid')}
            className="hover:scale-105 transition-all"
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Pagadas ({debts.filter(d => d.status === 'paid').length})
          </Button>
        </div>
      </Card>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <Card
          variant="elevated"
          className="text-center py-16 animate-fade-in"
        >
          <div className="p-8 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-8">
            <CheckCircle className="w-20 h-20 text-success-600" />
          </div>
          <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
            {filter === 'all' ? '¡Excelente!' : 'Sin deudas en esta categoría'}
          </h3>
          <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
            {filter === 'all'
              ? "No tienes deudas registradas actualmente. ¡Mantén tu historial limpio!"
              : `No tienes deudas ${filter === 'active' ? 'activas' : filter === 'in_negotiation' ? 'en negociación' : 'pagadas'} en este momento.`
            }
          </p>
          {filter !== 'all' && (
            <Button
              variant="outline"
              onClick={() => setFilter('all')}
              className="hover:scale-105 transition-all"
            >
              Ver todas las deudas
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredDebts.map((debt, index) => (
            <Card
              key={debt.id}
              variant="elevated"
              className="group hover:scale-[1.01] transition-all duration-300 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                    {getStatusIcon(debt.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-bold text-secondary-900 font-display">
                        Deuda #{debt.debt_reference || debt.id.slice(-8)}
                      </h3>
                      {getStatusBadge(debt.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-2 bg-secondary-50/80 rounded-xl">
                        <Building className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Empresa</p>
                          <p className="text-xs font-semibold text-secondary-900">
                            {debt.company?.business_name || 'Empresa'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-secondary-50/80 rounded-xl">
                        <Calendar className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Fecha</p>
                          <p className="text-xs font-semibold text-secondary-900">
                            {formatDate(debt.origin_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-secondary-50/80 rounded-xl">
                        <DollarSign className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Tipo</p>
                          <p className="text-xs font-semibold text-secondary-900 capitalize">
                            {debt.debt_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-2xl border border-neutral-200/50">
                        <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Monto Original</p>
                        <p className="text-lg font-bold text-secondary-900 font-display">
                          {formatCurrency(debt.original_amount)}
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-200/50">
                        <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Monto Actual</p>
                        <p className="text-lg font-bold text-secondary-900 font-display">
                          {formatCurrency(debt.current_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                    onClick={() => handleViewDetails(debt)}
                  >
                    Ver Detalles
                  </Button>
                  {debt.status === 'active' && (
                    <Button
                      variant="gradient"
                      size="sm"
                      className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                      onClick={() => handleNegotiate(debt)}
                    >
                      Negociar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sección de ganancias potenciales */}
      {debts.length > 0 && (
        <Card
          variant="elevated"
          className="animate-slide-up bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-green-200"
          style={{ animationDelay: '400ms' }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-900">
                    💰 Tus Ganancias Potenciales
                  </h3>
                  <p className="text-secondary-600 text-sm">
                    Basado en tus deudas morosas registradas
                  </p>
                </div>
              </div>

              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleViewCompleteDetails()}
                className="hover:scale-105 transition-all shadow-glow"
              >
                Ver Detalles Completos
              </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {(() => {
                const now = new Date();
                const overdueDebts = debts.filter(debt => {
                  if (!debt.due_date) return false;
                  const dueDate = new Date(debt.due_date);
                  return dueDate < now && debt.status === 'active';
                });
                const totalOverdueAmount = overdueDebts.reduce((sum, debt) => sum + parseFloat(debt.current_amount || 0), 0);
                const potentialCommission = overdueDebts.length * 36000; // $36.000 por deuda morosa

                return (
                  <>
                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-orange-600 mb-1">
                        {overdueDebts.length}
                      </div>
                      <div className="text-xs text-secondary-600">Deudas Morosas</div>
                    </div>

                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-blue-600 mb-1">
                        {formatCurrency(totalOverdueAmount)}
                      </div>
                      <div className="text-xs text-secondary-600">Monto Moroso</div>
                    </div>

                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-green-600 mb-1">
                        {formatCurrency(potentialCommission)}
                      </div>
                      <div className="text-xs text-secondary-600">Comisión Potencial</div>
                    </div>

                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-purple-600 mb-1">
                        $36.000
                      </div>
                      <div className="text-xs text-secondary-600">Por Cierre</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Mensaje motivacional */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 text-sm">¡Oportunidad de Ingresos Extra!</h4>
                  <p className="text-xs text-green-800">
                    Registra más deudas morosas para aumentar tus ganancias potenciales. Cada acuerdo exitoso te paga $36.000 de comisión fija.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal para registrar nueva deuda */}
      <Modal
        isOpen={showAddDebtModal}
        onClose={() => setShowAddDebtModal(false)}
        title="💰 Registrar Nueva Deuda"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header del modal */}
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl inline-block mb-4">
              <CreditCard className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Agrega tu deuda para calcular ganancias
            </h3>
            <p className="text-secondary-600">
              Registra los detalles de tu deuda y descubre cuánto puedes ganar negociándola
            </p>
          </div>

          <form onSubmit={handleAddDebt} className="space-y-6">
            {/* Información de la empresa */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-secondary-900">Empresa Acreedora</h4>
              </div>

              <Input
                label="Nombre de la Empresa *"
                type="text"
                name="companyName"
                value={debtForm.companyName}
                onChange={handleDebtFormChange}
                placeholder="Ej: Banco Estado, Falabella, Ripley..."
                leftIcon={<Building className="w-5 h-5" />}
                required
                className="text-lg"
              />
            </Card>

            {/* Detalles financieros */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-secondary-900">Detalles Financieros</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Deuda Total *"
                  type="number"
                  name="totalDebt"
                  value={debtForm.totalDebt}
                  onChange={handleDebtFormChange}
                  placeholder="Ej: 1000000"
                  leftIcon={<DollarSign className="w-5 h-5" />}
                  min="0"
                  step="1000"
                  required
                  className="text-lg font-semibold"
                  helperText="Monto total adeudado"
                />

                <Input
                  label="Monto de la Cuota"
                  type="number"
                  name="installmentAmount"
                  value={debtForm.installmentAmount}
                  onChange={handleDebtFormChange}
                  placeholder="Ej: 50000"
                  leftIcon={<DollarSign className="w-5 h-5" />}
                  min="0"
                  step="1000"
                  helperText="Monto de cada cuota (opcional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Input
                  label="Cuotas Pagadas"
                  type="number"
                  name="paidInstallments"
                  value={debtForm.paidInstallments}
                  onChange={handleDebtFormChange}
                  placeholder="Ej: 5"
                  min="0"
                  helperText="Número de cuotas ya pagadas"
                />

                <Input
                  label="Cuotas Pendientes"
                  type="number"
                  name="pendingInstallments"
                  value={debtForm.pendingInstallments}
                  onChange={handleDebtFormChange}
                  placeholder="Ej: 10"
                  min="0"
                  helperText="Número de cuotas restantes"
                />

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Tipo de Deuda
                  </label>
                  <select
                    name="debtType"
                    value={debtForm.debtType}
                    onChange={handleDebtFormChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  >
                    <option value="credit_card">💳 Tarjeta de Crédito</option>
                    <option value="personal_loan">💰 Crédito Personal</option>
                    <option value="mortgage">🏠 Hipoteca</option>
                    <option value="car_loan">🚗 Crédito Automotriz</option>
                    <option value="store_credit">🛍️ Crédito Tienda</option>
                    <option value="other">📄 Otro</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Fechas importantes */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="font-semibold text-secondary-900">Fechas Importantes</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Vencimiento *"
                  type="date"
                  name="dueDate"
                  value={debtForm.dueDate}
                  onChange={handleDebtFormChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                  helperText="Fecha en que vence el pago"
                />

                <Input
                  label="Último Pago Realizado"
                  type="date"
                  name="lastPaymentDate"
                  value={debtForm.lastPaymentDate}
                  onChange={handleDebtFormChange}
                  leftIcon={<Clock className="w-5 h-5" />}
                  helperText="Si nunca has pagado, deja vacío"
                />
              </div>
            </Card>

            {/* Información calculada */}
            {debtForm.dueDate && debtForm.totalDebt && (
              <Card variant="elevated" className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-secondary-900">🎯 Tu Potencial de Ganancia</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {calculateDaysOverdue(debtForm.dueDate, debtForm.lastPaymentDate)}
                    </div>
                    <div className="text-sm text-secondary-600">Días de Mora</div>
                  </div>

                  <div className="text-center p-4 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatCurrency(36000)}
                    </div>
                    <div className="text-sm text-secondary-600">Comisión Potencial</div>
                  </div>

                  <div className="text-center p-4 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      $60.000
                    </div>
                    <div className="text-sm text-secondary-600">Total Comisión</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>¿Cómo funciona?</strong> Cuando negocies un acuerdo exitoso con esta deuda morosa,
                    recibirás $36.000 de comisión (60% del total de $60.000 por cierre de negocio).
                  </p>
                </div>
              </Card>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDebtModal(false)}
                className="flex-1 hover:scale-105 transition-all"
                size="lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 hover:scale-105 transition-all shadow-glow"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Registrando...
                  </>
                ) : (
                  '💰 Registrar y Calcular Ganancias'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default DebtsPage;