const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarRepresentanteLegal() {
    try {
        console.log('🔍 Verificando datos del representante legal...\n');

        // Consultar datos de empresas con representante legal
        const { data: companies, error } = await supabase
            .from('companies')
            .select(`
                company_name,
                rut,
                legal_representative_name,
                legal_representative_rut,
                contact_email,
                updated_at
            `)
            .not('legal_representative_name', 'is', null)
            .or('legal_representative_name.not.is.null,rut.not.is.null');

        if (error) {
            console.error('❌ Error al consultar empresas:', error);
            return;
        }

        if (!companies || companies.length === 0) {
            console.log('⚠️ No se encontraron empresas con datos de representante legal');
            
            // Verificar si las columnas existen
            console.log('\n🔍 Verificando si las columnas de representante legal existen...');
            const { data: columns } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', 'companies')
                .eq('table_schema', 'public')
                .in('column_name', ['legal_representative_name', 'legal_representative_rut']);

            if (!columns || columns.length === 0) {
                console.log('❌ Las columnas legal_representative_name y legal_representative_rut no existen');
                console.log('📋 Se debe ejecutar la migración 035_add_legal_representative_to_companies.sql');
            } else {
                console.log('✅ Las columnas existen pero no hay datos');
            }
            return;
        }

        console.log(`📊 Se encontraron ${companies.length} empresas con datos de representante legal:\n`);

        companies.forEach((company, index) => {
            console.log(`${index + 1}. 🏢 ${company.company_name}`);
            console.log(`   📧 Email: ${company.contact_email}`);
            console.log(`   🆔 RUT Empresa: ${company.rut}`);
            console.log(`   👤 Representante: ${company.legal_representative_name}`);
            console.log(`   📋 RUT Representante: ${company.legal_representative_rut}`);
            console.log(`   📅 Actualizado: ${company.updated_at}`);
            console.log('');
        });

        // Verificar específicamente los datos solicitados
        const nexupayCompany = companies.find(c => c.contact_email === 'empresa@nexupay.cl');
        if (nexupayCompany) {
            console.log('✅ DATOS DE NEXUPAY COBRANZAS:');
            console.log(`   👤 Representante: ${nexupayCompany.legal_representative_name}`);
            console.log(`   📋 RUT Representante: ${nexupayCompany.legal_representative_rut}`);
            
            if (nexupayCompany.legal_representative_name === 'Camilo Alegria' && 
                nexupayCompany.legal_representative_rut === '16323735-0') {
                console.log('   ✅ Los datos ya son correctos');
            } else {
                console.log('   ⚠️ Los datos necesitan actualización');
            }
        } else {
            console.log('⚠️ No se encontró la empresa empresa@nexupay.cl');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarRepresentanteLegal();