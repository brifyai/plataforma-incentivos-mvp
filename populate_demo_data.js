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

async function populateDemoData() {
    try {
        console.log('🚀 Poblando datos de demostración...\n');

        // 1. Crear usuario empresa primero
        console.log('1️⃣ Creando usuario empresa...');
        const { data: companyUser, error: userError } = await supabase
            .from('users')
            .insert([{
                email: 'empresa@demo.cl',
                rut: '12.345.678-9',
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

        console.log(`✅ Usuario empresa creado: ${companyUser.email} (ID: ${companyUser.id})`);

        // 2. Crear empresa de prueba
        console.log('2️⃣ Creando empresa de prueba...');
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert([{
                user_id: companyUser.id,
                company_name: 'Empresa de Cobranzas Demo S.A.',
                rut: '12.345.678-9',
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

        console.log(`✅ Empresa creada: ${company.company_name} (ID: ${company.id})`);

        // 3. Crear algunos deudores
        console.log('\n3️⃣ Creando deudores...');
        const debtors = [];
        for (let i = 1; i <= 10; i++) {
            const debtorData = {
                email: `deudor${i}@demo.cl`,
                full_name: `Deudor ${i}`,
                rut: `2222222${i}-1`, // RUT más corto para evitar límite de 12 caracteres
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

        // 4. Crear deudas (sin client_id ya que no existe en el esquema)
        console.log('\n4️⃣ Creando deudas...');
        const debts = [];
        for (let i = 0; i < debtors.length; i++) {
            const debtor = debtors[i];

            const debtData = {
                user_id: debtor.id,
                company_id: company.id,
                original_amount: Math.floor(Math.random() * 5000000) + 500000, // 500k a 5.5M
                current_amount: Math.floor(Math.random() * 3000000) + 200000, // 200k a 3.2M
                description: `Deuda pendiente - Deudor ${debtor.full_name}`,
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

        // 5. Crear algunos pagos completados
        console.log('\n5️⃣ Creando pagos completados...');
        const completedDebts = debts.slice(0, 5); // Primeros 5 deudores pagan
        for (const debt of completedDebts) {
            const paymentAmount = Math.min(debt.current_amount, Math.floor(Math.random() * debt.current_amount) + 100000);

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

        console.log('\n🎉 Datos de demostración poblados exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - Empresa: ${company.company_name}`);
        console.log(`   - Deudores: ${debtors.length}`);
        console.log(`   - Deudas: ${debts.length}`);
        console.log(`   - Pagos completados: ${completedDebts.length}`);

        console.log('\n💡 Ahora puedes acceder al dashboard en http://localhost:3002/empresa/dashboard');

    } catch (error) {
        console.error('❌ Error poblando datos:', error.message);
    }
}

populateDemoData();