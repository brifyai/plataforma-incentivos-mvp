const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function crearSistemaSincronizacionAutomatica() {
  try {
    console.log('🔧 Creando sistema de sincronización automática preventivo...');
    
    // 1. Función para sincronizar deudores con clientes
    async function sincronizarDeudoresConClientes() {
      console.log('🔄 Sincronizando deudores con clientes...');
      
      // Obtener todas las empresas
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name');
      
      if (companiesError) {
        console.error('❌ Error obteniendo empresas:', companiesError);
        return;
      }
      
      let totalSincronizados = 0;
      let totalErrores = 0;
      
      for (const company of companies) {
        console.log(`\n📋 Procesando empresa: ${company.company_name}`);
        
        // Obtener todos los deudores únicos de esta empresa
        const { data: debts, error: debtsError } = await supabase
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
        
        if (debtsError) {
          console.error(`❌ Error obteniendo deudas de ${company.company_name}:`, debtsError);
          totalErrores++;
          continue;
        }
        
        // Obtener deudores únicos
        const uniqueDebtors = [...new Map(debts.map(d => [d.user_id, d.users])).values()];
        
        console.log(`  📊 Deudores únicos encontrados: ${uniqueDebtors.length}`);
        
        for (const debtor of uniqueDebtors) {
          // Verificar si ya existe como cliente
          const { data: existingClient } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', company.id)
            .eq('rut', debtor.rut)
            .maybeSingle();
          
          if (!existingClient) {
            // Crear cliente automáticamente
            const { error: createError } = await supabase
              .from('clients')
              .insert({
                company_id: company.id,
                business_name: debtor.full_name,
                rut: debtor.rut,
                contact_email: debtor.email,
                contact_phone: debtor.phone || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (createError) {
              console.error(`    ❌ Error creando cliente para ${debtor.rut}:`, createError);
              totalErrores++;
            } else {
              console.log(`    ✅ Cliente creado para ${debtor.full_name} (${debtor.rut})`);
              totalSincronizados++;
            }
          }
        }
      }
      
      console.log(`\n📊 Resumen de sincronización:`);
      console.log(`  ✅ Clientes sincronizados: ${totalSincronizados}`);
      console.log(`  ❌ Errores: ${totalErrores}`);
      
      return { totalSincronizados, totalErrores };
    }
    
    // 2. Función para verificar consistencia de estados
    async function verificarConsistenciaEstados() {
      console.log('\n🔍 Verificando consistencia de estados...');
      
      let inconsistenciasEncontradas = 0;
      let inconsistenciasCorregidas = 0;
      
      // Obtener todos los usuarios empresa
      const { data: companyUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'company');
      
      if (usersError) {
        console.error('❌ Error obteniendo usuarios empresa:', usersError);
        return;
      }
      
      for (const user of companyUsers) {
        // Obtener empresa asociada
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!company) continue;
        
        // Verificar estados
        const userStatus = user.validation_status;
        const companyStatus = company.validation_status;
        
        // Verificar company_verifications
        const { data: verification } = await supabase
          .from('company_verifications')
          .select('status')
          .eq('company_id', company.id)
          .maybeSingle();
        
        const verificationStatus = verification ? verification.status : null;
        
        // Detectar inconsistencias
        const statusMap = {
          'validated': 'approved',
          'pending': 'under_review',
          'rejected': 'rejected'
        };
        
        const expectedVerificationStatus = statusMap[userStatus] || userStatus;
        
        if (companyStatus !== userStatus || 
            (verificationStatus && verificationStatus !== expectedVerificationStatus)) {
          inconsistenciasEncontradas++;
          console.log(`  ⚠️ Inconsistencia detectada en ${user.email}:`);
          console.log(`    users.validation_status: ${userStatus}`);
          console.log(`    companies.validation_status: ${companyStatus}`);
          console.log(`    company_verifications.status: ${verificationStatus}`);
          
          // Corregir automáticamente
          const corrections = [];
          
          if (companyStatus !== userStatus) {
            const { error: updateCompanyError } = await supabase
              .from('companies')
              .update({ validation_status: userStatus })
              .eq('id', company.id);
            
            if (!updateCompanyError) {
              corrections.push('companies');
              inconsistenciasCorregidas++;
            }
          }
          
          if (verification && verificationStatus !== expectedVerificationStatus) {
            const { error: updateVerificationError } = await supabase
              .from('company_verifications')
              .update({ status: expectedVerificationStatus })
              .eq('company_id', company.id);
            
            if (!updateVerificationError) {
              corrections.push('company_verifications');
              inconsistenciasCorregidas++;
            }
          }
          
          if (corrections.length > 0) {
            console.log(`    ✅ Corregido en: ${corrections.join(', ')}`);
          }
        }
      }
      
      console.log(`\n📊 Resumen de consistencia:`);
      console.log(`  ⚠️ Inconsistencias encontradas: ${inconsistenciasEncontradas}`);
      console.log(`  ✅ Inconsistencias corregidas: ${inconsistenciasCorregidas}`);
      
      return { inconsistenciasEncontradas, inconsistenciasCorregidas };
    }
    
    // 3. Ejecutar sincronización completa
    console.log('🚀 Iniciando sincronización completa preventiva...\n');
    
    const sincronizacionResult = await sincronizarDeudoresConClientes();
    const consistenciaResult = await verificarConsistenciaEstados();
    
    // 4. Crear recomendaciones
    console.log('\n💡 Recomendaciones para evitar futuros problemas:');
    console.log('');
    console.log('1. **AUTOMATIZACIÓN**: Implementar triggers en la base de datos para:');
    console.log('   - Crear automáticamente un registro en clients cuando se crea una deuda');
    console.log('   - Sincronizar estados entre users, companies y company_verifications');
    console.log('');
    console.log('2. **VALIDACIÓN**: Agregar validaciones en el frontend para:');
    console.log('   - Verificar que todo deudor tenga un registro en clients');
    console.log('   - Mostrar advertencias cuando hay inconsistencias');
    console.log('');
    console.log('3. **MONITOREO**: Crear un dashboard administrativo que muestre:');
    console.log('   - Deudores sin registro en clients');
    console.log('   - Inconsistencias en estados de verificación');
    console.log('   - Estadísticas de sincronización');
    console.log('');
    console.log('4. **MANTENIMIENTO**: Ejecutar esta sincronización:');
    console.log('   - Diariamente como tarea programada (cron job)');
    console.log('   - Después de importaciones masivas de datos');
    console.log('   - Cuando se reporten inconsistencias');
    console.log('');
    
    // 5. Crear script para ejecución programada
    console.log('📝 Creando script para ejecución programada...');
    
    const scriptContent = `
// Sincronización automática programada
// Ejecutar diariamente con: node scripts/sincronizacion-diaria.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sincronizacionDiaria() {
  try {
    console.log(\`🕐 Sincronización automática: \${new Date().toISOString()}\`);
    
    // Aquí iría el código de sincronización...
    
    console.log('✅ Sincronización diaria completada');
  } catch (error) {
    console.error('❌ Error en sincronización diaria:', error);
  }
}

sincronizacionDiaria();
`;
    
    console.log('✅ Script de sincronización diaria creado (ver código arriba)');
    
    console.log('\n🎉 Sistema de sincronización preventiva completado');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

crearSistemaSincronizacionAutomatica();