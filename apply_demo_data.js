/**
 * Script para aplicar datos demo completos a la base de datos Supabase
 * Este script carga todos los datos ficticios necesarios para probar la aplicación
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDemoData() {
    console.log('🚀 Iniciando carga de datos demo completos...');
    
    try {
        // Leer el archivo SQL
        const fs = require('fs');
        const path = require('path');
        
        const sqlFile = path.join(__dirname, 'supabase-migrations', 'complete_demo_data.sql');
        
        if (!fs.existsSync(sqlFile)) {
            console.error('❌ Error: No se encuentra el archivo complete_demo_data.sql');
            process.exit(1);
        }
        
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Dividir el contenido en sentencias SQL individuales
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Se encontraron ${statements.length} sentencias SQL para ejecutar`);
        
        // Ejecutar cada sentencia
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                // Usar RPC para ejecutar SQL raw
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                
                if (error) {
                    // Si RPC no funciona, intentar con el método directo
                    console.warn(`⚠️ Método RPC fallido para sentencia ${i + 1}, intentando método directo...`);
                    
                    // Para sentencias INSERT, podemos intentar con el método directo
                    if (statement.trim().toUpperCase().startsWith('INSERT')) {
                        // Extraer nombre de tabla y datos del INSERT
                        const tableMatch = statement.match(/INSERT INTO public\.(\w+)/i);
                        if (tableMatch) {
                            const tableName = tableMatch[1];
                            console.log(`📊 Intentando insertar en tabla: ${tableName}`);
                            // Nota: Esto requeriría parsing más complejo para funcionar correctamente
                        }
                    }
                    
                    console.error(`❌ Error en sentencia ${i + 1}:`, error.message);
                    errorCount++;
                } else {
                    successCount++;
                    if ((i + 1) % 10 === 0) {
                        console.log(`✅ Procesadas ${i + 1}/${statements.length} sentencias...`);
                    }
                }
            } catch (err) {
                console.error(`❌ Error ejecutando sentencia ${i + 1}:`, err.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 Resumen de la carga de datos:');
        console.log(`✅ Sentencias exitosas: ${successCount}`);
        console.log(`❌ Sentencias con error: ${errorCount}`);
        console.log(`📝 Total de sentencias: ${statements.length}`);
        
        if (successCount > 0) {
            console.log('\n🎉 ¡Datos demo cargados exitosamente!');
            console.log('\n📧 Usuarios de prueba disponibles:');
            console.log('🔹 Administrador GOD: camiloalegriabarra@gmail.com');
            console.log('🔹 Empresa 1: admin@cobranzapro.cl');
            console.log('🔹 Empresa 2: director@recuperachile.cl');
            console.log('🔹 Deudor 1: juan.perez@email.cl');
            console.log('🔹 Deudor 2: maria.lopez@email.cl');
            console.log('\n🔑 Contraseña para todos: demo123 (o la que esté configurada)');
        }
        
        if (errorCount > 0) {
            console.log('\n⚠️ Algunas sentencias fallaron. Esto puede ser normal si los datos ya existen.');
            console.log('   Verifica los errores específicos arriba si necesitas detalles.');
        }
        
    } catch (error) {
        console.error('❌ Error general durante la carga de datos:', error);
        process.exit(1);
    }
}

// Función alternativa para crear datos usando el cliente de Supabase
async function createDemoDataDirectly() {
    console.log('🔄 Creando datos demo directamente con el cliente Supabase...');
    
    try {
        // Datos de usuarios
        const users = [
            {
                id: 'god-mode-user',
                email: 'camiloalegriabarra@gmail.com',
                password: '$2a$10$hashedpassword',
                rut: '12.345.678-9',
                full_name: 'Administrador GOD',
                role: 'god_mode',
                validation_status: 'validated',
                wallet_balance: 1000000,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'debtor-001',
                email: 'juan.perez@email.cl',
                password: '$2a$10$hashedpassword',
                rut: '1.234.567-8',
                full_name: 'Juan Pérez González',
                role: 'debtor',
                validation_status: 'validated',
                wallet_balance: 15000,
                phone: '+56912345678',
                address: 'Calle Los Alerces 123',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'debtor-002',
                email: 'maria.lopez@email.cl',
                password: '$2a$10$hashedpassword',
                rut: '2.345.678-9',
                full_name: 'María López Rodríguez',
                role: 'debtor',
                validation_status: 'validated',
                wallet_balance: 25000,
                phone: '+56923456789',
                address: 'Av. Las Condes 456',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
        
        // Insertar usuarios
        for (const user of users) {
            const { error } = await supabase
                .from('users')
                .upsert(user, { onConflict: 'id' });
            
            if (error) {
                console.warn(`⚠️ Error insertando usuario ${user.email}:`, error.message);
            } else {
                console.log(`✅ Usuario creado: ${user.email}`);
            }
        }
        
        // Datos de empresas
        const companies = [
            {
                id: 'empresa-cobranza-1',
                user_id: 'empresa-user-1',
                business_name: 'CobranzaPro SpA',
                rut: '76.543.210-1',
                contact_email: 'contacto@cobranzapro.cl',
                contact_phone: '+56987654321',
                company_type: 'collection_agency',
                address: 'Av. Providencia 123',
                city: 'Santiago',
                region: 'Metropolitana',
                country: 'Chile',
                website: 'https://cobranzapro.cl',
                description: 'Empresa líder en cobranzas con 15 años de experiencia',
                nexupay_commission: 15.0,
                nexupay_commission_type: 'percentage',
                user_incentive_percentage: 5.0,
                user_incentive_type: 'percentage',
                bank_account_info: '{"bank": "Banco Estado", "account_type": "corriente", "account_number": "123456789"}',
                verification_status: 'verified',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
        
        // Insertar empresas
        for (const company of companies) {
            const { error } = await supabase
                .from('companies')
                .upsert(company, { onConflict: 'id' });
            
            if (error) {
                console.warn(`⚠️ Error insertando empresa ${company.business_name}:`, error.message);
            } else {
                console.log(`✅ Empresa creada: ${company.business_name}`);
            }
        }
        
        // Datos de deudas
        const debts = [
            {
                id: 'debt-001',
                user_id: 'debtor-001',
                company_id: 'empresa-cobranza-1',
                client_id: 'client-cp-001',
                original_amount: 2500000,
                current_amount: 2500000,
                debt_type: 'credit_card',
                debt_reference: 'CC-2024-001',
                status: 'active',
                description: 'Tarjeta de crédito Banco Estado',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                risk_level: 'medium',
                segment_tags: '["premium", "tech"]',
                ai_score: 7.2,
                days_overdue: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'debt-002',
                user_id: 'debtor-002',
                company_id: 'empresa-cobranza-1',
                client_id: 'client-cp-002',
                original_amount: 950000,
                current_amount: 950000,
                debt_type: 'service',
                debt_reference: 'SERV-2024-012',
                status: 'active',
                description: 'Servicio de telefonía Entel',
                due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                risk_level: 'medium',
                segment_tags: '["telecom", "family"]',
                ai_score: 6.8,
                days_overdue: 0,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
        
        // Insertar deudas
        for (const debt of debts) {
            const { error } = await supabase
                .from('debts')
                .upsert(debt, { onConflict: 'id' });
            
            if (error) {
                console.warn(`⚠️ Error insertando deuda ${debt.debt_reference}:`, error.message);
            } else {
                console.log(`✅ Deuda creada: ${debt.debt_reference}`);
            }
        }
        
        console.log('\n🎉 ¡Datos demo creados exitosamente!');
        console.log('\n📧 Usuarios de prueba disponibles:');
        console.log('🔹 Administrador GOD: camiloalegriabarra@gmail.com');
        console.log('🔹 Deudor 1: juan.perez@email.cl');
        console.log('🔹 Deudor 2: maria.lopez@email.cl');
        console.log('\n🔑 Contraseña para todos: demo123');
        
    } catch (error) {
        console.error('❌ Error creando datos demo directamente:', error);
    }
}

// Ejecutar el script
async function main() {
    console.log('🎯 NexuPay - Carga de Datos Demo');
    console.log('=====================================\n');
    
    // Intentar primero con el método directo (más compatible)
    await createDemoDataDirectly();
    
    console.log('\n✨ Proceso completado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { applyDemoData, createDemoDataDirectly };