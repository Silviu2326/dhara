import React, { useState } from 'react';
import { IntegrationStatusGrid } from './components/IntegrationStatusGrid';
import { SettingsDrawer } from './components/SettingsDrawer';
import { WebhooksPanel } from './components/WebhooksPanel';
import { Loader } from '../../components/Loader';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const Integrations = () => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntegrationClick = (integration) => {
    setSelectedIntegration(integration);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedIntegration(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deep">Integraciones</h1>
            <p className="text-gray-600 mt-1">Conecta Dhara con tus herramientas favoritas</p>
          </div>
        </div>

        {/* Integration Status Grid */}
        <div>
          <h2 className="text-xl font-semibold text-deep mb-4">Calendarios y Herramientas</h2>
          <IntegrationStatusGrid onIntegrationClick={handleIntegrationClick} />
        </div>

        {/* Webhooks Panel */}
        <div>
          <h2 className="text-xl font-semibold text-deep mb-4">Automatización</h2>
          <WebhooksPanel />
        </div>

        {/* Settings Drawer */}
        <SettingsDrawer
          integration={selectedIntegration}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
        />
      </div>
    </ErrorBoundary>
  );
};