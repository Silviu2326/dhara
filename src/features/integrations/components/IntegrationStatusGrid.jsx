import React from 'react';
import { IntegrationCard } from './IntegrationCard';

const INTEGRATIONS = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: '📅',
    connected: true,
    description: 'Sincroniza eventos con Google Calendar'
  },
  {
    id: 'outlook-calendar',
    name: 'Microsoft Outlook Calendar',
    icon: '📧',
    connected: false,
    description: 'Sincroniza eventos con Outlook Calendar'
  },
  {
    id: 'apple-calendar',
    name: 'Apple Calendar (ICS)',
    icon: '🍎',
    connected: false,
    description: 'Importa eventos desde archivos ICS'
  },
  {
    id: 'zapier',
    name: 'Zapier / Webhooks',
    icon: '⚡',
    connected: true,
    description: 'Automatiza flujos de trabajo'
  }
];

export const IntegrationStatusGrid = ({ onIntegrationClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INTEGRATIONS.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onClick={() => onIntegrationClick(integration)}
        />
      ))}
    </div>
  );
};