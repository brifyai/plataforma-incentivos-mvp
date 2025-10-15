/**
 * Script para probar la corrección de importación masiva
 * 
 * Este script verifica que los cambios realizados permitan
 * guardar correctamente los datos en la base de datos.
 */

import { createClient } from '@supabase/supabase-js';
import { bulkImportDebts } from '../src/services/bulkImportService.js';

// Configuración
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Iniciando prueba de importación masiva...');

// Crear cliente admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Datos de prueba
const testDebtData = [
  {
    rut: '12.345.678-9',
    full_name: 'Juan Pérez González',
    email: 'juan.perez@test.com',
    phone: '+56912345678',
    debt_amount: 1500000,
    due_date: '2024-12-31',
    creditor_name: 'Banco Estado',
    debt_reference: 'PREST-001',
    debt_type: 'credit_card',
    interest_rate: 2.5,
    description: 'Deuda tarjeta de crédito'
  },
  {
    rut: '9.876.543-2',
    full_name: 'María González López',
    email: 'maria.gonzalez@test.com',
    phone: '+56987654321',
    debt_amount: 2500000,
    due_date: '2024-11-15',
    creditor_name: 'CMR Falabella',
    debt_reference: 'CUOTA-045',
    debt_type: 'loan',
    interest_rate: 1.8,
    description: 'Crédito consumo'
  }
];

// Función para obtener una empresa de prueba
const getTestCompany = async () => {
  try {
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('id, company_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Error obteniendo empresa:', error);
      return null;
    }
    
    if (!companies || companies.length === 0) {
      console.error('❌ No hay empresas registradas');
      return null;
    }
    
    console.log('✅ Empresa encontrada:', companies[0]);
    return companies[0];
  } catch (error) {
    console.error('❌ Error en getTestCompany:', error);
    return null;
  }
};

// Función para limpiar datos de prueba
const cleanupTestData = async (userIds, debtIds) => {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    // Eliminar deudas
    if (debtIds.length > 0) {
      const { error: debtDeleteError } = await supabaseAdmin
        .from('debts')
        .delete()
        .in('id', debtIds);
      
      if (debtDeleteError) {
        console.error('❌ Error eliminando deudas:', debtDeleteError);
      } else {
        console.log('✅ Deudas eliminadas');
      }
    }
    
    // Eliminar usuarios
    if (userIds.length > 0) {
      const { error: userDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .in('id', userIds);
      
      if (userDeleteError) {
        console.error('❌ Error eliminando usuarios:', userDeleteError);
      } else {
        console.log('✅ Usuarios eliminados');
      }
    }
  } catch (error) {
    console.error('❌ Error en cleanupTestData:', error);
  }
};

// Función principal de prueba
const runImportTest = async () => {
  console.log('\n🚀 Ejecutando prueba completa de importación...\n');
  
  const userIds = [];
  const debtIds = [];
  
  try {
    // 1. Verificar configuración
    console.log('📋 1. Verificando configuración...');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY');
    }
    console.log('✅ Configuración verificada');
    
    // 2. Obtener empresa de prueba
    console.log('\n🏢 2. Obteniendo empresa de prueba...');
    const company = await getTestCompany();
    if (!company) {
      throw new Error('No se pudo obtener una empresa de prueba');
    }
    
    // 3. Ejecutar importación
    console.log('\n📥 3. Ejecutando importación masiva...');
    console.log(`📊 Datos a importar: ${testDebtData.length} registros`);
    
    const importResult = await bulkImportDebts(testDebtData, {
      companyId: company.id,
      onProgress: (progress) => {
        console.log(`📈 Progreso: ${progress.processed}/${testDebtData.length} - ✅ ${progress.successful} ❌ ${progress.failed}`);
      }
    });
    
    console.log('\n📊 Resultado de la importación:');
    console.log('Éxito:', importResult.success);
    console.log('Total:', importResult.totalRows);
    console.log('Procesados:', importResult.processed);
    console.log('Exitosos:', importResult.successful);
    console.log('Fallidos:', importResult.failed);
    console.log('Usuarios creados:', importResult.createdUsers);
    console.log('Deudas creadas:', importResult.createdDebts);
    console.log('Tasa de éxito:', importResult.successRate?.toFixed(2) + '%');
    
    if (importResult.errors && importResult.errors.length > 0) {
      console.log('\n❌ Errores:');
      importResult.errors.slice(0, 5).forEach(error => {
        console.log(`  Fila ${error.row}: ${error.errors.join(', ')}`);
      });
    }
    
    // 4. Verificar datos en la base de datos
    console.log('\n🔍 4. Verificando datos en la base de datos...');
    
    // Buscar usuarios creados
    const { data: createdUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, rut, full_name, email')
      .in('rut', testDebtData.map(d => d.rut));
    
    if (usersError) {
      console.error('❌ Error verificando usuarios:', usersError);
    } else {
      console.log('✅ Usuarios creados:', createdUsers?.length || 0);
      createdUsers?.forEach(user => {
        console.log(`  - ${user.full_name} (${user.rut})`);
        userIds.push(user.id);
      });
    }
    
    // Buscar deudas creadas
    const { data: createdDebts, error: debtsError } = await supabaseAdmin
      .from('debts')
      .select('id, user_id, original_amount, current_amount, due_date, description')
      .eq('company_id', company.id);
    
    if (debtsError) {
      console.error('❌ Error verificando deudas:', debtsError);
    } else {
      console.log('✅ Deudas creadas:', createdDebts?.length || 0);
      createdDebts?.forEach(debt => {
        console.log(`  - $${debt.original_amount.toLocaleString('es-CL')} (Venc: ${debt.due_date})`);
        debtIds.push(debt.id);
      });
    }
    
    // 5. Evaluar resultado
    console.log('\n📋 5. Evaluando resultado...');
    
    const isSuccess = importResult.success && 
                     importResult.successful > 0 && 
                     importResult.createdUsers > 0 && 
                     importResult.createdDebts > 0;
    
    if (isSuccess) {
      console.log('✅ PRUEBA EXITOSA: La importación masiva funciona correctamente');
      console.log('🎉 Todos los datos se guardaron correctamente en la base de datos');
    } else {
      console.log('❌ PRUEBA FALLIDA: La importación masiva no funciona correctamente');
      console.log('⚠️ Los datos no se guardaron correctamente en la base de datos');
    }
    
    // 6. Limpiar datos de prueba
    console.log('\n🧹 6. Limpiando datos de prueba...');
    await cleanupTestData(userIds, debtIds);
    
    return isSuccess;
    
  } catch (error) {
    console.error('\n💥 Error durante la prueba:', error);
    
    // Intentar limpiar incluso si hubo error
    if (userIds.length > 0 || debtIds.length > 0) {
      await cleanupTestData(userIds, debtIds);
    }
    
    return false;
  }
};

// Ejecutar prueba
runImportTest()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 LA IMPORTACIÓN MASIVA ESTÁ FUNCIONANDO CORRECTAMENTE');
      console.log('✅ Los problemas han sido resueltos');
    } else {
      console.log('❌ LA IMPORTACIÓN MASIVA AÚN TIENE PROBLEMAS');
      console.log('⚠️ Se necesitan más correcciones');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Error fatal en la prueba:', error);
    process.exit(1);
  });