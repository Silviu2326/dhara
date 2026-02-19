import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { connectIntegration, disconnectIntegration } from '../integrations.api';

export const ConnectButton = ({ integrationId, connected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);

  const handleToggleConnection = async () => {
    setIsLoading(true);
    try {
      if (isConnected) {
        await disconnectIntegration(integrationId);
        setIsConnected(false);
      } else {
        // Para OAuth, esto abriría una ventana de autorización
        await connectIntegration(integrationId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      // TODO: Mostrar notificación de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleConnection}
      disabled={isLoading}
      variant={isConnected ? 'outline' : 'primary'}
      size="sm"
      className="w-full"
      aria-label={`${isConnected ? 'Desconectar' : 'Conectar'} ${integrationId}`}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Procesando...</span>
        </span>
      ) : (
        isConnected ? 'Desconectar' : 'Conectar'
      )}
    </Button>
  );
};