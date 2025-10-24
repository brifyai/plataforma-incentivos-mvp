require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function replaceTechCorpWithAIntelligence() {
  console.log('🔄 Reemplazando TechCorp por AIntelligence');
  console.log('===========================================');

  try {
    // Paso 1: Identificar y eliminar TechCorp
    console.log('\n📋 Paso 1: Buscando empresa TechCorp...');
    
    // Buscar empresas con "TechCorp" en el nombre
    const { data: techcorpCompanies, error: techcorpError } = await supabase
      .from('companies')
      .select('*')
      .ilike('company_name', '%TechCorp%');

    if (techcorpError) {
      console.error('❌ Error buscando TechCorp:', techcorpError);
      return;
    }

    if (techcorpCompanies.length === 0) {
      console.log('ℹ️ No se encontraron empresas TechCorp');
    } else {
      console.log(`📁 Se encontraron ${techcorpCompanies.length} empresas TechCorp:`);
      techcorpCompanies.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id})`);
      });

      // Eliminar cada empresa TechCorp y sus datos relacionados
      for (const company of techcorpCompanies) {
        console.log(`\n🗑️ Eliminando empresa: ${company.company_name}`);
        
        // Eliminar deudas asociadas
        const { error: debtsError } = await supabase
          .from('debts')
          .delete()
          .eq('company_id', company.id);
        
        if (debtsError) {
          console.error('❌ Error eliminando deudas:', debtsError);
        } else {
          console.log('✅ Deudas eliminadas');
        }

        // Eliminar clientes asociados
        const { error: clientsError } = await supabase
          .from('clients')
          .delete()
          .eq('company_id', company.id);
        
        if (clientsError) {
          console.error('❌ Error eliminando clientes:', clientsError);
        } else {
          console.log('✅ Clientes eliminados');
        }

        // Eliminar empresa corporativa asociada
        const { error: corporateError } = await supabase
          .from('corporate_clients')
          .delete()
          .eq('company_id', company.id);
        
        if (corporateError) {
          console.error('❌ Error eliminando empresa corporativa:', corporateError);
        } else {
          console.log('✅ Empresa corporativa eliminada');
        }

        // Eliminar la empresa
        const { error: companyError } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id);
        
        if (companyError) {
          console.error('❌ Error eliminando empresa:', companyError);
        } else {
          console.log('✅ Empresa eliminada');
        }
      }
    }

    // Paso 2: Crear empresa corporativa AIntelligence
    console.log('\n📋 Paso 2: Creando empresa corporativa AIntelligence...');
    
    // Buscar si ya existe una empresa AIntelligence
    const { data: existingAIntelligence, error: searchError } = await supabase
      .from('companies')
      .select('*')
      .ilike('company_name', '%AIntelligence%');

    if (searchError) {
      console.error('❌ Error buscando AIntelligence:', searchError);
      return;
    }

    if (existingAIntelligence.length > 0) {
      console.log('ℹ️ Ya existe una empresa AIntelligence:');
      existingAIntelligence.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id})`);
      });
    } else {
      // Crear nueva empresa AIntelligence
      const newCompany = {
        company_name: 'AIntelligence SpA',
        contact_email: 'contact@aintelligence.cl',
        contact_phone: '+56 2 2345 6789',
        rut: '77.888.999-0',
        validation_status: 'validated',
        nexupay_commission_type: 'percentage',
        nexupay_commission: 15,
        user_incentive_type: 'percentage',
        user_incentive_percentage: 5
      };

      const { data: createdCompany, error: createError } = await supabase
        .from('companies')
        .insert([newCompany])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando empresa AIntelligence:', createError);
        return;
      }

      console.log('✅ Empresa AIntelligence creada:');
      console.log(`   ID: ${createdCompany.id}`);
      console.log(`   Nombre: ${createdCompany.company_name}`);
      console.log(`   RUT: ${createdCompany.rut}`);

      // Crear empresa corporativa asociada
      const corporateClient = {
        company_id: createdCompany.id,
        business_name: 'AIntelligence Solutions',
        contact_email: 'solutions@aintelligence.cl',
        rut: '77.888.999-0',
        industry: '🤖 Tecnología e Inteligencia Artificial',
        description: 'División de soluciones corporativas de AIntelligence',
        website: 'https://aintelligence.cl',
        phone: '+56 2 2345 6789',
        address: 'Av. Providencia 1234, Santiago, Chile'
      };

      const { data: createdCorporate, error: corporateCreateError } = await supabase
        .from('corporate_clients')
        .insert([corporateClient])
        .select()
        .single();

      if (corporateCreateError) {
        console.error('❌ Error creando empresa corporativa AIntelligence:', corporateCreateError);
      } else {
        console.log('✅ Empresa corporativa AIntelligence creada:');
        console.log(`   ID: ${createdCorporate.id}`);
        console.log(`   Nombre: ${createdCorporate.business_name}`);
        console.log(`   RUT: ${createdCorporate.rut}`);
      }
    }

    // Paso 3: Verificar estado final
    console.log('\n📋 Paso 3: Verificando estado final...');
    
    const { data: finalCompanies, error: finalError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        contact_email,
        validation_status,
        corporate_clients (
          id,
          business_name,
          rut,
          industry
        ),
        clients (
          id,
          name,
          email
        ),
        debts (
          id,
          amount,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Error verificando estado final:', finalError);
      return;
    }

    console.log('\n📊 Estado final del sistema:');
    console.log('================================');
    
    finalCompanies.forEach(company => {
      console.log(`\n🏢 Empresa: ${company.company_name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Email: ${company.contact_email}`);
      console.log(`   Estado: ${company.validation_status}`);
      
      if (company.corporate_clients && company.corporate_clients.length > 0) {
        company.corporate_clients.forEach(corporate => {
          console.log(`   🏭 Empresa Corporativa: ${corporate.business_name}`);
          console.log(`      RUT: ${corporate.rut}`);
          console.log(`      Industria: ${corporate.industry}`);
        });
      }
      
      if (company.clients && company.clients.length > 0) {
        console.log(`   👥 Clientes: ${company.clients.length}`);
        company.clients.forEach(client => {
          console.log(`      - ${client.name} (${client.email})`);
        });
      }
      
      if (company.debts && company.debts.length > 0) {
        console.log(`   💰 Deudas: ${company.debts.length}`);
        company.debts.forEach(debt => {
          console.log(`      - $${debt.amount.toLocaleString()} (${debt.status})`);
        });
      }
    });

    console.log('\n✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

replaceTechCorpWithAIntelligence();