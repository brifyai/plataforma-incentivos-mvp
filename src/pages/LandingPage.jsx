/**
 * Landing Page - NexuPay Future Finance
 * Diseño minimalista y profesional
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
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Target,
  Wallet,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
  BarChart3,
  Cpu,
  Database,
  ShieldCheck,
  Rocket,
  Heart
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mouse movement for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Modern Dark Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
        
        {/* Animated particles */}
        <div
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"
          style={{
            left: `${10 + mousePosition.x * 0.01}%`,
            top: `${20 + mousePosition.y * 0.01}%`,
            animationDelay: '0s'
          }}
        ></div>
        <div
          className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse"
          style={{
            left: `${80 + mousePosition.x * -0.01}%`,
            top: `${70 + mousePosition.y * -0.01}%`,
            animationDelay: '1s'
          }}
        ></div>
        <div
          className="absolute w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-pulse"
          style={{
            left: `${50 + mousePosition.x * 0.005}%`,
            top: `${40 + mousePosition.y * 0.005}%`,
            animationDelay: '2s'
          }}
        ></div>
      </div>

      {/* Modern Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/90 backdrop-blur-xl border-b border-gray-600/30 shadow-2xl'
          : 'bg-black/80 backdrop-blur-xl border-b border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">NexuPay</span>
                <span className="text-xs text-gray-400 block -mt-1">Future Finance</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-white hover:text-white font-medium transition-colors duration-300"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => navigate('/registro')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Comenzar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Dark */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center relative">
          {/* Floating Elements */}
          <div className="absolute top-10 left-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute top-20 right-20 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-1/4 animate-float animation-delay-4000">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-600 rounded-full opacity-20 blur-lg"></div>
          </div>

          <div className="inline-flex items-center px-6 py-3 bg-gray-800/50/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8 hover:bg-gray-800/50/15 transition-all duration-300 cursor-default">
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Sistema Operativo Financiero
          </div>

          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 animate-gradient">
              NexuPay
            </h1>
            <div className="absolute -top-2 -right-2">
              <Rocket className="w-8 h-8 text-blue-400 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent mb-8">
            Future Finance
          </h2>

          <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed">
            La primera plataforma que <span className="font-semibold text-blue-400">convierte deudas en activos digitales</span>.
            Tecnología <span className="font-semibold text-purple-400">blockchain</span> aplicada a las cobranzas tradicionales.
          </p>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
            <div className="group relative">
              <div className="text-4xl font-bold text-blue-400 group-hover:scale-110 transition-transform duration-300">50%</div>
              <div className="text-gray-400 text-sm mt-1">Comisión</div>
              <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <div className="group relative">
              <div className="text-4xl font-bold text-green-400 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-gray-400 text-sm mt-1">Disponible</div>
              <div className="absolute inset-0 bg-green-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <div className="group relative">
              <div className="text-4xl font-bold text-purple-400 group-hover:scale-110 transition-transform duration-300">∞</div>
              <div className="text-gray-400 text-sm mt-1">Potencial</div>
              <div className="absolute inset-0 bg-purple-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Enhanced CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/registro')}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="flex items-center">
                Comenzar gratis
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-gray-800/50/10 backdrop-blur-sm text-white rounded-lg hover:bg-gray-800/50/20 transition-all duration-300 font-medium text-lg border-2 border-white/20 hover:border-white/30 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <span className="flex items-center">
                Acceder
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>

          {/* Enhanced Social Proof */}
          <div className="flex items-center justify-center space-x-6 text-gray-400">
            <div className="flex items-center group">
              <div className="flex -space-x-2 mr-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-black group-hover:scale-110 transition-transform duration-300"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-black group-hover:scale-110 transition-transform duration-300"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-black group-hover:scale-110 transition-transform duration-300"></div>
              </div>
              <span className="text-sm font-medium group-hover:text-white transition-colors duration-300">+2,500 usuarios activos</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modern Dark */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full opacity-10 blur-xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-500 rounded-full opacity-10 blur-xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-indigo-500 rounded-full opacity-10 blur-xl animate-float animation-delay-4000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gray-800/50/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-6">
              <Zap className="w-5 h-5 mr-2 animate-pulse" />
              Proceso Simplificado
            </div>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6">
              ¿Cómo Funciona?
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
              Transforma tus deudas en ingresos en <span className="font-semibold text-blue-400">4 simples pasos</span>.
              Nuestra plataforma blockchain garantiza transparencia y seguridad en cada etapa.
            </p>
          </div>

          {/* Enhanced Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Lines - Extended */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 via-purple-500 via-blue-500 to-transparent z-0"></div>
            
            {steps.map((step, index) => (
              <div key={index} className="group relative h-full">
                {/* Step Card */}
                <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 hover:border-blue-400/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden h-full flex flex-col">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content Container */}
                  <div className="relative z-10 flex-1 flex flex-col">
                    {/* Step Number Inside Card */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-gray-600/30">
                        {step.number}
                      </div>
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                      {/* Glow Effect */}
                      <div className="absolute inset-0 w-20 h-20 bg-blue-400 rounded-2xl mx-auto blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300 text-center">
                      {step.title}
                    </h3>
                    <p className="text-white leading-relaxed group-hover:text-gray-200 transition-colors duration-300 flex-1 text-center">
                      {step.description}
                    </p>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/30 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400/30 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/30 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400/30 rounded-br-xl"></div>
                </div>

                {/* Step Connector (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-transparent"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Enhanced CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
              Comienza en menos de 2 minutos
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Sin compromisos • Cancela cuando quieras • Soporte 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Design */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`
            }}></div>
          </div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Modern Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gray-800/50/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8">
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Ventaja Competitiva
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Por qué elegir <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NexuPay</span>
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
              La revolucionaria plataforma que <span className="text-blue-400 font-semibold">transforma deudas</span> en
              <span className="text-purple-400 font-semibold">oportunidades reales</span>
            </p>
          </div>

          {/* Modern Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Glass Card */}
                <div className="relative h-full bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-3xl p-8 hover:bg-gray-800/50/10 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                  {/* Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Icon */}
                  <div className="relative mb-8">
                    <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Main Icon */}
                    <div className={`w-20 h-20 mx-auto bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    
                    {/* Animated Ring */}
                    <div className={`absolute inset-0 w-20 h-20 mx-auto rounded-2xl border-2 border-blue-400 opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-spin-slow`}></div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-white leading-relaxed mb-6 group-hover:text-gray-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex justify-center items-center space-x-6 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 ml-2">Activo</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-1000"></div>
                        <span className="text-blue-400 ml-2">Popular</span>
                      </div>
                    </div>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400/30 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-400/30 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400/30 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400/30 rounded-br-2xl"></div>
                </div>

                {/* Floating Particles */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -top-1 -right-3 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse animation-delay-500"></div>
                <div className="absolute -bottom-2 left-4 w-2 h-2 bg-blue-300 rounded-full opacity-50 animate-pulse animation-delay-1000"></div>
              </div>
            ))}
          </div>

          {/* Bottom Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">50%</div>
              <div className="text-gray-400 text-sm">Comisión</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">100%</div>
              <div className="text-gray-400 text-sm">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-gray-400 text-sm">Disponible</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">∞</div>
              <div className="text-gray-400 text-sm">Potencial</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Tecnología de Vanguardia
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto">
              Arquitectura empresarial con IA, blockchain revolucionario y machine learning avanzado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* AI Quantum Card */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-xl p-8 hover:bg-gray-800/50/10 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">IA Predictiva Avanzada</h3>
              <p className="text-white mb-4 leading-relaxed">
                Procesamiento paralelo que analiza <strong>millones de escenarios</strong> de negociación simultáneamente.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-600">Precisión:</span>
                  <span className="text-white font-bold">99.7%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-600">Procesamiento:</span>
                  <span className="text-white font-bold">&lt; 50ms</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-white">
                React 18.2 + TensorFlow.js • Tecnología patentada
              </div>
            </div>

            {/* Blockchain Card */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-xl p-8 hover:bg-gray-800/50/10 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">⛓️</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4">Blockchain Revolucionario</h3>
              <p className="text-white mb-4 leading-relaxed">
                Arquitectura blockchain única con <strong>contratos inteligentes</strong> que garantizan pagos irreversibles.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Seguridad:</span>
                  <span className="text-white font-bold">Criptográfica</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Transacciones:</span>
                  <span className="text-white font-bold">Instantáneas</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-white">
                Supabase + PostgreSQL 15 • Smart Contracts
              </div>
            </div>

            {/* Machine Learning Card */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-xl p-8 hover:bg-gray-800/50/10 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-orange-400 mb-4">Machine Learning Automatizado</h3>
              <p className="text-white mb-4 leading-relaxed">
                Algoritmos de ML que <strong>aprenden automáticamente</strong> de cada negociación y optimizan estrategias.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Optimización:</span>
                  <span className="text-white font-bold">Continua</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Precisión:</span>
                  <span className="text-white font-bold">Auto-ajustable</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-white">
                Python + Scikit-learn • Auto ML
              </div>
            </div>
          </div>

          {/* Technical Metrics */}
          <div className="bg-gray-800/50 border border-gray-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              Especificaciones Técnicas de Nivel Empresarial
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-white text-sm">Uptime Garantizado</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">&lt; 2s</div>
                <div className="text-white text-sm">Tiempo de Carga</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">&lt; 200ms</div>
                <div className="text-white text-sm">API Response</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">80%+</div>
                <div className="text-white text-sm">Cobertura Tests</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="text-white text-sm">
                <strong>Stack Tecnológico:</strong> React 18.2 + TypeScript • Vite 4.0 • Supabase + PostgreSQL 15 • Deno Edge Functions
              </div>
              <div className="text-white text-sm mt-2">
                <strong>Seguridad:</strong> Row Level Security • Encriptación AES-256 • JWT Tokens • Cumplimiento GDPR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="bg-gray-800/50 border border-gray-200 rounded-xl p-8 md:p-12">
            <div className="flex justify-center mb-6">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>

            <blockquote className="text-2xl text-center text-white font-medium mb-8 leading-relaxed">
              "{testimonials[currentTestimonial].content}"
            </blockquote>

            <div className="flex items-center justify-center">
              <div className="text-6xl mr-4">{testimonials[currentTestimonial].avatar}</div>
              <div className="text-left">
                <div className="text-xl font-bold text-white">{testimonials[currentTestimonial].name}</div>
                <div className="text-white">{testimonials[currentTestimonial].role}</div>
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
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Confianza y Seguridad Garantizadas
            </h2>
            <p className="text-lg text-white">
              Respaldado por las mejores tecnologías y estándares de la industria
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-white mb-2">Seguridad SSL</h3>
              <p className="text-sm text-white">Encriptación de extremo a extremo</p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-white mb-2">GDPR Compliant</h3>
              <p className="text-sm text-white">Protección de datos europea</p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-white mb-2">Global Reach</h3>
              <p className="text-sm text-white">Disponible en todo el mundo</p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-white mb-2">Soporte 24/7</h3>
              <p className="text-sm text-white">Ayuda cuando la necesites</p>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="text-center">
            <p className="text-sm text-white mb-6">Tecnología de confianza utilizada por empresas líderes</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">React</div>
              <div className="text-2xl font-bold text-gray-400">Supabase</div>
              <div className="text-2xl font-bold text-gray-400">PostgreSQL</div>
              <div className="text-2xl font-bold text-gray-400">Vercel</div>
              <div className="text-2xl font-bold text-gray-400">AWS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-12 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                ¿Listo para transformar tus deudas en ingresos?
              </h2>

              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Únete a miles de usuarios que ya están generando ingresos extra con NexuPay.
                Es gratis registrarse y comenzar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={() => navigate('/registro')}
                  className="group px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center">
                    Comenzar Gratis
                    <Rocket className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
                <div className="flex items-center group">
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:text-white transition-colors duration-300">Sin costo de registro</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:text-white transition-colors duration-300">Proceso 100% seguro</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:text-white transition-colors duration-300">Soporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-600/30">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              NexuPay
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            © 2025 NexuPay. Tecnología blockchain aplicada a las finanzas tradicionales.
          </p>
          <div className="flex justify-center space-x-6 text-xs text-white">
            <Link to="/terminos-servicio" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
