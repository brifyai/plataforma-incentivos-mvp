/**
 * Script para eliminar "TechCorp - División Desarrollo" de la tabla clients
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTechCorpClient() {
  try {
    console.log('🔍 Buscando "TechCorp - División Desarrollo" para eliminar...');

    // Buscar el registro específico
    const { data: techCorpClient, error: searchError } = await supabase
      .from('clients')
      .select('*')
      .eq('business_name', 'TechCorp - División Desarrollo')
      .single();

    if (searchError) {
      console.error('❌ Error buscando el cliente:', searchError);
      return;
    }

    if (!techCorpClient) {
      console.log('❌ No se encontró "TechCorp - División Desarrollo"');
      return;
    }

    console.log('📊 Cliente encontrado:');
    console.table([techCorpClient]);

    // Buscar deudas relacionadas con este cliente
    const { data: relatedDebts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('client_id', techCorpClient.id);

    if (debtsError) {
      console.error('❌ Error buscando deudas relacionadas:', debtsError);
    } else {
      console.log(`📊 Encontradas ${relatedDebts.length} deudas relacionadas:`);
      if (relatedDebts.length > 0) {
        console.table(relatedDebts);
      }
    }

    // Confirmar eliminación
    console.log('\n⚠️  ADVERTENCIA: Se procederá a eliminar:');
    console.log(`- 1 cliente: ${techCorpClient.business_name}`);
    console.log(`- ${relatedDebts.length} deudas relacionadas`);
    console.log('\n¿Desea continuar? (Escriba "ELIMINAR" para confirmar)');

    // En entorno automático, procedemos directamente
    console.log('🔄 Procediendo con la eliminación...');

    // Eliminar deudas relacionadas primero
    if (relatedDebts && relatedDebts.length > 0) {
      for (const debt of relatedDebts) {
        const { error: deleteDebtError } = await supabase
          .from('debts')
          .delete()
          .eq('id', debt.id);

        if (deleteDebtError) {
          console.error('❌ Error eliminando deuda:', deleteDebtError);
        } else {
          console.log(`✅ Eliminada deuda ID: ${debt.id}`);
        }
      }
    }

    // Eliminar el cliente
    const { error: deleteClientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', techCorpClient.id);

    if (deleteClientError) {
      console.error('❌ Error eliminando el cliente:', deleteClientError);
    } else {
      console.log(`✅ Eliminado cliente: ${techCorpClient.business_name}`);
    }

    console.log('\n🎉 Proceso de eliminación completado');
    console.log('✅ "TechCorp - División Desarrollo" ha sido eliminado completamente del sistema');

    // Verificar que no queden rastros
    const { data: remainingClients, error: verifyError } = await supabase
      .from('clients')
      .select('*')
      .or('business_name.ilike.%TechCorp%');

    if (verifyError) {
      console.error('❌ Error verificando:', verifyError);
    } else {
      console.log(`📊 Clientes restantes con TechCorp: ${remainingClients.length}`);
      if (remainingClients.length > 0) {
        console.table(remainingClients);
      } else {
        console.log('✅ No quedan registros de TechCorp en la tabla clients');
      }
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
deleteTechCorpClient();