import React from 'react';
import { Card } from '../../../components/Card';
import { ConnectButton } from './ConnectButton';
import { SyncNowButton } from './SyncNowButton';
import { ViewLogsLink } from './ViewLogsLink';

export const IntegrationCard = ({ integration, onClick }) => {
  const { id, name, icon, connected, description } = integration;

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-deep">{name}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className={`text-sm font-medium ${
              connected ? 'text-green-600' : 'text-red-600'
            }`}>
              {connected ? 'Conectado' : 'No conectado'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <ConnectButton 
            integrationId={id}
            connected={connected}
          />
          
          {connected && (
            <div className="flex space-x-2">
              <SyncNowButton integrationId={id} />
              <ViewLogsLink integrationId={id} />
            </div>
          )}
        </div>

        <button
          onClick={onClick}
          className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Configurar integración →
        </button>
      </div>
    </Card>
  );
};