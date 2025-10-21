/**
 * Script directo para agregar columnas de cuenta bancaria
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de columnas bancarias...');

    // Intentar verificar si podemos insertar datos para forzar la creación de columnas
    console.log('📊 Intentando verificar si las columnas existen...');

    // Intentar actualizar una empresa existente para ver si las columnas existen
    const { data: testCompany, error: testError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error accediendo a companies:', testError);
      return;
    }

    if (testCompany && testCompany.length > 0) {
      console.log('✅ Encontrada empresa para prueba:', testCompany[0].id);

      // Intentar actualizar con las nuevas columnas (esto fallará si no existen)
      const testData = {
        bank_account_info: {
          bankName: 'Test Bank',
          accountType: 'checking_account',
          accountNumber: '123456789',
          accountHolderName: 'Test User',
          bankId: '001'
        },
        mercadopago_beneficiary_id: 'test-beneficiary-id'
      };

      const { error: updateError } = await supabase
        .from('companies')
        .update(testData)
        .eq('id', testCompany[0].id);

      if (updateError) {
        console.log('❌ Las columnas no existen (error esperado):', updateError.message);
        
        if (updateError.message.includes('bank_account_info') || updateError.message.includes('mercadopago_beneficiary_id')) {
          console.log('\n🔧 Necesitas aplicar la migración manualmente:');
          console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
          console.log('2. Ejecuta estos comandos SQL:');
          console.log('');
          console.log('ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT NULL;');
          console.log('ALTER TABLE companies ADD COLUMN IF NOT EXISTS mercadopago_beneficiary_id TEXT DEFAULT NULL;');
          console.log('');
          console.log('3. Luego haz clic en "Run" para ejecutar');
          console.log('4. Vuelve a intentar la configuración bancaria');
        }
      } else {
        console.log('✅ Las columnas ya existen o se crearon correctamente');
      }
    } else {
      console.log('⚠️ No hay empresas para probar');
    }

  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

applyMigration();