#!/usr/bin/env node

/**
 * SEO Checker Script - NexuPay
 *
 * Verifica que todas las optimizaciones SEO estén implementadas correctamente
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'http://localhost:3000'; // Cambiar a producción cuando esté listo

class SEOChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const coloredMessage = this.colorize(message, type);
    console.log(`[${timestamp}] ${coloredMessage}`);
  }

  colorize(message, type) {
    const colors = {
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      success: '\x1b[32m', // Green
      info: '\x1b[36m'     // Cyan
    };
    return `${colors[type]}${message}\x1b[0m`;
  }

  // Verificar archivos requeridos
  checkRequiredFiles() {
    this.log('🔍 Verificando archivos requeridos...', 'info');

    const requiredFiles = [
      'index.html',
      'public/site.webmanifest',
      'public/robots.txt',
      'public/sitemap.xml',
      'public/browserconfig.xml',
      'src/components/common/SEO.jsx'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.success.push(`✅ Archivo encontrado: ${file}`);
      } else {
        this.errors.push(`❌ Archivo faltante: ${file}`);
      }
    });
  }

  // Verificar meta tags en index.html
  checkMetaTags() {
    this.log('🏷️ Verificando meta tags...', 'info');

    try {
      const htmlContent = fs.readFileSync('index.html', 'utf8');

      const requiredMetaTags = [
        { name: 'description', type: 'name' },
        { name: 'keywords', type: 'name' },
        { name: 'author', type: 'name' },
        { name: 'robots', type: 'name' },
        { name: 'og:title', type: 'property' },
        { name: 'og:description', type: 'property' },
        { name: 'og:image', type: 'property' },
        { name: 'twitter:title', type: 'name' },
        { name: 'twitter:description', type: 'name' },
        { name: 'twitter:image', type: 'name' }
      ];

      requiredMetaTags.forEach(tag => {
        const attr = tag.type === 'name' ? 'name' : 'property';
        const regex = new RegExp(`<meta ${attr}="${tag.name}"`, 'i');

        if (regex.test(htmlContent)) {
          this.success.push(`✅ Meta tag encontrado: ${tag.name}`);
        } else {
          this.errors.push(`❌ Meta tag faltante: ${tag.name}`);
        }
      });

      // Verificar Schema.org
      if (htmlContent.includes('application/ld+json')) {
        this.success.push('✅ Schema.org structured data encontrado');
      } else {
        this.errors.push('❌ Schema.org structured data faltante');
      }

    } catch (error) {
      this.errors.push(`❌ Error leyendo index.html: ${error.message}`);
    }
  }

  // Verificar imágenes requeridas
  checkImages() {
    this.log('🖼️ Verificando imágenes requeridas...', 'info');

    const requiredImages = [
      'public/og-image.jpg',
      'public/twitter-card.jpg',
      'public/tiktok-card.jpg',
      'public/favicon.ico',
      'public/favicon-16x16.png',
      'public/favicon-32x32.png',
      'public/apple-touch-icon.png'
    ];

    requiredImages.forEach(image => {
      if (fs.existsSync(image)) {
        this.success.push(`✅ Imagen encontrada: ${image}`);
      } else {
        this.warnings.push(`⚠️ Imagen faltante (crear placeholder): ${image}`);
      }
    });
  }

  // Verificar sitemap.xml
  checkSitemap() {
    this.log('🗺️ Verificando sitemap.xml...', 'info');

    try {
      const sitemapContent = fs.readFileSync('public/sitemap.xml', 'utf8');

      if (sitemapContent.includes('<urlset')) {
        this.success.push('✅ Sitemap.xml válido');
      } else {
        this.errors.push('❌ Sitemap.xml malformado');
      }

      // Contar URLs
      const urlMatches = sitemapContent.match(/<loc>/g);
      if (urlMatches) {
        this.success.push(`✅ Sitemap contiene ${urlMatches.length} URLs`);
      }

    } catch (error) {
      this.errors.push(`❌ Error leyendo sitemap.xml: ${error.message}`);
    }
  }

  // Verificar robots.txt
  checkRobotsTxt() {
    this.log('🤖 Verificando robots.txt...', 'info');

    try {
      const robotsContent = fs.readFileSync('public/robots.txt', 'utf8');

      if (robotsContent.includes('User-agent: *')) {
        this.success.push('✅ Robots.txt válido');
      } else {
        this.errors.push('❌ Robots.txt malformado');
      }

      if (robotsContent.includes('Sitemap:')) {
        this.success.push('✅ Sitemap referenciado en robots.txt');
      } else {
        this.warnings.push('⚠️ Sitemap no referenciado en robots.txt');
      }

    } catch (error) {
      this.errors.push(`❌ Error leyendo robots.txt: ${error.message}`);
    }
  }

  // Verificar Web App Manifest
  checkManifest() {
    this.log('📱 Verificando Web App Manifest...', 'info');

    try {
      const manifestContent = fs.readFileSync('public/site.webmanifest', 'utf8');
      const manifest = JSON.parse(manifestContent);

      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];

      requiredFields.forEach(field => {
        if (manifest[field]) {
          this.success.push(`✅ Manifest field: ${field}`);
        } else {
          this.errors.push(`❌ Manifest field faltante: ${field}`);
        }
      });

    } catch (error) {
      this.errors.push(`❌ Error leyendo/parsing manifest: ${error.message}`);
    }
  }

  // Verificar componente SEO
  checkSEOComponent() {
    this.log('⚛️ Verificando componente SEO...', 'info');

    try {
      const seoContent = fs.readFileSync('src/components/common/SEO.jsx', 'utf8');

      if (seoContent.includes('useEffect')) {
        this.success.push('✅ Componente SEO tiene useEffect');
      }

      if (seoContent.includes('document.title')) {
        this.success.push('✅ Componente SEO actualiza document.title');
      }

      if (seoContent.includes('meta[property="og:"')) {
        this.success.push('✅ Componente SEO maneja Open Graph');
      }

    } catch (error) {
      this.errors.push(`❌ Error leyendo componente SEO: ${error.message}`);
    }
  }

  // Verificar CSS personalizado
  checkCustomCSS() {
    this.log('🎨 Verificando CSS personalizado...', 'info');

    try {
      const cssContent = fs.readFileSync('src/index.css', 'utf8');

      const customClasses = [
        'animate-float',
        'animate-gradient-x',
        'animate-spin-slow',
        'animate-on-scroll'
      ];

      customClasses.forEach(className => {
        if (cssContent.includes(className)) {
          this.success.push(`✅ Clase CSS encontrada: ${className}`);
        } else {
          this.warnings.push(`⚠️ Clase CSS faltante: ${className}`);
        }
      });

    } catch (error) {
      this.errors.push(`❌ Error leyendo CSS: ${error.message}`);
    }
  }

  // Ejecutar todas las verificaciones
  async run() {
    this.log('🚀 Iniciando verificación SEO completa...', 'info');
    this.log('=' .repeat(50), 'info');

    this.checkRequiredFiles();
    this.checkMetaTags();
    this.checkImages();
    this.checkSitemap();
    this.checkRobotsTxt();
    this.checkManifest();
    this.checkSEOComponent();
    this.checkCustomCSS();

    this.log('=' .repeat(50), 'info');

    // Resultados
    this.log(`✅ Éxitos: ${this.success.length}`, 'success');
    this.success.forEach(msg => this.log(msg, 'success'));

    if (this.warnings.length > 0) {
      this.log(`⚠️ Advertencias: ${this.warnings.length}`, 'warning');
      this.warnings.forEach(msg => this.log(msg, 'warning'));
    }

    if (this.errors.length > 0) {
      this.log(`❌ Errores: ${this.errors.length}`, 'error');
      this.errors.forEach(msg => this.log(msg, 'error'));
    }

    this.log('=' .repeat(50), 'info');

    if (this.errors.length === 0) {
      this.log('🎉 ¡SEO completamente optimizado!', 'success');
    } else {
      this.log('⚠️ Algunos elementos requieren atención', 'warning');
    }

    // Resumen
    this.log(`\n📊 Resumen: ${this.success.length} ✅, ${this.warnings.length} ⚠️, ${this.errors.length} ❌`, 'info');
  }
}

// Ejecutar verificación
const checker = new SEOChecker();
checker.run().catch(console.error);