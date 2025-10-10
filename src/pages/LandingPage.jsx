/**
 * Landing Page - Diseño Moderno e Innovador de NexuPay
 * Inspirado en el portal de empresa con colores púrpura/indigo
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Shield,
  MessageSquare,
  Zap,
  Award,
  TrendingUp,
  Star,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Target,
  Rocket
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle access button click
  const handleAccessClick = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: DollarSign,
      title: "50% de Comisión",
      description: "Recibe el 50% del valor acordado cuando completes un pago exitoso",
      gradient: "from-emerald-400 to-green-600"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Tus datos personales nunca se comparten con las empresas de cobranza",
      gradient: "from-blue-400 to-indigo-600"
    },
    {
      icon: MessageSquare,
      title: "Comunicación Directa",
      description: "Negocia directamente con empresas certificadas a través de nuestra plataforma",
      gradient: "from-purple-400 to-pink-600"
    },
    {
      icon: Zap,
      title: "Proceso Rápido",
      description: "Acuerdos en minutos, pagos en tiempo real",
      gradient: "from-yellow-400 to-orange-600"
    },
    {
      icon: Award,
      title: "Empresas Certificadas",
      description: "Solo trabajamos con empresas de cobranza reguladas y confiables",
      gradient: "from-cyan-400 to-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Sin Riesgo",
      description: "Si no llegas a un acuerdo, no pagas nada",
      gradient: "from-rose-400 to-red-600"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en menos de 2 minutos y conviértete en el único punto de contacto",
      icon: Users
    },
    {
      number: "02",
      title: "Las Empresas te Buscan",
      description: "Las cobranzas te contactan a través de NexuPay (no más llamadas del 600)",
      icon: Target
    },
    {
      number: "03",
      title: "Negocia tu Acuerdo",
      description: "Comunícate directamente y llega al mejor acuerdo posible",
      icon: MessageSquare
    },
    {
      number: "04",
      title: "Recibe tu Comisión",
      description: "Al completar el pago, recibes el 50% de la comisión automáticamente",
      icon: DollarSign
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Deudora Satisfecha",
      content: "Gracias a Nexu Pay pude renegociar mi deuda y recibir una comisión que nunca imaginé. ¡Es increíble!",
      rating: 5,
      avatar: "👩‍💼"
    },
    {
      name: "Carlos Rodríguez",
      role: "Usuario Activo",
      content: "La plataforma es súper fácil de usar y las empresas responden rápido. Ya recuperé más de $500.000 en comisiones.",
      rating: 5,
      avatar: "👨‍💻"
    },
    {
      name: "Ana López",
      role: "Madre Soltera",
      content: "Me ayudó mucho con mis deudas. Ahora tengo dinero extra para mis hijos. ¡Recomiendo Nexu Pay al 100%!",
      rating: 5,
      avatar: "👩‍👧‍👦"
    }
  ];

  const stats = [
    { value: "50%", label: "Comisión", icon: DollarSign },
    { value: "24/7", label: "Disponible", icon: Clock },
    { value: "∞", label: "Potencial", icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-black relative overflow-hidden">
      {/* Multi-layered Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.2),transparent_50%)] animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl animate-spin-slow"></div>

      {/* Floating Geometric Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-float-delayed"></div>
      <div className="absolute bottom-32 left-20 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-cyan-500/30 rounded-full blur-lg animate-bounce-subtle"></div>
      <div className="absolute bottom-1/4 left-1/4 w-18 h-18 bg-orange-500/20 rounded-full blur-xl animate-float-delayed"></div>

      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      </div>

      {/* Particle Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 md:p-6 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl md:text-3xl font-bold text-white">NexuPay</span>
              <span className="text-xs md:text-sm text-indigo-200/80 -mt-1">Future Finance</span>
            </div>
          </div>
          <div className="hidden md:flex space-x-1"></div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300"
            >
              Acceder
            </button>
            <button
              onClick={() => navigate('/registro')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Comenzar
            </button>
          </div>
        </nav>

        {/* Hero Section - Modern & Visual */}
        <section className="px-6 md:px-8 py-20 md:py-32 relative">
          {/* Hero Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

          <div className="max-w-6xl mx-auto text-center relative">
            {/* Clean Brand Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-sm rounded-full text-emerald-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Sistema Operativo
            </div>

            {/* Balanced Headline */}
            <h1 className="text-6xl md:text-7xl font-extrabold mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">NexuPay</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-indigo-200/90">Future Finance</h2>

            {/* Clear Value Proposition */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              La primera plataforma que convierte deudas en activos digitales. Tecnología blockchain aplicada a las cobranzas tradicionales.
            </p>

            {/* Visual Stats Cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12 max-w-xl md:max-w-3xl mx-auto text-center">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-extrabold text-white">50%</div>
                <div className="uppercase tracking-widest text-indigo-300 text-xs md:text-sm">Comisión</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-extrabold text-white">24/7</div>
                <div className="uppercase tracking-widest text-blue-300 text-xs md:text-sm">Disponible</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-extrabold text-white">∞</div>
                <div className="uppercase tracking-widest text-purple-300 text-xs md:text-sm">Potencial</div>
              </div>
            </div>

            {/* Clear CTA Section */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/20 rounded-3xl p-8 mb-12 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro')}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
                >
                  <span className="flex items-center">
                    Iniciar Transformación
                    <Rocket className="w-5 h-5 ml-2" />
                  </span>
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  Acceder
                </button>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full border-2 border-slate-800"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full border-2 border-slate-800"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full border-2 border-slate-800"></div>
                </div>
                <span className="text-sm">+2,500 usuarios activos</span>
              </div>
            </div>

            {/* Watermark (AIntelligence) */}
            <div className="hidden md:flex items-center gap-3 absolute bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-lg">
              <span className="text-xs text-white/90">Proyecto desarrollado por</span>
              <span className="text-xs font-semibold bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">AIntelligence</span>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="px-6 md:px-8 py-20 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  ¿Cómo Funciona?
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Un proceso simple y transparente en 4 pasos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 md:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Características
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Principales
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Tecnología de vanguardia diseñada para maximizar tus ingresos y proteger tus datos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105">
                  <div className={`inline-flex p-4 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section - AI + Blockchain */}
        <section id="technology" className="px-6 md:px-8 py-20 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Tecnología de Vanguardia
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Arquitectura empresarial con IA, blockchain revolucionario y machine learning avanzado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* AI Quantum Card */}
              <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-400/20 rounded-3xl p-8 hover:bg-cyan-500/20 transition-all duration-500">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold text-cyan-300 mb-4">IA Predictiva Avanzada</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  Procesamiento paralelo que analiza <strong>millones de escenarios</strong> de negociación simultáneamente.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400">Precisión:</span>
                    <span className="text-white font-bold">99.7%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400">Procesamiento:</span>
                    <span className="text-white font-bold">&lt; 50ms</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-cyan-300/70">
                  React 18.2 + TensorFlow.js • Tecnología patentada
                </div>
              </div>

              {/* Blockchain Card */}
              <div className="group bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-purple-400/20 rounded-3xl p-8 hover:bg-purple-500/20 transition-all duration-500">
                <div className="text-5xl mb-4">⛓️</div>
                <h3 className="text-2xl font-bold text-purple-300 mb-4">Blockchain Revolucionario</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  Arquitectura blockchain única con <strong>contratos inteligentes</strong> que garantizan pagos irreversibles.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Seguridad:</span>
                    <span className="text-white font-bold">Criptográfica</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Transacciones:</span>
                    <span className="text-white font-bold">Instantáneas</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-purple-300/70">
                  Supabase + PostgreSQL 15 • Smart Contracts
                </div>
              </div>

              {/* Machine Learning Card */}
              <div className="group bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-sm border border-orange-400/20 rounded-3xl p-8 hover:bg-orange-500/20 transition-all duration-500">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-orange-300 mb-4">Machine Learning Automatizado</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  Algoritmos de ML que <strong>aprenden automáticamente</strong> de cada negociación y optimizan estrategias.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-400">Optimización:</span>
                    <span className="text-white font-bold">Continua</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-400">Precisión:</span>
                    <span className="text-white font-bold">Auto-ajustable</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-orange-300/70">
                  Python + Scikit-learn • Auto ML
                </div>
              </div>
            </div>

            {/* Technical Metrics */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Especificaciones Técnicas de Nivel Empresarial
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                  <div className="text-gray-300 text-sm">Uptime Garantizado</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-400 mb-2">&lt; 2s</div>
                  <div className="text-gray-300 text-sm">Tiempo de Carga</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">&lt; 200ms</div>
                  <div className="text-gray-300 text-sm">API Response</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-orange-400 mb-2">80%+</div>
                  <div className="text-gray-300 text-sm">Cobertura Tests</div>
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className="text-gray-400 text-sm">
                  <strong>Stack Tecnológico:</strong> React 18.2 + TypeScript • Vite 4.0 • Supabase + PostgreSQL 15 • Deno Edge Functions
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  <strong>Seguridad:</strong> Row Level Security • Encriptación AES-256 • JWT Tokens • Cumplimiento GDPR
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="px-6 md:px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Lo que dicen
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  nuestros usuarios
                </span>
              </h2>
            </div>

            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>

                <blockquote className="text-2xl md:text-3xl text-center text-white font-medium mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>

                <div className="flex items-center justify-center">
                  <div className="text-6xl mr-4">{testimonials[currentTestimonial].avatar}</div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-white">{testimonials[currentTestimonial].name}</div>
                    <div className="text-indigo-300">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-8 space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? 'bg-indigo-500 scale-125'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-6 md:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  ¿Listo para transformar
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  tus deudas en ingresos?
                </span>
              </h2>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a miles de usuarios que ya están generando ingresos extra con NexuPay.
                Es gratis registrarse y comenzar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro')}
                  className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
                >
                  <span className="flex items-center">
                    Comenzar Gratis
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Sin costo de registro
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Proceso 100% seguro
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Soporte 24/7
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-8 py-12 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                NexuPay
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 NexuPay. Tecnología blockchain aplicada a las finanzas tradicionales.
            </p>
            <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-500">
              <Link to="/terms-of-service" className="hover:text-white transition-colors">
                Términos de Servicio
              </Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
  
  export default LandingPage;
