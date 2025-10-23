const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Usar las credenciales del archivo .env que están funcionando en la app
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

class AnalisisSistemicoCompleto {
    constructor() {
        this.tablasBD = {};
        this.camposUI = {
            admin: {},
            empresa: {},
            deudor: {}
        };
        this.discrepancias = [];
        this.relaciones = [];
    }

    async analizarEstructuraCompletaBD() {
        console.log('🔍 PASO 1: Analizando estructura completa de la base de datos...');
        
        try {
            // Obtener todas las tablas del esquema público
            const { data: tablas, error: tablasError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .neq('table_name', '_pg_stat_statements')
                .order('table_name');
            
            if (tablasError) {
                console.error('❌ Error obteniendo tablas:', tablasError);
                return;
            }
            
            console.log(`📊 Encontradas ${tablas.length} tablas en la base de datos`);
            
            // Para cada tabla, obtener sus columnas
            for (const tabla of tablas) {
                const tableName = tabla.table_name;
                
                try {
                    const { data: columnas, error: columnasError } = await supabase
                        .from('information_schema.columns')
                        .select('column_name, data_type, is_nullable, column_default')
                        .eq('table_schema', 'public')
                        .eq('table_name', tableName)
                        .order('ordinal_position');
                    
                    if (columnasError) {
                        console.error(`❌ Error obteniendo columnas de ${tableName}:`, columnasError);
                        continue;
                    }
                    
                    this.tablasBD[tableName] = {
                        columnas: columnas,
                        numColumnas: columnas.length
                    };
                    
                    console.log(`✅ Tabla ${tableName}: ${columnas.length} columnas`);
                    
                } catch (e) {
                    console.error(`❌ Error crítico analizando tabla ${tableName}:`, e.message);
                }
            }
            
            console.log(`📋 Estructura BD analizada: ${Object.keys(this.tablasBD).length} tablas procesadas`);
            
        } catch (error) {
            console.error('❌ Error crítico en análisis de BD:', error);
        }
    }

    async analizarPaginasAdmin() {
        console.log('\n🔍 PASO 2: Analizando páginas del panel de administración...');
        
        const adminPages = [
            'src/pages/admin/AdminDashboardSprint3.jsx',
            'src/pages/admin/CompanyVerificationDashboard.jsx'
        ];
        
        for (const page of adminPages) {
            try {
                const content = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
                const campos = this.extraerCamposDeComponente(content, page);
                this.camposUI.admin[page] = campos;
                console.log(`✅ Analizado ${page}: ${campos.length} campos encontrados`);
            } catch (e) {
                console.log(`⚠️ No se pudo leer ${page}: ${e.message}`);
            }
        }
    }

    async analizarPaginasEmpresa() {
        console.log('\n🔍 PASO 3: Analizando páginas del panel de empresas...');
        
        const companyDir = path.join(__dirname, '..', 'src', 'pages', 'company');
        
        try {
            const files = fs.readdirSync(companyDir);
            const jsxFiles = files.filter(file => file.endsWith('.jsx'));
            
            for (const file of jsxFiles) {
                try {
                    const filePath = path.join(companyDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const campos = this.extraerCamposDeComponente(content, `company/${file}`);
                    this.camposUI.empresa[`company/${file}`] = campos;
                    console.log(`✅ Analizado company/${file}: ${campos.length} campos encontrados`);
                } catch (e) {
                    console.log(`⚠️ No se pudo analizar company/${file}: ${e.message}`);
                }
            }
        } catch (e) {
            console.error('❌ Error leyendo directorio company:', e.message);
        }
    }

    async analizarPaginasDeudor() {
        console.log('\n🔍 PASO 4: Analizando páginas del panel de deudores/personas...');
        
        const debtorDir = path.join(__dirname, '..', 'src', 'pages', 'debtor');
        
        try {
            const files = fs.readdirSync(debtorDir);
            const jsxFiles = files.filter(file => file.endsWith('.jsx'));
            
            for (const file of jsxFiles) {
                try {
                    const filePath = path.join(debtorDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const campos = this.extraerCamposDeComponente(content, `debtor/${file}`);
                    this.camposUI.deudor[`debtor/${file}`] = campos;
                    console.log(`✅ Analizado debtor/${file}: ${campos.length} campos encontrados`);
                } catch (e) {
                    console.log(`⚠️ No se pudo analizar debtor/${file}: ${e.message}`);
                }
            }
        } catch (e) {
            console.error('❌ Error leyendo directorio debtor:', e.message);
        }
    }

    extraerCamposDeComponente(content, archivo) {
        const campos = [];
        
        // Patrones para encontrar campos en el código
        const patrones = [
            // Form fields
            /name=['"`]([^'"`]+)['"`]/g,
            // useState variables
            /const\s+\[*(\w+)\]*\s*=/g,
            // Variables en objetos
            /(\w+):\s*['"`]([^'"`]+)['"`]/g,
            // Referencias a datos
            /data\.(\w+)/g,
            /item\.(\w+)/g,
            /user\.(\w+)/g,
            /company\.(\w+)/g,
            /client\.(\w+)/g,
            /debt\.(\w+)/g,
            // Supabase select fields
            /\.select\(['"`]([^'"`]+)['"`]\)/g,
            // Input placeholders y labels
            /placeholder=['"`]([^'"`]+)['"`]/g,
            /label[^>]*>([^<]+)</g
        ];
        
        const camposEncontrados = new Set();
        
        patrons.forEach(patron => {
            let match;
            while ((match = patron.exec(content)) !== null) {
                const campo = match[1] || match[2];
                if (campo && campo.length > 1 && !campo.includes(' ') && !campo.includes('<')) {
                    camposEncontrados.add(campo);
                }
            }
        });
        
        return Array.from(camposEncontrados);
    }

    async analizarRelacionesUIBD() {
        console.log('\n🔍 PASO 5: Analizando relaciones UI-BD campo por campo...');
        
        let totalCamposUI = 0;
        let camposConRelacion = 0;
        let camposSinRelacion = 0;
        
        // Analizar todos los campos UI encontrados
        const todosLosCampos = {
            ...this.camposUI.admin,
            ...this.camposUI.empresa,
            ...this.camposUI.deudor
        };
        
        for (const [archivo, campos] of Object.entries(todosLosCampos)) {
            totalCamposUI += campos.length;
            
            for (const campo of campos) {
                const relacion = this.buscarRelacionConBD(campo);
                
                if (relacion.encontrada) {
                    camposConRelacion++;
                    this.relaciones.push({
                        campoUI: campo,
                        archivo: archivo,
                        tablaBD: relacion.tabla,
                        columnaBD: relacion.columna,
                        tipo: 'CORRECTA'
                    });
                } else {
                    camposSinRelacion++;
                    this.discrepancias.push({
                        tipo: 'CAMPO_SIN_RELACION_BD',
                        campoUI: campo,
                        archivo: archivo,
                        severidad: this.determinarSeveridad(campo),
                        descripcion: `El campo "${campo}" no tiene correspondencia en ninguna tabla de la base de datos`
                    });
                }
            }
        }
        
        console.log(`📊 Resultados del análisis:`);
        console.log(`   • Total campos UI analizados: ${totalCamposUI}`);
        console.log(`   • Campos con relación BD: ${camposConRelacion}`);
        console.log(`   • Campos sin relación BD: ${camposSinRelacion}`);
        console.log(`   • Porcentaje de cobertura: ${((camposConRelacion/totalCamposUI)*100).toFixed(1)}%`);
    }

    buscarRelacionConBD(campo) {
        // Buscar el campo en todas las tablas de la BD
        for (const [tabla, info] of Object.entries(this.tablasBD)) {
            for (const columna of info.columnas) {
                // Búsqueda exacta
                if (columna.column_name === campo) {
                    return { encontrada: true, tabla, columna: columna.column_name };
                }
                
                // Búsqueda por similitud (snake_case vs camelCase)
                if (this.sonSimilares(campo, columna.column_name)) {
                    return { encontrada: true, tabla, columna: columna.column_name, similar: true };
                }
            }
        }
        
        return { encontrada: false };
    }

    sonSimilares(campoUI, campoBD) {
        // Convertir camelCase a snake_case
        const campoUISnake = campoUI.replace(/([A-Z])/g, '_$1').toLowerCase();
        const campoBDSnake = campoBD.toLowerCase();
        
        return campoUISnake === campoBDSnake || 
               campoUI.toLowerCase() === campoBDSnake ||
               campoUI === campoBD;
    }

    determinarSeveridad(campo) {
        const camposCriticos = [
            'name', 'email', 'phone', 'rut', 'address', 'company',
            'client', 'debt', 'payment', 'status', 'amount', 'date'
        ];
        
        const campoLower = campo.toLowerCase();
        
        if (camposCriticos.some(critico => campoLower.includes(critico))) {
            return 'ALTA';
        } else if (campoLower.includes('id') || campoLower.includes('type')) {
            return 'MEDIA';
        } else {
            return 'BAJA';
        }
    }

    async generarReporteCompleto() {
        console.log('\n📋 PASO 6: Generando reporte completo...');
        
        const reporte = {
            fecha: new Date().toISOString(),
            resumen: {
                totalTablasBD: Object.keys(this.tablasBD).length,
                totalArchivosUI: Object.keys({...this.camposUI.admin, ...this.camposUI.empresa, ...this.camposUI.deudor}).length,
                totalCamposUI: Object.values({...this.camposUI.admin, ...this.camposUI.empresa, ...this.camposUI.deudor}).reduce((sum, campos) => sum + campos.length, 0),
                totalRelaciones: this.relaciones.length,
                totalDiscrepancias: this.discrepancias.length
            },
            estructuraBD: this.tablasBD,
            camposUI: this.camposUI,
            relaciones: this.relaciones,
            discrepancias: this.discrepancias,
            analisisPorSeveridad: this.analizarPorSeveridad(),
            recomendaciones: this.generarRecomendaciones()
        };
        
        // Guardar reporte en archivo JSON
        const reportePath = path.join(__dirname, '..', 'reporte-analisis-sistemico-completo.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        
        console.log(`✅ Reporte completo guardado en: ${reportePath}`);
        
        // Generar reporte legible en Markdown
        this.generarReporteMarkdown(reporte);
        
        return reporte;
    }

    analizarPorSeveridad() {
        const analisis = {
            ALTA: this.discrepancias.filter(d => d.severidad === 'ALTA').length,
            MEDIA: this.discrepancias.filter(d => d.severidad === 'MEDIA').length,
            BAJA: this.discrepancias.filter(d => d.severidad === 'BAJA').length
        };
        
        return analisis;
    }

    generarRecomendaciones() {
        const recomendaciones = [];
        
        if (this.discrepancias.length > 0) {
            const altaSeveridad = this.discrepancias.filter(d => d.severidad === 'ALTA');
            
            if (altaSeveridad.length > 0) {
                recomendaciones.push({
                    prioridad: 'URGENTE',
                    accion: 'Crear migraciones para campos críticos faltantes',
                    campos: altaSeveridad.map(d => d.campoUI),
                    impacto: 'Los campos críticos sin relación BD pueden causar errores graves'
                });
            }
            
            recomendaciones.push({
                prioridad: 'ALTA',
                accion: 'Implementar validación automática UI-BD',
                descripcion: 'Crear un sistema que verifique que cada campo UI tenga su correspondiente campo BD antes del despliegue'
            });
            
            recomendaciones.push({
                prioridad: 'MEDIA',
                accion: 'Documentar mapeo completo UI-BD',
                descripcion: 'Crear documentación detallada de todas las relaciones entre componentes y tablas'
            });
        }
        
        if (this.relaciones.length > 0) {
            recomendaciones.push({
                prioridad: 'BAJA',
                accion: 'Optimizar relaciones existentes',
                descripcion: 'Revisar y optimizar las relaciones correctas para mejorar rendimiento'
            });
        }
        
        return recomendaciones;
    }

    generarReporteMarkdown(reporte) {
        let markdown = `# 📊 ANÁLISIS SISTÉMICO COMPLETO NEXUPAY\n\n`;
        markdown += `**Fecha:** ${new Date(reporte.fecha).toLocaleString()}\n\n`;
        
        markdown += `## 📈 RESUMEN EJECUTIVO\n\n`;
        markdown += `- **Tablas en BD:** ${reporte.resumen.totalTablasBD}\n`;
        markdown += `- **Archivos UI analizados:** ${reporte.resumen.totalArchivosUI}\n`;
        markdown += `- **Campos UI totales:** ${reporte.resumen.totalCamposUI}\n`;
        markdown += `- **Relaciones correctas:** ${reporte.resumen.totalRelaciones}\n`;
        markdown += `- **Discrepancias encontradas:** ${reporte.resumen.totalDiscrepancias}\n`;
        markdown += `- **Cobertura:** ${((reporte.resumen.totalRelaciones/reporte.resumen.totalCamposUI)*100).toFixed(1)}%\n\n`;
        
        markdown += `## 🚨 DISCREPANCIAS POR SEVERIDAD\n\n`;
        markdown += `- **ALTA:** ${reporte.analisisPorSeveridad.ALTA} campos críticos sin relación BD\n`;
        markdown += `- **MEDIA:** ${reporte.analisisPorSeveridad.MEDIA} campos importantes sin relación BD\n`;
        markdown += `- **BAJA:** ${reporte.analisisPorSeveridad.BAJA} campos secundarios sin relación BD\n\n`;
        
        if (reporte.discrepancias.length > 0) {
            markdown += `## ❌ LISTADO DE DISCREPANCIAS\n\n`;
            
            const discrepanciasPorSeveridad = {
                ALTA: reporte.discrepancias.filter(d => d.severidad === 'ALTA'),
                MEDIA: reporte.discrepancias.filter(d => d.severidad === 'MEDIA'),
                BAJA: reporte.discrepancias.filter(d => d.severidad === 'BAJA')
            };
            
            Object.entries(discrepanciasPorSeveridad).forEach(([severidad, discrepancias]) => {
                if (discrepancias.length > 0) {
                    markdown += `### ${severidad} SEVERIDAD\n\n`;
                    discrepancias.forEach(d => {
                        markdown += `- **${d.campoUI}** (${d.archivo})\n`;
                        markdown += `  \`${d.descripcion}\`\n\n`;
                    });
                }
            });
        }
        
        markdown += `## 🎯 RECOMENDACIONES\n\n`;
        reporte.recomendaciones.forEach((rec, index) => {
            markdown += `${index + 1}. **${rec.prioridad}:** ${rec.accion}\n`;
            if (rec.descripcion) markdown += `   - ${rec.descripcion}\n`;
            if (rec.campos) markdown += `   - Campos afectados: ${rec.campos.join(', ')}\n`;
            markdown += `\n`;
        });
        
        const reportePath = path.join(__dirname, '..', 'ANALISIS_SISTEMICO_COMPLETO.md');
        fs.writeFileSync(reportePath, markdown);
        
        console.log(`✅ Reporte Markdown guardado en: ${reportePath}`);
    }

    async ejecutarAnalisisCompleto() {
        console.log('🚀 INICIANDO ANÁLISIS SISTÉMICO COMPLETO DE NEXUPAY');
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        try {
            await this.analizarEstructuraCompletaBD();
            await this.analizarPaginasAdmin();
            await this.analizarPaginasEmpresa();
            await this.analizarPaginasDeudor();
            await this.analizarRelacionesUIBD();
            
            const reporte = await this.generarReporteCompleto();
            
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            console.log('\n🎉 ANÁLISIS COMPLETADO');
            console.log(`⏱️ Duración: ${duration} segundos`);
            console.log(`📊 Discrepancias encontradas: ${reporte.resumen.totalDiscrepancias}`);
            console.log(`📋 Reportes generados: reporte-analisis-sistemico-completo.json, ANALISIS_SISTEMICO_COMPLETO.md`);
            
            return reporte;
            
        } catch (error) {
            console.error('❌ Error en análisis sistemático:', error);
            throw error;
        }
    }
}

// Ejecutar el análisis
const analisis = new AnalisisSistemicoCompleto();
analisis.ejecutarAnalisisCompleto().catch(console.error);