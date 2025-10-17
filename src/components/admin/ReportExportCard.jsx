/**
 * Report Export Card Component
 * 
 * Componente para exportación avanzada de reportes
 * Integración con el servicio de exportación
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '../common';
import { reportExportService } from '../../services/reportExportService';
import {
  Download,
  FileText,
  Table,
  Calendar,
  Clock,
  Send,
  Settings,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const ReportExportCard = ({ currentMetrics }) => {
  const [exportHistory, setExportHistory] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    template: 'financial',
    format: 'pdf',
    schedule: 'weekly',
    recipients: [],
    enabled: true
  });

  // Cargar datos al montar
  useEffect(() => {
    loadExportData();
  }, []);

  const loadExportData = () => {
    setExportHistory(reportExportService.getExportHistory());
    setScheduledReports(reportExportService.getScheduledReports());
  };

  const handleExport = async (format, template) => {
    try {
      setLoading(true);
      setExportProgress({ stage: 'preparing', progress: 0 });

      // Preparar datos para exportación
      const reportData = {
        ...currentMetrics,
        period: 'Últimos 30 días',
        generatedAt: new Date().toISOString(),
        logo: null // Aquí se podría agregar un logo
      };

      setExportProgress({ stage: 'generating', progress: 50 });

      let result;
      switch (format) {
        case 'pdf':
          result = await reportExportService.exportToPDF(reportData, {
            title: `Reporte ${template}`,
            template,
            includeCharts: true
          });
          break;
        case 'excel':
          result = await reportExportService.exportToExcel(reportData, {
            title: `Reporte ${template}`,
            template,
            multipleSheets: true
          });
          break;
        case 'csv':
          result = await reportExportService.exportToCSV(reportData, {
            title: `Reporte ${template}`,
            section: 'resumen'
          });
          break;
        default:
          throw new Error('Formato no soportado');
      }

      setExportProgress({ stage: 'downloading', progress: 90 });

      // Descargar archivo
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportProgress({ stage: 'completed', progress: 100 });

      // Limpiar URL
      setTimeout(() => URL.revokeObjectURL(result.url), 1000);

      // Recargar historial
      loadExportData();

      setTimeout(() => {
        setExportProgress(null);
        setLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error exportando reporte:', error);
      setExportProgress({ stage: 'error', progress: 0, error: error.message });
      setTimeout(() => {
        setExportProgress(null);
        setLoading(false);
      }, 3000);
    }
  };

  const handleScheduleReport = () => {
    const scheduledReport = reportExportService.scheduleReport({
      ...scheduleForm,
      recipients: scheduleForm.recipients.filter(r => r.trim() !== '')
    });

    setScheduledReports([...scheduledReports, scheduledReport]);
    setShowScheduleModal(false);
    setScheduleForm({
      template: 'financial',
      format: 'pdf',
      schedule: 'weekly',
      recipients: [],
      enabled: true
    });
  };

  const handleToggleReport = (reportId, enabled) => {
    reportExportService.toggleScheduledReport(reportId, enabled);
    setScheduledReports(reportExportService.getScheduledReports());
  };

  const handleDeleteReport = (reportId) => {
    reportExportService.removeScheduledReport(reportId);
    setScheduledReports(reportExportService.getScheduledReports());
  };

  const addRecipient = () => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index, value) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  const removeRecipient = (index) => {
    setScheduleForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return FileText;
      case 'excel': return Table;
      case 'csv': return Table;
      default: return FileText;
    }
  };

  const getScheduleColor = (schedule) => {
    switch (schedule) {
      case 'daily': return 'blue';
      case 'weekly': return 'green';
      case 'monthly': return 'purple';
      default: return 'gray';
    }
  };

  const getProgressMessage = () => {
    switch (exportProgress?.stage) {
      case 'preparing': return 'Preparando datos...';
      case 'generating': return 'Generando reporte...';
      case 'downloading': return 'Descargando archivo...';
      case 'completed': return '¡Reporte descargado!';
      case 'error': return `Error: ${exportProgress.error}`;
      default: return '';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">📊 Exportación de Reportes</h3>
              <p className="text-sm text-secondary-600">Genera y programa reportes automáticos</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Programar
          </Button>
        </div>

        {/* Export Progress */}
        {exportProgress && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              {exportProgress.stage === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : exportProgress.stage === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{getProgressMessage()}</p>
                {exportProgress.stage !== 'error' && exportProgress.stage !== 'completed' && (
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Export Options */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Exportación Rápida</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf', 'financial')}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 h-auto"
            >
              <FileText className="w-6 h-6 text-red-600" />
              <span className="text-sm font-medium">Reporte PDF</span>
              <span className="text-xs text-gray-500">Completo con gráficos</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('excel', 'financial')}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 h-auto"
            >
              <Table className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium">Reporte Excel</span>
              <span className="text-xs text-gray-500">Múltiples hojas</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('csv', 'financial')}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 h-auto"
            >
              <Table className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium">Datos CSV</span>
              <span className="text-xs text-gray-500">Para análisis</span>
            </Button>
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-secondary-900">Reportes Programados</h4>
            <Badge variant="secondary" size="sm">
              {scheduledReports.length} activos
            </Badge>
          </div>
          
          {scheduledReports.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No hay reportes programados</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleModal(true)}
                className="mt-2"
              >
                Crear primer reporte
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledReports.map((report) => {
                const FormatIcon = getFormatIcon(report.format);
                return (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FormatIcon className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Reporte {report.template}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Badge variant={getScheduleColor(report.schedule)} size="sm">
                            {report.schedule}
                          </Badge>
                          <span>{report.format.toUpperCase()}</span>
                          <span>{report.recipients.length} destinatarios</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleReport(report.id, !report.enabled)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {report.enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Export History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-secondary-900">Historial de Exportaciones</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={loadExportData}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Actualizar
            </Button>
          </div>
          
          {exportHistory.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No hay exportaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {exportHistory.slice(-5).reverse().map((exportItem) => {
                const FormatIcon = getFormatIcon(exportItem.type);
                return (
                  <div key={exportItem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FormatIcon className="w-3 h-3 text-gray-600" />
                      <span className="text-sm text-gray-900">{exportItem.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{exportItem.type.toUpperCase()}</span>
                      <span>{new Date(exportItem.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Programar Reporte Automático"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={scheduleForm.template}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, template: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="financial">Reporte Financiero</option>
              <option value="users">Reporte de Usuarios</option>
              <option value="performance">Reporte de Rendimiento</option>
              <option value="custom">Reporte Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Exportación
            </label>
            <select
              value={scheduleForm.format}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia
            </label>
            <select
              value={scheduleForm.schedule}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinatarios (Email)
            </label>
            {scheduleForm.recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={recipient}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="flex-1"
                />
                {scheduleForm.recipients.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addRecipient}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar destinatario
            </Button>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleScheduleReport}
              className="flex-1"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Programar Reporte
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ReportExportCard;