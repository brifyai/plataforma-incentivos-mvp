const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function moveMariaConchaToEmpresa() {
  try {
    console.log('🔍 Buscando información de María Concha (RUT: 16610128-k)...');
    
    // 1. Buscar a María Concha en la tabla users
    const { data: mariaUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('rut', '16610128-k')
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Error buscando usuario:', userError);
      return;
    }
    
    if (!mariaUser) {
      console.log('❌ No se encontró usuario con RUT 16610128-k');
      
      // Buscar por nombre
      const { data: byName, error: nameError } = await supabase
        .from('users')
        .select('*')
        .ilike('full_name', '%maría%concha%')
        .maybeSingle();
      
      if (nameError) {
        console.error('❌ Error buscando por nombre:', nameError);
        return;
      }
      
      if (!byName) {
        console.log('❌ No se encontró usuario con el nombre María Concha');
        return;
      }
      
      console.log('✅ Usuario encontrado por nombre:', byName);
      mariaUser = byName;
    } else {
      console.log('✅ Usuario encontrado por RUT:', mariaUser);
    }
    
    // 2. Buscar la empresa empresa@nexupay.cl
    const { data: empresaUser, error: empresaError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .eq('role', 'company')
      .single();
    
    if (empresaError) {
      console.error('❌ Error buscando empresa:', empresaError);
      return;
    }
    
    console.log('✅ Empresa encontrada:', empresaUser);
    
    // 3. Buscar la compañía asociada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', empresaUser.id)
      .single();
    
    if (companyError) {
      console.error('❌ Error buscando compañía:', companyError);
      return;
    }
    
    console.log('✅ Compañía encontrada:', company);
    
    // 4. Verificar si María Concha ya tiene deudas asociadas
    const { data: existingDebts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', mariaUser.id);
    
    if (debtsError) {
      console.error('❌ Error buscando deudas existentes:', debtsError);
      return;
    }
    
    console.log(`📊 Deudas existentes de María Concha: ${existingDebts.length}`);
    
    if (existingDebts.length > 0) {
      console.log('📋 Deudas actuales:');
      existingDebts.forEach((debt, index) => {
        console.log(`  ${index + 1}. ID: ${debt.id}, Monto: $${debt.current_amount}, Empresa: ${debt.company_id}`);
      });
      
      // 5. Actualizar todas las deudas para que pertenezcan a la nueva empresa
      console.log('🔄 Actualizando deudas para que pertenezcan a la nueva empresa...');
      
      for (const debt of existingDebts) {
        const { error: updateError } = await supabase
          .from('debts')
          .update({ 
            company_id: company.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', debt.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando deuda ${debt.id}:`, updateError);
        } else {
          console.log(`✅ Deuda ${debt.id} actualizada correctamente`);
        }
      }
    } else {
      // 6. Si no tiene deudas, crear una de ejemplo
      console.log('📝 Creando deuda de ejemplo para María Concha...');
      
      const { data: newDebt, error: createError } = await supabase
        .from('debts')
        .insert({
          user_id: mariaUser.id,
          company_id: company.id,
          current_amount: 150000,
          original_amount: 150000,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          description: 'Deuda de ejemplo reasignada a empresa@nexupay.cl',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando deuda:', createError);
      } else {
        console.log('✅ Deuda creada correctamente:', newDebt);
      }
    }
    
    // 7. Verificar si María Concha está como cliente de alguna empresa
    const { data: clientRecords, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k');
    
    if (clientError) {
      console.error('❌ Error buscando registros de cliente:', clientError);
    } else {
      console.log(`📋 Registros como cliente: ${clientRecords.length}`);
      
      if (clientRecords.length > 0) {
        // Actualizar o crear registro como cliente de la nueva empresa
        const existingClientForCompany = clientRecords.find(c => c.company_id === company.id);
        
        if (!existingClientForCompany) {
          console.log('📝 Creando registro de cliente para la nueva empresa...');
          
          const { error: clientCreateError } = await supabase
            .from('clients')
            .insert({
              company_id: company.id,
              name: mariaUser.full_name,
              rut: mariaUser.rut,
              email: mariaUser.email,
              phone: mariaUser.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (clientCreateError) {
            console.error('❌ Error creando registro de cliente:', clientCreateError);
          } else {
            console.log('✅ Registro de cliente creado correctamente');
          }
        } else {
          console.log('✅ María Concha ya está registrada como cliente de la empresa');
        }
      }
    }
    
    // 8. Verificación final
    console.log('\n🔍 Verificación final...');
    
    const { data: finalDebts, error: finalDebtsError } = await supabase
      .from('debts')
      .select(`
        *,
        companies(company_name)
      `)
      .eq('user_id', mariaUser.id)
      .eq('company_id', company.id);
    
    if (finalDebtsError) {
      console.error('❌ Error en verificación final:', finalDebtsError);
    } else {
      console.log(`✅ María Concha ahora tiene ${finalDebts.length} deuda(s) con ${company.company_name}:`);
      finalDebts.forEach((debt, index) => {
        console.log(`  ${index + 1}. $${debt.current_amount} - ${debt.description} - Estado: ${debt.status}`);
      });
    }
    
    console.log('\n🎉 Proceso completado exitosamente');
    console.log(`📧 Empresa destino: ${empresaUser.email} (${company.company_name})`);
    console.log(`👤 Deudora: ${mariaUser.full_name} (${mariaUser.rut})`);
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

moveMariaConchaToEmpresa();