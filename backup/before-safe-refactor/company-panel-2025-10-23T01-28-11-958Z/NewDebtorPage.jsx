/**
 * New Client Page - Diseño Vanguardista
 *
 * Página para agregar nuevos clientes/deudores al sistema con diseño moderno
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { createDebt } from '../../services/databaseService';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  Save,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';

const NewDebtorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  const [formData, setFormData] = useState({
    debtorName: '',
    debtorRut: '',
    debtorEmail: '',
    debtorPhone: '',
    amount: '',
    description: '',
    dueDate: '',
    clientId: ''
  });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validaciones básicas
      if (!formData.debtorName.trim()) {
        await Swal.fire({
          icon: 'error',
          title: 'Nombre requerido',
          text: 'Por favor ingresa el nombre del deudor',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        await Swal.fire({
          icon: 'error',
          title: 'Monto inválido',
          text: 'Por favor ingresa un monto válido mayor a 0',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Crear la deuda
      const debtData = {
        user_id: null,
        company_id: user.id,
        client_id: formData.clientId || null,
        original_amount: parseFloat(formData.amount),
        current_amount: parseFloat(formData.amount),
        description: formData.description,
        due_date: formData.dueDate || null,
        status: 'pending',
        debtor_info: {
          name: formData.debtorName,
          rut: formData.debtorRut,
          email: formData.debtorEmail,
          phone: formData.debtorPhone
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { debt, error } = await createDebt(debtData);

      if (error) {
        throw error;
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Deudor agregado!',
        text: 'El deudor ha sido agregado exitosamente al sistema',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3B82F6'
      });

      // Limpiar formulario
      setFormData({
        debtorName: '',
        debtorRut: '',
        debtorEmail: '',
        debtorPhone: '',
        amount: '',
        description: '',
        dueDate: '',
        clientId: ''
      });

    } catch (error) {
      console.error('Error creating debt:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Ocurrió un error al agregar el cliente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-900 to-indigo-900 animate-gradient-x"></div>
  
          {/* Floating orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>

        {/* Interactive mouse follower */}
        <div
          className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
            transform: `scale(${Math.sin(Date.now() * 0.001) * 0.5 + 1})`,
          }}
        ></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/empresa/dashboard')}
                className="text-white hover:bg-white/10"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Volver al Dashboard
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Sistema Activo</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Nuevo Deudor</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-blue-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">
                Agregar
              </span>
              <br />
              <span className="text-4xl lg:text-6xl font-light text-gray-400">
                Nuevo Deudor
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Expande tu cartera de deudores y <strong className="text-white">maximiza tus ingresos</strong>
              agregando nuevos deudores al sistema de cobranzas inteligente.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text group-hover:scale-110 transition-transform">
                  50%
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Comisión</div>
              </div>
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text group-hover:scale-110 transition-transform">
                  ∞
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Potencial</div>
              </div>
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text group-hover:scale-110 transition-transform">
                  24/7
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Disponible</div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Debtor Information */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Información del Deudor</h3>
                      <p className="text-gray-400">Datos personales del cliente</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Nombre Completo *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.debtorName}
                          onChange={(e) => handleInputChange('debtorName', e.target.value)}
                          placeholder="Ej: Juan Pérez González"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">RUT</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.debtorRut}
                          onChange={(e) => handleInputChange('debtorRut', e.target.value)}
                          placeholder="Ej: 12.345.678-9"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.debtorEmail}
                          onChange={(e) => handleInputChange('debtorEmail', e.target.value)}
                          placeholder="Ej: juan@email.com"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.debtorPhone}
                          onChange={(e) => handleInputChange('debtorPhone', e.target.value)}
                          placeholder="Ej: +56912345678"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debt Information */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Información de la Deuda</h3>
                      <p className="text-gray-400">Detalles del monto y condiciones</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Monto Original *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          placeholder="Ej: 500000"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Fecha de Vencimiento</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <label className="text-sm font-medium text-gray-300">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe brevemente la deuda, origen, condiciones..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500 hover:from-blue-600 hover:via-blue-600 hover:to-indigo-600 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 px-12 py-4 text-lg font-semibold"
                    leftIcon={<Save className="w-6 h-6" />}
                  >
                    {loading ? 'Guardando Deudor...' : 'Agregar Nuevo Deudor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-20">
            <path
              fill="rgba(0,0,0,0.1)"
              d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Beneficios Inmediatos
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Al agregar este cliente, activas todo el poder de nuestra plataforma de cobranzas inteligente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Ofertas Automáticas",
                description: "El sistema genera propuestas optimizadas basadas en IA predictiva",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: TrendingUp,
                title: "Seguimiento Inteligente",
                description: "Monitoreo automático del comportamiento de pago y recordatorios",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Zap,
                title: "Pagos Instantáneos",
                description: "Procesamiento automático de pagos con comisiones al instante",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((benefit, index) => (
              <div key={index} className="group text-center">
                <div className={`w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <benefit.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewDebtorPage;