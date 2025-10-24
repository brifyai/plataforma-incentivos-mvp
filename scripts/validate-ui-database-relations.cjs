#!/usr/bin/env node

/**
 * 📋 VALIDACIÓN DE RELACIONES UI-BD - Versión para Proyecto NexuPay
 * 
 * Este script analiza las relaciones entre los campos de las páginas web
 * y las tablas de la base de datos, usando la configuración existente del proyecto.
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existe
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

// Importar configuración de Supabase del proyecto
let supabaseUrl, supabaseKey;

try {
    // Intentar obtener desde variables de entorno
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno no encontradas');
    }
} catch (error) {
    console.error('❌ ERROR: No se encontraron las variables de entorno de Supabase');
    console.error('   Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_ROLE_KEY configuradas');
    console.error('   Puedes verificarlas en el archivo .env.local o en la configuración de Vite');
    process.exit(1);
}

// Crear cliente de Supabase manualmente
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

class UIDatabaseRelationsValidator {
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
        
        this.uiDatabaseMapping = this.getUIDatabaseMapping();
    }

    getUIDatabaseMapping() {
        return {
            // PANEL DE ADMINISTRACIÓN
            admin: {
                AdminDashboard: {
                    'Total Empresas': { table: 'companies', field: 'COUNT(*)', relation: 'direct' },
                    'Total Deudores': { table: 'debtors', field: 'COUNT(*)', relation: 'direct' },
                    'Total Deudas': { table: 'debts', field: 'SUM(amount)', relation: 'direct' },
                    'Pagos Recientes': { table: 'payments', field: 'created_at DESC', relation: 'direct' }
                },
                AdminConfig: {
                    'Configuración General': { table: 'system_config', field: 'config_key, config_value', relation: 'partial' },
                    'Email Settings': { table: 'email_config', field: 'smtp_host, smtp_port', relation: 'valid' },
                    'Payment Gateway': { table: 'payment_config', field: 'gateway_type, api_key', relation: 'valid' }
                },
                AIConfig: {
                    'AI Provider': { table: 'ai_providers', field: 'provider_name, api_key', relation: 'valid' },
                    'Model Settings': { table: 'ai_models', field: 'model_name, parameters', relation: 'valid' },
                    'Knowledge Base': { table: 'knowledge_base', field: 'title, content', relation: 'valid' }
                },
                AdminPayments: {
                    'Payment History': { table: 'payments', field: 'amount, status, created_at', relation: 'valid' },
                    'Transaction ID': { table: 'payments', field: 'transaction_id', relation: 'valid' },
                    'Payment Method': { table: 'payments', field: 'payment_method', relation: 'valid' },
                    'Status': { table: 'payments', field: 'status', relation: 'valid' }
                },
                CompanyVerification: {
                    'Company List': { table: 'companies', field: 'name, email, verification_status', relation: 'valid' },
                    'Verification Status': { table: 'companies', field: 'verification_status', relation: 'valid' },
                    'Documents': { table: 'company_documents', field: 'company_id, document_type', relation: 'valid' },
                    'Approval Date': { table: 'companies', field: 'verified_at', relation: 'valid' }
                }
            },
            
            // PANEL DE EMPRESAS
            company: {
                CompanyDashboard: {
                    'Company Name': { table: 'companies', field: 'name', relation: 'valid' },
                    'Total Clients': { table: 'clients', field: 'COUNT(*) WHERE company_id = ?', relation: 'valid' },
                    'Total Debts': { table: 'debts', field: 'SUM(amount) WHERE company_id = ?', relation: 'valid' },
                    'Recent Activity': { table: 'activity_log', field: 'created_at DESC WHERE company_id = ?', relation: 'partial' }
                },
                ClientsPage: {
                    'Client Name': { table: 'clients', field: 'name', relation: 'valid' },
                    'Email': { table: 'clients', field: 'email', relation: 'valid' },
                    'Phone': { table: 'clients', field: 'phone', relation: 'valid' },
                    'Debt Amount': { table: 'debts', field: 'SUM(amount) WHERE client_id = ?', relation: 'valid' },
                    'Status': { table: 'clients', field: 'status', relation: 'valid' },
                    'client_id': { table: 'clients', field: 'id', relation: 'critical' }
                },
                ClientDetails: {
                    'Client Info': { table: 'clients', field: 'name, email, phone, address', relation: 'valid' },
                    'Debt History': { table: 'debts', field: 'amount, due_date, status WHERE client_id = ?', relation: 'valid' },
                    'Payment History': { table: 'payments', field: 'amount, date WHERE client_id = ?', relation: 'valid' },
                    'Notes': { table: 'client_notes', field: 'note, created_at WHERE client_id = ?', relation: 'valid' }
                },
                NewDebtor: {
                    'Debtor Name': { table: 'debtors', field: 'name', relation: 'valid' },
                    'Email': { table: 'debtors', field: 'email', relation: 'valid' },
                    'Phone': { table: 'debtors', field: 'phone', relation: 'valid' },
                    'Debt Amount': { table: 'debts', field: 'amount', relation: 'valid' },
                    'Due Date': { table: 'debts', field: 'due_date', relation: 'valid' },
                    'Company ID': { table: 'debts', field: 'company_id', relation: 'valid' },
                    'Client ID': { table: 'debts', field: 'client_id', relation: 'critical' }
                },
                BulkImport: {
                    'File Upload': { table: 'import_jobs', field: 'file_path, status', relation: 'valid' },
                    'Import Status': { table: 'import_jobs', field: 'status, progress', relation: 'valid' },
                    'Results': { table: 'import_results', field: 'success_count, error_count', relation: 'valid' }
                },
                Campaigns: {
                    'Campaign Name': { table: 'campaigns', field: 'name', relation: 'valid' },
                    'Campaign Type': { table: 'campaigns', field: 'type', relation: 'valid' },
                    'Status': { table: 'campaigns', field: 'status', relation: 'valid' },
                    'Target Clients': { table: 'campaign_targets', field: 'client_id WHERE campaign_id = ?', relation: 'valid' }
                },
                CompanyNotifications: {
                    'Notification Title': { table: 'notifications', field: 'title', relation: 'valid' },
                    'Message': { table: 'notifications', field: 'message', relation: 'valid' },
                    'Type': { table: 'notifications', field: 'type', relation: 'valid' },
                    'Read Status': { table: 'notifications', field: 'read', relation: 'valid' },
                    'User ID': { table: 'notifications', field: 'user_id', relation: 'valid' }
                }
            },
            
            // PANEL DE DEUDORES
            debtor: {
                DebtorDashboard: {
                    'Debtor Name': { table: 'debtors', field: 'name', relation: 'valid' },
                    'Total Debt': { table: 'debts', field: 'SUM(amount) WHERE debtor_id = ?', relation: 'valid' },
                    'Payment History': { table: 'payments', field: 'amount, date WHERE debtor_id = ?', relation: 'valid' },
                    'Available Offers': { table: 'offers', field: 'amount, terms WHERE debtor_id = ?', relation: 'valid' }
                },
                Debts: {
                    'Debt Amount': { table: 'debts', field: 'amount', relation: 'valid' },
                    'Creditor': { table: 'companies', field: 'name JOIN debts.company_id = companies.id', relation: 'valid' },
                    'Due Date': { table: 'debts', field: 'due_date', relation: 'valid' },
                    'Status': { table: 'debts', field: 'status', relation: 'valid' },
                    'Interest Rate': { table: 'debts', field: 'interest_rate', relation: 'valid' }
                },
                Offers: {
                    'Offer Amount': { table: 'offers', field: 'amount', relation: 'valid' },
                    'Discount': { table: 'offers', field: 'discount_percentage', relation: 'valid' },
                    'Payment Terms': { table: 'offers', field: 'payment_terms', relation: 'valid' },
                    'Expiry Date': { table: 'offers', field: 'expires_at', relation: 'valid' },
                    'Status': { table: 'offers', field: 'status', relation: 'valid' }
                },
                Payments: {
                    'Payment Amount': { table: 'payments', field: 'amount', relation: 'valid' },
                    'Payment Method': { table: 'payments', field: 'payment_method', relation: 'valid' },
                    'Transaction ID': { table: 'payments', field: 'transaction_id', relation: 'valid' },
                    'Payment Date': { table: 'payments', field: 'created_at', relation: 'valid' },
                    'Status': { table: 'payments', field: 'status', relation: 'valid' }
                },
                Profile: {
                    'Full Name': { table: 'debtors', field: 'name', relation: 'valid' },
                    'Email': { table: 'debtors', field: 'email', relation: 'valid' },
                    'Phone': { table: 'debtors', field: 'phone', relation: 'valid' },
                    'Address': { table: 'debtors', field: 'address', relation: 'valid' },
                    'ID Document': { table: 'debtors', field: 'id_document', relation: 'valid' }
                }
            }
        };
    }

    async validateAllRelations() {
        console.log('🚀 Iniciando validación completa de relaciones UI-BD...\n');
        console.log('📊 Analizando mapeo de campos de UI con tablas de base de datos...\n');

        try {
            // 1. Validar estructura de tablas
            await this.validateTableStructure();
            
            // 2. Validar relaciones específicas de UI
            await this.validateUIRelations();
            
            // 3. Validar foreign keys críticas
            await this.validateCriticalForeignKeys();
            
            // 4. Validar datos huérfanos
            await this.validateOrphanedData();
            
            // 5. Generar reporte
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error durante validación:', error.message);
            console.error('Stack:', error.stack);
        }
    }

    async validateTableStructure() {
        console.log('📋 Validando estructura de tablas básicas...');
        
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

    async validateUIRelations() {
        console.log('🖥️ Validando relaciones específicas de UI...');
        
        for (const [panel, pages] of Object.entries(this.uiDatabaseMapping)) {
            console.log(`  📑 Panel: ${panel.toUpperCase()}`);
            
            for (const [page, fields] of Object.entries(pages)) {
                console.log(`    📄 Página: ${page}`);
                
                for (const [uiField, mapping] of Object.entries(fields)) {
                    await this.validateUIField(panel, page, uiField, mapping);
                }
            }
        }
    }

    async validateUIField(panel, page, uiField, mapping) {
        try {
            const { table, field, relation } = mapping;
            
            // Verificar si la tabla existe
            const { data: tableData, error: tableError } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (tableError) {
                this.addResult('critical', `${panel}.${page}.${uiField}`, 
                    `Tabla ${table} no existe: ${tableError.message}`);
                return;
            }
            
            // Verificar si el campo existe (intentar seleccionarlo)
            if (field.includes('WHERE') || field.includes('JOIN')) {
                // Para consultas complejas, solo validar que la tabla existe
                this.addResult('valid', `${panel}.${page}.${uiField}`, 
                    `Relación compleja válida (${table})`);
            } else {
                // Para campos simples, verificar que existan
                const fieldsToCheck = field.split(',').map(f => f.trim().split(' ')[0]);
                
                for (const fieldName of fieldsToCheck) {
                    if (fieldName !== 'COUNT(*)' && fieldName !== 'SUM(amount)') {
                        const { data, error } = await supabase
                            .from(table)
                            .select(fieldName)
                            .limit(1);
                        
                        if (error) {
                            this.addResult('invalid', `${panel}.${page}.${uiField}`, 
                                `Campo ${fieldName} no existe en ${table}: ${error.message}`);
                            return;
                        }
                    }
                }
                
                this.addResult('valid', `${panel}.${page}.${uiField}`, 
                    `Campo válido: ${table}.${field}`);
            }
            
            // Evaluar el estado de la relación
            if (relation === 'critical') {
                this.addResult('critical', `${panel}.${page}.${uiField}`, 
                    'REQUIERE ATENCIÓN: Relación crítica identificada');
            } else if (relation === 'partial') {
                this.addResult('warnings', `${panel}.${page}.${uiField}`, 
                    'Relación parcial: requiere revisión');
            }
            
        } catch (error) {
            this.addResult('invalid', `${panel}.${page}.${uiField}`, 
                `Error validando: ${error.message}`);
        }
    }

    async validateCriticalForeignKeys() {
        console.log('🔗 Validando foreign keys críticas...');
        
        // Validar companies.id → debts.company_id
        await this.validateForeignKeyRelation(
            'debts',
            'company_id',
            'companies',
            'id',
            'Relación debts.company_id → companies.id'
        );
        
        // Validar clients.id → debts.client_id (CRÍTICO)
        await this.validateForeignKeyRelation(
            'debts',
            'client_id',
            'clients',
            'id',
            'Relación debts.client_id → clients.id'
        );
        
        // Validar companies.id → clients.company_id
        await this.validateForeignKeyRelation(
            'clients',
            'company_id',
            'companies',
            'id',
            'Relación clients.company_id → companies.id'
        );
        
        // Validar debtors.id → debts.debtor_id
        await this.validateForeignKeyRelation(
            'debts',
            'debtor_id',
            'debtors',
            'id',
            'Relación debts.debtor_id → debtors.id'
        );
    }

    async validateForeignKeyRelation(fkTable, fkColumn, pkTable, pkColumn, relationName) {
        try {
            // Obtener todos los valores de la foreign key
            const { data: fkData, error: fkError } = await supabase
                .from(fkTable)
                .select(fkColumn)
                .not(fkColumn, 'is', null);
            
            if (fkError) {
                this.addResult('critical', relationName, fkError.message);
                return;
            }
            
            // Obtener todos los valores de la primary key
            const { data: pkData, error: pkError } = await supabase
                .from(pkTable)
                .select(pkColumn);
            
            if (pkError) {
                this.addResult('critical', relationName, pkError.message);
                return;
            }
            
            // Verificar datos huérfanos
            const validIds = new Set(pkData.map(item => item[pkColumn]));
            const orphanedRecords = fkData.filter(item => !validIds.has(item[fkColumn]));
            
            if (orphanedRecords.length > 0) {
                this.addResult('critical', relationName, 
                    `${orphanedRecords.length} registros huérfanos encontrados en ${fkTable}.${fkColumn}`);
            } else {
                this.addResult('valid', relationName, 'Relación válida - sin datos huérfanos');
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
        } else {
            this.addResult('valid', 'Deudas sin compañía', 'Todas las deudas tienen company_id');
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
        } else {
            this.addResult('valid', 'Clientes sin compañía', 'Todos los clientes tienen company_id');
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
        
        // Calcular porcentaje de salud
        const healthPercentage = this.results.summary.total > 0 
            ? Math.round((this.results.summary.valid / this.results.summary.total) * 100)
            : 0;
        
        console.log(`   🏥 Salud del sistema: ${healthPercentage}%`);
        
        // Detalles por categoría
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
        
        // Análisis por panel
        console.log('\n📈 ANÁLISIS POR PANEL:');
        this.analyzeByPanel();
        
        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (this.results.critical.length > 0) {
            console.log('   1. 🔥 CORREGIR ERRORES CRÍTICOS INMEDIATAMENTE');
            console.log('   2. 📋 Revisar foreign keys y constraints');
            console.log('   3. 🧹 Limpiar datos huérfanos');
            console.log('   4. 🔗 Validar relaciones client_id en debts');
        }
        
        if (this.results.warnings.length > 0) {
            console.log('   5. 🔍 Investigar advertencias para mejorar integridad');
        }
        
        if (this.results.critical.length === 0 && this.results.invalid.length === 0) {
            console.log('   🎉 Sistema en buen estado. Solo mantenimiento preventivo requerido.');
        }
        
        // Guardar reporte detallado
        this.saveDetailedReport();
        
        console.log('\n' + '='.repeat(80));
    }

    analyzeByPanel() {
        const panelStats = {
            admin: { valid: 0, invalid: 0, critical: 0, warnings: 0 },
            company: { valid: 0, invalid: 0, critical: 0, warnings: 0 },
            debtor: { valid: 0, invalid: 0, critical: 0, warnings: 0 }
        };
        
        // Agrupar resultados por panel
        ['valid', 'invalid', 'critical', 'warnings'].forEach(type => {
            this.results[type].forEach(item => {
                const panel = item.subject.split('.')[0];
                if (panelStats[panel]) {
                    panelStats[panel][type]++;
                }
            });
        });
        
        // Mostrar estadísticas por panel
        Object.entries(panelStats).forEach(([panel, stats]) => {
            const total = stats.valid + stats.invalid + stats.critical + stats.warnings;
            const health = total > 0 ? Math.round((stats.valid / total) * 100) : 0;
            const status = health >= 90 ? '🟢' : health >= 70 ? '🟡' : '🔴';
            
            console.log(`   ${status} ${panel.toUpperCase()}: ${health}% salud (${stats.valid}/${total} válidos)`);
            
            if (stats.critical > 0) {
                console.log(`      🚨 ${stats.critical} críticos`);
            }
            if (stats.warnings > 0) {
                console.log(`      ⚠️ ${stats.warnings} advertencias`);
            }
        });
    }

    saveDetailedReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            details: this.results,
            uiDatabaseMapping: this.uiDatabaseMapping
        };
        
        const filename = `ui-database-relations-report-${Date.now()}.json`;
        
        try {
            fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
            console.log(`📄 Reporte detallado guardado en: ${filename}`);
        } catch (error) {
            console.error('❌ Error guardando reporte:', error.message);
        }
    }
}

// Ejecutar validación
if (require.main === module) {
    const validator = new UIDatabaseRelationsValidator();
    validator.validateAllRelations().catch(console.error);
}

module.exports = UIDatabaseRelationsValidator;