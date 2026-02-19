import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { EndpointField } from './EndpointField';
import { EventCheckboxes } from './EventCheckboxes';
import { SecretButton } from './SecretButton';

export const WebhooksPanel = () => {
  const [isActive, setIsActive] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState([
    'booking.created',
    'payment.succeeded'
  ]);
  const [webhookUrl] = useState('https://hooks.zapier.com/hooks/catch/12345/abcdef/');
  const [secret, setSecret] = useState('whsec_1234567890abcdef');

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleEventChange = (events) => {
    setSelectedEvents(events);
  };

  const handleSecretRegenerate = (newSecret) => {
    setSecret(newSecret);
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-deep flex items-center space-x-2">
              <span>⚡</span>
              <span>Webhooks Personalizados</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Conecta con Zapier, Make.com u otras herramientas de automatización
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${
              isActive ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
            <button
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label="Toggle webhook status"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <EndpointField 
            value={webhookUrl}
            disabled={!isActive}
          />
          
          <SecretButton 
            secret={secret}
            onRegenerate={handleSecretRegenerate}
            disabled={!isActive}
          />
          
          <EventCheckboxes 
            selectedEvents={selectedEvents}
            onChange={handleEventChange}
            disabled={!isActive}
          />
        </div>

        {!isActive && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600">
                Los webhooks están desactivados. Actívalos para comenzar a recibir eventos en tu endpoint.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-600">
              <strong>Documentación:</strong> Los webhooks envían datos en formato JSON con firma HMAC-SHA256. 
              <a href="#" className="text-blue-600 hover:text-blue-800 underline ml-1">
                Ver ejemplos de payload
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};