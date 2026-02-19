import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { X, Bell, Clock, Mail, MessageSquare, Calendar, Settings, Plus, Edit, Trash2, Send, CheckCircle, AlertCircle } from 'lucide-react';

const AutomaticReminders = ({ isOpen, onClose, clients, plans }) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [reminderTemplates, setReminderTemplates] = useState([
    {
      id: 'template_1',
      name: 'Recordatorio de Sesión',
      type: 'session',
      trigger: 'before_session',
      timing: 24, // horas antes
      channel: 'email',
      active: true,
      subject: 'Recordatorio: Sesión de terapia mañana',
      message: 'Hola {client_name}, te recordamos que tienes una sesión de terapia programada para mañana {session_date} a las {session_time}. Si necesitas reprogramar, por favor contáctanos con al menos 24 horas de anticipación.',
      usageCount: 45
    },
    {
      id: 'template_2',
      name: 'Tarea Pendiente',
      type: 'homework',
      trigger: 'overdue_task',
      timing: 2, // días después de vencimiento
      channel: 'sms',
      active: true,
      subject: 'Tarea pendiente de completar',
      message: 'Hola {client_name}, tienes una tarea pendiente: "{task_name}". Recuerda completarla para aprovechar al máximo tu proceso terapéutico.',
      usageCount: 23
    },
    {
      id: 'template_3',
      name: 'Nueva Tarea Asignada',
      type: 'homework',
      trigger: 'new_task',
      timing: 1, // horas después de asignación
      channel: 'email',
      active: true,
      subject: 'Nueva tarea asignada en tu plan terapéutico',
      message: 'Hola {client_name}, se te ha asignado una nueva tarea: "{task_name}". Puedes revisarla en tu portal de cliente. Fecha límite: {due_date}.',
      usageCount: 67
    },
    {
      id: 'template_4',
      name: 'Seguimiento Semanal',
      type: 'progress',
      trigger: 'weekly_checkin',
      timing: 168, // cada semana (168 horas)
      channel: 'email',
      active: false,
      subject: 'Seguimiento semanal de tu progreso',
      message: 'Hola {client_name}, ¿cómo te has sentido esta semana? Nos gustaría conocer tu progreso y si tienes alguna pregunta sobre tu plan terapéutico.',
      usageCount: 12
    }
  ]);
  
  const [scheduledReminders, setScheduledReminders] = useState([
    {
      id: 'reminder_1',
      clientId: 'client_1',
      clientName: 'Ana García',
      templateId: 'template_1',
      templateName: 'Recordatorio de Sesión',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      channel: 'email',
      context: {
        session_date: '15 de Enero, 2024',
        session_time: '10:00 AM'
      }
    },
    {
      id: 'reminder_2',
      clientId: 'client_2',
      clientName: 'Carlos López',
      templateId: 'template_2',
      templateName: 'Tarea Pendiente',
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'sent',
      channel: 'sms',
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      context: {
        task_name: 'Diario de emociones diarias'
      }
    },
    {
      id: 'reminder_3',
      clientId: 'client_3',
      clientName: 'María Rodríguez',
      templateId: 'template_3',
      templateName: 'Nueva Tarea Asignada',
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'failed',
      channel: 'email',
      error: 'Dirección de email inválida',
      context: {
        task_name: 'Ejercicios de respiración',
        due_date: '20 de Enero, 2024'
      }
    }
  ]);
  
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'session',
    trigger: 'before_session',
    timing: 24,
    channel: 'email',
    active: true,
    subject: '',
    message: ''
  });

  const triggerOptions = {
    session: [
      { value: 'before_session', label: 'Antes de la sesión' },
      { value: 'after_session', label: 'Después de la sesión' },
      { value: 'missed_session', label: 'Sesión perdida' }
    ],
    homework: [
      { value: 'new_task', label: 'Nueva tarea asignada' },
      { value: 'overdue_task', label: 'Tarea vencida' },
      { value: 'task_reminder', label: 'Recordatorio de tarea' }
    ],
    progress: [
      { value: 'weekly_checkin', label: 'Seguimiento semanal' },
      { value: 'monthly_review', label: 'Revisión mensual' },
      { value: 'milestone_reached', label: 'Hito alcanzado' }
    ]
  };

  const channelOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'push', label: 'Notificación Push', icon: Bell }
  ];

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setReminderTemplates(prev => prev.map(template => 
        template.id === editingTemplate.id 
          ? { ...editingTemplate, ...newTemplate }
          : template
      ));
      setEditingTemplate(null);
    } else {
      const template = {
        ...newTemplate,
        id: `template_${Date.now()}`,
        usageCount: 0
      };
      setReminderTemplates(prev => [...prev, template]);
    }
    
    setShowTemplateForm(false);
    setNewTemplate({
      name: '',
      type: 'session',
      trigger: 'before_session',
      timing: 24,
      channel: 'email',
      active: true,
      subject: '',
      message: ''
    });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({ ...template });
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = (templateId) => {
    setReminderTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  const toggleTemplateStatus = (templateId) => {
    setReminderTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, active: !template.active }
        : template
    ));
  };

  const handleSendTestReminder = (templateId) => {
    // Simular envío de recordatorio de prueba
    const template = reminderTemplates.find(t => t.id === templateId);
    if (template) {
      const testReminder = {
        id: `test_${Date.now()}`,
        clientId: 'test_client',
        clientName: 'Cliente de Prueba',
        templateId: template.id,
        templateName: template.name,
        scheduledFor: new Date().toISOString(),
        status: 'sent',
        channel: template.channel,
        sentAt: new Date().toISOString(),
        context: {
          session_date: 'Mañana',
          session_time: '10:00 AM',
          task_name: 'Tarea de ejemplo',
          due_date: 'En 3 días'
        }
      };
      
      setScheduledReminders(prev => [testReminder, ...prev]);
      alert('Recordatorio de prueba enviado exitosamente');
    }
  };

  const retryFailedReminder = (reminderId) => {
    setScheduledReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, status: 'scheduled', error: null }
        : reminder
    ));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Programado';
      case 'sent':
        return 'Enviado';
      case 'failed':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recordatorios Automáticos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona plantillas y programa recordatorios para tus clientes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'templates', label: 'Plantillas', icon: Settings },
              { id: 'scheduled', label: 'Programados', icon: Calendar },
              { id: 'history', label: 'Historial', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Plantillas de Recordatorios</h3>
                <Button
                  onClick={() => setShowTemplateForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Plantilla
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reminderTemplates.map(template => {
                  const ChannelIcon = channelOptions.find(c => c.value === template.channel)?.icon || Mail;
                  
                  return (
                    <Card key={template.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              template.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <ChannelIcon className="w-4 h-4" />
                              {channelOptions.find(c => c.value === template.channel)?.label}
                            </span>
                            <span>Usado {template.usageCount} veces</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Asunto:</strong> {template.subject}
                          </p>
                          
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleTemplateStatus(template.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              template.active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={template.active ? 'Desactivar' : 'Activar'}
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleSendTestReminder(template.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Enviar prueba"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Disparador: {triggerOptions[template.type]?.find(t => t.value === template.trigger)?.label} 
                        ({template.timing} {template.trigger.includes('weekly') ? 'horas' : template.timing === 1 ? 'hora' : 'horas'})
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Recordatorios Programados</h3>
                <div className="text-sm text-gray-600">
                  {scheduledReminders.filter(r => r.status === 'scheduled').length} recordatorios pendientes
                </div>
              </div>
              
              <div className="space-y-4">
                {scheduledReminders
                  .filter(reminder => reminder.status === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
                  .map(reminder => {
                    const ChannelIcon = channelOptions.find(c => c.value === reminder.channel)?.icon || Mail;
                    
                    return (
                      <Card key={reminder.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(reminder.status)}
                              <ChannelIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{reminder.clientName}</h4>
                              <p className="text-sm text-gray-600">{reminder.templateName}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(reminder.scheduledFor).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(reminder.scheduledFor).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                
                {scheduledReminders.filter(r => r.status === 'scheduled').length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recordatorios programados</h3>
                    <p className="text-gray-600">
                      Los recordatorios aparecerán aquí cuando se programen automáticamente
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Historial de Recordatorios</h3>
                <div className="text-sm text-gray-600">
                  {scheduledReminders.filter(r => r.status !== 'scheduled').length} recordatorios procesados
                </div>
              </div>
              
              <div className="space-y-4">
                {scheduledReminders
                  .filter(reminder => reminder.status !== 'scheduled')
                  .sort((a, b) => new Date(b.sentAt || b.scheduledFor) - new Date(a.sentAt || a.scheduledFor))
                  .map(reminder => {
                    const ChannelIcon = channelOptions.find(c => c.value === reminder.channel)?.icon || Mail;
                    
                    return (
                      <Card key={reminder.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(reminder.status)}
                              <ChannelIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{reminder.clientName}</h4>
                              <p className="text-sm text-gray-600">{reminder.templateName}</p>
                              {reminder.error && (
                                <p className="text-sm text-red-600 mt-1">{reminder.error}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {getStatusText(reminder.status)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {reminder.sentAt 
                                  ? new Date(reminder.sentAt).toLocaleString()
                                  : new Date(reminder.scheduledFor).toLocaleString()
                                }
                              </div>
                            </div>
                            
                            {reminder.status === 'failed' && (
                              <Button
                                onClick={() => retryFailedReminder(reminder.id)}
                                size="sm"
                                variant="outline"
                              >
                                Reintentar
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Template Form Modal */}
        {showTemplateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Recordatorio'}
                </h3>
                <button
                  onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                    setNewTemplate({
                      name: '',
                      type: 'session',
                      trigger: 'before_session',
                      timing: 24,
                      channel: 'email',
                      active: true,
                      subject: '',
                      message: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la plantilla
                      </label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Recordatorio de sesión"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de recordatorio
                      </label>
                      <select
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate(prev => ({ 
                          ...prev, 
                          type: e.target.value,
                          trigger: triggerOptions[e.target.value][0].value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="session">Sesiones</option>
                        <option value="homework">Tareas</option>
                        <option value="progress">Progreso</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disparador
                      </label>
                      <select
                        value={newTemplate.trigger}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, trigger: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {triggerOptions[newTemplate.type]?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo ({newTemplate.trigger.includes('weekly') ? 'horas' : 'horas'})
                      </label>
                      <input
                        type="number"
                        value={newTemplate.timing}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, timing: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canal de envío
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {channelOptions.map(channel => {
                        const Icon = channel.icon;
                        return (
                          <label
                            key={channel.value}
                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              newTemplate.channel === channel.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="channel"
                              value={channel.value}
                              checked={newTemplate.channel === channel.value}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, channel: e.target.value }))}
                              className="sr-only"
                            />
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{channel.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto del mensaje
                    </label>
                    <input
                      type="text"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Asunto del recordatorio"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje
                    </label>
                    <textarea
                      value={newTemplate.message}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Contenido del recordatorio. Puedes usar variables como {client_name}, {session_date}, {task_name}, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {'{client_name}'}, {'{session_date}'}, {'{session_time}'}, {'{task_name}'}, {'{due_date}'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newTemplate.active}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Activar plantilla inmediatamente</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.message}
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { AutomaticReminders };