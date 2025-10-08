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
  Building
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
    if (!profile?.company?.id) return;

    try {
      // Por ahora simulamos los datos de clientes corporativos
      // En producción, esto debería consultar una tabla real de clientes corporativos
      const mockCorporateClients = [
        {
          id: '1',
          company_name: 'TechCorp S.A.',
          contact_name: 'María González',
          contact_email: 'maria@techcorp.cl',
          contact_phone: '+56912345678',
          company_rut: '76.543.210-1',
          address: 'Av. Providencia 123, Santiago',
          industry: 'Tecnología',
          contract_value: 5000000,
          contract_start_date: '2024-01-15',
          status: 'active',
          created_at: '2024-01-10'
        },
        {
          id: '2',
          company_name: 'RetailMax Ltda.',
          contact_name: 'Carlos Rodríguez',
          contact_email: 'carlos@retailmax.cl',
          contact_phone: '+56987654321',
          company_rut: '98.765.432-1',
          address: 'Calle Comercio 456, Concepción',
          industry: 'Retail',
          contract_value: 3200000,
          contract_start_date: '2024-02-01',
          status: 'active',
          created_at: '2024-01-25'
        }
      ];

      setCorporateClients(mockCorporateClients);
    } catch (error) {
      console.error('Error loading corporate clients:', error);
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

    // Validar que se haya seleccionado un cliente corporativo
    if (!selectedCorporateClient) {
      alert('Por favor selecciona un cliente corporativo antes de subir el archivo.');
      return;
    }

    // Validar archivo usando el servicio
    const validation = validateImportFile(selectedFile);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

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
        alert('El archivo no contiene datos válidos');
        return;
      }

      if (data.length > 10000) {
        alert('El archivo no puede contener más de 10,000 registros. Por favor divide los datos en archivos más pequeños.');
        return;
      }

      setParsedData(data);
      setShowPreview(true);

      // Generar mapeo automático basado en nombres de columnas
      const autoMapping = generateAutoMapping(data[0]);
      setFieldMapping(autoMapping);

    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error al procesar el archivo. Verifica que el formato sea correcto.');
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

  // Validar datos mapeados
  const validateMappedData = () => {
    const errors = [];
    const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);

    parsedData.forEach((row, index) => {
      const rowErrors = [];

      // Validar campos requeridos
      requiredFieldKeys.forEach(fieldKey => {
        const mappedColumn = fieldMapping[fieldKey];
        if (!mappedColumn || !row[mappedColumn]) {
          rowErrors.push(`${fieldKey} es requerido`);
        }
      });

      // Validar formato de RUT
      if (fieldMapping.rut && row[fieldMapping.rut]) {
        const rut = row[fieldMapping.rut].toString();
        if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(rut)) {
          rowErrors.push('RUT debe tener formato XX.XXX.XXX-X');
        }
      }

      // Validar email
      if (fieldMapping.email && row[fieldMapping.email]) {
        const email = row[fieldMapping.email].toString();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          rowErrors.push('Email tiene formato inválido');
        }
      }

      // Validar monto
      if (fieldMapping.debt_amount && row[fieldMapping.debt_amount]) {
        const amount = parseFloat(row[fieldMapping.debt_amount]);
        if (isNaN(amount) || amount <= 0) {
          rowErrors.push('Monto debe ser un número positivo');
        }
      }

      // Validar fecha
      if (fieldMapping.due_date && row[fieldMapping.due_date]) {
        const date = new Date(row[fieldMapping.due_date]);
        if (isNaN(date.getTime())) {
          rowErrors.push('Fecha de vencimiento inválida');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors
        });
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Iniciar proceso de importación
  const startImport = async () => {
    if (!validateMappedData()) {
      alert('Hay errores de validación. Corrige los errores antes de importar.');
      return;
    }

    setIsProcessing(true);
    setImportProgress({
      total: parsedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      status: 'starting'
    });

    try {
      // Preparar datos mapeados para importación
      const mappedData = parsedData.map(row => ({
        rut: row[fieldMapping.rut],
        full_name: row[fieldMapping.full_name],
        email: row[fieldMapping.email] || null,
        phone: row[fieldMapping.phone] || null,
        debt_amount: parseFloat(row[fieldMapping.debt_amount]),
        due_date: row[fieldMapping.due_date],
        creditor_name: row[fieldMapping.creditor_name],
        debt_reference: row[fieldMapping.debt_reference] || null,
        debt_type: row[fieldMapping.debt_type] || 'other',
        interest_rate: row[fieldMapping.interest_rate] ? parseFloat(row[fieldMapping.interest_rate]) : 0,
        description: row[fieldMapping.description] || null
      }));

      // Usar el servicio de importación masiva
      const result = await bulkImportService.bulkImportDebts(mappedData, {
        companyId: profile.company.id,
        clientId: selectedCorporateClient, // Cliente corporativo seleccionado
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

        alert(`✅ Importación completada exitosamente!\n\n` +
              `📊 Total procesados: ${result.totalRows}\n` +
              `✅ Exitosos: ${result.successful}\n` +
              `❌ Fallidos: ${result.failed}\n` +
              `👥 Usuarios creados: ${result.createdUsers}\n` +
              `💰 Deudas creadas: ${result.createdDebts}\n` +
              `⏱️ Tiempo: ${result.duration.toFixed(1)}s\n` +
              `📈 Tasa de éxito: ${result.successRate.toFixed(1)}%`);

        if (onImportComplete) {
          onImportComplete();
        }
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
      alert('❌ Error durante la importación: ' + error.message);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Upload className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Importación Masiva de Deudas
            </h2>
            <p className="text-gray-600">
              Sube un archivo CSV o Excel con los datos de tus deudores
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={downloadTemplate}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Descargar Plantilla
        </Button>
      </div>

      {/* Corporate Client Selection */}
      {!file && corporateClients.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Seleccionar Cliente Corporativo
              </h3>
              <p className="text-sm text-blue-700">
                Elige a qué cliente corporativo se cargarán las deudas
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <select
              value={selectedCorporateClient}
              onChange={(e) => setSelectedCorporateClient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            >
              <option value="">Selecciona un cliente corporativo...</option>
              {corporateClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name} - {client.company_rut}
                </option>
              ))}
            </select>

            {selectedCorporateClient && (
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {corporateClients.find(c => c.id === selectedCorporateClient)?.company_name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>RUT: {corporateClients.find(c => c.id === selectedCorporateClient)?.company_rut}</div>
                  <div>Industria: {corporateClients.find(c => c.id === selectedCorporateClient)?.industry}</div>
                  <div>Valor Contrato: ${corporateClients.find(c => c.id === selectedCorporateClient)?.contract_value?.toLocaleString('es-CL')}</div>
                  <div>Estado: <span className="text-green-600 font-medium">Activo</span></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Upload Area */}
      {!file && selectedCorporateClient && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <div className="text-center py-12">
            <div className="p-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl inline-block mb-6">
              <FileText className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Sube tu archivo de deudas
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Selecciona un archivo CSV o Excel con los datos de tus clientes.
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
              leftIcon={<Upload className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Seleccionar Archivo
            </Button>

            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2"><strong>Formatos soportados:</strong> CSV, Excel (.xls, .xlsx)</p>
              <p><strong>Tamaño máximo:</strong> 10MB</p>
            </div>
          </div>
        </Card>
      )}

      {/* File Info & Actions */}
      {file && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
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
                size="sm"
                onClick={() => setShowPreview(true)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Vista Previa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapping(true)}
                leftIcon={<Settings className="w-4 h-4" />}
              >
                Mapear Campos
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={clearAll}
                leftIcon={<Trash2 className="w-4 h-4" />}
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
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Errores de Validación</h3>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validationErrors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>Fila {error.row}:</strong> {error.errors.join(', ')}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <p className="text-sm text-red-600">
                ... y {validationErrors.length - 10} errores más
              </p>
            )}
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
    </div>
  );
};

export default BulkImportDebts;