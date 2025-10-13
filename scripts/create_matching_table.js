/**
 * Script para crear la tabla debtor_corporate_matches manualmente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createMatchingTable() {
  console.log('🔧 Creando tabla debtor_corporate_matches...');

  try {
    // SQL para crear la tabla (versión corregida)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS debtor_corporate_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
        match_score DECIMAL(3,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 1),
        match_type VARCHAR(50) NOT NULL DEFAULT 'partial',
        match_details JSONB DEFAULT '{}',
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(debtor_id, corporate_id)
      );
    `;

    // SQL para crear índices
    const createIndexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_debtor_id ON debtor_corporate_matches(debtor_id);',
      'CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_corporate_id ON debtor_corporate_matches(corporate_id);',
      'CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_score ON debtor_corporate_matches(match_score);',
      'CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_status ON debtor_corporate_matches(status);',
      'CREATE INDEX IF NOT EXISTS idx_debtor_corporate_matches_created_at ON debtor_corporate_matches(created_at);'
    ];

    // SQL para crear trigger para updated_at
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_debtor_corporate_matches_updated_at ON debtor_corporate_matches;
      CREATE TRIGGER update_debtor_corporate_matches_updated_at
        BEFORE UPDATE ON debtor_corporate_matches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('📋 Creando tabla...');
    
    // Intentar crear la tabla usando RPC si está disponible, sino usar SQL directo
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (error) {
        console.log('⚠️ RPC no disponible, intentando método alternativo...');
        throw error;
      }
      
      console.log('✅ Tabla creada exitosamente via RPC');
    } catch (rpcError) {
      console.log('⚠️ RPC falló, la tabla debe ser creada manualmente en el panel de Supabase');
      console.log('📋 SQL para ejecutar manualmente:');
      console.log('=====================================');
      console.log(createTableSQL);
      console.log('\n' + createIndexesSQL.join('\n'));
      console.log('\n' + createTriggerSQL);
      console.log('=====================================');
      
      // Intentar verificar si la tabla ya existe
      try {
        const { data: testSelect, error: testError } = await supabase
          .from('debtor_corporate_matches')
          .select('id')
          .limit(1);
        
        if (!testError) {
          console.log('✅ La tabla ya existe y es accesible');
          return true;
        }
      } catch (testErr) {
        console.log('❌ La tabla no existe o no es accesible');
        return false;
      }
    }

    // Crear índices
    console.log('📋 Creando índices...');
    for (const indexSQL of createIndexesSQL) {
      try {
        await supabase.rpc('exec_sql', { sql: indexSQL });
      } catch (indexError) {
        console.log(`⚠️ Índice falló (puede ya existir): ${indexError.message}`);
      }
    }

    // Crear trigger
    console.log('📋 Creando trigger...');
    try {
      await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      console.log('✅ Trigger creado exitosamente');
    } catch (triggerError) {
      console.log(`⚠️ Trigger falló (puede ya existir): ${triggerError.message}`);
    }

    // Verificar que la tabla fue creada
    console.log('🔍 Verificando tabla...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('debtor_corporate_matches')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('❌ Error verificando tabla:', verifyError.message);
      return false;
    }

    console.log('✅ Tabla debtor_corporate_matches creada y verificada exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando tabla:', error.message);
    return false;
  }
}

// Ejecutar función
createMatchingTable().then(success => {
  if (success) {
    console.log('\n🎉 Proceso completado exitosamente');
    process.exit(0);
  } else {
    console.log('\n💥 El proceso falló - crea la tabla manualmente en el panel de Supabase');
    process.exit(1);
  }
});