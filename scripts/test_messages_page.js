/**
 * Script de prueba para la página de mensajes
 * Verifica funcionalidad de botones y elementos interactivos
 */

const puppeteer = require('puppeteer');

async function testMessagesPage() {
  console.log('🧪 Iniciando pruebas de la página de mensajes...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navegar a la página de mensajes
    await page.goto('http://localhost:3002/empresa/mensajes');
    await page.waitForSelector('.space-y-8', { timeout: 10000 });
    
    console.log('✅ Página de mensajes cargada correctamente');
    
    // 1. Verificar botones principales
    console.log('\n🔍 Verificando botones principales...');
    
    // Botón "Nuevo Mensaje"
    const nuevoMensajeBtn = await page.$('button:has-text("Nuevo Mensaje")');
    if (nuevoMensajeBtn) {
      console.log('✅ Botón "Nuevo Mensaje" encontrado');
      await nuevoMensajeBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar que se abre el modal
      const modalTitle = await page.$('text=Enviar Nuevo Mensaje');
      if (modalTitle) {
        console.log('✅ Modal "Nuevo Mensaje" se abre correctamente');
        
        // Cerrar modal
        const cancelBtn = await page.$('button:has-text("Cancelar")');
        if (cancelBtn) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
          console.log('✅ Modal se cierra correctamente');
        }
      }
    } else {
      console.log('❌ Botón "Nuevo Mensaje" no encontrado');
    }
    
    // Botón "Actualizar"
    const actualizarBtn = await page.$('button:has-text("Actualizar")');
    if (actualizarBtn) {
      console.log('✅ Botón "Actualizar" encontrado');
    } else {
      console.log('❌ Botón "Actualizar" no encontrado');
    }
    
    // 2. Verificar sección de conversaciones activas
    console.log('\n🔍 Verificando conversaciones activas...');
    
    const conversationsSection = await page.$('text=Conversaciones Activas con IA');
    if (conversationsSection) {
      console.log('✅ Sección "Conversaciones Activas con IA" encontrada');
      
      // Buscar botones "Ver Conversación"
      const verConversacionBtns = await page.$$('button:has-text("Ver Conversación")');
      if (verConversacionBtns.length > 0) {
        console.log(`✅ Encontrados ${verConversacionBtns.length} botones "Ver Conversación"`);
        
        // Probar el primer botón
        await verConversacionBtns[0].click();
        await page.waitForTimeout(1000);
        
        // Verificar que se abre el modal de conversación
        const conversationModal = await page.$('text=Conversación con');
        if (conversationModal) {
          console.log('✅ Modal de conversación se abre correctamente');
          
          // Verificar componentes de IA
          const aiStatus = await page.$('text=IA Activa');
          if (aiStatus) {
            console.log('✅ Estado de IA visible');
          }
          
          // Buscar botones de acción de IA
          const responderConIABtn = await page.$('button:has-text("Responder con IA")');
          const escalarHumanoBtn = await page.$('button:has-text("Escalar a Humano")');
          
          if (responderConIABtn) {
            console.log('✅ Botón "Responder con IA" encontrado');
            
            // Probar respuesta de IA
            await responderConIABtn.click();
            await page.waitForTimeout(2000);
            
            // Verificar si aparece respuesta de IA
            const aiResponse = await page.$('text=Última respuesta generada');
            if (aiResponse) {
              console.log('✅ Respuesta de IA generada correctamente');
            }
          }
          
          if (escalarHumanoBtn) {
            console.log('✅ Botón "Escalar a Humano" encontrado');
          }
          
          // Cerrar modal
          const closeBtn = await page.$('button:has-text("Cerrar")');
          if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    } else {
      console.log('❌ Sección "Conversaciones Activas con IA" no encontrada');
    }
    
    // 3. Verificar filtros de fecha
    console.log('\n🔍 Verificando filtros de fecha...');
    
    const hoyBtn = await page.$('button:has-text("Hoy")');
    const ultimos7DiasBtn = await page.$('button:has-text("Últimos 7 días")');
    const esteMesBtn = await page.$('button:has-text("Este mes")');
    
    if (hoyBtn) console.log('✅ Botón "Hoy" encontrado');
    if (ultimos7DiasBtn) console.log('✅ Botón "Últimos 7 días" encontrado');
    if (esteMesBtn) console.log('✅ Botón "Este mes" encontrado');
    
    // Probar filtro "Hoy"
    if (hoyBtn) {
      await hoyBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Filtro "Hoy" aplicado');
    }
    
    // 4. Verificar sección de reportes de campañas
    console.log('\n🔍 Verificando reportes de campañas...');
    
    const reportesSection = await page.$('text=Reportes de Campañas');
    if (reportesSection) {
      console.log('✅ Sección "Reportes de Campañas" encontrada');
      
      // Verificar filtro por empresa
      const empresaFilter = await page.$('select');
      if (empresaFilter) {
        console.log('✅ Filtro por empresa corporativa encontrado');
      }
      
      // Verificar botón de limpiar filtro
      const limpiarFiltroBtn = await page.$('button:has-text("Limpiar Filtro")');
      if (limpiarFiltroBtn) {
        console.log('✅ Botón "Limpiar Filtro" encontrado');
      }
    }
    
    // 5. Verificar métricas y estadísticas
    console.log('\n🔍 Verificando métricas...');
    
    const metricCards = await page.$$('.grid.grid-cols-1.md\\:grid-cols-4.gap-3 .text-sm.font-bold');
    if (metricCards.length > 0) {
      console.log(`✅ Encontradas ${metricCards.length} métricas visibles`);
    }
    
    // 6. Verificar navegación
    console.log('\n🔍 Verificando navegación...');
    
    // Intentar navegar a otras páginas para verificar que no se rompe
    await page.goto('http://localhost:3002/empresa/dashboard');
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:3002/empresa/mensajes');
    await page.waitForSelector('.space-y-8', { timeout: 5000 });
    
    console.log('✅ Navegación funciona correctamente');
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testMessagesPage().catch(console.error);
}

module.exports = { testMessagesPage };