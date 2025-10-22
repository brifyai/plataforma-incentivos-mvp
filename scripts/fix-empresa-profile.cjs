/**
 * Script para crear perfil de empresa para usuario empresa@nexupay.cl
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixEmpresaProfile() {
  try {
    console.log('🔍 Buscando usuario empresa@nexupay.cl...');

    // Buscar usuario por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError || !user) {
      console.log('❌ Error buscando usuario:', userError?.message || 'Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:', user.id, user.email, user.role);

    // Buscar empresa asociada al usuario
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError && companyError.code !== 'PGRST116') {
      console.log('❌ Error buscando empresa:', companyError.message);
      return;
    }

    if (company) {
      console.log('✅ Empresa ya existe:', company.id, company.business_name, company.verification_status);
      return;
    }

    console.log('⚠️ No hay empresa asociada al usuario. Creando perfil de empresa...');

    // Crear empresa para el usuario (solo campos obligatorios)
    const companyData = {
      user_id: user.id,
      company_name: 'NexuPay SPA',
      rut: '76.123.456-7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creando empresa:', createError.message);
      return;
    }

    console.log('✅ Empresa creada exitosamente:');
    console.log('   ID:', newCompany.id);
    console.log('   Nombre:', newCompany.business_name);
    console.log('   Estado:', newCompany.verification_status);

    // Crear registro en corporate_clients
    console.log('📋 Creando registro en corporate_clients...');
    
    const corporateData = {
      company_id: newCompany.id,
      business_name: newCompany.business_name,
      legal_name: newCompany.legal_name,
      tax_id: newCompany.tax_id,
      industry: newCompany.industry,
      contact_email: newCompany.contact_email,
      contact_phone: newCompany.contact_phone,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .insert(corporateData)
      .select()
      .single();

    if (corporateError) {
      console.log('❌ Error creando corporate_client:', corporateError.message);
    } else {
      console.log('✅ Corporate client creado exitosamente:', corporateClient.id);
    }

    console.log('🎉 Perfil de empresa creado completamente para empresa@nexupay.cl');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

fixEmpresaProfile();