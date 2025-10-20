#!/usr/bin/env node

/**
 * SEO Images Generator - NexuPay
 *
 * Genera todas las imágenes necesarias para optimización SEO
 * usando Canvas y Sharp
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configuración de colores y branding
const BRAND = {
  colors: {
    primary: '#000000',      // Negro
    secondary: '#8B5CF6',    // Púrpura
    accent: '#3B82F6',       // Azul
    highlight: '#F59E0B',    // Ámbar
    text: '#FFFFFF',         // Blanco
    textSecondary: '#E5E7EB' // Gris claro
  },
  fonts: {
    primary: 'Arial',
    secondary: 'Arial'
  }
};

// Función para crear gradiente radial
function createRadialGradient(ctx, x, y, r1, r2, colors) {
  const gradient = ctx.createRadialGradient(x, y, r1, x, y, r2);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
}

// Función para crear gradiente lineal
function createLinearGradient(ctx, x1, y1, x2, y2, colors) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
}

// Función para dibujar elementos geométricos de fondo
function drawBackgroundElements(ctx, width, height) {
  // Gradiente de fondo
  const bgGradient = createLinearGradient(ctx, 0, 0, width, height, [
    BRAND.colors.primary,
    '#1a1a1a',
    '#0a0a0a'
  ]);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Elementos decorativos
  ctx.globalAlpha = 0.1;

  // Círculos grandes
  ctx.fillStyle = BRAND.colors.secondary;
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, width * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BRAND.colors.accent;
  ctx.beginPath();
  ctx.arc(width * 0.2, height * 0.8, width * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Hexágonos
  ctx.fillStyle = BRAND.colors.highlight;
  ctx.globalAlpha = 0.05;
  const hexSize = Math.min(width, height) * 0.15;

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = width * 0.5 + Math.cos(angle) * hexSize;
    const y = height * 0.5 + Math.sin(angle) * hexSize;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
}

// Función para dibujar el logo y texto principal
function drawMainContent(ctx, width, height, title, subtitle, isVertical = false) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Logo "N"
  ctx.fillStyle = BRAND.colors.text;
  ctx.font = `bold ${Math.min(width, height) * 0.15}px ${BRAND.fonts.primary}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Efecto de glow en el logo
  ctx.shadowColor = BRAND.colors.secondary;
  ctx.shadowBlur = 20;
  ctx.fillText('N', centerX, isVertical ? height * 0.25 : centerY - height * 0.15);
  ctx.shadowBlur = 0;

  // Título principal
  ctx.fillStyle = BRAND.colors.text;
  ctx.font = `bold ${Math.min(width, height) * 0.08}px ${BRAND.fonts.primary}`;
  ctx.fillText(title, centerX, isVertical ? height * 0.4 : centerY - height * 0.05);

  // Subtítulo
  ctx.fillStyle = BRAND.colors.textSecondary;
  ctx.font = `normal ${Math.min(width, height) * 0.04}px ${BRAND.fonts.secondary}`;
  ctx.fillText(subtitle, centerX, isVertical ? height * 0.5 : centerY + height * 0.05);

  // Tagline
  ctx.fillStyle = BRAND.colors.secondary;
  ctx.font = `normal ${Math.min(width, height) * 0.03}px ${BRAND.fonts.secondary}`;
  ctx.fillText('Future Finance • IA + Blockchain', centerX, isVertical ? height * 0.6 : centerY + height * 0.12);

  // Elementos decorativos
  ctx.strokeStyle = BRAND.colors.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;

  // Líneas decorativas
  const lineLength = Math.min(width, height) * 0.2;
  ctx.beginPath();
  ctx.moveTo(centerX - lineLength, isVertical ? height * 0.35 : centerY - height * 0.08);
  ctx.lineTo(centerX + lineLength, isVertical ? height * 0.35 : centerY - height * 0.08);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - lineLength, isVertical ? height * 0.55 : centerY + height * 0.08);
  ctx.lineTo(centerX + lineLength, isVertical ? height * 0.55 : centerY + height * 0.08);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// Función para generar Open Graph Image
async function generateOGImage() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackgroundElements(ctx, width, height);
  drawMainContent(ctx, width, height, 'NexuPay', 'Convierte tus Deudas en Ingresos');

  // Guardar como PNG primero, luego convertir a JPG
  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .jpeg({ quality: 90 })
    .toFile('public/og-image.jpg');

  console.log('✅ Generated: og-image.jpg (1200x630)');
}

// Función para generar Twitter Card Image
async function generateTwitterCard() {
  const width = 1200;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackgroundElements(ctx, width, height);
  drawMainContent(ctx, width, height, 'NexuPay', 'IA + Blockchain en Cobranzas');

  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .jpeg({ quality: 90 })
    .toFile('public/twitter-card.jpg');

  console.log('✅ Generated: twitter-card.jpg (1200x600)');
}

// Función para generar TikTok Card Image
async function generateTikTokCard() {
  const width = 1280;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackgroundElements(ctx, width, height);
  drawMainContent(ctx, width, height, 'NexuPay', 'Deudas → Ingresos', true);

  // Agregar elementos específicos para TikTok
  ctx.fillStyle = BRAND.colors.highlight;
  ctx.font = `bold ${height * 0.04}px ${BRAND.fonts.primary}`;
  ctx.textAlign = 'center';
  ctx.fillText('¡50% de Comisión!', width / 2, height * 0.75);

  ctx.fillStyle = BRAND.colors.accent;
  ctx.font = `normal ${height * 0.03}px ${BRAND.fonts.secondary}`;
  ctx.fillText('#NexuPay #Fintech #IA #Blockchain', width / 2, height * 0.82);

  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .jpeg({ quality: 90 })
    .toFile('public/tiktok-card.jpg');

  console.log('✅ Generated: tiktok-card.jpg (1280x720)');
}

// Función para generar favicons
async function generateFavicons() {
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' }
  ];

  // Crear canvas para favicon base
  const baseSize = 256;
  const baseCanvas = createCanvas(baseSize, baseSize);
  const baseCtx = baseCanvas.getContext('2d');

  // Fondo circular con gradiente
  const gradient = createRadialGradient(baseCtx, baseSize/2, baseSize/2, 0, baseSize/2, [
    BRAND.colors.secondary,
    BRAND.colors.accent
  ]);
  baseCtx.fillStyle = gradient;
  baseCtx.fillRect(0, 0, baseSize, baseSize);

  // Letra "N" en el centro
  baseCtx.fillStyle = BRAND.colors.text;
  baseCtx.font = `bold ${baseSize * 0.6}px ${BRAND.fonts.primary}`;
  baseCtx.textAlign = 'center';
  baseCtx.textBaseline = 'middle';
  baseCtx.fillText('N', baseSize/2, baseSize/2);

  const baseBuffer = baseCanvas.toBuffer('image/png');

  // Generar diferentes tamaños
  for (const { size, name } of sizes) {
    await sharp(baseBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/${name}`);
    console.log(`✅ Generated: ${name} (${size}x${size})`);
  }

  // Generar favicon.ico
  await sharp(baseBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  console.log('✅ Generated: favicon.ico (32x32)');
}

// Función principal
async function generateAllImages() {
  console.log('🚀 Generando imágenes SEO para NexuPay...\n');

  try {
    // Crear directorio public si no existe
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }

    // Generar todas las imágenes
    await generateOGImage();
    await generateTwitterCard();
    await generateTikTokCard();
    await generateFavicons();

    console.log('\n🎉 ¡Todas las imágenes SEO han sido generadas exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('- og-image.jpg (1200x630) - Open Graph');
    console.log('- twitter-card.jpg (1200x600) - Twitter Card');
    console.log('- tiktok-card.jpg (1280x720) - TikTok');
    console.log('- favicon.ico (32x32) - Favicon principal');
    console.log('- favicon-16x16.png (16x16) - Favicon pequeño');
    console.log('- favicon-32x32.png (32x32) - Favicon mediano');
    console.log('- apple-touch-icon.png (180x180) - iOS');

    console.log('\n💡 Ejecuta "npm run seo-check" para verificar que todo esté optimizado.');

  } catch (error) {
    console.error('❌ Error generando imágenes:', error);
    process.exit(1);
  }
}

// Ejecutar generación
generateAllImages();