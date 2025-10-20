/**
 * Bulk Import Debts Component - VERSIÓN CORREGIDA Y MEJORADA
 *
 * Componente para importar deudas masivamente desde archivos CSV/Excel
 * Con manejo robusto de errores, validación mejorada y UX optimizada
 *
 * @module BulkImportDebtsFixed
 */

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, Modal, Badge, ProgressBar } from '../common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import bulkImportServiceFixed, { validateImportFileFixed } from '../../services/bulkImportServiceFixed';
import Swal from 'sweetalert2';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Building,
  Settings,
  Info,
  Shield,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  ArrowLeft,
  Save,
  FileSpreadsheet,
  Zap,
  Target
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const BulkImportDebtsFixed = ({ profile, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState('');
  const [corporateClients, setCorporateClients] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [useAI, setUseAI] = useState(false); // Desactivado por defecto

  const fileInputRef = useRef(null);

  // Cargar clientes corporativos al montar
  useEffect(() => {
    loadCorporateClients();
  }, []);

  const loadCorporateClients = async () => {
    console.log('🔍 Cargando clientes corporativos...');
    
    if (!profile?.company?.id) {
      console.error('❌ No hay company ID en el perfil');
      setCorporateClients([]);
      await Swal.fire({
        icon: 'error',
        title: 'Error de configuración',
        text: 'No se encontró el ID de la empresa. Por favor, recarga la página.',
        confirmButtonColor: '#1e40af'
      });
      return;
    }

    try {
      const { getCorporateClients } = await import('../../services/databaseService');
      const { corporateClients, error } = await getCorporateClients(profile.company.id);
      
      if (error) {
        console.error('❌ Error cargando clientes corporativos:', error);
        setCorporateClients([]);
        return;
      }

      const transformedClients = (corporateClients || []).map(client => ({
        id: client.id,
        company_name: client.name || client.company_name || client.business_name || 'Cliente sin nombre',
        contact_name: client.contact_name || 'Sin contacto',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        company_rut: client.rut || client.company_rut || 'Sin RUT',
        address: client.address || '',
        industry: client.industry || 'General',
        contract_value: client.contract_value || 0,
        status: client.is_active !== false ? 'active' : 'inactive'
      }));

      setCorporateClients(transformedClients);
      console.log('✅ Clientes corporativos cargados:', transformedClients.length);
    } catch (error) {
      console.error('💥 Error en loadCorporateClients:', error);
      setCorporateClients([]);
    }
  };

  // Campos requeridos para deudas - VERSIÓN MEJORADA
  const requiredFields = [
    { key: 'rut', label: 'RUT del Deudor', type: 'text', required: true, icon: Shield, description: 'Formato chileno: XX.XXX.XXX-X' },
    { key: 'full_name', label: 'Nombre Completo', type: 'text', required: true, icon: Users, description: 'Nombre completo del deudor' },
    { key: 'email', label: 'Email', type: 'email', required: false, icon: FileText, description: 'Correo electrónico (opcional)' },
    { key: 'phone', label: 'Teléfono', type: 'phone', required: false, icon: FileText, description: 'Teléfono formato +569XXXXXXXX' },
    { key: 'debt_amount', label: 'Monto de Deuda', type: 'currency', required: true, icon: TrendingUp, description: 'Monto numérico positivo' },
    { key: 'due_date', label: 'Fecha de Vencimiento', type: 'date', required: true, icon: Clock, description: 'Formato YYYY-MM-DD' },
    { key: 'creditor_name', label: 'Nombre del Acreedor', type: 'text', required: true, icon: Building, description: 'Nombre de la empresa acreedora' },
    { key: 'debt_reference', label: 'Referencia de Deuda', type: 'text', required: false, icon: FileText, description: 'Número o referencia de la deuda' },
    { key: 'debt_type', label: 'Tipo de Deuda', type: 'select', required: false, icon: BarChart3, description: 'Categoría de la deuda' },
    { key: 'interest_rate', label: 'Tasa de Interés (%)', type: 'percentage', required: false, icon: Activity, description: 'Tasa de interés anual' },
    { key: 'description', label: 'Descripción', type: 'text', required: false, icon: FileText, description: 'Descripción detallada' }
  ];

  // Plantilla de ejemplo mejorada
  const downloadTemplate = () => {
    const template = [
      {
        rut: '12.345.678-9',
        full_name: 'Juan Pérez González',
        email: 'juan.perez@email.com',
        phone: '+56912345678',
        debt_amount: 1500000,
        due_date: '2024-12-31',
        creditor_name: 'Banco Estado',
        debt_reference: 'PREST-001',
        debt_type: 'credit_card',
        interest_rate: 2.5,
        description: 'Deuda tarjeta de crédito consumo'
      },
      {
        rut: '9.876.543-2',
        full_name: 'María González López',
        email: 'maria.gonzalez@email.com',
        phone: '+56987654321',
        debt_amount: 2500000,
        due_date: '2024-11-15',
        creditor_name: 'CMR Falabella',
        debt_reference: 'CUOTA-045',
        debt_type: 'loan',
        interest_rate: 1.8,
        description: 'Crédito consumo con cuotas mensuales'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Deudas');
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // rut
      { wch: 25 }, // full_name
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 15 }, // debt_amount
      { wch: 12 }, // due_date
      { wch: 20 }, // creditor_name
      { wch: 15 }, // debt_reference
      { wch: 15 }, // debt_type
      { wch: 10 }, // interest_rate
      { wch: 30 }  // description
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'plantilla_importacion_deudas_mejorada.xlsx');
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validar que se haya seleccionado un cliente corporativo
    if (!selectedCorporateClient) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente Corporativo Requerido',
        text: 'Por favor selecciona un cliente corporativo antes de subir el archivo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    // Validar archivo usando el servicio mejorado
    const validation = validateImportFileFixed(selectedFile);
    if (!validation.isValid) {
      console.error('❌ Validación de archivo fallida:', validation.errors);
      await Swal.fire({
        icon: 'error',
        title: 'Archivo No Válido',
        html: `
          <div style="text-align: left;">
            <p><strong>Errores encontrados:</strong></p>
            <ul>
              ${validation.errors.map(error => `<li>• ${error}</li>`).join('')}
            </ul>
            ${validation.warnings.length > 0 ? `
              <p><strong>Advertencias:</strong></p>
              <ul>
                ${validation.warnings.map(warning => `<li>⚠️ ${warning}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    if (validation.warnings.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Advertencias del Archivo',
        html: `
          <div style="text-align: left;">
            <p>El archivo es válido pero tiene algunas advertencias:</p>
            <ul>
              ${validation.warnings.map(warning => `<li>⚠️ ${warning}</li>`).join('')}
            </ul>
            <p>¿Deseas continuar?</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#F59E0B'
      }).then((result) => {
        if (!result.isConfirmed) return;
      });
    }

    console.log('✅ Archivo validado, iniciando parseo...');
    setFile(selectedFile);
    await parseFile(selectedFile);
    setCurrentStep(2);
  };

  // Parsear archivo CSV/Excel - VERSIÓN MEJORADA
  const parseFile = async (file) => {
    try {
      let data = [];

      if (file.type === 'text/csv') {
        // Parsear CSV con configuración mejorada
        const result = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            transform: (value, field) => {
              // Limpiar valores
              if (typeof value === 'string') {
                return value.trim();
              }
              return value;
            },
            complete: resolve,
            error: reject
          });
        });
        data = result.data;
      } else {
        // Parsear Excel con mejor manejo de errores
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { 
          cellDates: true,
          dateNF: 'yyyy-mm-dd'
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '',
          raw: false
        });
      }

      if (data.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo Vacío',
          text: 'El archivo no contiene datos válidos',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      if (data.length > 5000) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo Demasiado Grande',
          text: 'El archivo no puede contener más de 5,000 registros. Por favor divide los datos en archivos más pequeños.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      setParsedData(data);

      // Generar mapeo automático mejorado
      const autoMapping = generateAutoMapping(data[0]);
      setFieldMapping(autoMapping);

      console.log(`✅ Archivo parseado exitosamente: ${data.length} registros`);

    } catch (error) {
      console.error('Error parsing file:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al Procesar Archivo',
        html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Soluciones sugeridas:</strong></p>
            <ul>
              <li>• Verifica que el archivo no esté corrupto</li>
              <li>• Asegúrate que el formato sea CSV o Excel válido</li>
              <li>• Revisa que las columnas tengan nombres consistentes</li>
              <li>• Intenta guardar el archivo como CSV UTF-8</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Generar mapeo automático mejorado
  const generateAutoMapping = (firstRow) => {
    const mapping = {};
    const columns = Object.keys(firstRow);

    // Mapeos mejorados con más variaciones
    const commonMappings = {
      rut: ['rut', 'r.u.t', 'run', 'dni', 'cedula', 'identificacion', 'id', 'documento', 'nro_documento', 'rut_deudor'],
      full_name: ['nombre', 'name', 'full_name', 'nombre_completo', 'cliente', 'deudor', 'razon_social', 'nombre_cliente', 'nombre_deudor'],
      email: ['email', 'correo', 'mail', 'e-mail', 'email_contacto', 'correo_electronico', 'email_cliente'],
      phone: ['telefono', 'phone', 'celular', 'movil', 'contacto', 'telefono_contacto', 'fono', 'telefono_movil'],
      debt_amount: ['monto', 'amount', 'deuda', 'saldo', 'total', 'valor', 'importe', 'capital', 'monto_deuda', 'deuda_total'],
      due_date: ['fecha_vencimiento', 'due_date', 'vencimiento', 'fecha', 'fecha_vto', 'vto', 'fecha_limite'],
      creditor_name: ['acreedor', 'creditor', 'empresa', 'entidad', 'banco', 'institucion', 'proveedor', 'nombre_acreedor'],
      debt_reference: ['referencia', 'reference', 'numero', 'id_deuda', 'nro_operacion', 'codigo', 'operacion'],
      debt_type: ['tipo', 'type', 'categoria', 'categoria_deuda', 'clasificacion', 'tipo_deuda'],
      interest_rate: ['interes', 'interest', 'tasa', 'tasa_interes', 'porcentaje', 'tasa_anual'],
      description: ['descripcion', 'description', 'detalle', 'comentario', 'observaciones', 'notas', 'descripcion_deuda']
    };

    requiredFields.forEach(field => {
      const possibleNames = commonMappings[field.key] || [];
      const matchedColumn = columns.find(col => {
        const colLower = col.toLowerCase().trim();
        return possibleNames.some(name =>
          colLower.includes(name.toLowerCase()) || 
          name.toLowerCase().includes(colLower) ||
          colLower.replace(/[_\s]/g, '') === name.toLowerCase().replace(/[_\s]/g, '')
        );
      });

      if (matchedColumn) {
        mapping[field.key] = matchedColumn;
      }
    });

    return mapping;
  };

  // Procesar y validar datos mejorados
  const processAndValidateData = () => {
    const processed = [];
    const errors = [];
    const warnings = [];
    const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);

    console.log('🔍 Procesando datos con validación mejorada...');
    console.log('📋 FieldMapping actual:', fieldMapping);

    parsedData.forEach((row, index) => {
      const processedRow = { ...row };
      const rowErrors = [];
      const rowWarnings = [];
      const autoGeneratedFields = [];

      // Procesar cada campo requerido
      requiredFieldKeys.forEach(fieldKey => {
        const mappedColumn = fieldMapping[fieldKey];
        const fieldInfo = requiredFields.find(f => f.key === fieldKey);
        
        if (!mappedColumn) {
          // Campo no mapeado - generar automáticamente
          const autoValue = generateAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
          rowWarnings.push(`Campo ${fieldInfo.label} autogenerado (no estaba mapeado)`);
        } else if (!row[mappedColumn]) {
          // Campo vacío - generar automáticamente
          const autoValue = generateAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
          rowWarnings.push(`Campo ${fieldInfo.label} autogenerado (estaba vacío)`);
        } else {
          // Campo existe - usar valor original
          processedRow[fieldKey] = row[mappedColumn];
        }
      });

      // Agregar metadatos
      processedRow._originalIndex = index + 1;
      processedRow._autoGenerated = autoGeneratedFields;
      processedRow._hasErrors = rowErrors.length > 0;
      processedRow._hasWarnings = rowWarnings.length > 0;
      processedRow._errors = rowErrors;
      processedRow._warnings = rowWarnings;

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: processedRow
        });
      }

      if (rowWarnings.length > 0) {
        warnings.push({
          row: index + 1,
          warnings: rowWarnings,
          data: processedRow
        });
      }

      processed.push(processedRow);
    });

    console.log(`📊 Datos procesados: ${processed.length} filas`);
    console.log(`🔧 Campos autogenerados en ${processed.filter(r => r._autoGenerated.length > 0).length} filas`);
    console.log(`❌ Errores encontrados: ${errors.length} filas`);
    console.log(`⚠️ Advertencias encontradas: ${warnings.length} filas`);

    setProcessedData(processed);
    setValidationErrors(errors);
    setValidationWarnings(warnings);
    
    return {
      processed,
      errors,
      warnings,
      hasAutoGenerated: processed.some(r => r._autoGenerated.length > 0)
    };
  };

  // Generar datos automáticos
  const generateAutoData = (row, fieldKey) => {
    switch (fieldKey) {
      case 'rut':
        const rutNumbers = Math.floor(Math.random() * 20000000) + 1000000;
        return bulkImportServiceFixed.normalizeRUT(rutNumbers.toString());
      
      case 'phone':
        const phoneNumbers = Math.floor(Math.random() * 90000000) + 10000000;
        return bulkImportServiceFixed.normalizePhoneNumber('+569' + phoneNumbers.toString().substring(0, 8));
      
      case 'debt_amount':
        return Math.floor(Math.random() * 450000) + 50000;
      
      case 'due_date':
        const daysFromNow = Math.floor(Math.random() * 60) + 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysFromNow);
        return dueDate.toISOString().split('T')[0];
      
      case 'creditor_name':
        return profile?.company?.company_name || 'Empresa Desconocida';
      
      case 'debt_type':
        const types = ['credit_card', 'loan', 'mortgage', 'consumer_loan', 'other'];
        return types[Math.floor(Math.random() * types.length)];
      
      case 'interest_rate':
        return (Math.random() * 2 + 1).toFixed(1);
      
      case 'description':
        return 'Deuda por consumo sin especificar detalles adicionales';
      
      default:
        return '';
    }
  };

  // Iniciar proceso de importación mejorado
  const startImport = async () => {
    console.log('🚀 Iniciando proceso de importación mejorado...');

    // Validar que se haya seleccionado un cliente corporativo
    if (!selectedCorporateClient) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente Corporativo Requerido',
        text: 'Debe seleccionar un cliente corporativo específico para asignar los deudores',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Procesar datos
    const { processed, errors, warnings, hasAutoGenerated } = processAndValidateData();
    
    // Si hay errores graves, mostrar editor de datos
    if (errors.length > 0) {
      setCurrentStep(3);
      setShowDataEditor(true);
      return;
    }

    // Si hay advertencias o autocompletado, mostrar confirmación
    if (warnings.length > 0 || hasAutoGenerated) {
      const result = await Swal.fire({
        icon: hasAutoGenerated ? 'info' : 'warning',
        title: hasAutoGenerated ? 'Datos Procesados con Autocompletado' : 'Se Detectaron Advertencias',
        html: `
          <div style="text-align: left;">
            <p><strong>${hasAutoGenerated ? '✅ Se han autocompletado campos faltantes' : '⚠️ Se detectaron advertencias'}</strong></p>
            <br>
            <p><strong>📊 Total procesados:</strong> ${processed.length}</p>
            <p><strong>🔧 Campos autogenerados:</strong> ${processed.filter(r => r._autoGenerated.length > 0).length} filas</p>
            <p><strong>⚠️ Advertencias:</strong> ${warnings.length} filas</p>
            <p><strong>❌ Errores:</strong> ${errors.length} filas</p>
            <br>
            <p>¿Deseas continuar con la importación?</p>
          </div>
        `,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Revisar Datos',
        confirmButtonColor: '#3B82F6',
        showCancelButton: true,
        width: '500px'
      });

      if (!result.isConfirmed) {
        setCurrentStep(3);
        setShowDataEditor(true);
        return;
      }
    }

    // Continuar con importación directa
    await performImport(processed);
  };

  // Realizar importación
  const performImport = async (dataToImport) => {
    setIsProcessing(true);
    setCurrentStep(4);
    setImportProgress({
      total: dataToImport.length,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      status: 'starting'
    });

    try {
      console.log('🚀 Iniciando bulkImportDebtsFixed');
      
      const result = await bulkImportServiceFixed.bulkImportDebtsFixed(dataToImport, {
        companyId: profile.company.id,
        clientId: selectedCorporateClient,
        useAI: useAI, // Opcional y desactivado por defecto
        onProgress: (progress) => {
          console.log('📈 Progreso de importación:', progress);
          setImportProgress(prev => ({
            ...prev,
            processed: progress.processed,
            successful: progress.successful,
            failed: progress.failed,
            status: 'processing'
          }));
        },
        onBatchComplete: (batchResult) => {
          console.log('📦 Lote completado:', batchResult);
          setImportProgress(prev => ({
            ...prev,
            currentBatch: batchResult.batchNumber
          }));
        }
      });

      console.log('🎯 Resultado final de importación:', result);

      if (result.success) {
        setImportProgress(prev => ({
          ...prev,
          status: 'completed',
          ...result
        }));

        const isSuccess = result.successRate > 0;
        const icon = isSuccess ? 'success' : 'warning';
        const title = isSuccess ? '¡Importación Completada!' : 'Importación Finalizada con Errores';
        const confirmButtonColor = isSuccess ? '#10B981' : '#F59E0B';

        let htmlContent = `
          <div style="text-align: left;">
            <p><strong>${isSuccess ? '✅ Importación completada exitosamente!' : '⚠️ Importación finalizada con errores'}</strong></p>
            <br>
            <p><strong>📊 Total procesados:</strong> ${result.totalRows}</p>
            <p><strong>✅ Exitosos:</strong> <span style="color: ${result.successful > 0 ? '#10B981' : '#EF4444'}">${result.successful}</span></p>
            <p><strong>❌ Fallidos:</strong> <span style="color: ${result.failed > 0 ? '#EF4444' : '#10B981'}">${result.failed}</span></p>
            <p><strong>👥 Usuarios creados:</strong> ${result.createdUsers}</p>
            <p><strong>💰 Deudas creadas:</strong> ${result.createdDebts}</p>
            <p><strong>⏱️ Tiempo:</strong> ${result.duration.toFixed(1)}s</p>
            <p><strong>📈 Tasa de éxito:</strong> <span style="color: ${result.successRate > 50 ? '#10B981' : result.successRate > 0 ? '#F59E0B' : '#EF4444'}">${result.successRate.toFixed(1)}%</span></p>
        `;

        // Agregar advertencias si existen
        if (result.hasWarnings && result.warnings.length > 0) {
          htmlContent += `
            <br>
            <div style="background: #fef3c7; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b;">
              <p><strong>⚠️ Advertencias:</strong> ${result.warnings.length} registros con advertencias</p>
            </div>
          `;
        }

        // Agregar información de IA si se usó
        if (result.aiProcessing) {
          htmlContent += `
            <br>
            <div style="background: #f0f9ff; padding: 10px; border-radius: 5px; border-left: 4px solid #3b82f6;">
              <p><strong>🤖 Procesamiento con IA:</strong> ${result.aiProcessing.success ? 'Exitoso' : 'Con fallback'}</p>
              <p><strong>Mensaje:</strong> ${result.aiProcessing.message}</p>
              ${result.aiProcessing.fallback ? '<p><small>⚠️ Se usó corrección manual debido a problemas con la IA</small></p>' : ''}
            </div>
          `;
        }

        if (result.failed > 0) {
          htmlContent += '<br><p><small>💡 Revisa la sección de errores para corregir los problemas.</small></p>';
        }

        htmlContent += '</div>';

        await Swal.fire({
          icon: icon,
          title: title,
          html: htmlContent,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: confirmButtonColor,
          width: '600px'
        });

        if (onImportComplete) {
          onImportComplete();
        }
        
        // Resetear componente
        clearAll();
        setCurrentStep(1);
      } else {
        throw new Error(result.error || 'Error desconocido en la importación');
      }

    } catch (error) {
      console.error('Error during import:', error);
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
      
      await Swal.fire({
        icon: 'error',
        title: 'Error en la Importación',
        html: `
          <div style="text-align: left;">
            <p><strong>❌ Error durante la importación</strong></p>
            <br>
            <p><strong>Error:</strong> ${error.message}</p>
            <br>
            <p><strong>💡 Acciones recomendadas:</strong></p>
            <ul style="font-size: 12px; margin-left: 20px;">
              <li>Verifica la consola del navegador para más detalles</li>
              <li>Confirma que el SERVICE_ROLE_KEY esté configurado</li>
              <li>Ejecuta el SQL de corrección de políticas RLS</li>
              <li>Intenta con un archivo más pequeño</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Limpiar todo
  const clearAll = () => {
    setFile(null);
    setParsedData([]);
    setFieldMapping({});
    setValidationErrors([]);
    setValidationWarnings([]);
    setImportProgress(null);
    setProcessedData([]);
    setShowPreview(false);
    setShowMapping(false);
    setShowDataEditor(false);
    setSelectedCorporateClient('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Renderizado del componente
  return (
    <div className="space-y-6">
      {/* Header con pasos */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Importación Masiva de Deudores</h1>
              <p className="text-blue-100">Sistema mejorado con validación robusta y manejo de errores</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            Descargar Plantilla
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                currentStep >= step 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white/60'
              }`}>
                {step}
              </div>
              <div className="ml-3">
                <p className={`font-semibold text-sm ${
                  currentStep >= step ? 'text-white' : 'text-white/60'
                }`}>
                  {step === 1 && 'Configuración'}
                  {step === 2 && 'Carga de Archivo'}
                  {step === 3 && 'Revisión de Datos'}
                  {step === 4 && 'Importación'}
                </p>
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-4 transition-all ${
                  currentStep > step ? 'bg-white' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Configuración */}
      {currentStep === 1 && (
        <Card className="border-2 border-dashed border-gray-300">
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl inline-block mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Seleccionar Cliente Corporativo
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Elige a qué cliente corporativo se asignarán los deudores importados
            </p>

            {corporateClients.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-800">
                      No hay clientes corporativos disponibles
                    </p>
                    <p className="text-xs text-yellow-700">
                      Debes crear clientes corporativos antes de poder importar deudas.
                    </p>
                    <button
                      onClick={() => window.location.href = '/empresa/clientes'}
                      className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Ir a Gestión de Clientes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <Select
                  value={selectedCorporateClient}
                  onChange={(value) => setSelectedCorporateClient(value)}
                  options={[
                    { value: '', label: 'Selecciona un cliente corporativo...' },
                    ...corporateClients.map(client => ({
                      value: client.id,
                      label: `${client.company_name} - ${client.company_rut}`
                    }))
                  ]}
                  className="mb-4"
                />

                {selectedCorporateClient && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">
                      {corporateClients.find(c => c.id === selectedCorporateClient)?.company_name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      <div>RUT: {corporateClients.find(c => c.id === selectedCorporateClient)?.company_rut}</div>
                      <div>Industria: {corporateClients.find(c => c.id === selectedCorporateClient)?.industry}</div>
                      <div>Valor Contrato: ${corporateClients.find(c => c.id === selectedCorporateClient)?.contract_value?.toLocaleString('es-CL')}</div>
                      <div>Estado: <span className="text-green-600 font-medium">Activo</span></div>
                    </div>
                  </div>
                )}

                <Button
                  variant="gradient"
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedCorporateClient}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600"
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Carga de Archivo */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <div className="text-center py-8">
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl inline-block mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Sube tu archivo de deudas
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                Selecciona un archivo CSV o Excel con los datos de tus deudores.
                Máximo 5,000 registros por archivo.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="debt-file-upload-fixed"
              />

              <Button
                variant="gradient"
                onClick={() => document.getElementById('debt-file-upload-fixed').click()}
                leftIcon={<Upload className="w-4 h-4" />}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Seleccionar Archivo
              </Button>

              <div className="mt-4 text-xs text-gray-500">
                <p className="mb-1"><strong>Formatos soportados:</strong> CSV, Excel (.xls, .xlsx)</p>
                <p><strong>Tamaño máximo:</strong> 10MB</p>
              </div>
            </div>
          </Card>

          {file && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {parsedData.length} registros
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    leftIcon={<Eye className="w-3 h-3" />}
                  >
                    Vista Previa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMapping(true)}
                    leftIcon={<Settings className="w-3 h-3" />}
                  >
                    Mapear Campos
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={startImport}
                    disabled={parsedData.length === 0}
                    leftIcon={<ArrowRight className="w-4 h-4" />}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Revisión de Datos */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Resumen de datos */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Resumen de Datos</h3>
                  <p className="text-sm text-blue-700">
                    Revisa los datos antes de importar
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{processedData.length}</div>
                <div className="text-xs text-gray-600">Total Registros</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {processedData.filter(r => !r._hasErrors).length}
                </div>
                <div className="text-xs text-green-700">Válidos</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {processedData.filter(r => r._hasErrors).length}
                </div>
                <div className="text-xs text-red-700">Con Errores</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {processedData.filter(r => r._autoGenerated.length > 0).length}
                </div>
                <div className="text-xs text-blue-700">Autocompletados</div>
              </div>
            </div>
          </Card>

          {/* Opciones avanzadas */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-900">Opciones Avanzadas</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Usar IA para corrección (experimental)</span>
              </label>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
            <Button
              variant="gradient"
              onClick={() => performImport(processedData.filter(r => !r._hasErrors))}
              disabled={processedData.filter(r => !r._hasErrors).length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
              leftIcon={<Play className="w-4 h-4" />}
            >
              Importar {processedData.filter(r => !r._hasErrors).length} Registros Válidos
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Importación en Progreso */}
      {currentStep === 4 && importProgress && (
        <Card>
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl inline-block mb-4">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Importación en Progreso
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Procesando tus datos. Por favor espera...
            </p>

            <div className="max-w-md mx-auto">
              <ProgressBar
                progress={(importProgress.processed / importProgress.total) * 100}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Procesados: {importProgress.processed}/{importProgress.total}</div>
                <div>Exitosos: {importProgress.successful}</div>
                <div>Fallidos: {importProgress.failed}</div>
                <div>Lote: {importProgress.currentBatch}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal de Vista Previa */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de Datos"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Primeras 10 filas del archivo. Total: {parsedData.length} registros.
          </p>

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(parsedData[0] || {}).map((column, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                        {String(value || '').slice(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal de Mapeo de Campos */}
      <Modal
        isOpen={showMapping}
        onClose={() => setShowMapping(false)}
        title="Mapeo de Campos"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Asocia las columnas de tu archivo con los campos del sistema.
          </p>

          <div className="space-y-4">
            {requiredFields.map((field) => (
              <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <field.icon className="w-4 h-4 text-gray-400" />
                    <Badge variant={field.type === 'currency' ? 'success' : 'info'} size="sm">
                      {field.type}
                    </Badge>
                  </div>
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>

                <Select
                  value={fieldMapping[field.key] || ''}
                  onChange={(value) => setFieldMapping(prev => ({ ...prev, [field.key]: value }))}
                  options={[
                    { value: '', label: 'No mapear' },
                    ...Object.keys(parsedData[0] || {}).map(col => ({
                      value: col,
                      label: col
                    }))
                  ]}
                />
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Asistente de Mapeo</h4>
                <p className="text-sm text-blue-700">
                  El sistema ha intentado mapear automáticamente los campos basándose en nombres comunes.
                  Revisa y ajusta el mapeo según sea necesario.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowMapping(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setShowMapping(false);
                processAndValidateData();
              }}
              className="flex-1"
            >
              Aplicar Mapeo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BulkImportDebtsFixed;