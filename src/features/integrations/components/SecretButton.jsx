import React, { useState } from 'react';
import { Button } from '../../../components/Button';

export const SecretButton = ({ secret, onRegenerate, disabled }) => {
  const [isRegenerated, setIsRegenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    if (disabled) return;
    
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres regenerar el secreto? Esto invalidará el secreto actual y deberás actualizar tu configuración en las herramientas externas.'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      onRegenerate(newSecret);
      setIsRegenerated(true);
      setTimeout(() => setIsRegenerated(false), 3000);
    } catch (error) {
      console.error('Error regenerating secret:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying secret:', error);
    }
  };

  const maskedSecret = secret.substring(0, 8) + '•'.repeat(secret.length - 8);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Secreto de firma
      </label>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <div className="flex">
            <input
              type="text"
              value={showSecret ? secret : maskedSecret}
              readOnly
              disabled={disabled}
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm bg-gray-50 text-sm font-mono ${
                disabled ? 'text-gray-400' : 'text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            
            <button
              onClick={() => setShowSecret(!showSecret)}
              disabled={disabled}
              className={`px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                disabled ? 'cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              aria-label={showSecret ? 'Ocultar secreto' : 'Mostrar secreto'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showSecret ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
            
            <button
              onClick={handleCopySecret}
              disabled={disabled}
              className={`px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                disabled ? 'cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              aria-label="Copiar secreto"
            >
              {copied ? (
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <Button
          onClick={handleRegenerate}
          disabled={disabled || isLoading}
          variant="outline"
          size="sm"
          className="whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Regenerando...</span>
            </span>
          ) : (
            'Regenerar secreto'
          )}
        </Button>
      </div>
      
      {isRegenerated && (
        <div className="p-3 bg-green-50 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm text-green-700">
              <strong>Secreto regenerado exitosamente.</strong> Asegúrate de actualizar la configuración en tus herramientas externas.
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Usa este secreto para verificar que los webhooks provienen de Dhara. Se incluye en el header <code className="bg-gray-100 px-1 rounded">X-Dhara-Signature</code>.
      </p>
    </div>
  );
};