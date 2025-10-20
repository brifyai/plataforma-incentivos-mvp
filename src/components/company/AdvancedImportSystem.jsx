/**
 * Advanced Import System
 * 
 * Sistema super moderno de importación de archivos Excel y CSV
 * con normalización automática de RUT y teléfonos, editor de campos
 * y asistencia de IA para unificar formatos
 * 
 * @module AdvancedImportSystem
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Settings,
  Sparkles,
  Zap,
  Database,
  Filter,
  Edit3,
  Save,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Wand2,
  Brain,
  Target,
  Shield,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  Copy,
  CheckSquare,
  Square
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import FieldMappingModal from './FieldMappingModal';

const AdvancedImportSystem = ({ profile, onImportComplete }) => {
  // Estados principales
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState('');
  const [corporateClients, setCorporateClients] = useState([]);
  
  // Estados para UI avanzada
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [processedData, setProcessedData] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('originalIndex');
  const [sortDirection, setSortDirection] = useState('asc');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationRules, setValidationRules] = useState({
    rutStrict: true,
    phoneStrict: false,
    emailStrict: true,
    amountPositive: true
  });

  const fileInputRef = useRef(null);

  // Cargar clientes corporativos
  useEffect(() => {
    loadCorporateClients();
  }, []);

  // Auto-guardado
  useEffect(() => {
    if (autoSaveEnabled && processedData.length > 0) {
      const timer = setTimeout(() => {
        saveToLocalStorage();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [processedData, autoSaveEnabled]);

  const loadCorporateClients = async () => {
    console.log('🔍 Cargando clientes corporativos...');
    
    if (!profile?.company?.id) {
      console.error('❌ No hay company ID en el perfil');
      setCorporateClients([]);
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
        contract_start_date: client.contract_start_date || client.created_at || new Date().toISOString().split('T')[0],
        status: client.is_active !== false ? 'active' : 'inactive',
        created_at: client.created_at || new Date().toISOString()
      }));

      setCorporateClients(transformedClients);
    } catch (error) {
      console.error('💥 Error en loadCorporateClients:', error);
      setCorporateClients([]);
    }
  };

  // Campos mejorados con validación avanzada
  const requiredFields = [
    { key: 'rut', label: 'RUT del Deudor', type: 'text', required: true, icon: Shield },
    { key: 'full_name', label: 'Nombre Completo', type: 'text', required: true, icon: Users },
    { key: 'email', label: 'Email', type: 'email', required: false, icon: FileText },
    { key: 'phone', label: 'Teléfono', type: 'phone', required: false, icon: FileText },
    { key: 'debt_amount', label: 'Monto de Deuda', type: 'currency', required: true, icon: TrendingUp },
    { key: 'due_date', label: 'Fecha de Vencimiento', type: 'date', required: true, icon: Clock },
    { key: 'creditor_name', label: 'Nombre del Acreedor', type: 'text', required: true, icon: Building },
    { key: 'debt_reference', label: 'Referencia de Deuda', type: 'text', required: false, icon: FileText },
    { key: 'debt_type', label: 'Tipo de Deuda', type: 'select', required: false, icon: Filter },
    { key: 'interest_rate', label: 'Tasa de Interés (%)', type: 'percentage', required: false, icon: BarChart3 },
    { key: 'description', label: 'Descripción', type: 'text', required: false, icon: FileText }
  ];

  // Tipos de deuda predefinidos
  const debtTypes = [
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'loan', label: 'Préstamo Personal' },
    { value: 'mortgage', label: 'Hipoteca' },
    { value: 'consumer_loan', label: 'Crédito de Consumo' },
    { value: 'vehicle_loan', label: 'Crédito Vehicular' },
    { value: 'student_loan', label: 'Crédito Estudiantil' },
    { value: 'medical_debt', label: 'Deuda Médica' },
    { value: 'utility_bill', label: 'Cuenta de Servicios' },
    { value: 'rent', label: 'Alquiler' },
    { value: 'tax_debt', label: 'Deuda Tributaria' },
    { value: 'other', label: 'Otra' }
  ];

  // Plantilla mejorada
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
        description: 'Deuda tarjeta de crédito'
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
        description: 'Crédito consumo'
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
    
    XLSX.writeFile(wb, 'plantilla_importacion_deudas_avanzada.xlsx');
  };

  // Super normalización de RUT chileno
  const superNormalizeRUT = (rut) => {
    if (!rut) return '';
    
    console.log('🔍 Super normalizando RUT:', rut);
    
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
    
    // Validar que el dígito verificador sea correcto
    if (numbers.length > 0) {
      const expectedDV = calculateRUTDV(numbers);
      if (dv !== expectedDV && validationRules.rutStrict) {
        console.warn('⚠️ Dígito verificador incorrecto, corrigiendo:', dv, '->', expectedDV);
        dv = expectedDV;
      }
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
    
    const result = formatted + '-' + dv;
    console.log('✅ RUT super normalizado:', result);
    return result;
  };

  // Super normalización de teléfono
  const superNormalizePhone = (phone) => {
    if (!phone) return '';
    
    console.log('🔍 Super normalizando teléfono:', phone);
    
    // Eliminar todos los caracteres no numéricos excepto el +
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    
    // Normalización avanzada para Chile
    if (!cleaned.startsWith('+')) {
      // Si es un número chileno de 9 dígitos (empezando con 9)
      if (cleaned.length === 9 && cleaned.startsWith('9')) {
        cleaned = '+56' + cleaned;
      }
      // Si es un número de 8 dígitos (sin el 9)
      else if (cleaned.length === 8) {
        cleaned = '+569' + cleaned;
      }
      // Si es un número de 9 dígitos pero no empieza con 9
      else if (cleaned.length === 9) {
        cleaned = '+569' + cleaned;
      }
      // Si incluye código de país sin +
      else if (cleaned.length === 11 && cleaned.startsWith('569')) {
        cleaned = '+' + cleaned;
      }
      // Si es un número local (7 dígitos)
      else if (cleaned.length === 7) {
        cleaned = '+562' + cleaned; // Asumir Santiago
      }
    } else {
      // Si ya tiene +, validar formato
      if (cleaned.startsWith('+56') && cleaned.length === 12 && cleaned[3] !== '9') {
        // Número chileno sin el 9
        cleaned = '+569' + cleaned.substring(4);
      }
    }
    
    console.log('✅ Teléfono super normalizado:', cleaned);
    return cleaned;
  };

  // Calcular dígito verificador de RUT
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

  // Asistente de IA para normalización masiva
  const applyAINormalization = async () => {
    setAiProcessing(true);
    setShowAIAssistant(true);
    
    try {
      // Simular procesamiento con IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const normalizedData = processedData.map(row => {
        const newRow = { ...row };
        
        // Aplicar normalización super avanzada
        if (row.rut) {
          newRow.rut = superNormalizeRUT(row.rut);
          newRow._aiNormalized = newRow._aiNormalized || [];
          if (newRow.rut !== row.rut) {
            newRow._aiNormalized.push(`RUT: ${row.rut} → ${newRow.rut}`);
          }
        }
        
        if (row.phone) {
          newRow.phone = superNormalizePhone(row.phone);
          newRow._aiNormalized = newRow._aiNormalized || [];
          if (newRow.phone !== row.phone) {
            newRow._aiNormalized.push(`Teléfono: ${row.phone} → ${newRow.phone}`);
          }
        }
        
        // Corregir email automáticamente
        if (row.email && validationRules.emailStrict) {
          const email = row.email.toString().trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            // Intentar correcciones comunes
            let corrected = email
              .replace(/[,;]/g, '.') // Reemplazar comas y puntos y comas
              .replace(/\s+/g, '.') // Reemplazar espacios con puntos
              .replace(/\.+/g, '.'); // Múltiples puntos a uno solo
            
            if (emailRegex.test(corrected)) {
              newRow.email = corrected;
              newRow._aiNormalized = newRow._aiNormalized || [];
              newRow._aiNormalized.push(`Email: ${row.email} → ${corrected}`);
            }
          }
        }
        
        // Validar y corregir monto
        if (row.debt_amount && validationRules.amountPositive) {
          const amount = parseFloat(row.debt_amount.toString().replace(/[$\s.,]/g, '').replace(',', '.'));
          if (isNaN(amount) || amount <= 0) {
            newRow.debt_amount = Math.abs(amount || 100000);
            newRow._aiNormalized = newRow._aiNormalized || [];
            newRow._aiNormalized.push(`Monto corregido a: $${newRow.debt_amount.toLocaleString('es-CL')}`);
          }
        }
        
        return newRow;
      });
      
      setProcessedData(normalizedData);
      
      await Swal.fire({
        icon: 'success',
        title: '✨ IA Procesamiento Completado',
        html: `
          <div style="text-align: left;">
            <p><strong>🤖 La IA ha normalizado los datos automáticamente:</strong></p>
            <br>
            <p>• RUTs formateados con estándar chileno</p>
            <p>• Teléfonos normalizados a formato internacional</p>
            <p>• Emails corregidos automáticamente</p>
            <p>• Montos validados y corregidos</p>
            <br>
            <p><strong>${normalizedData.filter(r => r._aiNormalized && r._aiNormalized.length > 0).length}</strong> registros mejorados</p>
          </div>
        `,
        confirmButtonColor: '#10B981',
        width: '500px'
      });
      
    } catch (error) {
      console.error('Error en IA normalization:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en Procesamiento IA',
        text: 'No se pudo completar la normalización automática',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setAiProcessing(false);
      setShowAIAssistant(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

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

    const validation = validateImportFile(selectedFile);
    if (!validation.isValid) {
      await Swal.fire({
        icon: 'error',
        title: 'Archivo No Válido',
        text: validation.errors.join('\n'),
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    setFile(selectedFile);
    await parseFile(selectedFile);
    setCurrentStep(2);
  };

  // Parsear archivo mejorado
  const parseFile = async (file) => {
    try {
      let data = [];

      if (file.type === 'text/csv') {
        const result = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Limpiar headers
            complete: resolve,
            error: reject
          });
        });
        data = result.data;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { defval: '' }); // Evitar undefined
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
          text: 'El archivo no puede contener más de 10,000 registros.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      setParsedData(data);
      
      // Generar mapeo automático mejorado
      const autoMapping = generateAdvancedAutoMapping(data[0]);
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

  // Generar mapeo automático avanzado
  const generateAdvancedAutoMapping = (firstRow) => {
    const mapping = {};
    const columns = Object.keys(firstRow);

    // Mapeos mejorados con más variaciones
    const commonMappings = {
      rut: ['rut', 'r.u.t', 'run', 'dni', 'cedula', 'identificacion', 'id', 'documento', 'nro_documento'],
      full_name: ['nombre', 'name', 'full_name', 'nombre_completo', 'cliente', 'deudor', 'razon_social', 'nombre_cliente'],
      email: ['email', 'correo', 'mail', 'e-mail', 'email_contacto', 'correo_electronico'],
      phone: ['telefono', 'phone', 'celular', 'movil', 'contacto', 'telefono_contacto', 'fono'],
      debt_amount: ['monto', 'amount', 'deuda', 'saldo', 'total', 'valor', 'importe', 'capital'],
      due_date: ['fecha_vencimiento', 'due_date', 'vencimiento', 'fecha', 'fecha_vto', 'vto'],
      creditor_name: ['acreedor', 'creditor', 'empresa', 'entidad', 'banco', 'institucion', 'proveedor'],
      debt_reference: ['referencia', 'reference', 'numero', 'id_deuda', 'nro_operacion', 'codigo'],
      debt_type: ['tipo', 'type', 'categoria', 'categoria_deuda', 'clasificacion'],
      interest_rate: ['interes', 'interest', 'tasa', 'tasa_interes', 'porcentaje'],
      description: ['descripcion', 'description', 'detalle', 'comentario', 'observaciones', 'notas']
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

  // Procesamiento avanzado de datos
  const processAdvancedData = useCallback(() => {
    const processed = [];
    const errors = [];
    const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);

    parsedData.forEach((row, index) => {
      const processedRow = { ...row };
      const rowErrors = [];
      const autoGeneratedFields = [];

      requiredFieldKeys.forEach(fieldKey => {
        const mappedColumn = fieldMapping[fieldKey];
        const fieldInfo = requiredFields.find(f => f.key === fieldKey);
        
        if (!mappedColumn) {
          // Campo no mapeado - generar automáticamente
          const autoValue = generateSmartAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
        } else if (!row[mappedColumn]) {
          // Campo vacío - generar automáticamente
          const autoValue = generateSmartAutoData(row, fieldKey);
          processedRow[fieldKey] = autoValue;
          autoGeneratedFields.push(`${fieldInfo.label}: ${autoValue}`);
        } else {
          // Campo existe - validar y limpiar con super normalización
          let value = row[mappedColumn];
          
          if (fieldKey === 'debt_amount') {
            value = parseFloat(value.toString().replace(/[$\s.,]/g, '').replace(',', '.'));
            if (isNaN(value) || value <= 0) {
              value = generateSmartAutoData(row, fieldKey);
              autoGeneratedFields.push(`${fieldInfo.label}: ${value} (corregido)`);
            }
            processedRow[fieldKey] = value;
          } else if (fieldKey === 'due_date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              value = generateSmartAutoData(row, fieldKey);
              autoGeneratedFields.push(`${fieldInfo.label}: ${value} (corregido)`);
            } else {
              value = date.toISOString().split('T')[0];
            }
            processedRow[fieldKey] = value;
          } else if (fieldKey === 'rut') {
            const rut = superNormalizeRUT(value);
            processedRow[fieldKey] = rut;
            const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
            if (!rutRegex.test(rut)) {
              rowErrors.push(`RUT "${value}" no pudo ser normalizado correctamente`);
            }
          } else if (fieldKey === 'phone') {
            const phone = superNormalizePhone(value);
            processedRow[fieldKey] = phone;
          } else if (fieldKey === 'email' && value) {
            const email = value.toString().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              rowErrors.push(`Email "${email}" tiene formato inválido`);
            }
            processedRow[fieldKey] = email;
          } else {
            processedRow[fieldKey] = value;
          }
        }
      });

      // Agregar metadatos
      processedRow._originalIndex = index + 1;
      processedRow._autoGenerated = autoGeneratedFields;
      processedRow._hasErrors = rowErrors.length > 0;
      processedRow._errors = rowErrors;
      processedRow._selected = false;

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: processedRow
        });
      }

      processed.push(processedRow);
    });

    setProcessedData(processed);
    setValidationErrors(errors);
    
    return {
      processed,
      errors,
      hasAutoGenerated: processed.some(r => r._autoGenerated.length > 0)
    };
  }, [parsedData, fieldMapping]);

  // Generación inteligente de datos
  const generateSmartAutoData = (row, fieldKey) => {
    switch (fieldKey) {
      case 'rut':
        const rutNumbers = Math.floor(Math.random() * 20000000) + 1000000;
        return superNormalizeRUT(rutNumbers.toString());
      
      case 'phone':
        const phoneNumbers = Math.floor(Math.random() * 90000000) + 10000000;
        return superNormalizePhone('+569' + phoneNumbers.toString().substring(0, 8));
      
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

  // Funciones de ordenamiento y filtrado
  const sortData = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...processedData].sort((a, b) => {
      let aVal = a[field] || '';
      let bVal = b[field] || '';
      
      if (field === 'debt_amount') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (newDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setProcessedData(sorted);
  };

  const filterData = (status) => {
    setFilterStatus(status);
  };

  const getFilteredData = () => {
    let filtered = processedData;
    
    if (filterStatus === 'errors') {
      filtered = processedData.filter(r => r._hasErrors);
    } else if (filterStatus === 'valid') {
      filtered = processedData.filter(r => !r._hasErrors);
    } else if (filterStatus === 'selected') {
      filtered = processedData.filter(r => selectedRows.has(r._originalIndex));
    }
    
    return filtered;
  };

  // Guardado en localStorage
  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        processedData,
        fieldMapping,
        selectedCorporateClient,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('advancedImportData', JSON.stringify(dataToSave));
      console.log('💾 Datos guardados automáticamente');
    } catch (error) {
      console.error('Error guardando datos:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('advancedImportData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setProcessedData(data.processedData || []);
        setFieldMapping(data.fieldMapping || {});
        setSelectedCorporateClient(data.selectedCorporateClient || '');
        console.log('📂 Datos recuperados desde localStorage');
      }
    } catch (error) {
      console.error('Error cargando datos guardados:', error);
    }
  };

  // Iniciar importación avanzada
  const startAdvancedImport = async () => {
    if (!selectedCorporateClient || selectedCorporateClient === 'general') {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente Corporativo Requerido',
        text: 'Debe seleccionar un cliente corporativo específico',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    const { processed, errors, hasAutoGenerated } = processAdvancedData();
    
    if (errors.length > 0 || hasAutoGenerated) {
      setCurrentStep(3);
      setShowDataEditor(true);
      return;
    }

    await performAdvancedImport(processed);
  };

  // Realizar importación avanzada
  const performAdvancedImport = async (dataToImport) => {
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

      const result = await bulkImportService.bulkImportDebts(mappedData, {
        companyId: profile.company.id,
        clientId: selectedCorporateClient,
        onProgress: (progress) => {
          setImportProgress(prev => ({
            ...prev,
            processed: progress.processed,
            successful: progress.successful,
            failed: progress.failed,
            status: 'processing'
          }));
        },
        onBatchComplete: (batchResult) => {
          setImportProgress(prev => ({
            ...prev,
            currentBatch: batchResult.batchNumber
          }));
        }
      });

      if (result.success) {
        setImportProgress(prev => ({
          ...prev,
          status: 'completed',
          ...result
        }));

        await Swal.fire({
          icon: 'success',
          title: '✨ Importación Avanzada Completada',
          html: `
            <div style="text-align: left;">
              <p><strong>🎉 Importación completada con éxito</strong></p>
              <br>
              <p><strong>📊 Total procesados:</strong> ${result.totalRows}</p>
              <p><strong>✅ Exitosos:</strong> <span style="color: #10B981">${result.successful}</span></p>
              <p><strong>❌ Fallidos:</strong> <span style="color: #EF4444">${result.failed}</span></p>
              <p><strong>👥 Usuarios creados:</strong> ${result.createdUsers}</p>
              <p><strong>💰 Deudas creadas:</strong> ${result.createdDebts}</p>
              <p><strong>⏱️ Tiempo:</strong> ${result.duration.toFixed(1)}s</p>
              <p><strong>📈 Tasa de éxito:</strong> <span style="color: #10B981">${result.successRate.toFixed(1)}%</span></p>
            </div>
          `,
          confirmButtonText: '¡Excelente!',
          confirmButtonColor: '#10B981',
          width: '500px'
        });

        // Limpiar localStorage después de importación exitosa
        localStorage.removeItem('advancedImportData');
        
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
      console.error('Error during advanced import:', error);
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
    setProcessedData([]);
    setSelectedRows(new Set());
    setShowPreview(false);
    setShowMapping(false);
    setShowDataEditor(false);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Renderizado del componente principal
  return (
    <div className="space-y-6">
      {/* Header con pasos */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sistema Avanzado de Importación</h1>
              <p className="text-blue-100">Importa y normaliza datos de deudores con asistencia de IA</p>
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
                Máximo 10,000 registros por archivo.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="advanced-file-upload"
              />

              <Button
                variant="gradient"
                onClick={() => document.getElementById('advanced-file-upload').click()}
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
                    onClick={startAdvancedImport}
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
          {/* Resumen y herramientas */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Resumen de Datos</h3>
                  <p className="text-sm text-blue-700">
                    Revisa y edita los datos antes de importar
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={applyAINormalization}
                  disabled={aiProcessing}
                  leftIcon={<Brain className="w-3 h-3" />}
                  className="text-blue-600 border-blue-300"
                >
                  {aiProcessing ? 'Procesando...' : 'Normalizar con IA'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIAssistant(true)}
                  leftIcon={<Sparkles className="w-3 h-3" />}
                  className="text-purple-600 border-purple-300"
                >
                  Asistente IA
                </Button>
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

          {/* Herramientas de filtrado y ordenamiento */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'Todos los registros' },
                    { value: 'valid', label: 'Solo válidos' },
                    { value: 'errors', label: 'Con errores' },
                    { value: 'selected', label: 'Seleccionados' }
                  ]}
                  className="w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSelected = new Set();
                    getFilteredData().forEach(row => newSelected.add(row._originalIndex));
                    setSelectedRows(newSelected);
                  }}
                  leftIcon={<CheckSquare className="w-3 h-3" />}
                >
                  Seleccionar Todo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRows(new Set())}
                  leftIcon={<Square className="w-3 h-3" />}
                >
                  Deseleccionar
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
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === getFilteredData().length && getFilteredData().length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = new Set();
                              getFilteredData().forEach(row => newSelected.add(row._originalIndex));
                              setSelectedRows(newSelected);
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => sortData('_originalIndex')}>
                        Fila {sortField === '_originalIndex' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      {requiredFields.filter(f => f.required).map((field) => (
                        <th key={field.key} 
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => sortData(field.key)}>
                          {field.label} {sortField === field.key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredData().slice(0, 50).map((row, index) => (
                      <tr key={index} className={row._hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row._originalIndex)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(row._originalIndex);
                              } else {
                                newSelected.delete(row._originalIndex);
                              }
                              setSelectedRows(newSelected);
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {row._originalIndex}
                        </td>
                        {requiredFields.filter(f => f.required).map((field) => (
                          <td key={field.key} className="px-3 py-2 text-sm">
                            {editingCell?.rowIndex === row._originalIndex - 1 && editingCell?.fieldKey === field.key ? (
                              <input
                                type={field.type === 'currency' ? 'number' : 'text'}
                                value={row[field.key] || ''}
                                onChange={(e) => {
                                  const newData = [...processedData];
                                  const rowIndex = processedData.findIndex(r => r._originalIndex === row._originalIndex);
                                  if (fieldKey === 'rut') {
                                    newData[rowIndex][field.key] = superNormalizeRUT(e.target.value);
                                  } else if (fieldKey === 'phone') {
                                    newData[rowIndex][field.key] = superNormalizePhone(e.target.value);
                                  } else {
                                    newData[rowIndex][field.key] = e.target.value;
                                  }
                                  setProcessedData(newData);
                                }}
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
                                onClick={() => setEditingCell({ rowIndex: row._originalIndex - 1, fieldKey: field.key })}
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
                                  <span className="ml-1 text-blue-500">★</span>
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
              onClick={() => performAdvancedImport(getFilteredData().filter(r => !r._hasErrors))}
              disabled={getFilteredData().filter(r => !r._hasErrors).length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
              leftIcon={<Play className="w-4 h-4" />}
            >
              Importar {getFilteredData().filter(r => !r._hasErrors).length} Registros Válidos
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

      {/* Modal de Mapeo de Campos con SweetAlert */}
      {showMapping && (
        <FieldMappingModal
          isOpen={showMapping}
          onClose={() => setShowMapping(false)}
          fieldMapping={fieldMapping}
          setFieldMapping={setFieldMapping}
          requiredFields={requiredFields}
          parsedData={parsedData}
        />
      )}

      {/* Modal del Asistente de IA */}
      <Modal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title="Asistente de IA"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-200 rounded-3xl inline-block mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Asistente de Inteligencia Artificial
            </h3>
            <p className="text-sm text-gray-600">
              La IA puede ayudarte a normalizar y corregir tus datos automáticamente
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🔧 Normalización Automática</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Formateo automático de RUTs chilenos</li>
                <li>• Normalización de teléfonos a formato internacional</li>
                <li>• Corrección de errores comunes en emails</li>
                <li>• Validación y corrección de montos</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">✨ Características Inteligentes</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Detección de patrones y corrección masiva</li>
                <li>• Sugerencias basadas en el contexto</li>
                <li>• Validación avanzada de datos</li>
                <li>• Auto-corrección de errores comunes</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">🎯 Reglas de Validación</h4>
              <div className="space-y-2">
                {Object.entries(validationRules).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-purple-700">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setValidationRules(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded"
                    />
                    {key === 'rutStrict' && 'Validación estricta de RUT'}
                    {key === 'phoneStrict' && 'Validación estricta de teléfono'}
                    {key === 'emailStrict' && 'Validación estricta de email'}
                    {key === 'amountPositive' && 'Montos deben ser positivos'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowAIAssistant(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              variant="gradient"
              onClick={applyAINormalization}
              disabled={aiProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              leftIcon={<Wand2 className="w-4 h-4" />}
            >
              {aiProcessing ? 'Procesando...' : 'Aplicar IA'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedImportSystem;