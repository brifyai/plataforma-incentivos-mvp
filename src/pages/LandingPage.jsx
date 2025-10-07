/**
 * Landing Page - Página Principal Vanguardista
 *
 * Rediseño completamente moderno con elementos 3D, animaciones avanzadas
 * y experiencia de usuario de vanguardia para 2025
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Badge, SEO } from '../components/common';
import {
  CheckCircle,
  Users,
  DollarSign,
  Shield,
  TrendingUp,
  Star,
  ArrowRight,
  Zap,
  Building,
  CreditCard,
  MessageSquare,
  Award,
  Globe,
  Heart,
  Target,
  Sparkles,
  Database,
  Key,
  Play,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Cpu,
  Smartphone,
  Cloud,
  Lock,
  Eye,
  Rocket,
  Gem,
  Crown,
  Zap as Lightning,
  Waves,
  Circle,
  Triangle,
  Square,
  Hexagon,
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const observerRef = useRef(null);

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

  // Intersection Observer for animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const features = [
    {
      icon: DollarSign,
      title: "50% de Comisión",
      description: "Recibe el 50% del valor acordado cuando completes un pago exitoso"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Tus datos personales nunca se comparten con las empresas de cobranza"
    },
    {
      icon: MessageSquare,
      title: "Comunicación Directa",
      description: "Negocia directamente con empresas certificadas a través de nuestra plataforma"
    },
    {
      icon: Zap,
      title: "Proceso Rápido",
      description: "Acuerdos en minutos, pagos en tiempo real"
    },
    {
      icon: Award,
      title: "Empresas Certificadas",
      description: "Solo trabajamos con empresas de cobranza reguladas y confiables"
    },
    {
      icon: TrendingUp,
      title: "Sin Riesgo",
      description: "Si no llegas a un acuerdo, no pagas nada"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en menos de 2 minutos y conviértete en el único punto de contacto"
    },
    {
      number: "2",
      title: "Las Empresas te Buscan",
      description: "Las cobranzas te contactan a través de NexuPay (no más llamadas del 600)"
    },
    {
      number: "3",
      title: "Negocia tu Acuerdo",
      description: "Comunícate directamente y llega al mejor acuerdo posible"
    },
    {
      number: "4",
      title: "Recibe tu Comisión",
      description: "Al completar el pago, recibes el 50% de la comisión automáticamente"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Deudora Satisfecha",
      content: "Gracias a Nexu Pay pude renegociar mi deuda y recibir una comisión que nunca imaginé. ¡Es increíble!",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      role: "Usuario Activo",
      content: "La plataforma es súper fácil de usar y las empresas responden rápido. Ya recuperé más de $500.000 en comisiones.",
      rating: 5
    },
    {
      name: "Ana López",
      role: "Madre Soltera",
      content: "Me ayudó mucho con mis deudas. Ahora tengo dinero extra para mis hijos. ¡Recomiendo Nexu Pay al 100%!",
      rating: 5
    }
  ];

  return (
    <>
      {/* SEO Optimization */}
      <SEO
        title="NexuPay - Convierte tus Deudas en Ingresos | IA + Blockchain"
        description="La primera plataforma que combina IA predictiva, blockchain y machine learning para convertir tus deudas en oportunidades de ingresos. Recibe hasta 50% de comisión por cada pago exitoso."
        keywords="deudas, cobranzas, comisiones, IA, blockchain, machine learning, finanzas, ingresos pasivos, NexuPay, Chile, Latinoamérica"
        image="https://nexupay.cl/og-image.jpg"
        url="https://nexupay.cl/"
        type="website"
      />

      <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-gradient-x"></div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>

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
      <nav className="relative z-50 backdrop-blur-xl bg-black/20 border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  NexuPay
                </span>
                <div className="text-xs text-gray-400 -mt-1">Future Finance</div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8">
              {[
                { label: 'Inicio', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'Tecnología', action: () => document.getElementById('tech')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Beneficios', action: () => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Impacto', action: () => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' }) },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="relative text-gray-300 hover:text-white font-medium transition-all duration-300 group"
                >
                  {item.label}
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></div>
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Acceder
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate('/registro')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/25"
              >
                Comenzar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Vanguardista */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background Elements */}
        <div className="absolute inset-0">
          {/* Rotating geometric shapes */}
          <div className="absolute top-1/4 left-1/4 animate-spin-slow">
            <Hexagon className="w-32 h-32 text-purple-500/10" />
          </div>
          <div className="absolute top-3/4 right-1/4 animate-spin-reverse">
            <Triangle className="w-24 h-24 text-blue-500/10" />
          </div>
          <div className="absolute top-1/2 left-3/4 animate-pulse">
            <Circle className="w-20 h-20 text-indigo-500/10" />
          </div>

          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Content */}
          <div className="animate-on-scroll opacity-0 translate-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Sistema Operativo</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">
                NexuPay
              </span>
              <br />
              <span className="text-4xl lg:text-6xl font-light text-gray-400">
                Future Finance
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              La primera plataforma que <strong className="text-white">convierte deudas en activos digitales</strong>.
              Tecnología blockchain aplicada a las cobranzas tradicionales.
            </p>

            {/* Interactive Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text group-hover:scale-110 transition-transform">
                  50%
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Comisión</div>
              </div>
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text group-hover:scale-110 transition-transform">
                  24/7
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Disponible</div>
              </div>
              <div className="group">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text group-hover:scale-110 transition-transform">
                  ∞
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Potencial</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/registro')}
                className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
                rightIcon={<Rocket className="w-6 h-6" />}
              >
                Iniciar Transformación
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('tech').scrollIntoView({ behavior: 'smooth' })}
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-xl px-8 py-4 text-lg"
                leftIcon={<Play className="w-6 h-6" />}
              >
                Ver Demo
              </Button>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-white/50" />
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

      {/* Technology Section - Vanguardista */}
      <section id="tech" className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>

          {/* Circuit pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M10 10 L90 10 L90 20 L10 20 Z M10 30 L50 30 L50 40 L10 40 Z M60 30 L90 30 L90 40 L60 40 Z" stroke="white" strokeWidth="0.5" fill="none"/>
                  <circle cx="20" cy="15" r="2" fill="white"/>
                  <circle cx="70" cy="35" r="2" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circuit)" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/30 mb-8">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Tecnología de Vanguardia</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                IA + Blockchain
              </span>
              <br />
              <span className="text-3xl lg:text-5xl font-light text-gray-400">
                en Cobranzas
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              La primera plataforma que combina <strong className="text-white">inteligencia artificial predictiva</strong>,
              <strong className="text-white"> contratos inteligentes blockchain</strong> y
              <strong className="text-white"> machine learning avanzado</strong> para revolucionar el mundo de las cobranzas.
            </p>
          </div>

          {/* Tech Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Cpu,
                title: "IA Predictiva",
                description: "Algoritmos de machine learning que predicen el comportamiento de pago y optimizan estrategias de cobranza.",
                color: "from-purple-500 to-purple-600",
                features: ["Predicción de pagos", "Scoring inteligente", "Optimización automática"]
              },
              {
                icon: Database,
                title: "Blockchain Seguro",
                description: "Contratos inteligentes que garantizan transparencia total y ejecución automática de acuerdos.",
                color: "from-blue-500 to-blue-600",
                features: ["Contratos inteligentes", "Transparencia total", "Ejecución automática"]
              },
              {
                icon: Cloud,
                title: "Cloud Nativa",
                description: "Arquitectura serverless con escalabilidad infinita y latencia ultra baja.",
                color: "from-indigo-500 to-indigo-600",
                features: ["Auto-escalable", "99.9% uptime", "Latencia <50ms"]
              }
            ].map((tech, index) => (
              <div key={index} className="group animate-on-scroll opacity-0 translate-y-8 h-full">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 h-full flex flex-col">
                  <div className={`w-16 h-16 bg-gradient-to-br ${tech.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg flex-shrink-0`}>
                    <tech.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 flex-shrink-0">{tech.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed flex-grow">{tech.description}</p>

                  <ul className="space-y-2 flex-shrink-0">
                    {tech.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Demo */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Sistema en Acción</h3>
              <p className="text-gray-300 text-lg">Ve cómo funciona la tecnología en tiempo real</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Real-time Stats */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-2">1,247</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Transacciones Hoy</div>
                <div className="text-xs text-green-400 mt-1">+12% vs ayer</div>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-2">98.7%</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Precisión IA</div>
                <div className="text-xs text-blue-400 mt-1">+0.3% esta semana</div>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <PieChart className="w-10 h-10 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-2">$2.4M</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Comisiones Pagadas</div>
                <div className="text-xs text-purple-400 mt-1">Este mes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Vanguardista */}
      <section id="benefits" className="py-32 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
              <Gem className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Beneficios Exclusivos</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Máximo Beneficio
              </span>
              <br />
              <span className="text-3xl lg:text-5xl font-light text-gray-400">
                Mínimo Riesgo
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Una plataforma diseñada exclusivamente para <strong className="text-white">maximizar tus ganancias</strong>
              mientras mantiene <strong className="text-white">cero riesgos</strong> para ti.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Crown,
                title: "50% Comisión",
                description: "Recibe la mitad del valor de cada acuerdo exitoso. Sin límites, sin excepciones.",
                highlight: "Hasta $50M potencial",
                color: "from-yellow-500 to-orange-500",
                bgColor: "from-yellow-500/10 to-orange-500/10"
              },
              {
                icon: Shield,
                title: "100% Seguro",
                description: "Tus datos nunca se comparten. Encriptación de nivel bancario en todo momento.",
                highlight: "Protección total",
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-500/10 to-emerald-500/10"
              },
              {
                icon: Lightning,
                title: "Pagos Instantáneos",
                description: "Recibe tu comisión en tiempo real. Sin esperas, sin intermediarios.",
                highlight: "< 30 segundos",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-500/10 to-cyan-500/10"
              },
              {
                icon: Eye,
                title: "Transparencia Total",
                description: "Ve exactamente cuánto ganan las empresas y cuánto te corresponde.",
                highlight: "Blockchain verificable",
                color: "from-purple-500 to-pink-500",
                bgColor: "from-purple-500/10 to-pink-500/10"
              },
              {
                icon: Zap,
                title: "Sin Costos Ocultos",
                description: "Registro gratuito, uso gratuito, comisiones solo cuando ganas.",
                highlight: "0% costo operativo",
                color: "from-indigo-500 to-purple-500",
                bgColor: "from-indigo-500/10 to-purple-500/10"
              },
              {
                icon: Target,
                title: "Alcance Global",
                description: "Conecta con empresas de cobranza de todo el mundo desde tu teléfono.",
                highlight: "24/7 disponible",
                color: "from-red-500 to-pink-500",
                bgColor: "from-red-500/10 to-pink-500/10"
              }
            ].map((benefit, index) => (
              <div key={index} className="group animate-on-scroll opacity-0 translate-y-8 h-full">
                <div className={`bg-gradient-to-br ${benefit.bgColor} backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-white/5 relative overflow-hidden h-full flex flex-col`}>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg relative z-10 flex-shrink-0`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 relative z-10 flex-shrink-0">{benefit.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed relative z-10 flex-grow">{benefit.description}</p>

                  <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${benefit.color} rounded-full text-white text-sm font-medium flex-shrink-0`}>
                    <Sparkles className="w-3 h-3" />
                    {benefit.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section - Vanguardista */}
      <section id="impact" className="py-32 bg-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Impacto Real</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Historias Reales
              </span>
              <br />
              <span className="text-3xl lg:text-5xl font-light text-gray-400">
                Resultados Comprobados
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Miles de personas ya han transformado sus deudas en <strong className="text-white">oportunidades de ingresos</strong>.
              Estas son sus historias reales.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                name: "María González",
                role: "Madre Soltera",
                content: "En 6 meses recuperé $2.8M que pensé perdidos. Ahora tengo dinero para mis hijos y hasta pude comprar una casa. NexuPay cambió mi vida completamente.",
                amount: "$2.8M",
                time: "6 meses",
                rating: 5,
                avatar: "M"
              },
              {
                name: "Carlos Rodríguez",
                role: "Profesional Independiente",
                content: "Como freelancer, mis deudas me tenían estresado. Ahora gano más con las comisiones que con mi trabajo principal. ¡Es alucinante!",
                amount: "$890K",
                time: "3 meses",
                rating: 5,
                avatar: "C"
              },
              {
                name: "Ana López",
                role: "Emprendedora",
                content: "Pensé que era imposible salir de deudas. NexuPay no solo me sacó de ellas, sino que ahora tengo ingresos pasivos. Recomiendo al 1000%.",
                amount: "$1.5M",
                time: "8 meses",
                rating: 5,
                avatar: "A"
              }
            ].map((testimonial, index) => (
              <div key={index} className="group animate-on-scroll opacity-0 translate-y-8 h-full">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 relative overflow-hidden h-full flex flex-col">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-xl"></div>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4 flex-shrink-0">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed italic flex-grow">
                    "{testimonial.content}"
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-shrink-0">
                    <div>
                      <div className="text-2xl font-black text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text">
                        {testimonial.amount}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Recuperado</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{testimonial.time}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Tiempo</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Impact Stats */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Impacto Global NexuPay</h3>
              <p className="text-gray-300 text-lg">Números que demuestran el cambio real</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "15,847", label: "Usuarios Activos", change: "+23%" },
                { number: "$127M", label: "Comisiones Pagadas", change: "+156%" },
                { number: "98.7%", label: "Satisfacción", change: "+2.1%" },
                { number: "24/7", label: "Disponibilidad", change: "100%" }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-4xl lg:text-5xl font-black text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text group-hover:scale-110 transition-transform mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">{stat.label}</div>
                  <div className="text-xs text-green-400 font-medium">{stat.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Vanguardista */}
      <section className="py-32 bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-float-delayed"></div>

          {/* Animated particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8">
              <Rocket className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-sm font-medium text-yellow-400">Momento de Cambio</span>
            </div>

            <h2 className="text-5xl lg:text-8xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">
                Tu Futuro
              </span>
              <br />
              <span className="text-4xl lg:text-6xl font-light text-gray-400">
                Comienza Ahora
              </span>
            </h2>

            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              <strong className="text-white">Miles de personas</strong> ya han transformado sus deudas en ingresos.
              <strong className="text-white"> Tú puedes ser el siguiente.</strong>
            </p>

            {/* Urgency Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text mb-2">
                  2,847
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Acuerdos Hoy</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text mb-2">
                  $18.5M
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Comisiones Pagadas</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2">
                  99.9%
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Satisfacción</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/registro')}
                className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 hover:from-purple-600 hover:via-blue-600 hover:to-indigo-600 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 px-12 py-6 text-xl font-semibold"
                rightIcon={<Rocket className="w-7 h-7" />}
              >
                Comenzar Mi Transformación
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-xl px-12 py-6 text-xl hover:scale-105 transition-all duration-300"
                leftIcon={<ArrowRight className="w-6 h-6" />}
              >
                Ya Tengo Cuenta
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sin compromiso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>100% gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Proceso seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>24/7 disponible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimalista Vanguardista */}
      <footer className="bg-black border-t border-white/10 py-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-4 mb-6 group">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                    <span className="text-white font-bold text-xl">N</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    NexuPay
                  </span>
                  <div className="text-sm text-gray-400">Future Finance</div>
                </div>
              </Link>

              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                La primera plataforma que combina <strong className="text-white">IA predictiva</strong>,
                <strong className="text-white">blockchain</strong> y
                <strong className="text-white">machine learning</strong> para revolucionar las cobranzas tradicionales.
              </p>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  Acceder
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => navigate('/registro')}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Comenzar
                </Button>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-6">Plataforma</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => document.getElementById('tech')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Tecnología</button></li>
                <li><button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Beneficios</button></li>
                <li><button onClick={() => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Impacto</button></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Seguridad</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">Sistema Operativo</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <Lock className="w-3 h-3 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">AES-256</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span className="text-sm text-purple-400 font-medium">SSL</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Desarrollado con</span>
                <Heart className="w-4 h-4 text-red-400 animate-pulse" />
                <span>en Chile</span>
              </div>
            </div>

            <div className="text-center mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                © 2025 NexuPay. Todos los derechos reservados.
                <span className="text-gray-600 ml-2">•</span>
                <span className="text-gray-600 ml-2 italic">"Conectando deudores con el futuro financiero"</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default LandingPage;