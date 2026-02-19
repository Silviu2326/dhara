import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { Button } from '../../../components/Button';

export const AssignPlanModal = ({ isOpen, onClose, plan, clients, onAssign }) => {
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedClients.length === 0) {
      setError('Debe seleccionar al menos un cliente');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onAssign(plan.id, selectedClients);
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
    setError('');
    onClose();
  };

  // Filtrar clientes que no tienen ya este plan asignado
  const availableClients = clients.filter(client => 
    !client.assignedPlans.includes(plan?.id)
  );

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Asignar Plan a Clientes</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Plan Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">{plan.name}</h3>
            <p className="text-sm text-blue-700">{plan.description}</p>
            <div className="mt-2 text-xs text-blue-600">
              {plan.duration} semanas • {plan.sessionsPerWeek} sesión(es) por semana • {plan.totalSessions} sesiones totales
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleccionar Clientes
              </label>
              
              {availableClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Todos los clientes ya tienen este plan asignado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableClients.map(client => (
                    <div
                      key={client.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClients.includes(client.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <div className="flex items-center flex-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                          selectedClients.includes(client.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedClients.includes(client.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                          {client.assignedPlans.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {client.assignedPlans.length} plan(es) asignado(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClients.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">
                  <strong>{selectedClients.length}</strong> cliente(s) seleccionado(s)
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedClients.length === 0 || availableClients.length === 0}
              >
                {loading ? 'Asignando...' : `Asignar a ${selectedClients.length} cliente(s)`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};