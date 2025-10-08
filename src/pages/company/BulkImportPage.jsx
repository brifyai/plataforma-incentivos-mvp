/**
 * Bulk Import Page
 *
 * Página para importar deudas masivamente desde archivos CSV/Excel
 */

import React, { useState } from 'react';
import { Card, Button, Input, ProgressBar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { bulkImportDebts } from '../../services/bulkImportService';
import Swal from 'sweetalert2';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  X
} from 'lucide-react';

const BulkImportPage = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Tipo de archivo no válido',
          text: 'Por favor, selecciona un archivo CSV o Excel (.xlsx, .xls)',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo demasiado grande',
          text: 'El archivo no puede superar los 10MB',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      setFile(selectedFile);
      setResults(null);
      setErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      setResults(null);
      setErrors([]);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await bulkImportDebts(file, user.id, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResults(result);

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
      }

      // Mostrar resultado
      await Swal.fire({
        icon: result.success ? 'success' : 'warning',
        title: result.success ? '¡Importación completada!' : 'Importación con advertencias',
        text: `Se procesaron ${result.totalProcessed} registros. ${result.successfulImports} exitosos, ${result.errors?.length || 0} errores.`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: result.success ? '#3B82F6' : '#F59E0B'
      });

    } catch (error) {
      console.error('Error importing debts:', error);
      setProgress(0);

      await Swal.fire({
        icon: 'error',
        title: 'Error en la importación',
        text: error.message || 'Ocurrió un error al procesar el archivo',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Crear un archivo CSV de ejemplo
    const csvContent = `rut,nombre,monto_original,descripcion,fecha_vencimiento
12345678-9,Juan Pérez,500000,Deuda por servicios,2024-12-31
98765432-1,María González,750000,Préstamo personal,2024-11-15
11223344-5,Carlos Rodríguez,300000,Factura pendiente,2024-10-20`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_importacion_deudas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
    setErrors([]);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importar Deudas</h1>
          <p className="text-gray-600 mt-1">
            Carga masiva de deudas desde archivos CSV o Excel
          </p>
        </div>
      </div>

      {/* Template Download */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Plantilla de Importación</h3>
              <p className="text-sm text-gray-600">
                Descarga la plantilla CSV con el formato correcto
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
      </Card>

      {/* File Upload */}
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seleccionar Archivo</h3>
            <p className="text-gray-600 text-sm mb-4">
              Selecciona un archivo CSV o Excel con las deudas a importar.
              Asegúrate de seguir el formato de la plantilla.
            </p>
          </div>

          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-900 font-medium">Arrastra y suelta tu archivo aquí</p>
                  <p className="text-gray-500 text-sm">o</p>
                  <label className="inline-block">
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                      selecciona un archivo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  CSV, Excel (.xlsx, .xls) - Máximo 10MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="flex justify-center">
              <Button
                onClick={handleUpload}
                loading={uploading}
                disabled={uploading}
                leftIcon={<Upload className="w-4 h-4" />}
                className="px-8"
              >
                {uploading ? 'Importando...' : 'Importar Deudas'}
              </Button>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso de importación</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Resultados de la Importación</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.successfulImports || 0}</div>
                <div className="text-sm text-green-700">Importados</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.errors?.length || 0}</div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.totalProcessed || 0}</div>
                <div className="text-sm text-blue-700">Procesados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.duplicates || 0}</div>
                <div className="text-sm text-yellow-700">Duplicados</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Errores Encontrados</h3>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Fila {error.row || index + 1}
                      </p>
                      <p className="text-sm text-red-700">{error.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BulkImportPage;