/**
 * Script para asegurar que los clientes corporativos existentes
 * estén disponibles en todo el sistema, especialmente en el dashboard de IA
 * 
 * Uso:
 * node scripts/ensure_corporate_clients.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Verificando y asegurando clientes corporativos en todo el sistema...\n');

// Clientes corporativos que deben existir
const REQUIRED_CORPORATE_CLIENTS = [
  {
    name: 'TechCorp S.A.',
    business_name: 'TechCorp S.A.',
    rut: '76.123.456-7',
    display_category: 'Tecnología',
    contact_email: 'contacto@techcorp.cl',
    contact_phone: '+56 2 2345 6789',
    address: 'Av. Tecnología 1234, Santiago',
    industry: 'Tecnología',
    company_size: 'Grande',
    is_active: true
  },
  {
    name: 'RetailMax Ltda.',
    business_name: 'RetailMax Ltda.',
    rut: '77.987.654-3',
    display_category: 'Retail',
    contact_email: 'contacto@retailmax.cl',
    contact_phone: '+56 2 3456 7890',
    address: 'Av. Comercio 5678, Santiago',
    industry: 'Retail',
    company_size: 'Mediana',
    is_active: true
  }
];

// ID de la empresa principal (usaremos la primera empresa existente)
const MAIN_COMPANY_ID = 'f3183fcf-18b8-4ae9-9679-38c45ba9f94b'; // Empresa de Cobranza S.A.

async function getCompanyIdByName(companyName) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('company_name', companyName)
      .single();
    
    if (error) {
      console.error(`❌ Error obteniendo ID de empresa ${companyName}:`, error.message);
      return null;
    }
    
    return data?.id;
  } catch (error) {
    console.error(`❌ Error de conexión para empresa ${companyName}:`, error.message);
    return null;
  }
}

async function ensureCorporateClient(clientData, companyId) {
  try {
    console.log(`📋 Verificando cliente: ${clientData.name}`);
    
    // Verificar si ya existe
    const { data: existingClient, error: checkError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', companyId)
      .eq('name', clientData.name)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ Error verificando cliente existente:`, checkError.message);
      return false;
    }
    
    if (existingClient) {
      console.log(`✅ Cliente ${clientData.name} ya existe (ID: ${existingClient.id})`);
      
      // Actualizar datos si es necesario
      const { error: updateError } = await supabase
        .from('corporate_clients')
        .update({
          name: clientData.name,
          display_category: clientData.display_category,
          contact_email: clientData.contact_email,
          contact_phone: clientData.contact_phone,
          address: clientData.address,
          industry: clientData.industry,
          is_active: clientData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClient.id);
      
      if (updateError) {
        console.error(`❌ Error actualizando cliente:`, updateError.message);
        return false;
      }
      
      console.log(`🔄 Cliente ${clientData.name} actualizado`);
      return existingClient.id;
    } else {
      // Crear nuevo cliente corporativo
      const { data: newClient, error: insertError } = await supabase
        .from('corporate_clients')
        .insert({
          company_id: companyId,
          name: clientData.name,
          display_category: clientData.display_category,
          contact_email: clientData.contact_email,
          contact_phone: clientData.contact_phone,
          address: clientData.address,
          industry: clientData.industry,
          is_active: clientData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`❌ Error creando cliente:`, insertError.message);
        return false;
      }
      
      console.log(`🆕 Cliente ${clientData.name} creado (ID: ${newClient.id})`);
      return newClient.id;
    }
  } catch (error) {
    console.error(`❌ Error procesando cliente ${clientData.name}:`, error.message);
    return false;
  }
}

async function ensureKnowledgeBase(corporateClientId, clientData) {
  try {
    console.log(`📚 Verificando base de conocimiento para: ${clientData.name}`);
    
    // Verificar si ya tiene configuración de IA
    const { data: existingConfig, error: checkError } = await supabase
      .from('negotiation_ai_config')
      .select('*')
      .eq('corporate_client_id', corporateClientId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ Error verificando config IA existente:`, checkError.message);
      return false;
    }
    
    if (existingConfig) {
      console.log(`✅ Configuración IA ya existe para ${clientData.name}`);
      return true;
    }
    
    // Crear configuración de IA por defecto
    const { error: insertError } = await supabase
      .from('negotiation_ai_config')
      .insert({
        corporate_client_id: corporateClientId,
        max_negotiation_discount: 15,
        max_negotiation_term: 12,
        auto_respond: true,
        working_hours: { start: '09:00', end: '18:00' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error(`❌ Error creando configuración IA:`, insertError.message);
      return false;
    }
    
    console.log(`🆕 Configuración IA creada para ${clientData.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en base de conocimiento para ${clientData.name}:`, error.message);
    return false;
  }
}

async function ensurePromptTemplates(corporateClientId, clientData) {
  try {
    console.log(`📝 Verificando plantillas de prompts para: ${clientData.name}`);
    
    // Plantillas por defecto
    const defaultTemplates = [
      {
        prompt_type: 'negotiation',
        prompt_name: 'Respuesta inicial de negociación',
        prompt_template: `Eres un asistente de negociación para ${clientData.business_name}. El deudor {nombre_deudor} ({rut_deudor}) tiene una deuda de {monto_deuda} por {tipo_deuda} con {dias_mora} días de mora. Ofrece opciones de pago flexibles dentro de nuestros límites: descuento máximo {descuento_maximo}%, plazo máximo {plazo_maximo} meses. Sé profesional pero empático.`,
        variables: ['{nombre_deudor}', '{rut_deudor}', '{monto_deuda}', '{tipo_deuda}', '{dias_mora}', '{descuento_maximo}', '{plazo_maximo}'],
        priority: 1,
        is_active: true
      },
      {
        prompt_type: 'welcome',
        prompt_name: 'Mensaje de bienvenida',
        prompt_template: `¡Hola {nombre_deudor}! Bienvenido(a) al sistema de gestión de ${clientData.business_name}. Estamos aquí para ayudarte a encontrar la mejor solución para tu deuda. ¿En qué podemos asistirte hoy?`,
        variables: ['{nombre_deudor}'],
        priority: 2,
        is_active: true
      },
      {
        prompt_type: 'escalation',
        prompt_name: 'Escalada a representante',
        prompt_template: `Entiendo que necesitas asistencia personalizada. Voy a transferirte a uno de nuestros representantes de ${clientData.business_name} quien podrá ayudarte mejor con tu situación específica.`,
        variables: [],
        priority: 3,
        is_active: true
      }
    ];
    
    for (const template of defaultTemplates) {
      const { error: insertError } = await supabase
        .from('corporate_prompt_templates')
        .insert({
          corporate_client_id: corporateClientId,
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error(`❌ Error creando plantilla ${template.prompt_name}:`, insertError.message);
        return false;
      }
    }
    
    console.log(`🆕 ${defaultTemplates.length} plantillas de prompts creadas para ${clientData.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en plantillas de prompts para ${clientData.name}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    let processedClients = 0;
    let errors = [];
    
    console.log('🏢 Procesando clientes corporativos requeridos...\n');
    
    for (const clientData of REQUIRED_CORPORATE_CLIENTS) {
      try {
        // Usar la empresa principal para todos los clientes corporativos
        const companyId = MAIN_COMPANY_ID;
        console.log(`🏢 Usando empresa principal: Empresa de Cobranza S.A. (ID: ${companyId})`);
        
        // Asegurar cliente corporativo
        const corporateClientId = await ensureCorporateClient(clientData, companyId);
        
        if (!corporateClientId) {
          errors.push(`No se pudo crear/actualizar cliente corporativo ${clientData.name}`);
          continue;
        }
        
        // Asegurar base de conocimiento
        const kbResult = await ensureKnowledgeBase(corporateClientId, clientData);
        
        // Asegurar plantillas de prompts
        const promptsResult = await ensurePromptTemplates(corporateClientId, clientData);
        
        if (kbResult && promptsResult) {
          processedClients++;
          console.log(`✅ ${clientData.name} completamente configurado\n`);
        } else {
          errors.push(`Error en configuración completa de ${clientData.name}`);
        }
        
      } catch (error) {
        errors.push(`Error procesando ${clientData.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 RESULTADOS FINALES:');
    console.log(`✅ Clientes procesados exitosamente: ${processedClients}`);
    console.log(`❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ DETALLE DE ERRORES:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (processedClients === REQUIRED_CORPORATE_CLIENTS.length) {
      console.log('\n🎉 Todos los clientes corporativos están configurados y listos para usar en el dashboard de IA!');
      console.log('📍 Ahora deberían aparecer en: http://localhost:3002/empresa/ia');
    } else {
      console.log('\n⚠️ Algunos clientes no pudieron ser configurados completamente.');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando el script principal:', error.message);
    process.exit(1);
  }
}

main();