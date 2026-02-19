import React, { useState, useRef } from 'react';
import { X, FileText, Download, PenTool } from 'lucide-react';

const JustificanteModal = ({ isOpen, onClose, booking }) => {
  const [signatureData, setSignatureData] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [justificanteData, setJustificanteData] = useState({
    motivo: '',
    diagnostico: '',
    recomendaciones: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    validoHasta: ''
  });
  const canvasRef = useRef(null);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJustificanteData(prev => ({ ...prev, [name]: value }));
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastPoint({ x, y });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Guardar la firma como imagen base64
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL();
      setSignatureData(dataURL);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const generateJustificante = () => {
    if (!signatureData) {
      alert('Por favor, añada su firma antes de generar el justificante.');
      return;
    }

    // Crear el contenido del justificante
    const justificanteContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Justificante Médico</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .content { margin: 20px 0; }
          .field { margin: 15px 0; }
          .label { font-weight: bold; }
          .signature-section { margin-top: 40px; text-align: right; }
          .signature { border: 1px solid #ccc; padding: 10px; display: inline-block; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JUSTIFICANTE MÉDICO</h1>
          <p><strong>Centro de Terapia Psicológica</strong></p>
          <p>Colegiado Nº: 12345 | NIF: 12345678A</p>
        </div>
        
        <div class="content">
          <div class="field">
            <span class="label">Paciente:</span> ${booking?.clientName || ''}
          </div>
          <div class="field">
            <span class="label">Fecha de la consulta:</span> ${new Date(booking?.date).toLocaleDateString('es-ES')} - ${booking?.startTime}
          </div>
          <div class="field">
            <span class="label">Tipo de terapia:</span> ${booking?.therapyType || ''}
          </div>
          <div class="field">
            <span class="label">Motivo de la consulta:</span> ${justificanteData.motivo}
          </div>
          <div class="field">
            <span class="label">Diagnóstico/Observaciones:</span> ${justificanteData.diagnostico}
          </div>
          <div class="field">
            <span class="label">Recomendaciones:</span> ${justificanteData.recomendaciones}
          </div>
          <div class="field">
            <span class="label">Fecha de emisión:</span> ${new Date(justificanteData.fechaEmision).toLocaleDateString('es-ES')}
          </div>
          ${justificanteData.validoHasta ? `
          <div class="field">
            <span class="label">Válido hasta:</span> ${new Date(justificanteData.validoHasta).toLocaleDateString('es-ES')}
          </div>` : ''}
        </div>
        
        <div class="signature-section">
          <p>Firma del profesional:</p>
          <div class="signature">
            <img src="${signatureData}" alt="Firma" style="max-width: 200px; max-height: 100px;" />
          </div>
          <p style="margin-top: 10px;">Dr./Dra. [Nombre del Profesional]</p>
        </div>
        
        <div class="footer">
          <p>Este documento es un justificante médico válido para efectos laborales y académicos.</p>
          <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    // Crear y descargar el archivo
    const blob = new Blob([justificanteContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `justificante_${booking?.id}_${booking?.clientName?.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // También abrir en nueva ventana para vista previa
    const newWindow = window.open();
    newWindow.document.write(justificanteContent);
    newWindow.document.close();

    onClose();
  };

  const handleClose = () => {
    // Limpiar formulario y firma al cerrar
    setJustificanteData({
      motivo: '',
      diagnostico: '',
      recomendaciones: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      validoHasta: ''
    });
    clearSignature();
    onClose();
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Generar Justificante Médico</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del paciente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>
                <span className="ml-2 text-gray-900">{booking.clientName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{booking.clientEmail}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha de la cita:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(booking.date).toLocaleDateString('es-ES')} - {booking.startTime}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tipo de terapia:</span>
                <span className="ml-2 text-gray-900">{booking.therapyType}</span>
              </div>
            </div>
          </div>

          {/* Formulario del justificante */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Detalles del Justificante</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaEmision" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  id="fechaEmision"
                  name="fechaEmision"
                  value={justificanteData.fechaEmision}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="validoHasta" className="block text-sm font-medium text-gray-700 mb-1">
                  Válido Hasta (opcional)
                </label>
                <input
                  type="date"
                  id="validoHasta"
                  name="validoHasta"
                  value={justificanteData.validoHasta}
                  onChange={handleInputChange}
                  min={justificanteData.fechaEmision}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la Consulta *
              </label>
              <textarea
                id="motivo"
                name="motivo"
                value={justificanteData.motivo}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describa el motivo de la consulta..."
                required
              />
            </div>

            <div>
              <label htmlFor="diagnostico" className="block text-sm font-medium text-gray-700 mb-1">
                Diagnóstico/Observaciones *
              </label>
              <textarea
                id="diagnostico"
                name="diagnostico"
                value={justificanteData.diagnostico}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Diagnóstico u observaciones clínicas..."
                required
              />
            </div>

            <div>
              <label htmlFor="recomendaciones" className="block text-sm font-medium text-gray-700 mb-1">
                Recomendaciones
              </label>
              <textarea
                id="recomendaciones"
                name="recomendaciones"
                value={justificanteData.recomendaciones}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Recomendaciones para el paciente..."
              />
            </div>
          </div>

          {/* Sección de firma */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Firma Digital *</h3>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Limpiar Firma
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center mb-4">
                <PenTool className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Firme en el área de abajo</p>
              </div>
              
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-300 rounded cursor-crosshair w-full"
                style={{ maxWidth: '100%', height: 'auto' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={generateJustificante}
              disabled={!justificanteData.motivo || !justificanteData.diagnostico || !signatureData}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Generar Justificante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JustificanteModal;