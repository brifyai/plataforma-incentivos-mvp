/**
 * Knowledge Base Service
 * 
 * Servicio para gestionar la creación automática de base de conocimiento
 * para nuevas empresas corporativas y su configuración IA.
 */

import { supabase } from '../config/supabase';

/**
 * Crea automáticamente la base de conocimiento para una nueva empresa
 * @param {Object} companyData - Datos de la empresa
 * @param {string} companyData.userId - ID del usuario
 * @param {string} companyData.companyName - Nombre de la empresa
 * @param {string} companyData.companyRut - RUT de la empresa
 * @param {string} companyData.email - Email de contacto
 * @param {string} companyData.phone - Teléfono de contacto
 * @returns {Promise<{success, error}>}
 */
export const createKnowledgeBaseForNewCompany = async (companyData) => {
  try {
    console.log('🧠 Creando base de conocimiento para nueva empresa:', companyData.companyName);
    
    const { userId, companyName, companyRut, email, phone } = companyData;
    
    // 1. Crear registro en corporate_clients si no existe
    const { data: existingClient, error: checkError } = await supabase
      .from('corporate_clients')
      .select('id')
      .eq('rut', companyRut)
      .single();
    
    let clientId;
    
    if (checkError && checkError.code === 'PGRST116') {
      // No existe, crearlo
      const { data: newClient, error: createError } = await supabase
        .from('corporate_clients')
        .insert({
          name: companyName,
          rut: companyRut,
          email: email,
          phone: phone,
          industry: 'General',
          display_category: 'Todos',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando corporate_client:', createError);
        return { success: false, error: createError.message };
      }
      
      clientId = newClient.id;
      console.log('✅ Corporate client creado:', clientId);
    } else if (checkError) {
      return { success: false, error: checkError.message };
    } else {
      clientId = existingClient.id;
      console.log('✅ Corporate client ya existe:', clientId);
    }
    
    // 2. Crear configuración IA por defecto para la empresa
    const defaultAIConfig = {
      company_id: userId,
      client_id: clientId,
      ai_provider: 'claude',
      model_name: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system_prompt: `Eres un asistente de negociación profesional para ${companyName}.

Tu objetivo principal es facilitar conversaciones de negociación de manera empática y efectiva, manteniendo siempre el profesionalismo y buscando soluciones mutuamente beneficiosas.

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${companyName}
- RUT: ${companyRut}
- Contacto: ${email}
- Teléfono: ${phone}

DIRECTRICES DE NEGOCIACIÓN:
1. Mantén un tono profesional pero empático
2. Escucha activamente las preocupaciones del deudor
3. Ofrece soluciones flexibles dentro de las políticas de la empresa
4. Sé transparente sobre opciones y limitaciones
5. Busca siempre el win-win cuando sea posible
6. Si la negociación se vuelve compleja, sugiere hablar con un representante humano

RESPONDE SIEMPRE EN ESPAÑOL.`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: configError } = await supabase
      .from('company_ai_config')
      .insert(defaultAIConfig);
    
    if (configError) {
      console.error('❌ Error creando configuración IA:', configError);
      return { success: false, error: configError.message };
    }
    
    console.log('✅ Configuración IA creada para la empresa');
    
    // 3. Crear políticas por defecto
    const defaultPolicies = [
      {
        client_id: clientId,
        policy_name: 'Política de Descuentos',
        policy_type: 'discount',
        policy_content: 'Se pueden ofrecer descuentos de hasta 15% con autorización automática. Para descuentos mayores se requiere aprobación de supervisor.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        policy_name: 'Política de Plazos',
        policy_type: 'payment_terms',
        policy_content: 'Plazos máximos de pago: 3 meses para deudas menores a $100.000, 6 meses para deudas entre $100.000 y $500.000, 12 meses para deudas mayores.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        policy_name: 'Política de Cuotas',
        policy_type: 'installments',
        policy_content: 'Número máximo de cuotas: 3 para deudas menores a $50.000, 6 para deudas entre $50.000 y $200.000, 12 para deudas mayores.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: policiesError } = await supabase
      .from('corporate_client_policies')
      .insert(defaultPolicies);
    
    if (policiesError) {
      console.error('❌ Error creando políticas:', policiesError);
      return { success: false, error: policiesError.message };
    }
    
    console.log('✅ Políticas por defecto creadas');
    
    // 4. Crear respuestas rápidas por defecto
    const defaultResponses = [
      {
        client_id: clientId,
        trigger_keyword: 'descuento',
        response_template: 'Entiendo que busques una mejor opción. Puedo ofrecerte hasta un 15% de descuento adicional sobre la propuesta actual. ¿Te gustaría que calculemos el monto final con este descuento?',
        category: 'negotiation',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        trigger_keyword: 'cuotas',
        response_template: 'Podemos dividir el pago en cuotas según el monto: 3 cuotas para deudas menores a $50.000, 6 cuotas para deudas entre $50.000 y $200.000, o hasta 12 cuotas para deudas mayores. ¿Cuál prefieres?',
        category: 'payment_options',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        trigger_keyword: 'tiempo',
        response_template: 'Podemos extender el plazo de pago según nuestras políticas: hasta 3 meses para deudas menores, 6 meses para montos intermedios, o 12 meses para deudas mayores. ¿Cuánto tiempo necesitarías?',
        category: 'timing',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        trigger_keyword: 'hablar persona',
        response_template: 'Entiendo perfectamente. Te transferiré con uno de nuestros representantes especializados que podrá ayudarte mejor con tu caso específico. Un momento por favor.',
        category: 'escalation',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        client_id: clientId,
        trigger_keyword: 'no puedo pagar',
        response_template: 'Comprendo tu situación. Estamos aquí para ayudarte a encontrar una solución que funcione para ambos. ¿Podrías contarme más sobre tus circunstancias actuales? Así puedo buscar las mejores opciones disponibles para ti.',
        category: 'empathy',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: responsesError } = await supabase
      .from('corporate_client_responses')
      .insert(defaultResponses);
    
    if (responsesError) {
      console.error('❌ Error creando respuestas rápidas:', responsesError);
      return { success: false, error: responsesError.message };
    }
    
    console.log('✅ Respuestas rápidas por defecto creadas');
    
    // 5. Crear entrada en knowledge base por defecto
    const defaultKnowledge = {
      client_id: clientId,
      category: 'general',
      title: 'Información General de la Empresa',
      content: `## ${companyName}

**RUT:** ${companyRut}
**Contacto:** ${email}
**Teléfono:** ${phone}

### Políticas de Negociación Estándar:

1. **Descuentos:** Hasta 15% con autorización automática
2. **Plazos:** Máximo 12 meses según monto de deuda
3. **Cuotas:** Hasta 12 cuotas para deudas mayores
4. **Flexibilidad:** Buscamos siempre soluciones mutuamente beneficiosas

### Proceso de Negociación:

1. Escucha activa de las necesidades del deudor
2. Presentación de opciones disponibles
3. Búsqueda de solución win-win
4. Escalada a representante humano si es necesario

### Objetivos:

- Mantener relación positiva con clientes
- Recuperar inversiones de manera sostenible
- Facilitar soluciones de pago realistas`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: knowledgeError } = await supabase
      .from('company_knowledge_base')
      .insert(defaultKnowledge);
    
    if (knowledgeError) {
      console.error('❌ Error creando knowledge base:', knowledgeError);
      return { success: false, error: knowledgeError.message };
    }
    
    console.log('✅ Knowledge base por defecto creada');
    
    console.log('🎉 Base de conocimiento creada exitosamente para:', companyName);
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Error en createKnowledgeBaseForNewCompany:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica si una empresa ya tiene base de conocimiento configurada
 * @param {string} userId - ID del usuario/empresa
 * @returns {Promise<{hasKnowledgeBase, error}>}
 */
export const checkCompanyKnowledgeBase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('company_ai_config')
      .select('id')
      .eq('company_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return { hasKnowledgeBase: false, error: null };
    }
    
    if (error) {
      return { hasKnowledgeBase: false, error: error.message };
    }
    
    return { hasKnowledgeBase: !!data, error: null };
    
  } catch (error) {
    console.error('❌ Error en checkCompanyKnowledgeBase:', error);
    return { hasKnowledgeBase: false, error: error.message };
  }
};

/**
 * Inicializa base de conocimiento para empresas existentes que no tienen
 * @returns {Promise<{processed, errors}>}
 */
export const initializeExistingCompaniesKnowledgeBase = async () => {
  try {
    console.log('🔄 Buscando empresas sin base de conocimiento...');
    
    // Obtener todas las empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        rut,
        contact_email,
        contact_phone,
        user_id
      `);
    
    if (companiesError) {
      return { processed: 0, errors: [companiesError.message] };
    }
    
    let processed = 0;
    const errors = [];
    
    for (const company of companies) {
      // Verificar si ya tiene configuración IA
      const { hasKnowledgeBase } = await checkCompanyKnowledgeBase(company.user_id);
      
      if (!hasKnowledgeBase) {
        console.log(`📝 Creando base de conocimiento para: ${company.company_name}`);
        
        const result = await createKnowledgeBaseForNewCompany({
          userId: company.user_id,
          companyName: company.company_name,
          companyRut: company.rut,
          email: company.contact_email,
          phone: company.contact_phone
        });
        
        if (result.success) {
          processed++;
          console.log(`✅ Base de conocimiento creada para: ${company.company_name}`);
        } else {
          errors.push(`Error en ${company.company_name}: ${result.error}`);
          console.error(`❌ Error creando base de conocimiento para ${company.company_name}:`, result.error);
        }
      } else {
        console.log(`⏭️ ${company.company_name} ya tiene base de conocimiento`);
      }
    }
    
    console.log(`🎉 Proceso completado: ${processed} empresas procesadas`);
    return { processed, errors };
    
  } catch (error) {
    console.error('❌ Error en initializeExistingCompaniesKnowledgeBase:', error);
    return { processed: 0, errors: [error.message] };
  }
};