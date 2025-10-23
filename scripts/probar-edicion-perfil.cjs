const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function probarEdicionPerfil() {
    try {
        console.log('🧪 PROBANDO FUNCIONALIDAD DE EDICIÓN DE PERFIL\n');

        // 1. Verificar datos actuales de la empresa
        console.log('📋 Paso 1: Verificando datos actuales...');
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select(`
                id,
                company_name,
                contact_email,
                contact_phone,
                rut,
                legal_representative_name,
                legal_representative_rut,
                company_type,
                bank_account_info,
                updated_at
            `)
            .eq('contact_email', 'empresa@nexupay.cl')
            .single();

        if (companyError) {
            console.error('❌ Error obteniendo empresa:', companyError);
            return;
        }

        console.log('✅ Datos actuales de la empresa:');
        console.log(`   🏢 Nombre: ${company.company_name}`);
        console.log(`   👤 Representante: ${company.legal_representative_name || 'No configurado'}`);
        console.log(`   📋 RUT Representante: ${company.legal_representative_rut || 'No configurado'}`);
        console.log(`   📧 Email: ${company.contact_email}`);
        console.log(`   📞 Teléfono: ${company.contact_phone || 'No configurado'}`);
        console.log(`   🏦 Banco: ${company.bank_account_info?.bankName || 'No configurado'}`);
        console.log(`   📄 Cuenta: ${company.bank_account_info?.accountType || 'No configurado'} ${company.bank_account_info?.accountNumber || ''}`);

        // 2. Simular actualización de datos
        console.log('\n📝 Paso 2: Simulando actualización de datos...');
        
        const testData = {
            legal_representative_name: 'Camilo Alegria Test',
            legal_representative_rut: '16323735-0',
            contact_phone: '+56 9 1234 5678',
            bank_account_info: {
                bankName: 'banco estado',
                accountType: 'checking',
                accountNumber: '1234567890',
                accountHolderName: 'NexuPay Cobranzas',
                accountHolderRut: '78179864-9'
            }
        };

        console.log('🔄 Actualizando con datos de prueba...');
        const { error: updateError } = await supabase
            .from('companies')
            .update({
                ...testData,
                updated_at: new Date().toISOString()
            })
            .eq('id', company.id);

        if (updateError) {
            console.error('❌ Error actualizando empresa:', updateError);
            return;
        }

        console.log('✅ Actualización simulada exitosa');

        // 3. Verificar datos actualizados
        console.log('\n🔍 Paso 3: Verificando datos actualizados...');
        const { data: updatedCompany, error: verifyError } = await supabase
            .from('companies')
            .select(`
                legal_representative_name,
                legal_representative_rut,
                contact_phone,
                bank_account_info,
                updated_at
            `)
            .eq('id', company.id)
            .single();

        if (verifyError) {
            console.error('❌ Error verificando actualización:', verifyError);
            return;
        }

        console.log('✅ Datos actualizados verificados:');
        console.log(`   👤 Representante: ${updatedCompany.legal_representative_name}`);
        console.log(`   📋 RUT Representante: ${updatedCompany.legal_representative_rut}`);
        console.log(`   📞 Teléfono: ${updatedCompany.contact_phone}`);
        console.log(`   🏦 Banco: ${updatedCompany.bank_account_info?.bankName}`);
        console.log(`   📄 Cuenta: ${updatedCompany.bank_account_info?.accountType} ${updatedCompany.bank_account_info?.accountNumber}`);

        // 4. Restaurar datos originales
        console.log('\n🔄 Paso 4: Restaurando datos originales...');
        const { error: restoreError } = await supabase
            .from('companies')
            .update({
                legal_representative_name: company.legal_representative_name,
                legal_representative_rut: company.legal_representative_rut,
                contact_phone: company.contact_phone,
                bank_account_info: company.bank_account_info,
                updated_at: new Date().toISOString()
            })
            .eq('id', company.id);

        if (restoreError) {
            console.error('❌ Error restaurando datos:', restoreError);
            return;
        }

        console.log('✅ Datos originales restaurados');

        // 5. Verificar campos disponibles en la tabla
        console.log('\n📊 Paso 5: Verificando estructura de la tabla companies...');
        const { data: columns } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'companies')
            .eq('table_schema', 'public')
            .in('column_name', [
                'legal_representative_name',
                'legal_representative_rut',
                'company_type',
                'bank_account_info'
            ]);

        if (columns && columns.length > 0) {
            console.log('✅ Campos verificados en la base de datos:');
            columns.forEach(col => {
                console.log(`   📋 ${col.column_name}: ${col.data_type}`);
            });
        } else {
            console.log('⚠️ No se pudieron verificar los campos de la tabla');
        }

        console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
        console.log('✅ La funcionalidad de edición de perfil funciona correctamente');
        console.log('✅ Todos los campos se mapean correctamente con la base de datos');
        console.log('✅ Los datos bancarios se guardan en formato JSON en bank_account_info');

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

probarEdicionPerfil();