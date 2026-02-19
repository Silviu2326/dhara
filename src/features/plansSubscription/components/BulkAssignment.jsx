import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { X, Users, Search, Filter, CheckCircle, Circle, Calendar, Clock, AlertTriangle, UserCheck } from 'lucide-react';

const BulkAssignment = ({ isOpen, onClose, selectedPlan, clients, onAssignPlan }) => {
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assignmentSettings, setAssignmentSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    customStartDate: false,
    sendNotification: true,
    autoSchedule: false,
    schedulePreference: 'weekly',
    notes: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState(null);

  // Filtrar clientes según búsqueda y estado
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = client.activePlans && client.activePlans.length > 0;
    } else if (filterStatus === 'inactive') {
      matchesStatus = !client.activePlans || client.activePlans.length === 0;
    } else if (filterStatus === 'new') {
      matchesStatus = !client.totalSessions || client.totalSessions === 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedClients.length === 0) return;
    
    setIsAssigning(true);
    
    try {
      // Simular asignación masiva
      const results = {
        successful: [],
        failed: [],
        warnings: []
      };
      
      for (const clientId of selectedClients) {
        const client = clients.find(c => c.id === clientId);
        
        // Verificar si el cliente ya tiene este plan
        if (client.activePlans && client.activePlans.some(plan => plan.id === selectedPlan.id)) {
          results.warnings.push({
            clientId,
            clientName: client.name,
            message: 'Ya tiene este plan asignado'
          });
          continue;
        }
        
        // Verificar si el cliente tiene planes activos conflictivos
        if (client.activePlans && client.activePlans.length > 0) {
          const hasConflict = client.activePlans.some(plan => 
            plan.type === selectedPlan.type && plan.status === 'active'
          );
          
          if (hasConflict) {
            results.warnings.push({
              clientId,
              clientName: client.name,
              message: 'Tiene un plan similar activo'
            });
          }
        }
        
        // Simular éxito (en la realidad, aquí se haría la llamada a la API)
        const success = Math.random() > 0.1; // 90% de éxito
        
        if (success) {
          results.successful.push({
            clientId,
            clientName: client.name,
            assignedDate: assignmentSettings.startDate
          });
          
          // Llamar al callback para actualizar el estado
          if (onAssignPlan) {
            onAssignPlan(clientId, selectedPlan.id, {
              startDate: assignmentSettings.startDate,
              notes: assignmentSettings.notes,
              autoSchedule: assignmentSettings.autoSchedule,
              sendNotification: assignmentSettings.sendNotification
            });
          }
        } else {
          results.failed.push({
            clientId,
            clientName: client.name,
            error: 'Error de conexión con el servidor'
          });
        }
      }
      
      setAssignmentResults(results);
      
    } catch (error) {
      console.error('Error en asignación masiva:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const resetAssignment = () => {
    setSelectedClients([]);
    setAssignmentResults(null);
    setSearchTerm('');
    setFilterStatus('all');
    setAssignmentSettings({
      startDate: new Date().toISOString().split('T')[0],
      customStartDate: false,
      sendNotification: true,
      autoSchedule: false,
      schedulePreference: 'weekly',
      notes: ''
    });
  };

  if (!isOpen || !selectedPlan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Asignación Masiva de Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Asignar "{selectedPlan.name}" a múltiples clientes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!assignmentResults ? (
          <>
            {/* Plan Info */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedPlan.duration} semanas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedPlan.sessionsPerWeek} sesiones/semana
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Client Selection */}
              <div className="flex-1 flex flex-col">
                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar clientes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Todos los clientes</option>
                      <option value="active">Con planes activos</option>
                      <option value="inactive">Sin planes activos</option>
                      <option value="new">Clientes nuevos</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={selectAllClients}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {selectedClients.length === filteredClients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                    <span className="text-sm text-gray-600">
                      {selectedClients.length} de {filteredClients.length} seleccionados
                    </span>
                  </div>
                </div>

                {/* Client List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {filteredClients.map(client => {
                      const isSelected = selectedClients.includes(client.id);
                      const hasActivePlans = client.activePlans && client.activePlans.length > 0;
                      const hasSamePlan = client.activePlans && client.activePlans.some(plan => plan.id === selectedPlan.id);
                      
                      return (
                        <Card 
                          key={client.id} 
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                          }`}
                          onClick={() => toggleClientSelection(client.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`${
                              isSelected ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {isSelected ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                {hasSamePlan && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Ya tiene este plan
                                  </span>
                                )}
                                {hasActivePlans && !hasSamePlan && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Plan activo
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{client.email}</p>
                              {client.activePlans && client.activePlans.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Planes activos: {client.activePlans.map(plan => plan.name).join(', ')}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {client.totalSessions || 0} sesiones
                              </div>
                              <div className="text-xs text-gray-400">
                                Último contacto: {client.lastContact || 'Nunca'}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {filteredClients.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
                      <p className="text-gray-600">
                        Intenta ajustar los filtros de búsqueda
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Settings */}
              <div className="w-80 border-l border-gray-200 bg-gray-50">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Configuración de Asignación</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={assignmentSettings.startDate}
                        onChange={(e) => setAssignmentSettings(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assignmentSettings.sendNotification}
                          onChange={(e) => setAssignmentSettings(prev => ({
                            ...prev,
                            sendNotification: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enviar notificación a clientes</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assignmentSettings.autoSchedule}
                          onChange={(e) => setAssignmentSettings(prev => ({
                            ...prev,
                            autoSchedule: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Programar sesiones automáticamente</span>
                      </label>
                    </div>
                    
                    {assignmentSettings.autoSchedule && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frecuencia de programación
                        </label>
                        <select
                          value={assignmentSettings.schedulePreference}
                          onChange={(e) => setAssignmentSettings(prev => ({
                            ...prev,
                            schedulePreference: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quincenal</option>
                          <option value="monthly">Mensual</option>
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas adicionales
                      </label>
                      <textarea
                        value={assignmentSettings.notes}
                        onChange={(e) => setAssignmentSettings(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Notas sobre esta asignación masiva..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedClients.length > 0 && (
                  <span>
                    Se asignará el plan a {selectedClients.length} cliente{selectedClients.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkAssignment}
                  disabled={selectedClients.length === 0 || isAssigning}
                  className="min-w-[120px]"
                >
                  {isAssigning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Asignando...
                    </div>
                  ) : (
                    `Asignar Plan (${selectedClients.length})`
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Assignment Results */
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Asignación Masiva Completada
              </h3>
              <p className="text-gray-600">
                Se procesaron {selectedClients.length} clientes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {assignmentResults.successful.length}
                </div>
                <div className="text-sm text-gray-600">Exitosas</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {assignmentResults.warnings.length}
                </div>
                <div className="text-sm text-gray-600">Advertencias</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {assignmentResults.failed.length}
                </div>
                <div className="text-sm text-gray-600">Fallidas</div>
              </Card>
            </div>
            
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {assignmentResults.successful.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Asignaciones Exitosas
                  </h4>
                  <div className="space-y-1">
                    {assignmentResults.successful.map(result => (
                      <div key={result.clientId} className="text-sm text-gray-600 pl-6">
                        • {result.clientName} - Inicio: {new Date(result.assignedDate).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {assignmentResults.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Advertencias
                  </h4>
                  <div className="space-y-1">
                    {assignmentResults.warnings.map(result => (
                      <div key={result.clientId} className="text-sm text-gray-600 pl-6">
                        • {result.clientName}: {result.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {assignmentResults.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Asignaciones Fallidas
                  </h4>
                  <div className="space-y-1">
                    {assignmentResults.failed.map(result => (
                      <div key={result.clientId} className="text-sm text-gray-600 pl-6">
                        • {result.clientName}: {result.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={resetAssignment}
                variant="outline"
              >
                Nueva Asignación
              </Button>
              <Button
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { BulkAssignment };