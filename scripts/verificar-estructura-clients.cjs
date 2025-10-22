const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarEstructuraClients() {
  try {
    console.log('🔍 Verificando estructura exacta de la tabla clients...');
    
    // 1. Obtener un registro existente para ver la estructura
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
      .single();
    
    if (clientError) {
      console.error('❌ Error obteniendo cliente existente:', clientError);
      return;
    }
    
    console.log('📋 Estructura de la tabla clients (basado en registro existente):');
    console.log('Campos encontrados:');
    Object.keys(existingClient).forEach(key => {
      console.log(`  - ${key}: ${existingClient[key]}`);
    });
    
    // 2. Ahora crear el registro para María Concha con la estructura correcta
    console.log('\n🔄 Creando registro para María Concha con estructura correcta...');
    
    // Buscar datos de María Concha
    const { data: mariaUser } = await supabase
      .from('users')
      .select('*')
      .eq('rut', '16610128-k')
      .single();
    
    // Buscar empresa
    const { data: empresaUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .eq('role', 'company')
      .single();
    
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', empresaUser.id)
      .single();
    
    // Construir objeto con solo los campos que existen
    const clientData = {
      company_id: company.id,
      business_name: mariaUser.full_name,
      rut: mariaUser.rut,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Agregar campos opcionales solo si existen en la estructura
    if (existingClient.hasOwnProperty('contact_email')) {
      clientData.contact_email = mariaUser.email;
    }
    
    if (existingClient.hasOwnProperty('contact_phone')) {
      clientData.contact_phone = mariaUser.phone || null;
    }
    
    console.log('📝 Datos a insertar:', clientData);
    
    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error insertando cliente:', insertError);
    } else {
      console.log('✅ Cliente creado exitosamente:');
      console.log('  ID:', newClient.id);
      console.log('  Business Name:', newClient.business_name);
      console.log('  RUT:', newClient.rut);
      console.log('  Contact Email:', newClient.contact_email || 'No disponible');
    }
    
    // 3. Verificación final
    console.log('\n🔍 Verificación final...');
    
    const { data: allClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);
    
    console.log(`📊 Total clientes: ${allClients.length}`);
    
    const mariaClient = allClients.find(c => c.rut === '16610128-k');
    if (mariaClient) {
      console.log('✅ María Concha ahora aparece en la lista de clientes');
    } else {
      console.log('❌ María Concha aún no aparece');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

verificarEstructuraClients();