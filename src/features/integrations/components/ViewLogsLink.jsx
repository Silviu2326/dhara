import React from 'react';
import { Button } from '../../../components/Button';

export const ViewLogsLink = ({ integrationId }) => {
  const handleViewLogs = () => {
    // TODO: Abrir modal o drawer con logs
    console.log(`Ver logs para ${integrationId}`);
  };

  return (
    <Button
      onClick={handleViewLogs}
      variant="ghost"
      size="sm"
      className="flex-1"
      aria-label={`Ver logs de ${integrationId}`}
    >
      <span className="flex items-center space-x-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Ver logs</span>
      </span>
    </Button>
  );
};