const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createPromptsTable() {
  try {
    console.log('Creating corporate_prompt_templates table...');
    
    // Usar SQL directo para crear la tabla
    const { data, error } = await supabase
      .from('corporate_prompt_templates')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('Table does not exist, creating it...');
      
      // Intentar crear la tabla usando una inserción que forzará la creación
      const { error: insertError } = await supabase
        .from('corporate_prompt_templates')
        .insert({
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          prompt_type: 'negotiation',
          prompt_name: 'Temp',
          prompt_template: 'Temp'
        });
      
      if (insertError && !insertError.message.includes('violates foreign key constraint')) {
        console.log('Table creation failed:', insertError.message);
      } else {
        console.log('Table may have been created or already exists');
      }
    } else if (error) {
      console.log('Error checking table:', error.message);
    } else {
      console.log('Table already exists');
    }
    
    // Verificar si la tabla existe ahora
    const { data: testData, error: testError } = await supabase
      .from('corporate_prompt_templates')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('Table still does not exist:', testError.message);
      
      // Crear datos de prueba usando una tabla alternativa
      console.log('Creating sample data for testing...');
      
      // Insertar datos de prueba en corporate_clients si no existen
      const { data: clients } = await supabase
        .from('corporate_clients')
        .select('*')
        .limit(1);
      
      if (clients && clients.length > 0) {
        console.log('Found corporate client:', clients[0]);
        
        // Intentar crear un prompt de prueba
        const { data: newPrompt, error: promptError } = await supabase
          .from('corporate_prompt_templates')
          .insert({
            corporate_client_id: clients[0].id,
            company_id: clients[0].company_id,
            prompt_type: 'negotiation',
            prompt_name: 'Prompt de Prueba',
            prompt_template: 'Eres un asistente para {nombre_empresa}. El deudor {nombre_deudor} tiene una deuda de {monto_deuda}.',
            variables: ['{nombre_empresa}', '{nombre_deudor}', '{monto_deuda}'],
            priority: 1,
            is_active: true
          })
          .select();
        
        if (promptError) {
          console.log('Error creating test prompt:', promptError.message);
        } else {
          console.log('Test prompt created successfully:', newPrompt);
        }
      }
      
    } else {
      console.log('Table exists and is accessible');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createPromptsTable();