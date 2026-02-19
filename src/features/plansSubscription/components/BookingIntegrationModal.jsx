import React, { useState } from 'react';
import { X, Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/Button';

export const BookingIntegrationModal = ({ isOpen, onClose, plan, clients }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen || !plan) return null;

  const assignedClients = clients.filter(client => 
    client.assignedPlans.includes(plan.id)
  );

  const generateSessionSchedule = () => {
    if (!selectedClient || !startDate) return;

    const sessions = [];
    const start = new Date(startDate);
    const sessionsPerWeek = plan.sessionsPerWeek;
    const totalSessions = plan.totalSessions;
    
    let currentDate = new Date(start);
    let sessionCount = 0;
    
    while (sessionCount < totalSessions) {
      // Generar sesiones para la semana actual
      for (let i = 0; i < sessionsPerWeek && sessionCount < totalSessions; i++) {
        // Distribuir sesiones a lo largo de la semana
        const dayOffset = Math.floor((7 / sessionsPerWeek) * i);
        const sessionDate = new Date(currentDate);
        sessionDate.setDate(currentDate.getDate() + dayOffset);
        
        // Evitar fines de semana (opcional)
        if (sessionDate.getDay() === 0) sessionDate.setDate(sessionDate.getDate() + 1); // Domingo -> Lunes
        if (sessionDate.getDay() === 6) sessionDate.setDate(sessionDate.getDate() + 2); // Sábado -> Lunes
        
        sessions.push({
          id: sessionCount + 1,
          date: sessionDate.toISOString().split('T')[0],
          time: preferredTime,
          duration: sessionDuration,
          clientId: selectedClient,
          planId: plan.id,
          status: 'scheduled',
          week: Math.floor(sessionCount / sessionsPerWeek) + 1
        });
        
        sessionCount++;
      }
      
      // Avanzar a la siguiente semana
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    setGeneratedSessions(sessions);
    setShowPreview(true);
  };

  const confirmBooking = async () => {
    setLoading(true);
    try {
      // Simular llamada a API para crear las sesiones
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí se integraría con el sistema de reservas real
      console.log('Sesiones creadas:', generatedSessions);
      
      onClose();
    } catch (error) {
      console.error('Error al crear las sesiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClient('');
    setStartDate('');
    setPreferredTime('10:00');
    setSessionDuration(60);
    setGeneratedSessions([]);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Programar Sesiones - {plan.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!showPreview ? (
            <div className="space-y-6">
              {/* Información del plan */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Detalles del Plan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Duración:</span>
                    <p className="text-blue-900">{plan.duration} semanas</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Frecuencia:</span>
                    <p className="text-blue-900">{plan.sessionsPerWeek}/semana</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Total:</span>
                    <p className="text-blue-900">{plan.totalSessions} sesiones</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Tipo:</span>
                    <p className="text-blue-900">{plan.type}</p>
                  </div>
                </div>
              </div>

              {/* Formulario de configuración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar cliente</option>
                    {assignedClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora preferida
                  </label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos)
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                  </select>
                </div>
              </div>

              {/* Advertencias */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Consideraciones importantes:</h4>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• Las sesiones se distribuirán automáticamente evitando fines de semana</li>
                      <li>• Podrás modificar fechas individuales después de la creación</li>
                      <li>• Se enviará notificación al cliente sobre las citas programadas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={generateSessionSchedule}
                  disabled={!selectedClient || !startDate}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Generar Cronograma
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vista previa de sesiones */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">
                    Cronograma generado: {generatedSessions.length} sesiones
                  </h3>
                </div>
                <p className="text-sm text-green-700">
                  Cliente: {assignedClients.find(c => c.id === selectedClient)?.name}
                </p>
              </div>

              {/* Lista de sesiones */}
              <div className="max-h-96 overflow-y-auto">
                <div className="grid gap-3">
                  {generatedSessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {session.id}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Semana {session.week} - Sesión {((session.id - 1) % plan.sessionsPerWeek) + 1}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.time} ({session.duration} min)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de confirmación */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  disabled={loading}
                >
                  Modificar
                </Button>
                <Button
                  onClick={confirmBooking}
                  disabled={loading}
                >
                  {loading ? 'Creando sesiones...' : 'Confirmar y Crear Sesiones'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};