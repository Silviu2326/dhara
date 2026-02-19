import React, { useState } from 'react';
import { Button } from '../../../components/Button';

export const EndpointField = ({ value, disabled }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Endpoint URL
      </label>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            readOnly
            disabled={disabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-mono ${
              disabled ? 'text-gray-400' : 'text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        
        <Button
          onClick={handleCopy}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="px-3"
          aria-label="Copiar URL del endpoint"
        >
          {copied ? (
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Copiado</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copiar</span>
            </span>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500">
        Usa esta URL en tu herramienta de automatización (Zapier, Make.com, etc.) para recibir eventos de Dhara.
      </p>
    </div>
  );
};