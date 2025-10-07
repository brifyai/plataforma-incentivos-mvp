/**
 * Security Page - Página de Información de Seguridad
 *
 * Página que explica las medidas de seguridad y protección de datos de la plataforma
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Button, Card, Input, Modal } from '../components/common';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Key,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Server,
  UserCheck,
  FileText,
} from 'lucide-react';

const SecurityPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    comentarios: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState(null);

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encriptación de Datos",
      description: "Todos los datos se encriptan usando estándares AES-256 tanto en tránsito como en reposo."
    },
    {
      icon: Database,
      title: "Bases de Datos Seguras",
      description: "Utilizamos PostgreSQL con políticas RLS (Row Level Security) para controlar el acceso a los datos."
    },
    {
      icon: Key,
      title: "Autenticación Segura",
      description: "Implementamos OAuth 2.0, JWT tokens y verificación de dos factores para máxima seguridad."
    },
    {
      icon: Shield,
      title: "Monitoreo Continuo",
      description: "Sistema de monitoreo 24/7 para detectar y prevenir amenazas de seguridad."
    },
    {
      icon: Eye,
      title: "Auditorías Regulares",
      description: "Realizamos auditorías de seguridad periódicas y penetration testing."
    },
    {
      icon: UserCheck,
      title: "Control de Accesos",
      description: "Principio de menor privilegio y autenticación basada en roles."
    }
  ];

  const complianceItems = [
    "Cumplimiento con la Ley 19.628 sobre Protección de Datos Personales",
    "Alineación con la Ley 19.799 sobre Servicios Financieros",
    "Certificación ISO 27001 en proceso",
    "Cumplimiento con estándares PCI DSS para datos financieros",
    "Auditorías externas anuales de seguridad"
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!contactForm.nombre || !contactForm.email || !contactForm.comentarios) {
      setContactError('Por favor, complete los campos obligatorios.');
      return;
    }

    setContactLoading(true);
    setContactError(null);

    try {
      // Aquí iría la lógica para enviar el email
      // Por ahora simulamos el envío
      const emailData = {
        to: 'hola@aintelligence.cl',
        subject: 'Consulta de Seguridad - Nexu Pay',
        body: `
Nombre: ${contactForm.nombre}
Email: ${contactForm.email}
Teléfono: ${contactForm.telefono || 'No proporcionado'}
Empresa: ${contactForm.empresa || 'No proporcionado'}

Comentarios:
${contactForm.comentarios}
        `
      };

      // Simular envío (en producción usar EmailJS, SendGrid, etc.)
      console.log('Enviando email:', emailData);

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reset form and close modal
      setContactForm({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        comentarios: ''
      });
      setShowContactModal(false);

      // Mostrar mensaje de éxito
      Swal.fire('¡Mensaje enviado!', 'Nos pondremos en contacto contigo pronto.', 'success');

    } catch (error) {
      setContactError('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">Nexu Pay</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                as={Link}
                to="/"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-accent-100/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-soft">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-display font-bold text-secondary-900 mb-6">
            Seguridad y Protección
          </h1>

          <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            La seguridad de tus datos es nuestra máxima prioridad. Implementamos las mejores prácticas
            de la industria para proteger tu información personal y financiera.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-4">
              Medidas de Seguridad Implementadas
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Tecnología de vanguardia para proteger tu información
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-medium transition-all">
                  <div className="p-6">
                    <div className="p-4 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl w-fit mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-900 mb-3">{feature.title}</h3>
                    <p className="text-secondary-600 leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-gradient-to-br from-secondary-50 to-primary-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-4">
              Cumplimiento Normativo
            </h2>
            <p className="text-xl text-secondary-600">
              Operamos bajo los más altos estándares regulatorios
            </p>
          </div>

          <Card className="shadow-soft">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900">Certificaciones y Compliance</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-secondary-900 mb-4">
              Protección de Datos Personales
            </h2>
            <p className="text-xl text-secondary-600">
              Tus datos están protegidos por ley y tecnología
            </p>
          </div>

          <div className="space-y-8">
            <Card className="shadow-soft">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900">Ley 19.628 - Protección de Datos</h3>
                </div>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Cumplimos estrictamente con la Ley 19.628 sobre Protección de Datos Personales de Chile.
                  Tus datos personales solo se utilizan para los fines específicos de la plataforma y nunca
                  se comparten con terceros sin tu consentimiento expreso.
                </p>
                <ul className="space-y-2 text-secondary-600">
                  <li>• Recopilación de datos solo con consentimiento informado</li>
                  <li>• Uso de datos exclusivamente para fines de la plataforma</li>
                  <li>• Derecho de acceso, rectificación y eliminación de datos</li>
                  <li>• Medidas técnicas y administrativas de protección</li>
                </ul>
              </div>
            </Card>

            <Card className="shadow-soft">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Server className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900">Infraestructura Segura</h3>
                </div>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Nuestra infraestructura está alojada en proveedores certificados con los más altos estándares
                  de seguridad. Utilizamos centros de datos con certificaciones internacionales y monitoreo continuo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-2">Servidores</h4>
                    <p className="text-sm text-secondary-600">Centros de datos certificados ISO 27001 con redundancia geográfica</p>
                  </div>
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-2">Backups</h4>
                    <p className="text-sm text-secondary-600">Copias de seguridad automáticas y encriptadas diariamente</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6">
            ¿Tienes Preguntas sobre Seguridad?
          </h2>
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            Nuestro equipo de seguridad está disponible para resolver cualquier duda que tengas
            sobre cómo protegemos tu información.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg shadow-glow hover:bg-gray-50 transition-all text-lg"
            >
              Contactar Seguridad
            </button>
            <Link
              to="/politica-de-privacidad"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all text-lg"
            >
              Ver Política de Privacidad
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary-400 whitespace-nowrap">
            © 2025 Nexu Pay. Todos los derechos reservados. Desarrollado con los más altos estándares de seguridad.
          </p>
        </div>
      </footer>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contactar Equipo de Seguridad"
        size="lg"
      >
        <form onSubmit={handleContactSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={contactForm.nombre}
              onChange={(e) => setContactForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Tu nombre completo"
              required
              disabled={contactLoading}
            />

            <Input
              label="Email *"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@email.com"
              required
              disabled={contactLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={contactForm.telefono}
              onChange={(e) => setContactForm(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="+56912345678"
              disabled={contactLoading}
            />

            <Input
              label="Empresa (Opcional)"
              value={contactForm.empresa}
              onChange={(e) => setContactForm(prev => ({ ...prev, empresa: e.target.value }))}
              placeholder="Nombre de tu empresa"
              disabled={contactLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Comentarios *
            </label>
            <textarea
              value={contactForm.comentarios}
              onChange={(e) => setContactForm(prev => ({ ...prev, comentarios: e.target.value }))}
              placeholder="Describe tu consulta sobre seguridad..."
              className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
              rows={4}
              required
              disabled={contactLoading}
            />
          </div>

          {contactError && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{contactError}</p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Tu mensaje será enviado a nuestro equipo de seguridad y te responderemos
              lo antes posible. Todos los datos son tratados con la máxima confidencialidad.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowContactModal(false)}
              className="flex-1"
              disabled={contactLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              loading={contactLoading}
            >
              Enviar Consulta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SecurityPage;