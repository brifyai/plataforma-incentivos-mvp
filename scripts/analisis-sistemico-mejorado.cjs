const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Usar las credenciales del archivo .env que están funcionando en la app
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

class AnalisisSistemicoMejorado {
    constructor() {
        this.tablasBD = {};
        this.camposUI = {
            admin: {},
            empresa: {},
            deudor: {}
        };
        this.discrepancias = [];
        this.relaciones = [];
        this.tablasConocidas = [
            'users', 'companies', 'clients', 'debts', 'campaigns', 
            'proposals', 'agreements', 'payments', 'notifications',
            'analytics', 'messages', 'knowledge_base', 'ai_providers'
        ];
    }

    async analizarEstructuraCompletaBD() {
        console.log('🔍 PASO 1: Analizando estructura completa de la base de datos...');
        
        // Probar cada tabla conocida para ver si existe y obtener su estructura
        for (const tableName of this.tablasConocidas) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    if (error.message.includes('does not exist')) {
                        console.log(`❌ Tabla ${tableName}: NO EXISTE`);
                    } else if (error.message.includes('column')) {
                        // La tabla existe pero hay problemas de columnas
                        console.log(`⚠️ Tabla ${tableName}: EXISTE CON ERRORES DE COLUMNAS`);
                        this.tablasBD[tableName] = {
                            existe: true,
                            estado: 'CON_ERRORES',
                            error: error.message,
                            columnas: []
                        };
                    } else {
                        console.log(`⚠️ Tabla ${tableName}: ERROR DESCONOCIDO - ${error.message}`);
                    }
                } else {
                    // La tabla funciona correctamente
                    console.log(`✅ Tabla ${tableName}: FUNCIONANDO`);
                    
                    // Obtener las columnas de esta tabla
                    const columnas = data.length > 0 ? Object.keys(data[0]) : [];
                    
                    this.tablasBD[tableName] = {
                        existe: true,
                        estado: 'FUNCIONANDO',
                        columnas: columnas,
                        numColumnas: columnas.length,
                        tieneDatos: data.length > 0
                    };
                }
                
            } catch (e) {
                console.log(`❌ Error crítico analizando tabla ${tableName}: ${e.message}`);
                this.tablasBD[tableName] = {
                    existe: false,
                    estado: 'ERROR_CRITICO',
                    error: e.message
                };
            }
        }
        
        console.log(`\n📊 Resumen de análisis de BD:`);
        const funcionando = Object.values(this.tablasBD).filter(t => t.estado === 'FUNCIONANDO').length;
        const conErrores = Object.values(this.tablasBD).filter(t => t.estado === 'CON_ERRORES').length;
        const noExisten = Object.values(this.tablasBD).filter(t => t.estado === 'ERROR_CRITICO' || !t.existe).length;
        
        console.log(`   • Tablas funcionando: ${funcionando}`);
        console.log(`   • Tablas con errores: ${conErrores}`);
        console.log(`   • Tablas que no existen: ${noExisten}`);
        console.log(`   • Total analizadas: ${Object.keys(this.tablasBD).length}`);
    }

    extraerCamposDeArchivo(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const campos = new Set();
            
            // Patrones más precisos para encontrar campos
            const patrones = [
                // Form fields name
                /name\s*=\s*['"`]([^'"`]+)['"`]/g,
                // useState variables
                /const\s*\[([^]]+)\]\s*=\s*useState/g,
                // Object destructuring
                /{([^}]+)}/g,
                // Data binding expressions
                /\{([^}]+)\}/g,
                // Supabase queries
                /\.select\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
                // Input fields
                /placeholder\s*=\s*['"`]([^'"`]+)['"`]/g,
                // Form labels
                /<[^>]*>([^<]+)<\/[^>]*>/g,
                // Variable assignments
                /(\w+)\s*:\s*['"`]([^'"`]+)['"`]/g,
                // Object properties
                /(\w+)\.\s*(\w+)/g
            ];
            
            patrons.forEach(patron => {
                let match;
                while ((match = patron.exec(content)) !== null) {
                    for (let i = 1; i < match.length; i++) {
                        const campo = match[i];
                        if (campo && 
                            campo.length > 1 && 
                            !campo.includes(' ') && 
                            !campo.includes('<') && 
                            !campo.includes('>') &&
                            !campo.includes('(') &&
                            !campo.includes(')') &&
                            !campo.includes('{') &&
                            !campo.includes('}') &&
                            !campo.startsWith('const') &&
                            !campo.startsWith('function') &&
                            !campo.startsWith('return') &&
                            !campo.startsWith('if') &&
                            !campo.startsWith('else') &&
                            !campo.includes('=>') &&
                            !campo.includes('import') &&
                            !campo.includes('export')) {
                            campos.add(campo.trim());
                        }
                    }
                }
            });
            
            return Array.from(campos);
        } catch (e) {
            console.log(`⚠️ Error leyendo ${filePath}: ${e.message}`);
            return [];
        }
    }

    async analizarPaginasAdmin() {
        console.log('\n🔍 PASO 2: Analizando páginas del panel de administración...');
        
        const adminDir = path.join(__dirname, '..', 'src', 'pages', 'admin');
        
        try {
            const files = fs.readdirSync(adminDir);
            const jsxFiles = files.filter(file => file.endsWith('.jsx'));
            
            for (const file of jsxFiles) {
                const filePath = path.join(adminDir, file);
                const campos = this.extraerCamposDeArchivo(filePath);
                this.camposUI.admin[`admin/${file}`] = campos;
                console.log(`✅ Analizado admin/${file}: ${campos.length} campos encontrados`);
            }
        } catch (e) {
            console.log(`⚠️ Error analizando directorio admin: ${e.message}`);
        }
    }

    async analizarPaginasEmpresa() {
        console.log('\n🔍 PASO 3: Analizando páginas del panel de empresas...');
        
        const companyDir = path.join(__dirname, '..', 'src', 'pages', 'company');
        
        try {
            const files = fs.readdirSync(companyDir);
            const jsxFiles = files.filter(file => file.endsWith('.jsx'));
            
            for (const file of jsxFiles) {
                const filePath = path.join(companyDir, file);
                const campos = this.extraerCamposDeArchivo(filePath);
                this.camposUI.empresa[`company/${file}`] = campos;
                console.log(`✅ Analizado company/${file}: ${campos.length} campos encontrados`);
            }
        } catch (e) {
            console.log(`⚠️ Error analizando directorio company: ${e.message}`);
        }
    }

    async analizarPaginasDeudor() {
        console.log('\n🔍 PASO 4: Analizando páginas del panel de deudores/personas...');
        
        const debtorDir = path.join(__dirname, '..', 'src', 'pages', 'debtor');
        
        try {
            const files = fs.readdirSync(debtorDir);
            const jsxFiles = files.filter(file => file.endsWith('.jsx'));
            
            for (const file of jsxFiles) {
                const filePath = path.join(debtorDir, file);
                const campos = this.extraerCamposDeArchivo(filePath);
                this.camposUI.deudor[`debtor/${file}`] = campos;
                console.log(`✅ Analizado debtor/${file}: ${campos.length} campos encontrados`);
            }
        } catch (e) {
            console.log(`⚠️ Error analizando directorio debtor: ${e.message}`);
        }
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
        if (totalCamposUI > 0) {
            console.log(`   • Porcentaje de cobertura: ${((camposConRelacion/totalCamposUI)*100).toFixed(1)}%`);
        }
    }

    buscarRelacionConBD(campo) {
        // Buscar el campo en todas las tablas de la BD
        for (const [tabla, info] of Object.entries(this.tablasBD)) {
            if (info.columnas && info.columnas.length > 0) {
                for (const columna of info.columnas) {
                    // Búsqueda exacta
                    if (columna === campo) {
                        return { encontrada: true, tabla, columna: columna };
                    }
                    
                    // Búsqueda por similitud (snake_case vs camelCase)
                    if (this.sonSimilares(campo, columna)) {
                        return { encontrada: true, tabla, columna: columna, similar: true };
                    }
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
               campoUI === campoBD ||
               campoBDSnake.includes(campoUI.toLowerCase()) ||
               campoUI.toLowerCase().includes(campoBDSnake);
    }

    determinarSeveridad(campo) {
        const camposCriticos = [
            'name', 'email', 'phone', 'rut', 'address', 'company',
            'client', 'debt', 'payment', 'status', 'amount', 'date',
            'nombre', 'correo', 'telefono', 'empresa', 'cliente', 'deuda'
        ];
        
        const campoLower = campo.toLowerCase();
        
        if (camposCriticos.some(critico => campoLower.includes(critico))) {
            return 'ALTA';
        } else if (campoLower.includes('id') || campoLower.includes('type') || campoLower.includes('tipo')) {
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
                tablasFuncionando: Object.values(this.tablasBD).filter(t => t.estado === 'FUNCIONANDO').length,
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
        const reportePath = path.join(__dirname, '..', 'reporte-analisis-sistemico-mejorado.json');
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
        
        // Análisis de tablas faltantes
        const tablasFaltantes = Object.entries(this.tablasBD)
            .filter(([nombre, info]) => info.estado === 'ERROR_CRITICO' || !info.existe)
            .map(([nombre]) => nombre);
        
        if (tablasFaltantes.length > 0) {
            recomendaciones.push({
                prioridad: 'URGENTE',
                accion: 'Crear tablas faltantes en la base de datos',
                tablas: tablasFaltantes,
                impacto: 'Tablas críticas que no existen pueden causar errores graves en la aplicación'
            });
        }
        
        // Análisis de tablas con errores
        const tablasConErrores = Object.entries(this.tablasBD)
            .filter(([nombre, info]) => info.estado === 'CON_ERRORES')
            .map(([nombre, info]) => ({ nombre, error: info.error }));
        
        if (tablasConErrores.length > 0) {
            recomendaciones.push({
                prioridad: 'URGENTE',
                accion: 'Corregir errores de columnas en tablas existentes',
                tablas: tablasConErrores,
                impacto: 'Errores de columnas impiden el funcionamiento correcto de las tablas'
            });
        }
        
        // Análisis de discrepancias UI-BD
        if (this.discrepancias.length > 0) {
            const altaSeveridad = this.discrepancias.filter(d => d.severidad === 'ALTA');
            
            if (altaSeveridad.length > 0) {
                recomendaciones.push({
                    prioridad: 'ALTA',
                    accion: 'Crear columnas faltantes para campos UI críticos',
                    campos: altaSeveridad.map(d => d.campoUI),
                    impacto: 'Campos UI críticos sin columna BD causarán errores al guardar datos'
                });
            }
        }
        
        // Recomendaciones generales
        recomendaciones.push({
            prioridad: 'MEDIA',
            accion: 'Implementar validación automática UI-BD',
            descripcion: 'Crear un sistema que verifique que cada campo UI tenga su correspondiente campo BD antes del despliegue'
        });
        
        recomendaciones.push({
            prioridad: 'BAJA',
            accion: 'Documentar mapeo completo UI-BD',
            descripcion: 'Crear documentación detallada de todas las relaciones entre componentes y tablas'
        });
        
        return recomendaciones;
    }

    generarReporteMarkdown(reporte) {
        let markdown = `# 📊 ANÁLISIS SISTÉMICO COMPLETO NEXUPAY - MEJORADO\n\n`;
        markdown += `**Fecha:** ${new Date(reporte.fecha).toLocaleString()}\n\n`;
        
        markdown += `## 📈 RESUMEN EJECUTIVO\n\n`;
        markdown += `- **Tablas en BD:** ${reporte.resumen.totalTablasBD} (${reporte.resumen.tablasFuncionando} funcionando)\n`;
        markdown += `- **Archivos UI analizados:** ${reporte.resumen.totalArchivosUI}\n`;
        markdown += `- **Campos UI totales:** ${reporte.resumen.totalCamposUI}\n`;
        markdown += `- **Relaciones correctas:** ${reporte.resumen.totalRelaciones}\n`;
        markdown += `- **Discrepancias encontradas:** ${reporte.resumen.totalDiscrepancias}\n`;
        if (reporte.resumen.totalCamposUI > 0) {
            markdown += `- **Cobertura:** ${((reporte.resumen.totalRelaciones/reporte.resumen.totalCamposUI)*100).toFixed(1)}%\n`;
        }
        markdown += `\n`;
        
        markdown += `## 🗄️ ESTADO DE TABLAS DE BASE DE DATOS\n\n`;
        
        Object.entries(reporte.estructuraBD).forEach(([tabla, info]) => {
            const emoji = info.estado === 'FUNCIONANDO' ? '✅' : 
                        info.estado === 'CON_ERRORES' ? '⚠️' : '❌';
            markdown += `${emoji} **${tabla}**: ${info.estado}\n`;
            if (info.columnas && info.columnas.length > 0) {
                markdown += `   - Columnas: ${info.columnas.join(', ')}\n`;
            }
            if (info.error) {
                markdown += `   - Error: ${info.error}\n`;
            }
            markdown += `\n`;
        });
        
        markdown += `## 🚨 DISCREPANCIAS POR SEVERIDAD\n\n`;
        markdown += `- **ALTA:** ${reporte.analisisPorSeveridad.ALTA} campos críticos sin relación BD\n`;
        markdown += `- **MEDIA:** ${reporte.analisisPorSeveridad.MEDIA} campos importantes sin relación BD\n`;
        markdown += `- **BAJA:** ${reporte.analisisPorSeveridad.BAJA} campos secundarios sin relación BD\n\n`;
        
        if (reporte.discrepancias.length > 0) {
            markdown += `## ❌ LISTADO DE DISCREPANCIAS CRÍTICAS\n\n`;
            
            const discrepanciasPorSeveridad = {
                ALTA: reporte.discrepancias.filter(d => d.severidad === 'ALTA'),
                MEDIA: reporte.discrepancias.filter(d => d.severidad === 'MEDIA'),
                BAJA: reporte.discrepancias.filter(d => d.severidad === 'BAJA')
            };
            
            Object.entries(discrepanciasPorSeveridad).forEach(([severidad, discrepancias]) => {
                if (discrepancias.length > 0 && severidad === 'ALTA') {
                    markdown += `### ${severidad} SEVERIDAD\n\n`;
                    discrepancias.slice(0, 20).forEach(d => { // Limitar a 20 para no hacer el reporte muy largo
                        markdown += `- **${d.campoUI}** (${d.archivo})\n`;
                        markdown += `  \`${d.descripcion}\`\n\n`;
                    });
                    if (discrepancias.length > 20) {
                        markdown += `*... y ${discrepancias.length - 20} más*\n\n`;
                    }
                }
            });
        }
        
        markdown += `## 🎯 RECOMENDACIONES\n\n`;
        reporte.recomendaciones.forEach((rec, index) => {
            markdown += `${index + 1}. **${rec.prioridad}:** ${rec.accion}\n`;
            if (rec.descripcion) markdown += `   - ${rec.descripcion}\n`;
            if (rec.tablas) markdown += `   - Tablas afectadas: ${rec.tablas.join(', ')}\n`;
            if (rec.campos) markdown += `   - Campos afectados: ${rec.campos.slice(0, 10).join(', ')}${rec.campos.length > 10 ? '...' : ''}\n`;
            if (rec.impacto) markdown += `   - Impacto: ${rec.impacto}\n`;
            markdown += `\n`;
        });
        
        const reportePath = path.join(__dirname, '..', 'ANALISIS_SISTEMICO_MEJORADO.md');
        fs.writeFileSync(reportePath, markdown);
        
        console.log(`✅ Reporte Markdown guardado en: ${reportePath}`);
    }

    async ejecutarAnalisisCompleto() {
        console.log('🚀 INICIANDO ANÁLISIS SISTÉMICO MEJORADO DE NEXUPAY');
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
            console.log(`📊 Tablas funcionando: ${reporte.resumen.tablasFuncionando}/${reporte.resumen.totalTablasBD}`);
            console.log(`📊 Discrepancias encontradas: ${reporte.resumen.totalDiscrepancias}`);
            console.log(`📊 Campos UI analizados: ${reporte.resumen.totalCamposUI}`);
            console.log(`📋 Reportes generados: reporte-analisis-sistemico-mejorado.json, ANALISIS_SISTEMICO_MEJORADO.md`);
            
            return reporte;
            
        } catch (error) {
            console.error('❌ Error en análisis sistemático:', error);
            throw error;
        }
    }
}

// Ejecutar el análisis
const analisis = new AnalisisSistemicoMejorado();
analisis.ejecutarAnalisisCompleto().catch(console.error);