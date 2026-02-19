import React from 'react';
import { Card } from '../../../components/Card';
import { AlertItem } from './AlertItem';
import { useNavigate } from 'react-router-dom';

export const AlertsList = ({ alerts }) => {
  const navigate = useNavigate();

  // Generar fechas dinámicas
  const now = new Date();
  const nextSessionTime = new Date(now.getTime() + 15 * 60 * 1000); // +15 minutos
  const subscriptionExpiry = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 días

  const defaultAlerts = [
    {
      id: 1,
      type: 'appointment',
      priority: 'high',
      message: 'Próxima sesión en 15 minutos',
      time: `${nextSessionTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - Ana Martínez`,
      clientName: 'Ana Martínez',
      action: () => navigate('/app/reservas')
    },
    {
      id: 2,
      type: 'document',
      priority: 'medium',
      message: 'Documento pendiente de firmar',
      time: 'Consentimiento informado - Juan Pérez',
      clientName: 'Juan Pérez',
      action: () => navigate('/app/documentos-materiales')
    },
    {
      id: 3,
      type: 'subscription',
      priority: 'medium',
      message: 'Suscripción vence en 3 días',
      time: `Plan Premium - Renovar antes del ${subscriptionExpiry.toLocaleDateString('es-ES')}`,
      clientName: null,
      action: () => navigate('/app/planes-suscripcion')
    }
  ];

  const alertsToShow = alerts || defaultAlerts;

  const handleAlertClick = (alert) => {
    if (alert.action) {
      alert.action();
    } else {
      // Fallback navigation based on alert type
      switch (alert.type) {
        case 'appointment':
          navigate('/app/reservas');
          break;
        case 'document':
          navigate('/app/documentos-materiales');
          break;
        case 'subscription':
          navigate('/app/planes-suscripcion');
          break;
        default:
          break;
      }
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-deep">Alertas Rápidas</h2>
        {alertsToShow.length > 0 && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
            {alertsToShow.length}
          </span>
        )}
      </div>
      
      {alertsToShow.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay alertas pendientes</p>
      ) : (
        <div className="space-y-3">
          {alertsToShow.map((alert) => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              onClick={handleAlertClick}
            />
          ))}
        </div>
      )}
    </Card>
  );
};