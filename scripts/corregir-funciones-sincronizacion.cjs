const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function corregirFuncionesSincronizacion() {
  try {
    console.log('🔧 Corrigiendo funciones de sincronización...');
    
    // 1. Corregir función check_system_consistency
    console.log('\n📝 Corrigiendo función check_system_consistency...');
    
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        DROP FUNCTION IF EXISTS check_system_consistency();
        
        CREATE OR REPLACE FUNCTION check_system_consistency()
        RETURNS TABLE(
          check_type TEXT,
          total_issues BIGINT,
          details JSONB
        ) AS $$
        BEGIN
          -- Verificar deudores sin registro en clients
          RETURN QUERY
          SELECT 
            'debtors_without_clients'::TEXT,
            COUNT(*)::BIGINT,
            jsonb_agg(
              jsonb_build_object(
                'debtor_id', d.user_id,
                'debtor_name', u.full_name,
                'debtor_rut', u.rut,
                'company_id', d.company_id,
                'company_name', c.company_name
              )
            )
          FROM public.debts d
          JOIN public.users u ON d.user_id = u.id
          JOIN public.companies c ON d.company_id = c.id
          LEFT JOIN public.clients cl ON d.company_id = cl.company_id AND u.rut = cl.rut
          WHERE cl.id IS NULL;
          
          -- Verificar inconsistencias en estados de verificación
          RETURN QUERY
          SELECT 
            'verification_status_inconsistencies'::TEXT,
            COUNT(*)::BIGINT,
            jsonb_agg(
              jsonb_build_object(
                'user_id', u.id,
                'user_email', u.email,
                'user_status', u.validation_status::TEXT,
                'company_status', c.validation_status::TEXT,
                'verification_status', cv.status
              )
            )
          FROM public.users u
          JOIN public.companies c ON u.id = c.user_id
          LEFT JOIN public.company_verifications cv ON c.id = cv.company_id
          WHERE 
            u.validation_status::TEXT != c.validation_status::TEXT
            OR (cv.status IS NOT NULL AND 
                cv.status != CASE 
                  WHEN u.validation_status::TEXT = 'validated' THEN 'approved'
                  WHEN u.validation_status::TEXT = 'pending' THEN 'under_review'
                  WHEN u.validation_status::TEXT = 'rejected' THEN 'rejected'
                  ELSE u.validation_status::TEXT
                END);
          
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error1) {
      console.error('❌ Error corrigiendo check_system_consistency:', error1);
    } else {
      console.log('✅ Función check_system_consistency corregida');
    }
    
    // 2. Corregir función sync_all_debtors_to_clients
    console.log('\n📝 Corrigiendo función sync_all_debtors_to_clients...');
    
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        DROP FUNCTION IF EXISTS sync_all_debtors_to_clients();
        
        CREATE OR REPLACE FUNCTION sync_all_debtors_to_clients()
        RETURNS TABLE(
          company_name TEXT,
          debtors_synced INTEGER,
          errors TEXT
        ) AS $$
        DECLARE
          company_record RECORD;
          debtor_record RECORD;
          sync_count INTEGER;
          error_msg TEXT;
        BEGIN
          -- Iterar sobre todas las empresas
          FOR company_record IN 
              SELECT id, company_name FROM public.companies
          LOOP
              sync_count := 0;
              error_msg := NULL;
              
              BEGIN
                  -- Obtener todos los deudores únicos de esta empresa
                  FOR debtor_record IN
                      SELECT DISTINCT 
                          d.user_id,
                          u.full_name,
                          u.rut,
                          u.email,
                          u.phone
                      FROM public.debts d
                      JOIN public.users u ON d.user_id = u.id
                      WHERE d.company_id = company_record.id
                  LOOP
                      -- Verificar si ya existe como cliente
                      IF NOT EXISTS (
                          SELECT 1 FROM public.clients 
                          WHERE company_id = company_record.id 
                          AND rut = debtor_record.rut
                      ) THEN
                          -- Crear cliente
                          INSERT INTO public.clients (
                              company_id,
                              business_name,
                              rut,
                              contact_email,
                              contact_phone,
                              created_at,
                              updated_at
                          ) VALUES (
                              company_record.id,
                              debtor_record.full_name,
                              debtor_record.rut,
                              debtor_record.email,
                              debtor_record.phone,
                              NOW(),
                              NOW()
                          );
                          
                          sync_count := sync_count + 1;
                      END IF;
                  END LOOP;
                  
              EXCEPTION WHEN OTHERS THEN
                  error_msg := SQLERRM;
              END;
              
              -- Retornar resultados para esta empresa
              company_name := company_record.company_name;
              debtors_synced := sync_count;
              errors := error_msg;
              RETURN NEXT;
          END LOOP;
          
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error2) {
      console.error('❌ Error corrigiendo sync_all_debtors_to_clients:', error2);
    } else {
      console.log('✅ Función sync_all_debtors_to_clients corregida');
    }
    
    // 3. Probar las funciones corregidas
    console.log('\n🧪 Probando funciones corregidas...');
    
    // Probar check_system_consistency
    const { data: consistencyData, error: consistencyError } = await supabase
      .rpc('check_system_consistency');
    
    if (consistencyError) {
      console.error('❌ Error en check_system_consistency:', consistencyError);
    } else {
      console.log('✅ check_system_consistency funciona:');
      consistencyData.forEach(check => {
        console.log(`  ${check.check_type}: ${check.total_issues} problemas`);
      });
    }
    
    // Probar sync_all_debtors_to_clients
    const { data: syncData, error: syncError } = await supabase
      .rpc('sync_all_debtors_to_clients');
    
    if (syncError) {
      console.error('❌ Error en sync_all_debtors_to_clients:', syncError);
    } else {
      console.log('✅ sync_all_debtors_to_clients funciona:');
      syncData.forEach(result => {
        console.log(`  ${result.company_name}: ${result.debtors_synced} sincronizados`);
      });
    }
    
    console.log('\n🎉 Funciones corregidas y probadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

corregirFuncionesSincronizacion();