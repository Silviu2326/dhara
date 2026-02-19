import React, { useState } from 'react';
import { 
  XMarkIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  CreditCardIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const BULK_ACTIONS = [
  {
    id: 'send_message',
    label: 'Enviar mensaje',
    icon: ChatBubbleLeftIcon,
    description: 'Enviar un mensaje personalizado a los clientes seleccionados'
  },
  {
    id: 'send_email',
    label: 'Enviar email',
    icon: EnvelopeIcon,
    description: 'Enviar un email a los clientes seleccionados'
  },
  {
    id: 'assign_plan',
    label: 'Asignar plan',
    icon: CreditCardIcon,
    description: 'Asignar un plan de tratamiento a los clientes seleccionados'
  },
  {
    id: 'schedule_session',
    label: 'Programar sesión',
    icon: CalendarIcon,
    description: 'Programar sesiones para los clientes seleccionados'
  },
  {
    id: 'add_notes',
    label: 'Añadir notas',
    icon: DocumentTextIcon,
    description: 'Añadir notas privadas a los clientes seleccionados'
  }
];

const TREATMENT_PLANS = [
  { id: 'anxiety', label: 'Plan para Ansiedad', sessions: 12, price: 720 },
  { id: 'depression', label: 'Plan para Depresión', sessions: 16, price: 960 },
  { id: 'couples', label: 'Terapia de Pareja', sessions: 10, price: 800 },
  { id: 'trauma', label: 'Tratamiento de Trauma', sessions: 20, price: 1200 },
  { id: 'custom', label: 'Plan Personalizado', sessions: 0, price: 0 }
];

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    label: 'Mensaje de bienvenida',
    subject: 'Bienvenido/a a nuestro centro',
    content: 'Estimado/a {nombre},\n\nNos complace darte la bienvenida a nuestro centro de terapia...'
  },
  {
    id: 'reminder',
    label: 'Recordatorio de cita',
    subject: 'Recordatorio: Próxima sesión',
    content: 'Hola {nombre},\n\nTe recordamos que tienes una sesión programada...'
  },
  {
    id: 'followup',
    label: 'Seguimiento post-sesión',
    subject: 'Seguimiento de tu sesión',
    content: 'Hola {nombre},\n\nEsperamos que te encuentres bien después de nuestra última sesión...'
  }
];

export const BulkActionsModal = ({ 
  isOpen, 
  onClose, 
  selectedClients = [],
  onExecuteAction
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [formData, setFormData] = useState({
    message: '',
    subject: '',
    content: '',
    planId: '',
    customPlan: {
      name: '',
      sessions: '',
      price: ''
    },
    sessionDate: '',
    sessionTime: '',
    notes: ''
  });

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
    // Reset form data when changing action
    setFormData({
      message: '',
      subject: '',
      content: '',
      planId: '',
      customPlan: {
        name: '',
        sessions: '',
        price: ''
      },
      sessionDate: '',
      sessionTime: '',
      notes: ''
    });
  };

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actionData = {
      action: selectedAction,
      clientIds: selectedClients.map(client => client.id),
      data: formData
    };

    try {
      await onExecuteAction(actionData);
      onClose();
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };

  const renderActionForm = () => {
    switch (selectedAction) {
      case 'send_message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Escribe tu mensaje aquí..."
                required
              />
            </div>
          </div>
        );

      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla (opcional)
              </label>
              <select
                onChange={(e) => {
                  const template = EMAIL_TEMPLATES.find(t => t.id === e.target.value);
                  if (template) handleTemplateSelect(template);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Seleccionar plantilla...</option>
                {EMAIL_TEMPLATES.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Asunto del email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Contenido del email... Usa {nombre} para personalizar"
                required
              />
            </div>
          </div>
        );

      case 'assign_plan':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan de tratamiento
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Seleccionar plan...</option>
                {TREATMENT_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} {plan.sessions > 0 && `(${plan.sessions} sesiones - €${plan.price})`}
                  </option>
                ))}
              </select>
            </div>
            
            {formData.planId === 'custom' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del plan
                  </label>
                  <input
                    type="text"
                    value={formData.customPlan.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customPlan: { ...prev.customPlan, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Nombre del plan personalizado"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de sesiones
                    </label>
                    <input
                      type="number"
                      value={formData.customPlan.sessions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customPlan: { ...prev.customPlan, sessions: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="12"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio total (€)
                    </label>
                    <input
                      type="number"
                      value={formData.customPlan.price}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customPlan: { ...prev.customPlan, price: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="720"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'schedule_session':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.sessionTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Se programará una sesión individual para cada cliente seleccionado en la fecha y hora especificadas.</p>
            </div>
          </div>
        );

      case 'add_notes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas privadas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Añadir notas que se aplicarán a todos los clientes seleccionados..."
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Acciones masivas
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedClients.length} cliente{selectedClients.length !== 1 ? 's' : ''} seleccionado{selectedClients.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!selectedAction ? (
                /* Action Selection */
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Selecciona una acción
                  </h3>
                  {BULK_ACTIONS.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleActionSelect(action.id)}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">{action.label}</h4>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Action Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('')}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      ← Volver
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">
                      {BULK_ACTIONS.find(a => a.id === selectedAction)?.label}
                    </h3>
                  </div>

                  {/* Selected Clients Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Clientes seleccionados ({selectedClients.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClients.slice(0, 5).map((client) => (
                        <span 
                          key={client.id}
                          className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md"
                        >
                          {client.name}
                        </span>
                      ))}
                      {selectedClients.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-md">
                          +{selectedClients.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Form */}
                  {renderActionForm()}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Ejecutar acción
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};