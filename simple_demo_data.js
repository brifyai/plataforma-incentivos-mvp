import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno faltantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleDemoData() {
    try {
        console.log('🚀 Creando datos básicos de demostración...\n');

        // 1. Verificar si ya existe una empresa
        const { data: existingCompanies, error: checkError } = await supabase
            .from('companies')
            .select('id, company_name')
            .limit(1);

        if (checkError) {
            console.error('❌ Error verificando empresas existentes:', checkError.message);
            return;
        }

        let company;
        if (existingCompanies && existingCompanies.length > 0) {
            company = existingCompanies[0];
            console.log(`✅ Usando empresa existente: ${company.company_name}`);
        } else {
            // Crear usuario empresa
            const { data: companyUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    email: `empresa_${Date.now()}@demo.cl`,
                    rut: '12345678-9',
                    full_name: 'Empresa Demo S.A.',
                    role: 'company',
                    validation_status: 'validated',
                    email_verified: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (userError) {
                console.error('❌ Error creando usuario empresa:', userError.message);
                return;
            }

            // Crear empresa
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    user_id: companyUser.id,
                    company_name: 'Empresa de Cobranzas Demo S.A.',
                    rut: '12345678-9',
                    contact_email: 'contacto@demo.cl',
                    contact_phone: '+56912345678',
                    address: 'Av. Providencia 123, Santiago',
                    company_type: 'collection_agency',
                    nexupay_commission: 15,
                    nexupay_commission_type: 'percentage',
                    user_incentive_percentage: 5,
                    user_incentive_type: 'percentage',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (companyError) {
                console.error('❌ Error creando empresa:', companyError.message);
                return;
            }

            company = newCompany;
            console.log(`✅ Empresa creada: ${company.company_name}`);
        }

        // 2. Crear algunos deudores
        console.log('\n👥 Creando deudores...');
        const debtors = [];
        for (let i = 1; i <= 15; i++) {
            const debtorData = {
                email: `deudor_${Date.now()}_${i}@demo.cl`,
                full_name: `Deudor ${i}`,
                rut: `2222222${i}-1`,
                role: 'debtor',
                validation_status: 'validated',
                email_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: debtor, error: debtorError } = await supabase
                .from('users')
                .insert([debtorData])
                .select()
                .single();

            if (debtorError) {
                console.error(`❌ Error creando deudor ${i}:`, debtorError.message);
            } else {
                debtors.push(debtor);
                console.log(`✅ Deudor creado: ${debtor.full_name}`);
            }
        }

        // 3. Crear deudas
        console.log('\n💰 Creando deudas...');
        const debts = [];
        for (let i = 0; i < debtors.length; i++) {
            const debtor = debtors[i];
            const originalAmount = Math.floor(Math.random() * 5000000) + 500000;
            const currentAmount = Math.floor(Math.random() * originalAmount * 0.8) + originalAmount * 0.2;

            const debtData = {
                user_id: debtor.id,
                company_id: company.id,
                original_amount: originalAmount,
                current_amount: currentAmount,
                description: `Deuda pendiente - ${debtor.full_name}`,
                status: 'active',
                created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: debt, error: debtError } = await supabase
                .from('debts')
                .insert([debtData])
                .select()
                .single();

            if (debtError) {
                console.error(`❌ Error creando deuda para ${debtor.full_name}:`, debtError.message);
            } else {
                debts.push(debt);
                console.log(`✅ Deuda creada: $${debt.current_amount.toLocaleString()} para ${debtor.full_name}`);
            }
        }

        // 4. Crear algunos pagos completados
        console.log('\n💳 Creando pagos completados...');
        const paymentsToCreate = Math.min(8, debts.length);
        for (let i = 0; i < paymentsToCreate; i++) {
            const debt = debts[i];
            const paymentAmount = Math.min(debt.current_amount, Math.floor(Math.random() * debt.current_amount * 0.7) + debt.current_amount * 0.3);

            const paymentData = {
                user_id: debt.user_id,
                company_id: company.id,
                amount: paymentAmount,
                payment_method: 'mercadopago',
                status: 'completed',
                transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert([paymentData])
                .select()
                .single();

            if (paymentError) {
                console.error(`❌ Error creando pago:`, paymentError.message);
            } else {
                console.log(`✅ Pago completado: $${payment.amount.toLocaleString()}`);
            }
        }

        console.log('\n🎉 Datos básicos de demostración creados exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - Empresa: ${company.company_name}`);
        console.log(`   - Deudores: ${debtors.length}`);
        console.log(`   - Deudas: ${debts.length}`);
        console.log(`   - Pagos completados: ${paymentsToCreate}`);

        console.log('\n💡 Ahora puedes acceder al dashboard en http://localhost:3002/empresa/dashboard');

    } catch (error) {
        console.error('❌ Error creando datos básicos:', error.message);
    }
}

createSimpleDemoData();