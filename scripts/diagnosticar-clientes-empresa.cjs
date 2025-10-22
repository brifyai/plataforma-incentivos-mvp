const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosticarClientesEmpresa() {
  try {
    console.log('🔍 Diagnosticando por qué María Concha no aparece en clientes...');
    
    // 1. Buscar empresa y usuario
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
    
    console.log(`🏢 Empresa: ${company.company_name} (ID: ${company.id})`);
    
    // 2. Buscar a María Concha
    const { data: mariaUser } = await supabase
      .from('users')
      .select('*')
      .eq('rut', '16610128-k')
      .single();
    
    console.log(`👤 María Concha: ${mariaUser.full_name} (ID: ${mariaUser.id})`);
    
    // 3. Verificar deudas de María Concha con esta empresa
    const { data: mariaDebts } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', mariaUser.id)
      .eq('company_id', company.id);
    
    console.log(`💳 Deudas de María con esta empresa: ${mariaDebts.length}`);
    if (mariaDebts.length > 0) {
      mariaDebts.forEach((debt, index) => {
        console.log(`  ${index + 1}. $${debt.current_amount} - ${debt.description}`);
      });
    }
    
    // 4. Verificar si María Concha está en la tabla clients
    const { data: clientRecords } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .eq('rut', '16610128-k');
    
    console.log(`📋 Registros en tabla clients: ${clientRecords.length}`);
    if (clientRecords.length > 0) {
      clientRecords.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.name} - ${client.email}`);
      });
    } else {
      console.log('❌ María Concha NO está registrada en la tabla clients');
    }
    
    // 5. Verificar todos los clientes de la empresa
    const { data: allClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);
    
    console.log(`📊 Total clientes en tabla clients: ${allClients.length}`);
    if (allClients.length > 0) {
      console.log('Lista de clientes:');
      allClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.business_name} - RUT: ${client.rut} - Email: ${client.contact_email}`);
      });
    }
    
    // 6. Si María tiene deudas pero no está en clients, crear el registro
    if (mariaDebts.length > 0 && clientRecords.length === 0) {
      console.log('\n🔄 Creando registro de cliente para María Concha...');
      
      const { error: createError } = await supabase
        .from('clients')
        .insert({
          company_id: company.id,
          business_name: mariaUser.full_name,
          rut: mariaUser.rut,
          contact_email: mariaUser.email,
          contact_phone: mariaUser.phone || null,
          contact_name: mariaUser.full_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Error creando registro de cliente:', createError);
      } else {
        console.log('✅ Registro de cliente creado correctamente');
        
        // Verificar que se creó
        const { data: verifyClient } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', company.id)
          .eq('rut', '16610128-k')
          .single();
        
        if (verifyClient) {
          console.log('✅ Verificación: Cliente ahora aparece en la base de datos');
          console.log(`  ID: ${verifyClient.id}`);
          console.log(`  Nombre: ${verifyClient.business_name}`);
          console.log(`  RUT: ${verifyClient.rut}`);
          console.log(`  Email: ${verifyClient.contact_email}`);
        }
      }
    }
    
    // 7. Verificar si hay otros deudores sin registro en clients
    console.log('\n🔍 Buscando deudores sin registro en clients...');
    
    const { data: allDebtors } = await supabase
      .from('debts')
      .select(`
        user_id,
        users!debts_user_id_fkey (
          full_name,
          rut,
          email,
          phone
        )
      `)
      .eq('company_id', company.id);
    
    const uniqueDebtors = [...new Map(allDebtors.map(d => [d.user_id, d.users])).values()];
    
    console.log(`📊 Deudores únicos con deudas: ${uniqueDebtors.length}`);
    
    for (const debtor of uniqueDebtors) {
      const { data: clientCheck } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .eq('rut', debtor.rut)
        .maybeSingle();
      
      if (!clientCheck) {
        console.log(`⚠️ Deudor sin registro en clients: ${debtor.full_name} (${debtor.rut})`);
        
        // Crear registro automáticamente
        const { error: autoCreateError } = await supabase
          .from('clients')
          .insert({
            company_id: company.id,
            name: debtor.full_name,
            rut: debtor.rut,
            email: debtor.email,
            phone: debtor.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (autoCreateError) {
          console.error(`❌ Error creando cliente para ${debtor.rut}:`, autoCreateError);
        } else {
          console.log(`✅ Cliente creado para ${debtor.rut}`);
        }
      }
    }
    
    // 8. Verificación final
    console.log('\n🔍 Verificación final...');
    
    const { data: finalClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id);
    
    console.log(`📊 Total final de clientes: ${finalClients.length}`);
    
    const mariaFinalClient = finalClients.find(c => c.rut === '16610128-k');
    if (mariaFinalClient) {
      console.log('✅ María Concha ahora aparece en la lista de clientes');
      console.log(`  Nombre: ${mariaFinalClient.name}`);
      console.log(`  RUT: ${mariaFinalClient.rut}`);
      console.log(`  Email: ${mariaFinalClient.email}`);
    } else {
      console.log('❌ María Concha aún no aparece en la lista de clientes');
    }
    
    console.log('\n🎉 Proceso completado');
    console.log('💡 Refresca la página de clientes para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

diagnosticarClientesEmpresa();