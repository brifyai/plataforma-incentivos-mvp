#!/usr/bin/env node

/**
 * 📋 VALIDACIÓN COMPLETA DE RELACIONES UI-BD
 * Sistema NexuPay: Validación automática de todas las relaciones
 * entre campos de UI y tablas de base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class UIDatabaseValidator {
    constructor() {
        this.results = {
            valid: [],
            invalid: [],
            critical: [],
            warnings: [],
            summary: {
                total: 0,
                valid: 0,
                invalid: 0,
                critical: 0,
                warnings: 0
            }
        };
    }

    async validateAllRelations() {
        console.log('🚀 Iniciando validación completa de relaciones UI-BD...\n');

        try {
            // 1. Validar estructura de tablas
            await this.validateTableStructure();
            
            // 2. Validar foreign keys
            await this.validateForeignKeys();
            
            // 3. Validar datos huérfanos
            await this.validateOrphanedData();
            
            // 4. Validar relaciones específicas de UI
            await this.validateUIRelations();
            
            // 5. Generar reporte
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error durante validación:', error.message);
        }
    }

    async validateTableStructure() {
        console.log('📊 Validando estructura de tablas...');
        
        const tables = [
            'companies',
            'clients', 
            'debtors',
            'debts',
            'payments',
            'notifications',
            'campaigns',
            'offers',
            'users'
        ];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    this.addResult('critical', `Tabla ${table}`, error.message);
                } else {
                    this.addResult('valid', `Tabla ${table}`, 'Estructura válida');
                }
            } catch (error) {
                this.addResult('critical', `Tabla ${table}`, error.message);
            }
        }
    }

    async validateForeignKeys() {
        console.log('🔗 Validando foreign keys...');
        
        // Validar companies.id → debts.company_id
        await this.validateForeignKey(
            'debts.company_id',
            'companies.id',
            'Relación debts → companies'
        );
        
        // Validar clients.id → debts.client_id (CRÍTICO)
        await this.validateForeignKey(
            'debts.client_id',
            'clients.id',
            'Relación debts → clients'
        );
        
        // Validar companies.id → clients.company_id
        await this.validateForeignKey(
            'clients.company_id',
            'companies.id',
            'Relación clients → companies'
        );
        
        // Validar debtors.id → debts.debtor_id
        await this.validateForeignKey(
            'debts.debtor_id',
            'debtors.id',
            'Relación debts → debtors'
        );
        
        // Validar users.id → notifications.user_id
        await this.validateForeignKey(
            'notifications.user_id',
            'users.id',
            'Relación notifications → users'
        );
    }

    async validateForeignKey(fkColumn, pkTable, relationName) {
        try {
            const [fkTable, fkColumn_name] = fkColumn.split('.');
            const [pkColumn] = pkTable.split('.');
            
            // Verificar datos huérfanos
            const query = `
                SELECT COUNT(*) as orphaned_count 
                FROM ${fkTable} 
                WHERE ${fkColumn_name} IS NOT NULL 
                AND ${fkColumn_name} NOT IN (SELECT id FROM ${pkTable})
            `;
            
            const { data, error } = await supabase.rpc('execute_sql', { query });
            
            if (error) {
                // Alternativa si RPC no está disponible
                const { data: fkData, error: fkError } = await supabase
                    .from(fkTable)
                    .select(fkColumn_name)
                    .not(fkColumn_name, 'is', null);
                
                if (fkError) {
                    this.addResult('critical', relationName, fkError.message);
                    return;
                }
                
                const { data: pkData, error: pkError } = await supabase
                    .from(pkTable)
                    .select('id');
                
                if (pkError) {
                    this.addResult('critical', relationName, pkError.message);
                    return;
                }
                
                const validIds = new Set(pkData.map(item => item.id));
                const orphaned = fkData.filter(item => !validIds.has(item[fkColumn_name]));
                
                if (orphaned.length > 0) {
                    this.addResult('critical', relationName, 
                        `${orphaned.length} registros huérfanos encontrados`);
                } else {
                    this.addResult('valid', relationName, 'Relación válida');
                }
            } else {
                const orphanedCount = data[0]?.orphaned_count || 0;
                if (orphanedCount > 0) {
                    this.addResult('critical', relationName, 
                        `${orphanedCount} registros huérfanos encontrados`);
                } else {
                    this.addResult('valid', relationName, 'Relación válida');
                }
            }
        } catch (error) {
            this.addResult('warnings', relationName, `No se pudo validar: ${error.message}`);
        }
    }

    async validateOrphanedData() {
        console.log('🔍 Validando datos huérfanos...');
        
        // Verificar deudas sin compañía
        const { data: orphanedDebts, error: debtError } = await supabase
            .from('debts')
            .select('id, company_id, client_id')
            .is('company_id', null);
            
        if (debtError) {
            this.addResult('critical', 'Deudas sin compañía', debtError.message);
        } else if (orphanedDebts.length > 0) {
            this.addResult('critical', 'Deudas sin compañía', 
                `${orphanedDebts.length} deudas sin company_id`);
        }
        
        // Verificar clientes sin compañía
        const { data: orphanedClients, error: clientError } = await supabase
            .from('clients')
            .select('id, company_id')
            .is('company_id', null);
            
        if (clientError) {
            this.addResult('critical', 'Clientes sin compañía', clientError.message);
        } else if (orphanedClients.length > 0) {
            this.addResult('warnings', 'Clientes sin compañía', 
                `${orphanedClients.length} clientes sin company_id`);
        }
    }

    async validateUIRelations() {
        console.log('🖥️ Validando relaciones específicas de UI...');
        
        // Validar Panel de Administración
        await this.validateAdminPanel();
        
        // Validar Panel de Empresas
        await this.validateCompanyPanel();
        
        // Validar Panel de Deudores
        await this.validateDebtorPanel();
    }

    async validateAdminPanel() {
        console.log('  🏢 Validando Panel de Administración...');
        
        // Validar dashboard stats
        try {
            const { data: companies, error: compError } = await supabase
                .from('companies')
                .select('id', { count: 'exact' });
                
            const { data: debtors, error: debtError } = await supabase
                .from('debtors')
                .select('id', { count: 'exact' });
                
            const { data: debts, error: debtsError } = await supabase
                .from('debts')
                .select('amount', { count: 'exact' });
                
            if (compError || debtError || debtsError) {
                this.addResult('critical', 'Admin Dashboard', 
                    'Error obteniendo estadísticas');
            } else {
                this.addResult('valid', 'Admin Dashboard', 
                    `Stats válidas: ${companies.length} empresas, ${debtors.length} deudores, ${debts.length} deudas`);
            }
        } catch (error) {
            this.addResult('warnings', 'Admin Dashboard', error.message);
        }
    }

    async validateCompanyPanel() {
        console.log('  🏭 Validando Panel de Empresas...');
        
        // Validar relación companies → clients
        try {
            const { data: companies, error: compError } = await supabase
                .from('companies')
                .select('id, name')
                .limit(5);
                
            if (compError) {
                this.addResult('critical', 'Company Panel', compError.message);
                return;
            }
            
            for (const company of companies) {
                const { data: clients, error: clientError } = await supabase
                    .from('clients')
                    .select('id, name')
                    .eq('company_id', company.id);
                    
                if (clientError) {
                    this.addResult('warnings', `Empresa ${company.name}`, 
                        `Error obteniendo clientes: ${clientError.message}`);
                } else {
                    this.addResult('valid', `Empresa ${company.name}`, 
                        `${clients.length} clientes encontrados`);
                }
            }
        } catch (error) {
            this.addResult('warnings', 'Company Panel', error.message);
        }
    }

    async validateDebtorPanel() {
        console.log('  👤 Validando Panel de Deudores...');
        
        // Validar relación debtors → debts
        try {
            const { data: debtors, error: debtorError } = await supabase
                .from('debtors')
                .select('id, name')
                .limit(5);
                
            if (debtorError) {
                this.addResult('critical', 'Debtor Panel', debtorError.message);
                return;
            }
            
            for (const debtor of debtors) {
                const { data: debts, error: debtError } = await supabase
                    .from('debts')
                    .select('id, amount, company_id')
                    .eq('debtor_id', debtor.id);
                    
                if (debtError) {
                    this.addResult('warnings', `Deudor ${debtor.name}`, 
                        `Error obteniendo deudas: ${debtError.message}`);
                } else {
                    this.addResult('valid', `Deudor ${debtor.name}`, 
                        `${debts.length} deudas encontradas`);
                        
                    // Validar que cada deuda tenga una compañía válida
                    for (const debt of debts) {
                        if (!debt.company_id) {
                            this.addResult('critical', 
                                `Deuda ${debt.id} de ${debtor.name}`, 
                                'Sin company_id');
                        }
                    }
                }
            }
        } catch (error) {
            this.addResult('warnings', 'Debtor Panel', error.message);
        }
    }

    addResult(type, subject, message) {
        this.results[type].push({ subject, message });
        this.results.summary.total++;
        this.results.summary[type]++;
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 REPORTE DE VALIDACIÓN DE RELACIONES UI-BD');
        console.log('='.repeat(80));
        
        // Resumen
        console.log('\n📊 RESUMEN EJECUTIVO:');
        console.log(`   Total de validaciones: ${this.results.summary.total}`);
        console.log(`   ✅ Válidas: ${this.results.summary.valid}`);
        console.log(`   ⚠️ Advertencias: ${this.results.summary.warnings}`);
        console.log(`   ❌ Inválidas: ${this.results.summary.invalid}`);
        console.log(`   🚨 Críticas: ${this.results.summary.critical}`);
        
        // Detalles
        if (this.results.critical.length > 0) {
            console.log('\n🚨 ERRORES CRÍTICOS:');
            this.results.critical.forEach(item => {
                console.log(`   ❌ ${item.subject}: ${item.message}`);
            });
        }
        
        if (this.results.invalid.length > 0) {
            console.log('\n❌ ERRORES:');
            this.results.invalid.forEach(item => {
                console.log(`   ❌ ${item.subject}: ${item.message}`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ ADVERTENCIAS:');
            this.results.warnings.forEach(item => {
                console.log(`   ⚠️ ${item.subject}: ${item.message}`);
            });
        }
        
        if (this.results.valid.length > 0) {
            console.log('\n✅ RELACIONES VÁLIDAS:');
            this.results.valid.forEach(item => {
                console.log(`   ✅ ${item.subject}: ${item.message}`);
            });
        }
        
        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (this.results.critical.length > 0) {
            console.log('   1. CORREGIR ERRORES CRÍTICOS INMEDIATAMENTE');
            console.log('   2. Revisar foreign keys y constraints');
            console.log('   3. Limpiar datos huérfanos');
        }
        
        if (this.results.warnings.length > 0) {
            console.log('   4. Investigar advertencias para mejorar integridad');
        }
        
        if (this.results.critical.length === 0 && this.results.invalid.length === 0) {
            console.log('   🎉 Sistema en buen estado. Solo mantenimiento preventivo requerido.');
        }
        
        console.log('\n' + '='.repeat(80));
        
        // Guardar reporte en archivo
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            details: this.results
        };
        
        require('fs').writeFileSync(
            `ui-database-validation-report-${Date.now()}.json`,
            JSON.stringify(reportData, null, 2)
        );
        
        console.log('📄 Reporte guardado en archivo JSON');
    }
}

// Ejecutar validación
if (require.main === module) {
    const validator = new UIDatabaseValidator();
    validator.validateAllRelations().catch(console.error);
}

module.exports = UIDatabaseValidator;