/**
 * Bulk Import Debts Component
 *
 * Componente para importar deudas masivamente desde archivos CSV/Excel
 * Permite mapear campos, validar datos y procesar importaciones por lotes
 *
 * @module BulkImportDebts
 */

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, Modal, Badge, ProgressBar } from '../common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import bulkImportService, { validateImportFile } from '../../services/bulkImportService';
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
  Settings
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const BulkImportDebts = ({ profile, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState('');
  const [corporateClients, setCorporateClients] = useState([]);

  const fileInputRef = useRef(null);

  // Cargar clientes corporativos al montar
  useEffect(() => {
    loadCorporateClients();
  }, []);

  const loadCorporateClients = async () => {
    console.log('🔍 Cargando clientes corporativos reales...');
    console.log('👤 Profile:', profile);
    console.log('🏢 Company ID:', profile?.company?.id);

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
      console.log('🚀 Llamando a getCorporateClients con companyId:', profile.company.id);
      
      // Importar el servicio dinámicamente para evitar dependencias circulares
      const { getCorporateClients } = await import('../../services/databaseService');
      
      const { corporateClients, error } = await getCorporateClients(profile.company.id);
      
      if (error) {
        console.error('❌ Error cargando clientes corporativos:', error);
        setCorporateClients([]);
        await Swal.fire({
          icon: 'error',
          title: 'Error al cargar clientes',
          text: 'No se pudieron cargar los clientes corporativos: ' + error,
          confirmButtonColor: '#1e40af'
        });
        return;
      }

      console.log('✅ Clientes corporativos cargados desde BD:', corporateClients?.length || 0);
      
      // Transformar los datos al formato esperado por el componente
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
        contract_start_date: client.contract_start_date || client.created_at || new Date().toISOString().split('T')[0],
        status: client.is_active !== false ? 'active' : 'inactive',
        created_at: client.created_at || new Date().toISOString()
      }));

      if (transformedClients.length === 0) {
        console.log('⚠️ No hay clientes corporativos registrados en la base de datos');
        setCorporateClients([]);
      } else {
        console.log('📋 Clientes reales cargados exitosamente:', transformedClients.length);
        console.log('📋 Detalles de clientes:', transformedClients.map(c => ({
          id: c.id,
          name: c.company_name,
          email: c.contact_email,
          rut: c.company_rut
        })));
        setCorporateClients(transformedClients);
      }
    } catch (error) {
      console.error('💥 Error en loadCorporateClients:', error);
      setCorporateClients([]);
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Ocurrió un error al cargar los clientes: ' + error.message,
        confirmButtonColor: '#1e40af'
      });
    }
  };

  // Campos requeridos para deudas
  const requiredFields = [
    { key: 'rut', label: 'RUT del Deudor', type: 'text', required: true },
    { key: 'full_name', label: 'Nombre Completo', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: false },
    { key: 'phone', label: 'Teléfono', type: 'phone', required: false },
    { key: 'debt_amount', label: 'Monto de Deuda', type: 'currency', required: true },
    { key: 'due_date', label: 'Fecha de Vencimiento', type: 'date', required: true },
    { key: 'creditor_name', label: 'Nombre del Acreedor', type: 'text', required: true },
    { key: 'debt_reference', label: 'Referencia de Deuda', type: 'text', required: false },
    { key: 'debt_type', label: 'Tipo de Deuda', type: 'select', required: false },
    { key: 'interest_rate', label: 'Tasa de Interés (%)', type: 'percentage', required: false },
    { key: 'description', label: 'Descripción', type: 'text', required: false }
  ];

  // Plantilla de ejemplo para descargar
  const downloadTemplate = () => {
    const template = [
      {
        rut: '12345678-9',
        full_name: 'Juan Pérez González',
        email: 'juan.perez@email.com',
        phone: '+56912345678',
        debt_amount: 1500000,
        due_date: '2024-12-31',
        creditor_name: 'Banco Estado',
        debt_reference: 'PREST-001',
        debt_type: 'credit_card',
        interest_rate: 2.5,
        description: 'Deuda tarjeta de crédito'
      },
      {
        rut: '98765432-1',
        full_name: 'María González López',
        email: 'maria.gonzalez@email.com',
        phone: '+56987654321',
        debt_amount: 2500000,
        due_date: '2024-11-15',
        creditor_name: 'CMR Falabella',
        debt_reference: 'CUOTA-045',
        debt_type: 'loan',
        interest_rate: 1.8,
        description: 'Crédito consumo'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Deudas');
    XLSX.writeFile(wb, 'plantilla_importacion_deudas.xlsx');
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    console.log('📁 Archivo seleccionado:', selectedFile.name);
    console.log('🏢 Cliente corporativo seleccionado:', selectedCorporateClient);
    console.log('👤 Perfil de empresa:', profile?.company);

    // Validar que se haya seleccionado un cliente corporativo
    if (!selectedCorporateClient) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente Corporativo Requerido',
        text: 'Por favor selecciona un cliente corporativo antes de subir el archivo con los deudores.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    // Validar archivo usando el servicio
    const validation = validateImportFile(selectedFile);
    if (!validation.isValid) {
      console.error('❌ Validación de archivo fallida:', validation.errors);
      await Swal.fire({
        icon: 'error',
        title: 'Archivo No Válido',
        text: validation.errors.join('\n'),
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    console.log('✅ Archivo validado, iniciando parseo...');
    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  // Parsear archivo CSV/Excel
  const parseFile = async (file) => {
    try {
      let data = [];

      if (file.type === 'text/csv') {
        // Parsear CSV
        const result = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject
          });
        });
        data = result.data;
      } else {
        // Parsear Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
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

      if (data.length > 10000) {
        await Swal.fire({
          icon: 'warning',
          title: 'Archivo Demasiado Grande',
          text: 'El archivo no puede contener más de 10,000 registros. Por favor divide los datos en archivos más pequeños.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      setParsedData(data);
      setShowPreview(true);

      // Generar mapeo automático basado en nombres de columnas
      const autoMapping = generateAutoMapping(data[0]);
      setFieldMapping(autoMapping);

    } catch (error) {
      console.error('Error parsing file:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al Procesar Archivo',
        text: 'Error al procesar el archivo. Verifica que el formato sea correcto.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Generar mapeo automático basado en nombres de columnas
  const generateAutoMapping = (firstRow) => {
    const mapping = {};
    const columns = Object.keys(firstRow);

    // Mapeos comunes
    const commonMappings = {
      rut: ['rut', 'r.u.t', 'run', 'dni', 'cedula', 'identificacion'],
      full_name: ['nombre', 'name', 'full_name', 'nombre_completo', 'cliente'],
      email: ['email', 'correo', 'mail', 'e-mail'],
      phone: ['telefono', 'phone', 'celular', 'movil', 'contacto'],
      debt_amount: ['monto', 'amount', 'deuda', 'saldo', 'total'],
      due_date: ['fecha_vencimiento', 'due_date', 'vencimiento', 'fecha'],
      creditor_name: ['acreedor', 'creditor', 'empresa', 'entidad'],
      debt_reference: ['referencia', 'reference', 'numero', 'id_deuda'],
      debt_type: ['tipo', 'type', 'categoria'],
      interest_rate: ['interes', 'interest', 'tasa'],
      description: ['descripcion', 'description', 'detalle', 'comentario']
    };

    requiredFields.forEach(field => {
      const possibleNames = commonMappings[field.key] || [];
      const matchedColumn = columns.find(col =>
        possibleNames.some(name =>
          col.toLowerCase().includes(name.toLowerCase())
        )
      );

      if (matchedColumn) {
        mapping[field.key] = matchedColumn;
      }
    });

    return mapping;
  };

  // Estado para datos procesados y edición
  const [processedData, setProcessedData] = useState([]);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  // Función para generar datos automáticos
  const generateAutoData = (row, fieldKey) => {
    switch (fieldKey) {
      case 'rut':
        // Generar RUT chileno aleatorio con formato correcto
        const rutNumbers = Math.floor(Math.random() * 20000000) + 1000000;
        return normalizeRUT(rutNumbers.toString());
      
      case 'phone':
        // Generar teléfono chileno aleatorio
        const phoneNumbers = Math.floor(Math.random() * 90000000) + 10000000;
        return normalizePhoneNumber('+569' + phoneNumbers.toString().substring(0, 8));
      
      case 'debt_amount':
        // Si no hay monto, generar uno aleatorio entre 50,000 y 500,000
        return Math.floor(Math.random() * 450000) + 50000;
      
      case 'due_date':
        // Generar fecha de vencimiento entre 30 y 90 días desde hoy
        const daysFromNow = Math.floor(Math.random() * 60) + 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysFromNow);
        return dueDate.toISOString().split('T')[0];
      
      case 'creditor_name':
        // Usar nombre de la empresa si está disponible
        return profile?.company?.company_name || 'Empresa Desconocida';
      
      case 'debt_type':
        // Asignar tipo aleatorio común
        const types = ['credit_card', 'loan', 'mortgage', 'consumer_loan', 'other'];
        return types[Math.floor(Math.random() * types.length)];
      
      case 'interest_rate':
        // Tasa de interés típica chilena (1-3% mensual)
        return (Math.random() * 2 + 1).toFixed(1);
      
      case 'description':
        // Generar descripción basada en el tipo
        return 'Deuda por consumo sin especificar detalles adicionales';
      
      default:
        return '';
    }
  };

  // Función para normalizar número de teléfono
  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Eliminar todos los caracteres no numéricos excepto el +
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    
    console.log('🔍 Normalizando teléfono:', {
      original: phone,
      cleaned: cleaned,
      length: cleaned.length
    });
    
    // Si no tiene + y es un número chileno (9 dígitos), agregar +56
    if (!cleaned.startsWith('+') && cleaned.length === 9 && cleaned.startsWith('9')) {
      cleaned = '+56' + cleaned;
    }
    // Si no tiene + y es un número de 8 dígitos (sin el 9), agregar +569
    else if (!cleaned.startsWith('+') && cleaned.length === 8) {
      cleaned = '+569' + cleaned;
    }
    // Si no tiene + y es un número de 9 dígitos pero no empieza con 9, asumir chileno
    else if (!cleaned.startsWith('+') && cleaned.length === 9) {
      cleaned = '+569' + cleaned;
    }
    // Si ya tiene + pero no tiene código de país, asumir chileno
    else if (cleaned.startsWith('+') && cleaned.length === 9 && cleaned[1] === '9') {
      cleaned = '+56' + cleaned.substring(1);
    }
    // Si es un número chileno sin formato internacional
    else if (!cleaned.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('569')) {
      cleaned = '+' + cleaned;
    }
    
    console.log('✅ Teléfono normalizado:', cleaned);
    return cleaned;
  };

  // Función para normalizar RUT chileno
  const normalizeRUT = (rut) => {
    if (!rut) return '';
    
    // Eliminar todos los caracteres excepto números y K/k
    let cleaned = rut.toString().toUpperCase().replace(/[^0-9K]/g, '');
    
    // Separar dígito verificador
    let dv = cleaned.slice(-1);
    let numbers = cleaned.slice(0, -1);
    
    // Si no hay dígito verificador, calcularlo
    if (numbers.length > 0 && !/^[0-9K]$/.test(dv)) {
      numbers = cleaned;
      dv = calculateRUTDV(numbers);
    }
    
    // Formatear con puntos y guion
    if (numbers.length === 0) return '';
    
    // Agregar puntos cada 3 dígitos de derecha a izquierda
    let formatted = '';
    let count = 0;
    for (let i = numbers.length - 1; i >= 0; i--) {
      formatted = numbers[i] + formatted;
      count++;
      if (count === 3 && i > 0) {
        formatted = '.' + formatted;
        count = 0;
      }
    }
    
    return formatted + '-' + dv;
  };

  // Función para calcular dígito verificador de RUT
  const calculateRUTDV = (numbers) => {
    let sum = 0;
    let multiplier = 2;
    
    for (let i = numbers.length - 1; i >= 0; i--) {
      sum += parseInt(numbers[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const dv = 11 - remainder;
    
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
  };

  // Procesar datos y detectar campos faltantes
  const processAndValidateData = () => {
    const processed = [];
    const errors = [];
    const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);

    console.log('🔍 Procesando datos mapeados...');
    console.log('📋 FieldMapping actual:', fieldMapping);
    console.log('📊 Required fields:', requiredFieldKeys);

    parsedData.forEach((row, index) => {
      const processedRow = { ...row };
      const rowErrors = [];
      const autoGeneratedFields = [];

      // Procesar cada campo requerido
      requiredFieldKeys.forEach(fieldKey => {
        const mappedColumn = fieldMapping[fieldKey];
        const fieldInfo = requiredFields.find(f => f.key === fieldKey);
        
        if (!mappedColumn) {
          // Campo no mapeado - intentar generar automáticamente
          const autoValue = generateAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
        } else if (!row[mappedColumn]) {
          // Campo vacío - generar automáticamente
          const autoValue = generateAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
        } else {
          // Campo existe - validar y limpiar
          let value = row[mappedColumn];
          
          // Limpiar y validar según el tipo
          if (fieldKey === 'debt_amount') {
            value = parseFloat(value.toString().replace(/[$\s.,]/g, '').replace(',', '.'));
            if (isNaN(value) || value <= 0) {
              value = generateAutoData(row, fieldKey);
              autoGeneratedFields.push(`${fieldInfo.label}: ${value} (corregido)`);
            }
            processedRow[fieldKey] = value;
          } else if (fieldKey === 'due_date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              value = generateAutoData(row, fieldKey);
              autoGeneratedFields.push(`${fieldInfo.label}: ${value} (corregido)`);
            } else {
              value = date.toISOString().split('T')[0];
            }
            processedRow[fieldKey] = value;
          } else if (fieldKey === 'rut') {
            const rut = normalizeRUT(value);
            processedRow[fieldKey] = rut;
            // Validar RUT normalizado
            const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
            if (!rutRegex.test(rut)) {
              rowErrors.push(`RUT "${value}" no pudo ser normalizado correctamente`);
            }
          } else if (fieldKey === 'phone') {
            const phone = normalizePhoneNumber(value);
            processedRow[fieldKey] = phone;
          } else if (fieldKey === 'email' && value) {
            const email = value.toString().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              rowErrors.push(`Email "${email}" tiene formato inválido`);
            }
            processedRow[fieldKey] = value;
          } else {
            processedRow[fieldKey] = value;
          }
        }
      });

      // Agregar información de procesamiento
      processedRow._originalIndex = index + 1;
      processedRow._autoGenerated = autoGeneratedFields;
      processedRow._hasErrors = rowErrors.length > 0;
      processedRow._errors = rowErrors;

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: processedRow
        });
      }

      processed.push(processedRow);
    });

    console.log(`📊 Datos procesados: ${processed.length} filas`);
    console.log(`🔧 Campos autogenerados en ${processed.filter(r => r._autoGenerated.length > 0).length} filas`);
    console.log(`❌ Errores encontrados: ${errors.length} filas`);

    setProcessedData(processed);
    setValidationErrors(errors);
    
    return {
      processed,
      errors,
      hasAutoGenerated: processed.some(r => r._autoGenerated.length > 0)
    };
  };

  // Validar datos mapeados (mantener para compatibilidad)
  const validateMappedData = () => {
    const result = processAndValidateData();
    return result.errors.length === 0;
  };

  // Funciones para edición de datos
  const handleCellEdit = (rowIndex, fieldKey, value) => {
    const newData = [...processedData];
    
    // Normalizar datos según el campo
    if (fieldKey === 'rut') {
      newData[rowIndex][fieldKey] = normalizeRUT(value);
    } else if (fieldKey === 'phone') {
      newData[rowIndex][fieldKey] = normalizePhoneNumber(value);
    } else {
      newData[rowIndex][fieldKey] = value;
    }
    
    // Actualizar campos autogenerados
    const autoGenerated = newData[rowIndex]._autoGenerated.filter(field =>
      !field.startsWith(`${requiredFields.find(f => f.key === fieldKey)?.label}:`)
    );
    newData[rowIndex]._autoGenerated = autoGenerated;
    
    setProcessedData(newData);
  };

  const handleBulkEdit = (fieldKey, value) => {
    const newData = processedData.map(row => ({
      ...row,
      [fieldKey]: value
    }));
    setProcessedData(newData);
  };

  // Iniciar proceso de importación mejorado
  const startImport = async () => {
    console.log('🚀 Iniciando proceso de importación inteligente...');
    console.log('📊 Datos a procesar:', parsedData.length, 'registros');
    console.log('🗺️ Mapeo de campos:', fieldMapping);
    console.log('🏢 ID de empresa:', profile?.company?.id);
    console.log('👥 ID de cliente corporativo:', selectedCorporateClient);

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

    if (selectedCorporateClient === 'general') {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente Corporativo Requerido',
        text: 'La importación masiva de deudores debe estar asociada a un cliente corporativo específico',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Procesar datos con autocompletado
    const { processed, errors, hasAutoGenerated } = processAndValidateData();
    
    // Si hay errores graves (RUT inválido, etc.), mostrar editor de datos
    if (errors.length > 0 || hasAutoGenerated) {
      await Swal.fire({
        icon: hasAutoGenerated ? 'info' : 'warning',
        title: hasAutoGenerated ? 'Datos Procesados con Autocompletado' : 'Se Detectaron Errores',
        html: `
          <div style="text-align: left;">
            <p><strong>${hasAutoGenerated ? '✅ Se han autocompletado campos faltantes' : '⚠️ Se detectaron errores que necesitan corrección'}</strong></p>
            <br>
            <p><strong>📊 Total procesados:</strong> ${processed.length}</p>
            <p><strong>🔧 Campos autogenerados:</strong> ${processed.filter(r => r._autoGenerated.length > 0).length} filas</p>
            <p><strong>❌ Errores por corregir:</strong> ${errors.length} filas</p>
            <br>
            <p>Puedes revisar y editar los datos antes de importar.</p>
          </div>
        `,
        confirmButtonText: 'Revisar Datos',
        confirmButtonColor: '#3B82F6',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        width: '500px'
      }).then((result) => {
        if (result.isConfirmed) {
          setShowDataEditor(true);
        }
      });
      return;
    }

    // Si todo está perfecto, continuar con importación directa
    await performImport(processed);
  };

  // Realizar importación
  const performImport = async (dataToImport) => {
    // Validar nuevamente que se tenga un cliente corporativo válido
    if (!selectedCorporateClient || selectedCorporateClient === 'general') {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: 'No se puede continuar con la importación sin un cliente corporativo específico',
        confirmButtonColor: '#EF4444'
      });
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setImportProgress({
      total: dataToImport.length,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      status: 'starting'
    });

    try {
      // Preparar datos para importación
      const mappedData = dataToImport.map(row => ({
        rut: row.rut,
        full_name: row.full_name,
        email: row.email || null,
        phone: row.phone || null,
        debt_amount: parseFloat(row.debt_amount),
        due_date: row.due_date,
        creditor_name: row.creditor_name,
        debt_reference: row.debt_reference || null,
        debt_type: row.debt_type || 'other',
        interest_rate: row.interest_rate ? parseFloat(row.interest_rate) : 0,
        description: row.description || null
      }));

      console.log('📋 Datos preparados para importación:', mappedData.length, 'registros');

      // Usar el servicio de importación masiva
      console.log('🚀 Iniciando bulkImportDebts con IA activada');
      const result = await bulkImportService.bulkImportDebts(mappedData, {
        companyId: profile.company.id,
        clientId: selectedCorporateClient,
        useAI: true, // Asegurar que IA está activada
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

      console.log('🎯 Resultado final de importación:', {
        success: result.success,
        totalRows: result.totalRows,
        successful: result.successful,
        failed: result.failed,
        hasAIProcessing: !!result.aiProcessing,
        aiProcessingSuccess: result.aiProcessing?.success,
        aiFallback: result.aiProcessing?.fallback,
        aiMessage: result.aiProcessing?.message
      });

      if (result.success) {
        setImportProgress(prev => ({
          ...prev,
          status: 'completed',
          ...result
        }));

        // Determinar el tipo de mensaje según los resultados
        const isSuccess = result.successRate > 0;
        const icon = isSuccess ? 'success' : 'warning';
        const title = isSuccess ? '¡Importación Completada!' : 'Importación Finalizada con Errores';
        const confirmButtonColor = isSuccess ? '#10B981' : '#F59E0B';
        
        // Construir mensaje de IA si está disponible
        const aiMessage = result.aiProcessing ? `
          <br>
          <div style="background: #f0f9ff; padding: 10px; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <p><strong>🤖 Procesamiento con IA:</strong></p>
            <p><strong>Estado:</strong> <span style="color: ${result.aiProcessing.success ? '#10B981' : '#F59E0B'}">${result.aiProcessing.success ? 'Exitoso' : 'Con fallback'}</span></p>
            <p><strong>Mensaje:</strong> ${result.aiProcessing.message}</p>
            ${result.aiProcessing.fallback ? '<p><small>⚠️ Se usó corrección manual debido a problemas con la IA</small></p>' : ''}
            ${result.aiProcessing.fieldsCreated && result.aiProcessing.fieldsCreated.length > 0 ?
              `<p><strong>Campos creados:</strong> ${result.aiProcessing.fieldsCreated.join(', ')}</p>` : ''}
          </div>
        ` : '';

        await Swal.fire({
          icon: icon,
          title: title,
          html: `
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
              ${result.failed > 0 ? '<br><p><small>💡 Revisa la sección de errores de validación para corregir los problemas.</small></p>' : ''}
              ${aiMessage}
            </div>
          `,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: confirmButtonColor,
          width: '600px'
        });

        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        console.error('❌ Error detallado de importación:', result);
        
        // Mostrar errores específicos si existen
        if (result.errors && result.errors.length > 0) {
          const errorDetails = result.errors.slice(0, 5).map(err => {
            const errorMessages = Array.isArray(err.errors) ? err.errors : [err.errors];
            return `Fila ${err.row}: ${errorMessages.join(', ')}`;
          }).join('\n');
          
          // Mostrar datos del primer error para depuración
          const firstErrorData = result.errors[0]?.data;
          const dataPreview = firstErrorData ?
            `\n\n📋 Datos de la fila con error:\n${JSON.stringify(firstErrorData, null, 2)}` : '';
          
          await Swal.fire({
            icon: 'error',
            title: 'Error en la Importación',
            html: `
              <div style="text-align: left;">
                <p><strong>❌ Error durante la importación</strong></p>
                <br>
                <p><strong>Resumen:</strong></p>
                <p>• Total procesados: ${result.totalRows || 0}</p>
                <p>• Exitosos: <span style="color: #10B981">${result.successful || 0}</span></p>
                <p>• Fallidos: <span style="color: #EF4444">${result.failed || 0}</span></p>
                <br>
                <p><strong>Detalles del error:</strong></p>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto; max-height: 200px; overflow-y: auto;">
${errorDetails}
                </pre>
                ${dataPreview ? `<pre style="background: #fef2f2; padding: 10px; border-radius: 5px; font-size: 11px; overflow-x: auto; max-height: 150px; overflow-y: auto; border: 1px solid #fecaca;">
${dataPreview}
                </pre>` : ''}
                ${result.errors.length > 5 ? `<p><small>... y ${result.errors.length - 5} errores más</small></p>` : ''}
                <br>
                <p><strong>Error general:</strong> ${result.error || 'Error desconocido'}</p>
                <br>
                <p><strong>💡 Recomendaciones:</strong></p>
                <ul style="font-size: 12px; margin-left: 20px;">
                  <li>Verifica que el RUT tenga formato XX.XXX.XXX-X</li>
                  <li>Asegúrate que el monto sea un número positivo</li>
                  <li>Confirma que la fecha de vencimiento sea válida</li>
                  <li>Revisa que todos los campos requeridos estén completos</li>
                </ul>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#EF4444',
            width: '700px',
            showCancelButton: true,
            cancelButtonText: 'Ver Consola',
            cancelButtonColor: '#6B7280'
          }).then((result) => {
            if (!result.isConfirmed) {
              // Abrir consola del navegador para depuración
              console.log('🔍 Abre la consola del navegador (F12) para ver más detalles del error');
            }
          });
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error en la Importación',
            html: `
              <div style="text-align: left;">
                <p><strong>❌ Error durante la importación</strong></p>
                <br>
                <p><strong>Error:</strong> ${result.error || 'Error desconocido'}</p>
                <br>
                <p><strong>💡 Acciones recomendadas:</strong></p>
                <ul style="font-size: 12px; margin-left: 20px;">
                  <li>Verifica la consola del navegador para más detalles</li>
                  <li>Confirma que el SERVICE_ROLE_KEY esté configurado</li>
                  <li>Ejecuta el SQL de corrección de políticas RLS</li>
                </ul>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#EF4444'
          });
        }
        
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
        text: '❌ Error durante la importación: ' + error.message,
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
    setImportProgress(null);
    setShowPreview(false);
    setShowMapping(false);
    setSelectedCorporateClient('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <Upload className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Importación Masiva de Deudas
            </h2>
            <p className="text-xs text-gray-600">
              Sube un archivo CSV o Excel con los datos de tus deudores
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={downloadTemplate}
          leftIcon={<Download className="w-3 h-3" />}
          className="text-xs py-2"
        >
          Descargar Plantilla
        </Button>
      </div>

      {/* Corporate Client Selection */}
      {!file && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <Building className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-blue-900">
                Seleccionar Cliente Corporativo
              </h3>
              <p className="text-xs text-blue-700">
                Elige a qué cliente corporativo se asignarán los deudores
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {corporateClients.length === 0 ? (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800">
                      No hay clientes corporativos disponibles
                    </p>
                    <p className="text-xs text-yellow-700">
                      Debes crear clientes corporativos antes de poder importar deudas.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Nota: En "Gestión de Clientes" se registran los clientes corporativos, no los deudores.
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
              <>
                <div className="bg-green-50 p-2 rounded-lg border border-green-200 mb-2">
                  <p className="text-xs font-medium text-green-800">
                    ✅ {corporateClients.length} clientes corporativos reales disponibles
                  </p>
                </div>
                <select
                  value={selectedCorporateClient}
                  onChange={(e) => setSelectedCorporateClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-xs"
                >
                  <option value="">Selecciona un cliente corporativo...</option>
                  {corporateClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.company_name} - {client.company_rut}
                    </option>
                  ))}
                </select>

                {selectedCorporateClient && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-xs">
                      {corporateClients.find(c => c.id === selectedCorporateClient)?.company_name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600">
                      <div>RUT: {corporateClients.find(c => c.id === selectedCorporateClient)?.company_rut}</div>
                      <div>Industria: {corporateClients.find(c => c.id === selectedCorporateClient)?.industry}</div>
                      <div>Valor Contrato: ${corporateClients.find(c => c.id === selectedCorporateClient)?.contract_value?.toLocaleString('es-CL')}</div>
                      <div>Estado: <span className="text-green-600 font-medium">Activo</span></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Upload Area */}
      {!file && selectedCorporateClient && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl inline-block mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Sube tu archivo de deudas
            </h3>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
              Selecciona un archivo CSV o Excel con los datos de tus deudores.
              Máximo 10,000 registros por archivo.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="debt-file-upload"
            />

            <Button
              variant="gradient"
              onClick={() => document.getElementById('debt-file-upload').click()}
              leftIcon={<Upload className="w-3 h-3" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs py-2"
            >
              Seleccionar Archivo
            </Button>

            <div className="mt-4 text-xs text-gray-500">
              <p className="mb-1"><strong>Formatos soportados:</strong> CSV, Excel (.xls, .xlsx)</p>
              <p><strong>Tamaño máximo:</strong> 10MB</p>
            </div>
          </div>
        </Card>
      )}

      {/* File Info & Actions */}
      {file && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded-lg">
                <FileText className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xs">{file.name}</h3>
                <p className="text-xs text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {parsedData.length} registros
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                leftIcon={<Eye className="w-3 h-3" />}
                className="text-xs py-1"
              >
                Vista Previa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapping(true)}
                leftIcon={<Settings className="w-3 h-3" />}
                className="text-xs py-1"
              >
                Mapear
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={clearAll}
                leftIcon={<Trash2 className="w-3 h-3" />}
                className="text-xs py-1"
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {importProgress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso de Importación</span>
                <span>{importProgress.processed}/{importProgress.total}</span>
              </div>
              <ProgressBar
                progress={(importProgress.processed / importProgress.total) * 100}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Lote {importProgress.currentBatch}</span>
                <span>{importProgress.successful} exitosas • {importProgress.failed} fallidas</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {parsedData.length > 0 && !importProgress && (
            <div className="flex gap-3">
              <Button
                variant="gradient"
                onClick={startImport}
                disabled={isProcessing}
                leftIcon={<Play className="w-4 h-4" />}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isProcessing ? 'Procesando...' : 'Iniciar Importación'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">
                Errores de Validación ({validationErrors.length} filas afectadas)
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMapping(true)}
              className="text-red-600 border-red-300 hover:bg-red-100"
              leftIcon={<Settings className="w-3 h-3" />}
            >
              Corregir Mapeo
            </Button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {validationErrors.slice(0, 15).map((error, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
                    {error.row}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900 mb-1">
                      Fila {error.row} - {error.errors.length} error(es):
                    </div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {error.errors.map((err, errIndex) => (
                        <li key={errIndex} className="flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                    {error.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                          Ver datos de la fila
                        </summary>
                        <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(error.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {validationErrors.length > 15 && (
              <div className="text-center py-2">
                <p className="text-sm text-red-600">
                  ... y {validationErrors.length - 15} filas más con errores
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <strong>Recomendaciones:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Asegúrate que todos los campos requeridos estén mapeados correctamente</li>
                  <li>• Verifica que los RUT tengan formato XX.XXX.XXX-X</li>
                  <li>• Los montos deben ser números positivos (pueden incluir $ y comas)</li>
                  <li>• Las fechas deben usar formato YYYY-MM-DD o DD/MM/YYYY</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de Datos"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Primeras 5 filas del archivo. Total: {parsedData.length} registros.
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
                {parsedData.slice(0, 5).map((row, index) => (
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

      {/* Field Mapping Modal */}
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
                  <Badge variant={field.type === 'currency' ? 'success' : 'info'} size="sm">
                    {field.type}
                  </Badge>
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
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Campos Automáticamente Detectados</h4>
                <p className="text-sm text-blue-700">
                  El sistema intenta mapear automáticamente los campos basándose en nombres comunes.
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
                validateMappedData();
              }}
              className="flex-1"
            >
              Aplicar Mapeo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Data Editor Modal */}
      <Modal
        isOpen={showDataEditor}
        onClose={() => setShowDataEditor(false)}
        title="Editor de Datos - Revisión y Corrección"
        size="full"
      >
        <div className="space-y-4">
          {/* Resumen de datos */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total registros:</span>
                <span className="ml-2 font-semibold">{processedData.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Con autocompletado:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {processedData.filter(r => r._autoGenerated.length > 0).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Con errores:</span>
                <span className="ml-2 font-semibold text-red-600">
                  {processedData.filter(r => r._hasErrors).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Listos para importar:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {processedData.filter(r => !r._hasErrors).length}
                </span>
              </div>
            </div>
          </div>

          {/* Herramientas de edición masiva */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Edición Masiva</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                placeholder="Seleccionar campo..."
                options={requiredFields.map(f => ({ value: f.key, label: f.label }))}
                onChange={(value) => {
                  if (value) {
                    Swal.fire({
                      title: 'Editar Campo Masivamente',
                      input: 'text',
                      inputLabel: `Nuevo valor para ${requiredFields.find(f => f.key === value)?.label}`,
                      showCancelButton: true,
                      confirmButtonText: 'Aplicar a todos',
                      confirmButtonColor: '#3B82F6'
                    }).then((result) => {
                      if (result.isConfirmed && result.value) {
                        handleBulkEdit(value, result.value);
                        Swal.fire({
                          icon: 'success',
                          title: 'Campo actualizado',
                          text: `Se ha aplicado el valor a todos los registros`,
                          timer: 1500,
                          showConfirmButton: false
                        });
                      }
                    });
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  Swal.fire({
                    title: 'Regenerar Datos Automáticos',
                    text: 'Esto reemplazará todos los campos autogenerados con nuevos valores',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Regenerar',
                    confirmButtonColor: '#F59E0B'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      const regenerated = processedData.map(row => {
                        const newRow = { ...row };
                        requiredFields.filter(f => f.required).forEach(field => {
                          if (row._autoGenerated.some(ag => ag.startsWith(`${field.label}:`))) {
                            newRow[field.key] = generateAutoData(row, field.key);
                          }
                        });
                        return newRow;
                      });
                      setProcessedData(regenerated);
                      Swal.fire({
                        icon: 'success',
                        title: 'Datos regenerados',
                        timer: 1500,
                        showConfirmButton: false
                      });
                    }
                  });
                }}
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Regenerar Automáticos
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  Swal.fire({
                    title: 'Eliminar Filas con Errores',
                    text: `Se eliminarán ${processedData.filter(r => r._hasErrors).length} filas con errores`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Eliminar',
                    confirmButtonColor: '#EF4444'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      setProcessedData(processedData.filter(r => !r._hasErrors));
                      Swal.fire({
                        icon: 'success',
                        title: 'Filas eliminadas',
                        timer: 1500,
                        showConfirmButton: false
                      });
                    }
                  });
                }}
                leftIcon={<Trash2 className="w-3 h-3" />}
              >
                Eliminar con Errores
              </Button>
            </div>
          </div>

          {/* Tabla de datos editable */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Datos para Importar</h4>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fila
                    </th>
                    {requiredFields.filter(f => f.required).map((field) => (
                      <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.map((row, index) => (
                    <tr key={index} className={row._hasErrors ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {row._originalIndex}
                      </td>
                      {requiredFields.filter(f => f.required).map((field) => (
                        <td key={field.key} className="px-3 py-2 text-sm">
                          {editingCell?.rowIndex === index && editingCell?.fieldKey === field.key ? (
                            <input
                              type={field.type === 'currency' ? 'number' : field.type}
                              value={row[field.key] || ''}
                              onChange={(e) => handleCellEdit(index, field.key, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingCell(null);
                                }
                              }}
                              className={`w-full px-2 py-1 border rounded text-xs ${
                                row._autoGenerated.some(ag => ag.startsWith(`${field.label}:`))
                                  ? 'bg-blue-100 border-blue-300'
                                  : 'border-gray-300'
                              }`}
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => setEditingCell({ rowIndex: index, fieldKey: field.key })}
                              className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-xs ${
                                row._autoGenerated.some(ag => ag.startsWith(`${field.label}:`))
                                  ? 'bg-blue-50 text-blue-800'
                                  : ''
                              } ${
                                row._errors.some(err => err.includes(field.label))
                                  ? 'text-red-600 font-medium'
                                  : 'text-gray-900'
                              }`}
                            >
                              {field.type === 'currency' && row[field.key]
                                ? `$${parseInt(row[field.key]).toLocaleString('es-CL')}`
                                : row[field.key] || '-'
                              }
                              {row._autoGenerated.some(ag => ag.startsWith(`${field.label}:`)) && (
                                <span className="ml-1 text-blue-500 text-xs">★</span>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-sm">
                        {row._hasErrors ? (
                          <div className="text-red-600">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            <span className="text-xs">{row._errors.length} errores</span>
                          </div>
                        ) : (
                          <div className="text-green-600">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            <span className="text-xs">Listo</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalles de campos autogenerados */}
          {processedData.some(r => r._autoGenerated.length > 0) && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Campos Autogenerados</h4>
              <div className="text-sm text-amber-800">
                <p className="mb-2">Los campos marcados con <span className="text-blue-600">★</span> fueron generados automáticamente:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {processedData
                    .filter(r => r._autoGenerated.length > 0)
                    .slice(0, 5)
                    .map((row, index) => (
                      <div key={index} className="text-xs">
                        <strong>Fila {row._originalIndex}:</strong> {row._autoGenerated.join(', ')}
                      </div>
                    ))}
                  {processedData.filter(r => r._autoGenerated.length > 0).length > 5 && (
                    <div className="text-xs text-amber-700">
                      ... y {processedData.filter(r => r._autoGenerated.length > 0).length - 5} filas más
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowDataEditor(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setShowDataEditor(false);
                performImport(processedData);
              }}
              disabled={processedData.filter(r => !r._hasErrors).length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              leftIcon={<Play className="w-4 h-4" />}
            >
              Importar {processedData.filter(r => !r._hasErrors).length} Registros Válidos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BulkImportDebts;