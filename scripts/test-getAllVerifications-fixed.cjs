const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular la función getAllVerifications corregida
async function getAllVerificationsFixed(filters = {}) {
  try {
    // Primero obtener las verificaciones sin relaciones
    let query = supabase
      .from('company_verifications')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Aplicar filtros
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Filtros de fecha
    if (filters.startDate) {
      query = query.gte('submitted_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('submitted_at', filters.endDate + 'T23:59:59.999Z');
    }

    const { data: verifications, error: verificationError } = await query;

    if (verificationError) {
      return { verifications: [], error: verificationError.message };
    }

    // Si no hay verificaciones, retornar vacío
    if (!verifications || verifications.length === 0) {
      return { verifications: [], error: null };
    }

    // Obtener información de empresas por separado
    const companyIds = [...new Set(verifications.map(v => v.company_id))];
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, rut, contact_email, user_id')
      .in('id', companyIds);

    if (companiesError) {
      console.warn('Error obteniendo información de empresas:', companiesError.message);
    }

    // Obtener información de usuarios asignados por separado
    const assignedToIds = [...new Set(verifications.map(v => v.assigned_to).filter(Boolean))];
    let assignedUsers = [];
    
    if (assignedToIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', assignedToIds);
      
      if (!usersError) {
        assignedUsers = users || [];
      } else {
        console.warn('Error obteniendo información de usuarios:', usersError.message);
      }
    }

    // Combinar la información
    const verificationsWithDetails = verifications.map(verification => {
      const company = companies?.find(c => c.id === verification.company_id);
      const assignedUser = assignedUsers?.find(u => u.id === verification.assigned_to);
      
      return {
        ...verification,
        company: company || null,
        assigned_to_user: assignedUser || null
      };
    });

    return { verifications: verificationsWithDetails, error: null };
  } catch (error) {
    console.error('Error getting all verifications:', error);
    return { verifications: [], error: 'Error al obtener verificaciones' };
  }
}

async function testFixedFunction() {
  try {
    console.log('🔍 Probando getAllVerifications() corregida...');
    
    const result = await getAllVerificationsFixed();
    
    if (result.error) {
      console.error('❌ Error:', result.error);
      return;
    }

    console.log('📊 Resultado de getAllVerifications corregida:');
    console.log(`Total de verificaciones: ${result.verifications?.length || 0}`);
    
    if (result.verifications && result.verifications.length > 0) {
      result.verifications.forEach((verification, index) => {
        console.log(`\n${index + 1}. ${verification.company?.company_name || 'Empresa sin nombre'}`);
        console.log(`   ID: ${verification.id}`);
        console.log(`   Status: ${verification.status}`);
        console.log(`   Company ID: ${verification.company_id}`);
        console.log(`   Submitted: ${verification.submitted_at}`);
        console.log(`   Updated: ${verification.updated_at}`);
        
        if (verification.status === 'rejected') {
          console.log(`   Rejected at: ${verification.rejected_at}`);
          console.log(`   Rejection reason: ${verification.rejection_reason}`);
        }
        
        if (verification.company) {
          console.log(`   Company Name: ${verification.company.company_name}`);
          console.log(`   Company RUT: ${verification.company.rut}`);
        }
        
        if (verification.assigned_to_user) {
          console.log(`   Assigned to: ${verification.assigned_to_user.full_name}`);
        }
      });
    } else {
      console.log('⚠️ No se encontraron verificaciones');
    }

    // Buscar específicamente la empresa NexuPay
    console.log('\n🔍 Buscando específicamente Empresa NexuPay...');
    const nexuPayVerification = result.verifications?.find(v => 
      v.company?.company_name?.includes('NexuPay') || 
      v.company_id === '7c834069-d92e-44b1-b0c0-474310fad1ff'
    );
    
    if (nexuPayVerification) {
      console.log('✅ Empresa NexuPay encontrada:');
      console.log(`   Status: ${nexuPayVerification.status}`);
      console.log(`   Company Name: ${nexuPayVerification.company?.company_name}`);
      console.log(`   Company validation_status: ${nexuPayVerification.company?.validation_status || 'No disponible'}`);
      
      if (nexuPayVerification.status === 'rejected') {
        console.log('   ✅ Estado RECHAZADO confirmado');
      } else {
        console.log('   ❌ Estado no es rejected');
      }
    } else {
      console.log('❌ Empresa NexuPay NO encontrada en los resultados');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

testFixedFunction();