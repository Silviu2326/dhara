import React, { useState } from 'react';
import { X, Send, Users, MessageCircle } from 'lucide-react';
import { Button } from '../../../components/Button';

export const BroadcastMessageModal = ({ isOpen, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    recipients: 'all',
    subject: '',
    message: '',
    sendEmail: true,
    sendSMS: false
  });

  const recipientOptions = [
    { value: 'all', label: 'Todos los clientes', count: 45 },
    { value: 'active', label: 'Clientes activos', count: 32 },
    { value: 'pending', label: 'Citas pendientes', count: 8 },
    { value: 'overdue', label: 'Pagos pendientes', count: 3 }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.message.trim()) {
      onSend(formData);
      setFormData({
        recipients: 'all',
        subject: '',
        message: '',
        sendEmail: true,
        sendSMS: false
      });
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedOption = recipientOptions.find(opt => opt.value === formData.recipients);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-deep flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Enviar Mensaje Masivo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selección de destinatarios */}
          <div>
            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Destinatarios
            </label>
            <select
              id="recipients"
              value={formData.recipients}
              onChange={(e) => handleChange('recipients', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              {recipientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count} personas)
                </option>
              ))}
            </select>
            {selectedOption && (
              <p className="text-xs text-gray-500 mt-1">
                Se enviará a {selectedOption.count} destinatarios
              </p>
            )}
          </div>

          {/* Canales de envío */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canales de envío
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) => handleChange('sendEmail', e.target.checked)}
                  className="rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="ml-2 text-sm text-gray-700">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sendSMS}
                  onChange={(e) => handleChange('sendSMS', e.target.checked)}
                  className="rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="ml-2 text-sm text-gray-700">SMS</span>
                <span className="ml-1 text-xs text-gray-500">(costo adicional)</span>
              </label>
            </div>
          </div>

          {/* Asunto (solo para email) */}
          {formData.sendEmail && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Asunto del email
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Asunto del mensaje"
              />
            </div>
          )}

          {/* Mensaje */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Mensaje *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Escribe tu mensaje aquí..."
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {formData.message.length}/500 caracteres
              </p>
              {formData.sendSMS && (
                <p className="text-xs text-gray-500">
                  SMS: {Math.ceil(formData.message.length / 160)} mensaje(s)
                </p>
              )}
            </div>
          </div>

          {/* Plantillas rápidas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plantillas rápidas
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleChange('message', 'Recordatorio: Tienes una cita programada mañana. ¡Te esperamos!')}
                className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
              >
                Recordatorio de cita
              </button>
              <button
                type="button"
                onClick={() => handleChange('message', 'Hola, queremos informarte sobre nuestros nuevos servicios disponibles.')}
                className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
              >
                Información de servicios
              </button>
              <button
                type="button"
                onClick={() => handleChange('message', 'Gracias por confiar en nosotros. Tu bienestar es nuestra prioridad.')}
                className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
              >
                Mensaje de agradecimiento
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.message.trim() || (!formData.sendEmail && !formData.sendSMS)}
              className="px-4 py-2 bg-sage text-white hover:bg-sage/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Enviar Mensaje
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};